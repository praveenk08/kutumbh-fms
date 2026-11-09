/**
 * @file swagger.js
 * @description OpenAPI 3.0 / Swagger configuration for Kutumbh FMS
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kutumbh FMS API',
      version: '2.0.0',
      description: 'Gram Panchayat Digital Family Management System & Census Platform API Documentation',
      contact: {
        name: 'Praveen Kumar',
        email: 'pk46066@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Saare route files se JSDoc comments parse karega
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;