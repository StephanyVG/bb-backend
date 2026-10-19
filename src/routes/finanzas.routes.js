const express = require('express');
const router = express.Router();
const finanzasController = require('../controllers/finanzas.controller');
const { requireAdminAuth } = require('../middlewares/auth');

// Todas las rutas financieras son protegidas
router.use(requireAdminAuth);

router.get('/corte', finanzasController.getCorteFinanciero);

module.exports = router;
