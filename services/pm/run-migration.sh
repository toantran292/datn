#!/bin/bash

# Script to run sprint metrics migration

echo "🚀 Running Sprint Metrics Migration..."
echo ""

# Check if database is running
echo "1️⃣ Checking database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Database is connected"
else
  echo "❌ Database is not running!"
  echo ""
  echo "Please start your database first:"
  echo "  - Docker: make dev.up"
  echo "  - Or: docker-compose up -d"
  exit 1
fi

echo ""
echo "2️⃣ Running migration..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration successful!"
  echo ""
  echo "3️⃣ Regenerating Prisma client..."
  npx prisma generate
  echo ""
  echo "✅ Done! Sprint metrics are now available."
  echo ""
  echo "🔄 Please restart your backend server to apply changes."
else
  echo ""
  echo "❌ Migration failed!"
  echo ""
  echo "You can run the migration manually:"
  echo "  cd services/pm"
  echo "  npx prisma migrate deploy"
fi
