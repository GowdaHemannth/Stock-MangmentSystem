'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStock() {
  const stock = await prisma.stock.findMany();
  return stock;
}

export async function getProductionRules() {
  const rules = await prisma.productionRule.findMany();
  return rules;
}

export async function getProductionHistory(productName?: string) {
  const history = await prisma.productionHistory.findMany({
    where: productName ? { product: productName } : {},
    orderBy: { date: 'desc' },
    take: 10,
  });
  return history;
}

export async function authorizeManager(password: string) {
  // Simple check for demonstration purposes. In real-world, use NextAuth or JWT.
  const user = await prisma.authorizedUser.findUnique({
    where: { username: 'manager' }
  });
  
  if (user && user.password === password) {
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
}

export async function updateStock(stockUpdates: { materialName: string, quantity: number }[]) {
  // Assuming authorized
  try {
    for (const update of stockUpdates) {
      await prisma.stock.update({
        where: { materialName: update.materialName },
        data: { quantity: update.quantity }
      });
    }
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Database error while updating stock' };
  }
}

export async function produceProduct(productName: string, quantity: number, metadata?: string) {
  try {
    // 1. Get rules for this product
    const rules = await prisma.productionRule.findMany({
      where: { product: productName }
    });

    if (rules.length === 0) {
      return { success: false, error: 'No production rules defined for this product' };
    }

    // 2. Fetch current stock
    const currentStock = await prisma.stock.findMany();
    const stockMap = new Map<string, number>(currentStock.map((s: any) => [s.materialName, s.quantity as number]));

    // 3. Verify enough stock and calculate deductions
    const deductions: { material: string, deduct: number }[] = [];
    for (const rule of rules) {
      const needed = rule.quantityRequired * quantity;
      const available = stockMap.get(rule.material) || 0;
      if (available < needed) {
        return { 
          success: false, 
          error: `Insufficient stock for ${rule.material}. Need ${needed}, but only have ${available}.` 
        };
      }
      deductions.push({ material: rule.material, deduct: needed });
    }

    // 4. Perform deduction and log history inside a transaction
    await prisma.$transaction(async (tx: any) => {
      // Deduct stock
      for (const req of deductions) {
        await tx.stock.update({
          where: { materialName: req.material },
          data: {
            quantity: {
              decrement: req.deduct
            }
          }
        });
      }

      // Log history
      await tx.productionHistory.create({
        data: {
          product: productName,
          quantity: quantity,
          metadata: metadata || null
        }
      });
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Production failed' };
  }
}

export async function seedDatabaseIfEmpty() {
  const userCount = await prisma.authorizedUser.count();
  if (userCount > 0) return; // Already seeded

  console.log("Seeding database via Server Action...");
  
  // Create Manager
  await prisma.authorizedUser.create({
    data: {
      username: 'manager',
      password: 'admin123',
    },
  });

  // Create Stock
  const initialStocks = [
    { materialName: 'Pages', quantity: 12000, unit: 'units' },
    { materialName: 'Book Covers', quantity: 500, unit: 'units' },
    { materialName: 'Ink', quantity: 40, unit: 'liters' },
    { materialName: 'Cloth', quantity: 300, unit: 'meters' },
    { materialName: 'Uniform Buttons', quantity: 2000, unit: 'units' },
    { materialName: 'Bag Material', quantity: 150, unit: 'units' },
    { materialName: 'Shoe Material', quantity: 100, unit: 'units' },
  ];

  for (const stock of initialStocks) {
    await prisma.stock.create({
      data: stock,
    });
  }

  // Create Rules
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
  
  revalidatePath('/');
}
