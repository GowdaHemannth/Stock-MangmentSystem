const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create Manager
  await prisma.authorizedUser.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      password: 'admin123', // In a real app, hash this!
    },
  });

  // Create Stock
  const initialStocks = [
    { materialName: 'Pages', quantity: 12000, unit: 'units' }, // Changed to 12000 as per example UI
    { materialName: 'Book Covers', quantity: 500, unit: 'units' },
    { materialName: 'Ink', quantity: 40, unit: 'liters' },
    { materialName: 'Cloth', quantity: 300, unit: 'meters' },
    { materialName: 'Uniform Buttons', quantity: 2000, unit: 'units' },
    { materialName: 'Bag Material', quantity: 150, unit: 'units' },
    { materialName: 'Shoe Material', quantity: 100, unit: 'units' },
  ];

  for (const stock of initialStocks) {
    await prisma.stock.upsert({
      where: { materialName: stock.materialName },
      update: {},
      create: stock,
    });
  }

  // Create Rules (if we wanted to rely on DB, but our logic might just use constants or DB)
  // Let's seed rules to match exactly what's required, we can clear and recreate
  await prisma.productionRule.deleteMany({});
  const rules = [
    { product: 'Book', material: 'Pages', quantityRequired: 100 },
    { product: 'Book', material: 'Book Covers', quantityRequired: 1 },
    { product: 'Book', material: 'Ink', quantityRequired: 0.02 },
    { product: 'Uniform', material: 'Cloth', quantityRequired: 2 },
    { product: 'Uniform', material: 'Uniform Buttons', quantityRequired: 4 },
    { product: 'Bag', material: 'Bag Material', quantityRequired: 1 },
  ];

  for (const rule of rules) {
    await prisma.productionRule.create({
      data: rule,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
