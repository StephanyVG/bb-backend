const prisma = require('../lib/prisma');

/**
 * GET /api/productos
 * Consulta el catálogo de productos.
 * Query param opcional: ?activo=true
 */
async function getProductos(req, res, next) {
  try {
    const { activo } = req.query;
    const where = {};

    if (activo === 'true') {
      where.estado = 'activo';
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { id: 'asc' }
    });

    return res.json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/productos
 * Crea un nuevo producto (Protegido por ADMIN_API_KEY).
 * Valida precio > 0 y campos obligatorios.
 */
async function createProducto(req, res, next) {
  try {
    const { nombre, precio, categoria, estado } = req.body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El nombre del producto es obligatorio y debe ser un texto válido'
      });
    }

    const precioNumerico = Number(precio);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'El precio debe ser un número mayor a 0'
      });
    }

    if (!categoria || typeof categoria !== 'string' || !categoria.trim()) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'La categoría es obligatoria y debe ser un texto válido'
      });
    }

    const estadoValido = estado === 'inactivo' ? 'inactivo' : 'activo';

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        precio: precioNumerico,
        categoria: categoria.trim(),
        estado: estadoValido
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/productos/:id
 * Edita nombre, precio o categoria de un producto (Protegido).
 */
async function updateProducto(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'ID de producto inválido'
      });
    }

    const { nombre, precio, categoria } = req.body;
    const dataToUpdate = {};

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'El nombre no puede ser una cadena vacía'
        });
      }
      dataToUpdate.nombre = nombre.trim();
    }

    if (precio !== undefined) {
      const precioNumerico = Number(precio);
      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'El precio debe ser un número mayor a 0'
        });
      }
      dataToUpdate.precio = precioNumerico;
    }

    if (categoria !== undefined) {
      if (typeof categoria !== 'string' || !categoria.trim()) {
        return res.status(400).json({
          error: 'Validación fallida',
          message: 'La categoría no puede ser una cadena vacía'
        });
      }
      dataToUpdate.categoria = categoria.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'Debe proporcionar al menos un campo para actualizar (nombre, precio o categoria)'
      });
    }

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: dataToUpdate
    });

    return res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productoActualizado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/productos/:id/estado
 * Cambia el estado del producto entre 'activo' e 'inactivo' (Soft Delete) (Protegido).
 */
async function updateEstadoProducto(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: 'ID de producto inválido'
      });
    }

    const { estado } = req.body;
    if (!estado || !['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        error: 'Validación fallida',
        message: "El estado debe ser 'activo' o 'inactivo'"
      });
    }

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: { estado }
    });

    return res.json({
      success: true,
      message: `Estado del producto actualizado a '${estado}'`,
      data: productoActualizado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProductos,
  createProducto,
  updateProducto,
  updateEstadoProducto
};
