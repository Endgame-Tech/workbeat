-- WorkBeat Database Schema Migration
-- Run this in Windows psql to create the schema

-- Connect to workbeat_dev database first
\c workbeat_dev workbeat_user

-- Create Organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "industry" VARCHAR(100) NOT NULL,
    "contactEmail" VARCHAR(255) UNIQUE NOT NULL,
    "contactPhone" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "settings" TEXT,
    "subscription" TEXT,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'admin' NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "lastLogin" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- Create Employees table
CREATE TABLE IF NOT EXISTS "employees" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "employeeId" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(20),
    "position" VARCHAR(100),
    "department" VARCHAR(100),
    "hireDate" DATE,
    "salary" DECIMAL(10,2),
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "biometricData" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    UNIQUE("organizationId", "employeeId")
);

-- Create Attendance table
CREATE TABLE IF NOT EXISTS "attendances" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "employeeName" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMPTZ(6),
    "checkOut" TIMESTAMPTZ(6),
    "status" VARCHAR(20) DEFAULT 'present' NOT NULL,
    "ipAddress" VARCHAR(45),
    "location" VARCHAR(200),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE
);

-- Create Daily Attendance table
CREATE TABLE IF NOT EXISTS "dailyAttendances" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "hoursWorked" DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    "overtimeHours" DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    "status" VARCHAR(20) DEFAULT 'present' NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
    FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE,
    UNIQUE("organizationId", "employeeId", "date")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_organizationId" ON "users"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_employees_organizationId" ON "employees"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_employees_employeeId" ON "employees"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_attendances_organizationId" ON "attendances"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_attendances_employeeId" ON "attendances"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_attendances_date" ON "attendances"("date");
CREATE INDEX IF NOT EXISTS "idx_dailyAttendances_organizationId" ON "dailyAttendances"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_dailyAttendances_employeeId" ON "dailyAttendances"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_dailyAttendances_date" ON "dailyAttendances"("date");

-- Show created tables
SELECT 'Schema created successfully!' as status;
\dt