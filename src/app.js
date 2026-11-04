const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const familyRoutes = require('./routes/familyRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors());

// Rate Limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'Kutumbh FMS Core API is healthy and operational.');
});

// Mount Domain Routes
app.use('/api/v1/families', familyRoutes);

// Catch-all 404 handler for undefined endpoints
app.use((req, res) => {
  return ApiResponse.error(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

// Central Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;