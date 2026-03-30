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
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
        const providedKey = req.headers['x-api-secret-key'] || req.headers['x-auth-key'] || req.headers.authorization?.replace('Bearer ', '') || req.body.apiSecretKey;
        if (providedKey !== expectedKey) {
          return res.status(401).json({ error: 'Unauthorized: Invalid API Secret Key' });
        }
      }

      const { from, to, subject, body } = req.body;

      if (!body || !to) {
        return res.status(400).json({ error: 'Missing body or to address' });
      }

      // Parse the raw email using mailparser
      let parsedText = '';
      let parsedHtml = '';
      let finalSubject = subject || 'No Subject';
      let finalFrom = from || 'Unknown Sender';

      try {
        // Ensure body is a string and trim leading whitespace/newlines
        // Leading newlines cause mailparser to treat the whole string as body instead of headers
        const rawEmailString = typeof body === 'string' ? body.trimStart() : String(body);
        const parsed = await simpleParser(rawEmailString);
        parsedText = parsed.text || '';
        parsedHtml = parsed.html || '';
        if (parsed.subject) finalSubject = parsed.subject;
        if (parsed.from && parsed.from.text) finalFrom = parsed.from.text;
      } catch (err) {
        console.error('Error parsing email:', err);
      }

      // Fallback: If mailparser fails to find HTML, but the raw body contains HTML tags, extract it manually
      if (!parsedHtml && typeof body === 'string') {
        const htmlStartIndex = body.indexOf('<!DOCTYPE html>');
        const htmlStartIndex2 = body.indexOf('<html');
        
        const startIndex = htmlStartIndex !== -1 ? htmlStartIndex : (htmlStartIndex2 !== -1 ? htmlStartIndex2 : -1);
        
        if (startIndex !== -1) {
          // Extract everything from the start of the HTML tag to the end of the string
          parsedHtml = body.substring(startIndex);
          
          // Try to decode quoted-printable if it looks like it's encoded
          if (parsedHtml.includes('=\r\n') || parsedHtml.includes('=\n') || parsedHtml.includes('=3D')) {
            // Simple quoted-printable decoding for the fallback
            parsedHtml = parsedHtml
              .replace(/=\r\n/g, '')
              .replace(/=\n/g, '')
              .replace(/=3D/g, '=')
              .replace(/=20/g, ' ')
              .replace(/=09/g, '\t')
              .replace(/=C2=A9/g, '©');
          }
        }
      }

      if (!parsedText && !parsedHtml) {
        parsedText = body; // Fallback if parsing fails completely
      }

      // Rate Limiting by recipient address
      const now = Date.now();
      const lastReceived = rateLimitMap.get(to) || 0;
      if (now - lastReceived < RATE_LIMIT_WINDOW_MS) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait 10 seconds.' });
      }
      rateLimitMap.set(to, now);

      // Extract OTP (4 to 8 digits) - improved to avoid dates and random numbers
      let otp = null;
      const searchText = parsedText || parsedHtml || body;
      
      // Look for numbers near keywords (before or after, within 150 chars)
      // Keywords: otp, code, pin, password, verification, token
      const keywordRegex = /(?:(?:otp|code|pin|password|verification|token)[\s\S]{0,150}?\b(?!(?:19|20)\d{2}\b)(\d{4,8})\b)|(?:\b(?!(?:19|20)\d{2}\b)(\d{4,8})\b[\s\S]{0,150}?(?:otp|code|pin|password|verification|token))/i;
      
      const keywordMatch = searchText.match(keywordRegex);
      if (keywordMatch) {
        otp = keywordMatch[1] || keywordMatch[2];
      }

      // Save to MongoDB
      if (mongoose.connection.readyState === 1) {
        // Ultimate fallback: ensure fullBody is never empty
        const finalFullBody = parsedText || body || 'Empty Body';
        
        const newEmail = new Email({
          otp,
          fullBody: finalFullBody,
          htmlBody: parsedHtml || '',
          recipientAlias: to,
          from: finalFrom,
          subject: finalSubject,
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
