const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { requireAdminAuth } = require('../middlewares/auth');

// Rutas Públicas
router.get('/', productosController.getProductos);

// Rutas Protegidas (Dashboard / Admin)
router.post('/', requireAdminAuth, productosController.createProducto);
router.put('/:id', requireAdminAuth, productosController.updateProducto);
router.patch('/:id/estado', requireAdminAuth, productosController.updateEstadoProducto);

module.exports = router;
