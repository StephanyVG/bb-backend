const prisma = require('../lib/prisma');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/finanzas/corte
 * Endpoint protegido para reporte financiero y corte de mes.
 * Query params obligatorios: ?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
 * Filtra pedidos con estado === 'completado' dentro del rango de fechas.
 */
async function getCorteFinanciero(req, res, next) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Los parámetros query "fecha_inicio" y "fecha_fin" son obligatorios (formato YYYY-MM-DD)'
      });
    }

    if (!DATE_REGEX.test(fecha_inicio) || !DATE_REGEX.test(fecha_fin)) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Las fechas deben tener el formato válido YYYY-MM-DD (ej: 2026-10-01)'
      });
    }

    const startDate = new Date(`${fecha_inicio}T00:00:00.000Z`);
    const endDate = new Date(`${fecha_fin}T23:59:59.999Z`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Una o ambas fechas proporcionadas son fechas calendario inválidas'
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'La fecha_inicio no puede ser posterior a la fecha_fin'
      });
    }

    // Consultar pedidos completados en el rango especificado
    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: 'completado',
        fecha_creacion: {
          gte: startDate,
          lte: endDate
        }
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
      },
      orderBy: {
        fecha_creacion: 'asc'
      }
    });

    // Cálculos financieros precisos
    let totalVentasBrutasCentavos = 0;
    let totalComisionAnticuarioCentavos = 0;

    for (const pedido of pedidos) {
      const totalPedido = Number(pedido.total_calculado);
      totalVentasBrutasCentavos += Math.round(totalPedido * 100);

      if (pedido.comision && pedido.comision.monto_comision) {
        const comisionMonto = Number(pedido.comision.monto_comision);
        totalComisionAnticuarioCentavos += Math.round(comisionMonto * 100);
      }
    }

    const totalVentasBrutas = Number((totalVentasBrutasCentavos / 100).toFixed(2));
    const totalComisionAnticuario = Number((totalComisionAnticuarioCentavos / 100).toFixed(2));
    const totalNetoCafeteria = Number(((totalVentasBrutasCentavos - totalComisionAnticuarioCentavos) / 100).toFixed(2));

    return res.json({
      success: true,
      periodo: {
        fecha_inicio,
        fecha_fin
      },
      total_ventas_brutas: totalVentasBrutas,
      total_comision_anticuario: totalComisionAnticuario,
      total_neto_cafeteria: totalNetoCafeteria,
      cantidad_pedidos: pedidos.length,
      desglose_pedidos: pedidos
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCorteFinanciero
};
