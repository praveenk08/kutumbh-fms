/**
 * @file app.js
 * @description Kutumbh FMS - Express Application Setup & Middleware Pipeline
 * Configures security headers, CORS, rate limiting, body parsers, and API routes.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Route Handlers
const familyRoutes = require('./routes/familyRoutes');
const memberRoutes = require('./routes/memberRoutes');
const censusRoutes = require('./routes/censusRoutes');

// Utilities & Middlewares
const errorHandler = require('./middlewares/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// 1. Security Headers (Swagger UI assets allow karne ke liye CSP disable rakha gaya hai)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// 2. Cross-Origin Resource Sharing
app.use(cors());

// 3. API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Static Frontend Files (Bootstrap Admin Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// 6. Swagger API Documentation (404 catch-all se pehle hona zaroori hai)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Health Check Endpoint
app.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'Kutumbh FMS Core API is healthy and operational.');
});

// 8. Domain-Specific API Routes
app.use('/api/v1/families', familyRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/census', censusRoutes);

// 9. Root Route -> Admin Console
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 10. Catch-All Route for Undefined Endpoints (404 Not Found)
app.use((req, res) => {
  return ApiResponse.error(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

// 11. Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;