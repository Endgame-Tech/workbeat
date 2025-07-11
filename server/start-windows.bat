@echo off
echo Starting WorkBeat Server on Windows with PostgreSQL...

REM Copy Windows environment file
copy .env.windows .env

REM Set environment variable
set NODE_ENV=local

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate

REM Start the server
echo Starting WorkBeat server...
echo Server will be available at: http://localhost:5000
echo Frontend should be available at: http://localhost:5173
echo.
npm start