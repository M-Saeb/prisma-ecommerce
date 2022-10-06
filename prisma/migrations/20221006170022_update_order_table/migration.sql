/*
  Warnings:

  - Made the column `totalPrice` on table `OrderLine` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrderLine" ALTER COLUMN "totalPrice" SET NOT NULL;
