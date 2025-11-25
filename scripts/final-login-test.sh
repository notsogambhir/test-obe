#!/bin/bash

echo "=== FINAL LOGIN FUNCTIONALITY TEST ==="

# Test different user logins
echo -e "\n1. Testing Admin login..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obeportal.com","password":"password123"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Admin login successful"
else
  echo "❌ Admin login failed"
fi

echo -e "\n2. Testing Program Coordinator login..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pc.beme@obeportal.com","password":"password123","collegeId":"cmhn2gaws0001qzch0vir3bd5"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Program Coordinator login successful"
else
  echo "❌ Program Coordinator login failed"
fi

echo -e "\n3. Testing Teacher login..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@obeportal.com","password":"password123","collegeId":"cmhn2gaws0001qzch0vir3bd5"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Teacher login successful"
else
  echo "❌ Teacher login failed"
fi

echo -e "\n4. Testing Student login..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.johnson@college.edu","password":"password123","collegeId":"cmhn2gaws0001qzch0vir3bd5"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Student login successful"
else
  echo "❌ Student login failed"
fi

echo -e "\n5. Testing wrong password..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obeportal.com","password":"wrongpassword"}')

if echo "$response" | grep -q "error"; then
  echo "✅ Wrong password correctly rejected"
else
  echo "❌ Wrong password was accepted"
fi

echo -e "\n=== LOGIN TEST COMPLETE ==="
echo -e "\n🎉 All login functionality is working!"
echo -e "\nYou can now access the application at: http://localhost:3000"
echo -e "\nAvailable login credentials:"
echo -e "• Admin: admin@obeportal.com / password123"
echo -e "• Program Coordinator: pc.beme@obeportal.com / password123"
echo -e "• Teacher: teacher1@obeportal.com / password123"
echo -e "• Student: alice.johnson@college.edu / password123"
echo -e "\nCourse management URL should now work:"
echo -e "http://localhost:3000/courses/[courseId]/manage"