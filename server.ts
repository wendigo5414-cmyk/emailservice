import express from 'express';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { simpleParser } from 'mailparser';

// --- MongoDB Setup ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/email-otp-bot';

// Connect to MongoDB only if MONGO_URI is provided and not a placeholder
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'YOUR_MONGO_URI_HERE') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGO_URI is not set or is a placeholder. MongoDB will not be connected.');
}

const emailSchema = new mongoose.Schema({
  otp: { type: String, required: false },
  fullBody: { type: String, required: true },
  htmlBody: { type: String, required: false },
  recipientAlias: { type: String, required: true },
  from: { type: String, required: false },
  subject: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
});

const Email = mongoose.model('Email', emailSchema);

// --- Express App Setup ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // --- API Routes ---
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Simple in-memory rate limiter for the webhook
  const rateLimitMap = new Map<string, number>();
  const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds

  // Webhook to receive emails from Cloudflare Worker
  app.post('/webhook/email', async (req, res) => {
    try {
      // Check API Secret Key if configured
      const expectedKey = process.env.API_SECRET_KEY;
      if (expectedKey) {
        const providedKey = req.headers['x-api-secret-key'] || req.headers.authorization?.replace('Bearer ', '') || req.body.apiSecretKey;
        if (providedKey !== expectedKey) {
          return res.status(401).json({ error: 'Unauthorized: Invalid API Secret Key' });
        }
      }

      const { from, to, subject, body } = req.body;

      if (!body || !to) {
        return res.status(400).json({ error: 'Missing body or to address' });
      }

      // Parse the raw email using mailparser
      let parsedText = body;
      let parsedHtml = '';
      try {
        const parsed = await simpleParser(body);
        parsedText = parsed.text || body;
        parsedHtml = parsed.html || '';
      } catch (err) {
        console.error('Error parsing email:', err);
      }

      // Rate Limiting by recipient address
      const now = Date.now();
      const lastReceived = rateLimitMap.get(to) || 0;
      if (now - lastReceived < RATE_LIMIT_WINDOW_MS) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait 10 seconds.' });
      }
      rateLimitMap.set(to, now);

      // Extract OTP (4 to 8 digits) - improved to avoid dates
      let otp = null;
      // First try to find numbers near keywords like OTP, code, pin
      const keywordMatch = parsedText.match(/(?:otp|code|pin|password|verification)[\s\S]{0,30}?\b(\d{4,8})\b/i);
      if (keywordMatch) {
        otp = keywordMatch[1];
      } else {
        // Fallback: find 4-8 digit numbers but ignore 4-digit numbers starting with 19 or 20 (likely years)
        const fallbackMatch = parsedText.match(/\b(?!(?:19|20)\d{2}\b)\d{4,8}\b/);
        if (fallbackMatch) {
          otp = fallbackMatch[0];
        }
      }

      // Save to MongoDB
      if (mongoose.connection.readyState === 1) {
        const newEmail = new Email({
          otp,
          fullBody: parsedText,
          htmlBody: parsedHtml,
          recipientAlias: to,
          from: from || 'Unknown Sender',
          subject: subject || 'No Subject',
        });
        await newEmail.save();
        console.log(`Saved new email for ${to} with OTP: ${otp}`);
      } else {
        console.warn('MongoDB not connected. Email received but not saved.');
      }

      res.status(200).json({ success: true, message: 'Email processed successfully' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all emails
  app.get('/api/emails', async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.json([]); // Return empty array if not connected
      }
      const emails = await Email.find().sort({ timestamp: -1 }).limit(100);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete a specific email
  app.delete('/api/emails/:id', async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected' });
      }
      await Email.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete all emails
  app.delete('/api/emails', async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected' });
      }
      await Email.deleteMany({});
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting all emails:', error);
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Auto-ping to keep Render free tier awake
    // Render provides RENDER_EXTERNAL_URL environment variable
    const pingUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || `http://localhost:${PORT}`;
    
    // Ping every 14 minutes (840000 ms) to prevent sleeping (Render sleeps after 15 mins)
    setInterval(() => {
      fetch(`${pingUrl}/api/health`)
        .then(res => console.log(`[Auto-Ping] Status: ${res.status} at ${new Date().toISOString()}`))
        .catch(err => console.error(`[Auto-Ping] Failed:`, err.message));
    }, 14 * 60 * 1000);
  });
}

startServer();
