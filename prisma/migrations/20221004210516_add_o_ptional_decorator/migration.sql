-- AlterTable
ALTER TABLE "OrderLine" ALTER COLUMN "totalPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "unitPrice" DROP NOT NULL;
