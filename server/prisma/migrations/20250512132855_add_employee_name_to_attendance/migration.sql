/*
  Warnings:

  - You are about to drop the `QRCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "employeeName" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QRCode";
PRAGMA foreign_keys=on;
