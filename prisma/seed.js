const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCTOS_INICIALES = [
  {
    nombre: 'Espresso Americano',
    precio: 35.00,
    categoria: 'Bebidas Calientes',
    estado: 'activo'
  },
  {
    nombre: 'Cappuccino Italiano',
    precio: 48.00,
    categoria: 'Bebidas Calientes',
    estado: 'activo'
  },
  {
    nombre: 'Latte Vainilla Frío',
    precio: 55.00,
    categoria: 'Bebidas Frías',
    estado: 'activo'
  },
  {
    nombre: 'Croissant Artesanal de Mantequilla',
    precio: 42.00,
    categoria: 'Panadería',
    estado: 'activo'
  },
  {
    nombre: 'Bagel Rústico de Pavo y Queso',
    precio: 68.00,
    categoria: 'Alimentos',
    estado: 'activo'
  }
];

async function main() {
  console.log('Verificando catálogo inicial de productos...');
  const total = await prisma.producto.count();

  if (total > 0) {
    console.log(`El catálogo ya contiene ${total} productos. Omitiendo seed inicial.`);
    return;
  }

  console.log('Tabla vacía. Insertando 5 productos iniciales de cafetería...');
  for (const item of PRODUCTOS_INICIALES) {
    await prisma.producto.create({
      data: item
    });
  }

  console.log('Seed completado exitosamente: 5 productos insertados.');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
