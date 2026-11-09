/**
 * @file swagger.js
 * @description Loads centralized OpenAPI spec from YAML for Swagger UI
 */

const path = require('path');
const YAML = require('yamljs');

const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

module.exports = swaggerDocument;