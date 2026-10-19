const app = require('./app');
const config = require('./config/env');
const prisma = require('./lib/prisma');

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`☕ Cafetería API Servidor Producción Activo`);
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🌍 Entorno: ${config.NODE_ENV}`);
  console.log(`🛡️  Orígenes CORS permitidos: ${config.ALLOWED_ORIGINS.join(', ')}`);
  console.log(`===============================================`);
});

// Manejo de apagado elegante (Graceful Shutdown)
async function gracefulShutdown(signal) {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor HTTP y desconectando base de datos...`);
  
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    try {
      await prisma.$disconnect();
      console.log('Conexión con PostgreSQL desconectada limpiamente.');
      process.exit(0);
    } catch (err) {
      console.error('Error al desconectar Prisma:', err);
      process.exit(1);
    }
  });

  // Forzar apagado después de 10 segundos en caso de conexiones colgadas
  setTimeout(() => {
    console.error('Tiempo de espera agotado. Forzando cierre del proceso.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
