#!/bin/bash

# Avatar Upload Test Script
# This script tests the avatar upload functionality

echo "🧪 Testing Avatar Upload System"
echo "================================"
echo ""

# Configuration
API_URL="http://localhost:3000"
TOKEN=""  # Add your JWT token here

# Check if token is provided
if [ -z "$TOKEN" ]; then
  echo "⚠️  Please set your JWT token in this script (TOKEN variable)"
  echo "   You can get a token by logging in first."
  exit 1
fi

echo "Step 1: Creating a test image..."
# Create a simple test image using ImageMagick (if available)
if command -v convert &> /dev/null; then
  convert -size 200x200 xc:blue -pointsize 40 -fill white -gravity center \
    -annotate +0+0 "Test Avatar" test-avatar.jpg
  echo "✅ Test image created: test-avatar.jpg"
else
  echo "⚠️  ImageMagick not found. Please provide a test-avatar.jpg file manually."
  exit 1
fi

echo ""
echo "Step 2: Uploading avatar..."
RESPONSE=$(curl -X POST "$API_URL/api/v1/users/update-profile" \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@test-avatar.jpg" \
  -F "firstName=Test" \
  -w "\n%{http_code}" \
  -s)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Avatar uploaded successfully!"
  echo "   Response: $BODY"
else
  echo "❌ Upload failed with status code: $HTTP_CODE"
  echo "   Response: $BODY"
  exit 1
fi

echo ""
echo "Step 3: Fetching user profile..."
PROFILE=$(curl -X GET "$API_URL/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -s)

AVATAR_URL=$(echo "$PROFILE" | grep -o '"avatarUrl":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AVATAR_URL" ]; then
  echo "✅ Profile fetched successfully!"
  echo "   Avatar URL: $AVATAR_URL"
else
  echo "⚠️  No avatar URL found in profile"
fi

echo ""
echo "Step 4: Downloading avatar..."
FULL_URL="$API_URL$AVATAR_URL"
curl -X GET "$FULL_URL" -o downloaded-avatar.jpg -s

if [ -f "downloaded-avatar.jpg" ] && [ -s "downloaded-avatar.jpg" ]; then
  echo "✅ Avatar downloaded successfully: downloaded-avatar.jpg"
  echo "   File size: $(wc -c < downloaded-avatar.jpg) bytes"
else
  echo "❌ Failed to download avatar"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "Cleanup..."
rm -f test-avatar.jpg downloaded-avatar.jpg
echo "✅ Test files removed"
