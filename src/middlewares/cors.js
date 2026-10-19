const cors = require('cors');
const config = require('../config/env');

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman, curl, herramientas internas o server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowed = config.ALLOWED_ORIGINS.some((allowedOrigin) => {
      // Comparación exacta
      if (allowedOrigin === origin) return true;

      // Soporte para comodines como *.vercel.app
      if (allowedOrigin.startsWith('*.')) {
        const domainSuffix = allowedOrigin.slice(1); // ej: .vercel.app
        const originUrl = new URL(origin);
        return originUrl.hostname.endsWith(domainSuffix);
      }

      return false;
    });

    if (allowed) {
      return callback(null, true);
    }

    return callback(new Error(`Origen ${origin} no permitido por la política CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

module.exports = cors(corsOptions);
