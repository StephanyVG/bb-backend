/**
 * Middleware centralizado para manejo de errores
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err);

  // Manejo de errores CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Error de CORS',
      message: err.message
    });
  }

  // Manejo de errores de validación JSON en body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El cuerpo de la solicitud no contiene un JSON válido'
    });
  }

  // Manejo de errores conocidos de Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      message: 'El registro solicitado no existe en la base de datos'
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto de unicidad',
      message: `Violación de restricción única en el campo: ${err.meta?.target || 'desconocido'}`
    });
  }

  // Error genérico de servidor
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    error: err.name || 'Error del servidor',
    message: err.message || 'Ha ocurrido un error inesperado en el servidor'
  });
}

module.exports = errorHandler;
