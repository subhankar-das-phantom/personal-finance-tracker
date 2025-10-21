const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration - more secure than default
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:5173' 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(morgan('dev'));

// const limiter = rateLimit({
// 	windowMs: 1 * 60 * 1000, // 1 minutes
// 	hydrogen: 10000, // Limit each IP to 10000 requests per `window` (here, per 1 minutes)
// 	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// app.use('/api', limiter);

// MongoDB connection with better error handling
const uri = process.env.ATLAS_URI;

if (!uri) {
  console.error('ATLAS_URI environment variable is not defined');
  process.exit(1);
}

// Connect to MongoDB with improved options
mongoose.connect(uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log("MongoDB database connection established successfully");
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// MongoDB connection event handlers
const connection = mongoose.connection;

connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve the static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Handles any requests that don't match the ones above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// Routes
const usersRouter = require('./routes/users');
const transactionsRouter = require('./routes/transactions');
const budgetGoalsRouter = require('./routes/budgetGoals');
const budgetRoutes = require('./routes/budget');

app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgetGoals', budgetGoalsRouter);
app.use('/api/budget', budgetRoutes);


// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Personal Finance Tracker API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      transactions: '/api/transactions',
      health: '/health'
    }
  });
});

// 404 handler for undefined routes - FIXED FOR EXPRESS v5
app.use('/*catchAll', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
});

module.exports = app;
