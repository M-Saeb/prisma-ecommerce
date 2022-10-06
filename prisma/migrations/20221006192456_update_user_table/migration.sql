/*
  Warnings:

  - You are about to drop the column `phone_number` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "phone_number",
ADD COLUMN     "phoneNumber" TEXT;
