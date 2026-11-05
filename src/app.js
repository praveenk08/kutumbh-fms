const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const familyRoutes = require('./routes/familyRoutes');
const memberRoutes = require('./routes/memberRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

app.use(helmet());
app.use(cors());

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  return ApiResponse.success(res, 200, 'Kutumbh FMS Core API is healthy and operational.');
});

// Domain Routes - Dono /api/v1 par clean mount hain
app.use('/api/v1', familyRoutes);
app.use('/api/v1', memberRoutes);

app.use((req, res) => {
  return ApiResponse.error(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

app.use(errorHandler);

module.exports = app;