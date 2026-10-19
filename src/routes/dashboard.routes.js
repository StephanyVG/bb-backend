const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAdminAuth } = require('../middlewares/auth');

// Todas las rutas de dashboard son protegidas
router.use(requireAdminAuth);

router.get('/pedidos', dashboardController.getPedidosDashboard);

module.exports = router;
