/*
  Warnings:

  - You are about to drop the column `role` on the `Admin` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Admin_role_idx";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "role";
