import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import downloadRouter from './routes/download.js';
import soundcloudRouter from './routes/soundcloud.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configurar CORS para aceitar múltiplas origens
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  // Adicione outras origens conforme necessário
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    // Permitir se a origin está na lista, se é do mesmo domínio, ou se é *.drizion.com
    if (
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://') ||
      origin.endsWith('.drizion.com') ||
      origin === 'https://drizion.com'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/soundcloud', soundcloudRouter);
app.use('/api/download', downloadRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Client URL: ${CLIENT_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
