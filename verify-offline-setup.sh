#!/bin/bash

# Offline Attendance System Verification Script
# This script helps verify that the offline attendance system is working correctly

echo "🔍 WorkBeat Offline Attendance System Verification"
echo "=================================================="
echo ""

# Check if required files exist
echo "📁 Checking required files..."

files=(
    "client/src/services/offlineAttendanceDB.ts"
    "client/src/services/offlineAttendanceService.ts"
    "client/src/components/context/OfflineContext.tsx"
    "client/src/components/OfflineIndicator.tsx"
    "OFFLINE_ATTENDANCE_IMPLEMENTATION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔧 Configuration Checks..."

# Check if idb package is installed
if grep -q '"idb"' client/package.json; then
    echo "✅ idb package found in package.json"
else
    echo "⚠️  idb package not found in package.json - run: npm install idb"
fi

# Check if OfflineProvider is in main.tsx
if grep -q "OfflineProvider" client/src/main.tsx; then
    echo "✅ OfflineProvider integrated in main.tsx"
else
    echo "❌ OfflineProvider not found in main.tsx"
fi

# Check if OfflineIndicator is in Header
if grep -q "OfflineIndicator" client/src/components/layout/Header.tsx; then
    echo "✅ OfflineIndicator integrated in Header"
else
    echo "❌ OfflineIndicator not found in Header"
fi

echo ""
echo "🌐 Server Configuration..."

# Check CSRF protection updates
if grep -q "allowedOrigins" server/middleware/csrfProtection.js; then
    echo "✅ CSRF protection updated for development"
else
    echo "❌ CSRF protection needs updating"
fi

# Check environment configuration
if grep -q "FRONTEND_URL" server/.env.development; then
    echo "✅ FRONTEND_URL configured in environment"
else
    echo "❌ FRONTEND_URL not found in environment"
fi

echo ""
echo "🧪 Testing Instructions:"
echo "======================="
echo ""
echo "1. Manual Network Test:"
echo "   - Start both client and server"
echo "   - Visit http://localhost:5173"
echo "   - Disconnect your internet"
echo "   - Try recording attendance"
echo "   - Reconnect internet and watch sync"
echo ""
echo "2. Demo Page Test:"
echo "   - Visit http://localhost:5173/offline-demo"
echo "   - Use manual offline mode toggle"
echo "   - Record test attendance records"
echo "   - Check sync statistics"
echo ""
echo "3. Browser DevTools:"
echo "   - Open Application → IndexedDB → workbeat-offline"
echo "   - Monitor attendance records storage"
echo "   - Check Network tab for sync requests"
echo ""
echo "✨ Setup appears to be complete!"
echo "Start your servers and test the offline functionality."
