// server.js - Create a simple Express server
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import paymentRoutes from './routes/paymentRoutes.js'; // Adjust path as needed

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - THIS IS CRUCIAL
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
      'http://localhost:3000',
    'http://localhost:5000', // Add other origins if needed
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
};

// Apply CORS middleware BEFORE other middlewares
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add a simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Mount payment routes
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log(`Health check: http://localhost:${PORT}/health`);
console.log(`Health check: /health`);
});

export default app;
