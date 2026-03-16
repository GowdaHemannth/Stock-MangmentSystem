import { PrismaClient } from '@prisma/client';
console.log(typeof PrismaClient);
try {
  const prisma = new PrismaClient();
  console.log("Prisma instantiated successfully!");
} catch (e) {
  console.error("Error:", e.message);
}
