const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler');

const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const finanzasRoutes = require('./routes/finanzas.routes');

const app = express();

// 1. Cabeceras de Seguridad HTTP con Helmet
app.use(helmet());

// 2. CORS Dinámico
app.use(corsMiddleware);

// 3. Parsing de Body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Endpoint de Salud / Estado del Servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Cafetería API Production',
    version: '1.0.0',
    status: 'online',
    docs: {
      productos: '/api/productos',
      pedidos: '/api/pedidos',
      dashboard: '/api/dashboard/pedidos',
      finanzas: '/api/finanzas/corte'
    }
  });
});

// 5. Montaje de Rutas de la API
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/finanzas', finanzasRoutes);

// 6. Manejador para Rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor`
  });
});

// 7. Manejador Central de Errores
app.use(errorHandler);

module.exports = app;
