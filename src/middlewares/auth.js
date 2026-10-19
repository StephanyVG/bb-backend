const config = require('../config/env');

/**
 * Middleware para validar autenticación de administrador por API Key
 * Verifica headers:
 * - `x-api-key: <token>`
 * - `Authorization: Bearer <token>`
 */
function requireAdminAuth(req, res, next) {
  const adminApiKey = process.env.ADMIN_API_KEY || config.ADMIN_API_KEY;

  if (!adminApiKey) {
    return res.status(500).json({
      error: 'Error de configuración',
      message: 'ADMIN_API_KEY no está configurada en las variables de entorno'
    });
  }

  // 1. Verificar header 'x-api-key'
  const xApiKey = req.header('x-api-key');

  // 2. Verificar header 'Authorization: Bearer <token>'
  const authHeader = req.header('Authorization');
  let bearerToken = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const tokenProvided = xApiKey || bearerToken;

  if (!tokenProvided) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Se requiere API Key de administrador (x-api-key o Authorization: Bearer)'
    });
  }

  if (tokenProvided !== adminApiKey) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'API Key de administrador no válida'
    });
  }

  next();
}

module.exports = {
  requireAdminAuth
};
