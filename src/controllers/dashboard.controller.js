const prisma = require('../lib/prisma');

/**
 * GET /api/dashboard/pedidos
 * Endpoint protegido para el panel administrativo / cocina.
 * Permite filtrar por estado (ej: ?estado=pendiente).
 * Ordena por fecha_creacion ascendente (los más antiguos primero).
 * Incluye los detalles con datos del producto y la comisión.
 */
async function getPedidosDashboard(req, res, next) {
  try {
    const { estado } = req.query;
    const where = {};

    if (estado && typeof estado === 'string') {
      where.estado = estado.toLowerCase().trim();
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: {
        fecha_creacion: 'asc'
      },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                categoria: true
              }
            }
          }
        },
        comision: true
      }
    });

    return res.json({
      success: true,
      count: pedidos.length,
      data: pedidos
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPedidosDashboard
};
