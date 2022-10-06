/*
  Warnings:

  - Made the column `email` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone_number` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone_number" SET NOT NULL;
