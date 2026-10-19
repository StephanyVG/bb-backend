const dotenv = require('dotenv');

dotenv.config();

const config = {
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL || '',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'clave_secreta_para_el_dashboard',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173'],
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = config;
