import express from 'express';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { simpleParser } from 'mailparser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// --- MongoDB Setup ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus-hub';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-nexus-hub-2026';

if (process.env.MONGO_URI && process.env.MONGO_URI !== 'YOUR_MONGO_URI_HERE') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGO_URI is not set. MongoDB will not be connected.');
}

// --- Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  thumbnail: { type: String },
  type: { type: String, enum: ['activated_email', 'account', 'service'], default: 'account' },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  exactCryptoAmount: { type: Number, required: true },
  cryptoCurrency: { type: String, required: true },
  customerDetails: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

const emailSchema = new mongoose.Schema({
  otp: { type: String, required: false },
  fullBody: { type: String, required: true },
  htmlBody: { type: String, required: false },
  recipientAlias: { type: String, required: true },
  from: { type: String, required: false },
  subject: { type: String, required: false },
  status: { type: String, enum: ['pending', 'stock', 'sold', 'admin'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  receivedAt: { type: Date, default: Date.now },
});
const Email = mongoose.model('Email', emailSchema);

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Config = mongoose.model('Config', configSchema);

// Initialize Config
async function initConfig() {
  if (mongoose.connection.readyState === 1) {
    const modeConfig = await Config.findOne({ key: 'emailMode' });
    if (!modeConfig) {
      await new Config({ key: 'emailMode', value: 'STOCKING' }).save();
    }
  }
}
mongoose.connection.once('open', initConfig);

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

      // Check if user should be admin based on ENV variables or specific email
      let isUserAdmin = false;
      if (email === 'rracfo@gmail.com') {
        isUserAdmin = true;
      }
      for (let i = 1; i <= 5; i++) {
        const adminUsername = process.env[`ADMIN_USER_${i}`];
        if (adminUsername && adminUsername === username) {
          isUserAdmin = true;
          break;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword, isAdmin: isUserAdmin });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id, username: newUser.username, isAdmin: newUser.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, isAdmin: newUser.isAdmin } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body; // identifier can be username or email
      if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required' });

      const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

      // Auto-upgrade to admin if email matches
      if (user.email === 'rracfo@gmail.com' && !user.isAdmin) {
        user.isAdmin = true;
        await user.save();
      }

      const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Shop Routes ---
  app.get('/api/products', async (req, res) => {
    try {
      // Auto-update pending emails to stock if older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await Email.updateMany(
        { status: 'pending', receivedAt: { $lte: sevenDaysAgo } },
        { $set: { status: 'stock' } }
      );

      const products = await Product.find();
      
      // Calculate dynamic stock for 'activated_email' products
      const stockCount = await Email.countDocuments({ status: 'stock' });
      
      const productsWithDynamicStock = products.map(p => {
        if (p.type === 'activated_email') {
          return { ...p.toObject(), stock: stockCount };
        }
        return p;
      });

      res.json(productsWithDynamicStock);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Checkout Route ---
  app.post('/api/checkout', authenticateToken, async (req: any, res) => {
    try {
      const { items, customerDetails, cryptoCurrency } = req.body;
      if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

      let totalAmount = 0;
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) return res.status(400).json({ error: `Product not found: ${item.name}` });
        totalAmount += product.price * item.quantity;
      }

      // Add random cents for tracking (e.g., 15.00 -> 15.07)
      const randomCents = Math.floor(Math.random() * 99) + 1;
      const exactCryptoAmount = totalAmount + (randomCents / 100);

      const order = new Order({
        userId: req.user.id,
        items,
        totalAmount,
        exactCryptoAmount,
        cryptoCurrency,
        customerDetails,
        status: 'pending'
      });

      await order.save();
      res.json({ orderId: order._id, exactCryptoAmount, cryptoCurrency });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- User Emails Route ---
  app.get('/api/my-emails', authenticateToken, async (req: any, res) => {
    try {
      const emails = await Email.find({ assignedTo: req.user.id }).sort({ receivedAt: -1 });
      res.json(emails);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Admin Routes ---
  app.get('/api/admin/config', authenticateToken, isAdmin, async (req, res) => {
    try {
      const config = await Config.find();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/config', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      await Config.findOneAndUpdate({ key }, { value }, { upsert: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
      const orders = await Order.find().populate('userId', 'username email').sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/orders/:id/complete', authenticateToken, isAdmin, async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      order.status = 'completed';
      await order.save();

      // If order contains activated_emails, assign them
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.type === 'activated_email') {
          const emailsToAssign = await Email.find({ status: 'stock' }).limit(item.quantity);
          for (const email of emailsToAssign) {
            email.status = 'sold';
            email.assignedTo = order.userId;
            await email.save();
          }
        }
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/emails', authenticateToken, isAdmin, async (req, res) => {
    try {
      const emails = await Email.find({ status: { $ne: 'sold' } }).sort({ receivedAt: -1 });
      res.json(emails);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Webhook Route (Email Receiver) ---
  app.post('/api/webhook/email', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const expectedAuth = `Bearer ${process.env.API_SECRET_KEY || 'YOUR_API_SECRET_KEY_HERE'}`;
      
      if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected' });
      }

      const modeConfig = await Config.findOne({ key: 'emailMode' });
      const currentMode = modeConfig ? modeConfig.value : 'STOCKING';

      if (currentMode === 'OFF') {
        return res.status(200).json({ success: true, message: 'Ignored (Mode OFF)' });
      }

      const { to, from, subject, body } = req.body;
      if (!to || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, body' });
      }

      let parsedText = '';
      let parsedHtml = '';
      
      if (body.includes('MIME-Version:') || body.includes('Content-Type:')) {
        try {
          const parsed = await simpleParser(body);
          parsedText = parsed.text || '';
          parsedHtml = parsed.html || '';
        } catch (parseErr) {
          console.error('Error parsing email body:', parseErr);
        }
      } else {
        parsedText = body;
      }

      // Extract OTP
      let otp = null;
      const searchText = parsedText || parsedHtml || body;
      const keywordRegex = /(?:(?:otp|code|pin|password|verification|token)[\s\S]{0,150}?\b(?!(?:19|20)\d{2}\b)(\d{4,8})\b)|(?:\b(?!(?:19|20)\d{2}\b)(\d{4,8})\b[\s\S]{0,150}?(?:otp|code|pin|password|verification|token))/i;
      const keywordMatch = searchText.match(keywordRegex);
      if (keywordMatch) {
        otp = keywordMatch[1] || keywordMatch[2];
      }

      const finalStatus = currentMode === 'ADMIN' ? 'admin' : 'pending';

      const newEmail = new Email({
        otp,
        fullBody: parsedText || body,
        htmlBody: parsedHtml || '',
        recipientAlias: to,
        from,
        subject,
        status: finalStatus
      });
      await newEmail.save();

      res.status(200).json({ success: true, message: `Email saved as ${finalStatus}` });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
