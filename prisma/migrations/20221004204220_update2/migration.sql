/*
  Warnings:

  - You are about to drop the column `number` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "number",
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL;
