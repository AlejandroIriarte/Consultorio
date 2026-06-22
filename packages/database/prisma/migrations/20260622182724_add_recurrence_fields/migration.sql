-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "recurrenceCount" INTEGER,
ADD COLUMN     "recurrenceDays" TEXT[],
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceFrequency" "RecurrenceFrequency",
ADD COLUMN     "recurrenceInterval" INTEGER;
