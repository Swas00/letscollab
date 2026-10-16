#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "          LetsCollab SMTP Password Setup"
echo "=========================================================="
echo ""
echo "Please enter your 16-character Google App Password"
echo "(Note: characters are hidden for security while you type/paste):"
read -s -r SMTP_INPUT
echo ""

# Remove any spaces in case user pasted with spaces like "abcd efgh ijkl mnop"
CLEAN_PASS=$(echo "$SMTP_INPUT" | tr -d ' ')

if [ -z "$CLEAN_PASS" ]; then
  echo "❌ Error: Password cannot be empty."
  exit 1
fi

# 1. Save to ~/.env
touch ~/.env
sed -i '' '/^SMTP_PASS=/d' ~/.env 2>/dev/null || true
echo "SMTP_PASS=$CLEAN_PASS" >> ~/.env

# 2. Save to backend/.env
BACKEND_ENV="/Users/swastiksahu/Downloads/Neostats/backend/.env"
touch "$BACKEND_ENV"
sed -i '' '/^SMTP_PASS=/d' "$BACKEND_ENV" 2>/dev/null || true
echo "SMTP_PASS=$CLEAN_PASS" >> "$BACKEND_ENV"

# 3. Add to Vercel
echo "Adding to Vercel Production Environment..."
cd /Users/swastiksahu/Downloads/Neostats/frontend
printf "%s" "$CLEAN_PASS" | npx vercel env add SMTP_PASS production --force --yes || true

echo ""
echo "=========================================================="
echo "✅ SMTP_PASS successfully saved to ~/.env, backend, and Vercel!"
echo "=========================================================="
