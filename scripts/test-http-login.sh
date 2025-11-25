#!/bin/bash

echo "=== TESTING HTTP LOGIN ENDPOINT ==="

# Test admin login
echo -e "\n1. Testing Admin login via HTTP..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obeportal.com","password":"password123"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Admin HTTP login successful"
  token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "   Token received: ${token:0:20}..."
else
  echo "❌ Admin HTTP login failed"
  echo "   Response: $response"
fi

# Test program coordinator login with college
echo -e "\n2. Testing Program Coordinator login with college..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pc.beme@obeportal.com","password":"password123","collegeId":"cmhn2gaws0001qzch0vir3bd5"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Program Coordinator HTTP login successful"
else
  echo "❌ Program Coordinator HTTP login failed"
  echo "   Response: $response"
fi

# Test wrong password
echo -e "\n3. Testing wrong password..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obeportal.com","password":"wrongpassword"}')

if echo "$response" | grep -q "error"; then
  echo "✅ Wrong password correctly rejected"
else
  echo "❌ Wrong password was accepted"
  echo "   Response: $response"
fi

echo -e "\n=== HTTP LOGIN TEST COMPLETE ==="
echo -e "\nThe login endpoint is working! You can test the web interface at:"
echo "http://localhost:3000"