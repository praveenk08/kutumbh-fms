/**
 * @file app.js
 * @description Kutumbh FMS - Express Application Setup & Middleware Pipeline
 * Configures security headers, CORS, rate limiting, body parsers, and API routes.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route Handlers
const familyRoutes = require('./routes/familyRoutes');
const memberRoutes = require('./routes/memberRoutes');

// Utilities & Middlewares
const errorHandler = require('./middlewares/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// 1. Security Headers (Helmet HTTP headers protect against common vulnerabilities)
app.use(helmet());

// 2. Cross-Origin Resource Sharing (Allows frontend/admin panel communication)
app.use(cors());

// 3. API Rate Limiting (Prevents brute-force & denial of service attacks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// 4. Request Body Parsers (Handles incoming JSON and form payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'Kutumbh FMS Core API is healthy and operational.');
});

// 6. Domain-Specific API Routes (Properly prefixed)
app.use('/api/v1/families', familyRoutes);
app.use('/api/v1/members', memberRoutes);

// 7. Catch-All Route for Undefined Endpoints (404 Not Found)
app.use((req, res) => {
  return ApiResponse.error(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

// 8. Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;