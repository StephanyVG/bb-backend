const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { requireAdminAuth } = require('../middlewares/auth');

// Ruta Pública (usada por el menú del cliente)
router.post('/', pedidosController.createPedido);

// Ruta Protegida (Dashboard / Admin)
router.patch('/:id/estado', requireAdminAuth, pedidosController.updateEstadoPedido);

module.exports = router;
