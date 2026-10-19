const prisma = require('../lib/prisma');

const ESTADOS_VALIDOS_PEDIDO = ['pendiente', 'preparando', 'completado', 'cancelado'];

/**
 * POST /api/pedidos
 * Endpoint público usado por el menú para crear pedidos.
 * Ejecuta una transacción Prisma para garantizar consistencia atómica:
 * - Consulta precios vigentes y valida que estén 'activos'
 * - Calcula el total en el servidor con precisión financiera
 * - Guarda detalles con precio_unitario_congelado
 * - Genera comisión del 10% si origen === 'anticuario'
 */
async function createPedido(req, res, next) {
  try {
    const { nombre_cliente, origen = 'anticuario', items } = req.body;

    if (!nombre_cliente || typeof nombre_cliente !== 'string' || !nombre_cliente.trim()) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El nombre del cliente es obligatorio'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Debe incluir al menos un producto en la lista de items'
      });
    }

    // Normalizar y validar estructura de cada item
    const itemsValidados = [];
    for (const item of items) {
      const productoId = parseInt(item.producto_id, 10);
      const cantidad = parseInt(item.cantidad, 10);

      if (isNaN(productoId) || productoId <= 0) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'Cada item debe contener un producto_id válido'
        });
      }

      if (isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'La cantidad debe ser un entero mayor a 0'
        });
      }

      itemsValidados.push({ productoId, cantidad });
    }

    const productoIds = itemsValidados.map((item) => item.productoId);

    // Transacción atómica en base de datos
    const nuevoPedido = await prisma.$transaction(async (tx) => {
      // 1. Consultar productos existentes en la base de datos
      const productosDb = await tx.producto.findMany({
        where: {
          id: { in: productoIds }
        }
      });

      const productosMap = new Map();
      productosDb.forEach((p) => productosMap.set(p.id, p));

      // 2. Validar existencia y estado activo de todos los productos
      for (const item of itemsValidados) {
        const prod = productosMap.get(item.productoId);
        if (!prod) {
          throw new Error(`El producto con ID ${item.productoId} no existe en el catálogo`);
        }
        if (prod.estado !== 'activo') {
          throw new Error(`El producto "${prod.nombre}" (ID ${prod.id}) se encuentra inactivo y no puede ordenarse`);
        }
      }

      // 3. Calcular total y preparar detalles con precio_unitario_congelado
      let totalCalculadoCentavos = 0;
      const detallesData = [];

      for (const item of itemsValidados) {
        const prod = productosMap.get(item.productoId);
        const precioUnitario = Number(prod.precio);
        const precioUnitarioCentavos = Math.round(precioUnitario * 100);
        const subtotalCentavos = precioUnitarioCentavos * item.cantidad;

        totalCalculadoCentavos += subtotalCentavos;

        detallesData.push({
          producto_id: prod.id,
          cantidad: item.cantidad,
          precio_unitario_congelado: precioUnitario
        });
      }

      const totalCalculado = Number((totalCalculadoCentavos / 100).toFixed(2));
      const origenNormalizado = (typeof origen === 'string' && origen.trim()) ? origen.trim() : 'anticuario';

      // 4. Crear el pedido con sus detalles
      const pedidoCreado = await tx.pedido.create({
        data: {
          nombre_cliente: nombre_cliente.trim(),
          origen: origenNormalizado,
          total_calculado: totalCalculado,
          estado: 'pendiente',
          detalles: {
            create: detallesData
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
          }
        }
      });

      // 5. Si origen === 'anticuario', calcular comisión del 10% y crear registro
      let comisionCreada = null;
      if (origenNormalizado.toLowerCase() === 'anticuario') {
        const porcentaje = 10.00;
        const montoComision = Number((totalCalculado * (porcentaje / 100)).toFixed(2));

        comisionCreada = await tx.comision.create({
          data: {
            pedido_id: pedidoCreado.id,
            porcentaje_aplicado: porcentaje,
            monto_comision: montoComision,
            estado_pago: 'pendiente'
          }
        });
      }

      return {
        ...pedidoCreado,
        comision: comisionCreada
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: nuevoPedido
    });
  } catch (error) {
    if (error.message && (error.message.includes('no existe') || error.message.includes('inactivo'))) {
      return res.status(400).json({
        error: 'Error en la solicitud',
        message: error.message
      });
    }
    next(error);
  }
}

/**
 * PATCH /api/pedidos/:id/estado
 * Actualiza el estado de un pedido (Protegido por ADMIN_API_KEY).
 * Estados permitidos: 'pendiente', 'preparando', 'completado', 'cancelado'
 */
async function updateEstadoPedido(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'ID de pedido inválido'
      });
    }

    const { estado } = req.body;
    if (!estado || !ESTADOS_VALIDOS_PEDIDO.includes(estado)) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: `El estado debe ser uno de: ${ESTADOS_VALIDOS_PEDIDO.join(', ')}`
      });
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: { estado },
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
      message: `Estado del pedido #${id} actualizado a '${estado}'`,
      data: pedidoActualizado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPedido,
  updateEstadoPedido
};
