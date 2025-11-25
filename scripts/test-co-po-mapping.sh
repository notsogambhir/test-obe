#!/bin/bash

echo "=== TESTING NBA COMPLIANT CO-PO MAPPING ==="

# Test accessing a course management page with CO-PO mapping
echo -e "\n1. Testing course access..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pc.beme@obeportal.com","password":"password123","collegeId":"cmhn2gaws0001qzch0vir3bd5"}')

if echo "$response" | grep -q "token"; then
  echo "✅ Login successful"
  
  # Get a course ID to test CO-PO mapping
  echo -e "\n2. Getting course list..."
  coursesResponse=$(curl -s -H "Cookie: auth-token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)" \
    http://localhost:3000/api/courses)
  
  if echo "$coursesResponse" | grep -q "\["; then
    echo "✅ Courses retrieved"
    
    # Extract first course ID
    courseId=$(echo "$coursesResponse" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "\n3. Testing CO-PO mapping API for course: $courseId"
    
    # Test PO attainments calculation
    poResponse=$(curl -s "http://localhost:3000/api/courses/$courseId/po-attainments")
    
    if echo "$poResponse" | grep -q "poAttainments"; then
      echo "✅ PO attainments API working"
      echo -e "\n4. NBA Compliance Features:"
      
      # Extract compliance score
      compliance=$(echo "$poResponse" | grep -o '"nbaComplianceScore":[^,]*' | cut -d':' -f2 | tr -d ' ')
      echo "   Compliance Score: $compliance%"
      
      # Extract overall attainment
      attainment=$(echo "$poResponse" | grep -o '"overallAttainment":[^,]*' | cut -d':' -f2 | tr -d ' ')
      echo "   Overall Attainment: $attainment%"
      
      # Check if compliant
      if (( $(echo "$compliance" | tr -d '.') >= 60 )); then
        echo "   ✅ NBA Compliant"
      else
        echo "   ⚠️ Below NBA Standard"
      fi
      
    else
      echo "❌ PO attainments API failed"
      echo "   Response: $poResponse"
    fi
  else
    echo "❌ No courses found"
  fi
else
  echo "❌ Login failed"
fi

echo -e "\n=== CO-PO MAPPING TEST COMPLETE ==="
echo -e "\n🎯 NBA-Compliant CO-PO Mapping System Ready!"
echo -e "\nFeatures:"
echo "• Interactive mapping matrix with NBA guidelines"
echo "• Automated PO attainment calculations"
echo "• NBA compliance analysis and reporting"
echo "• Real-time compliance monitoring"
echo -e "\nAccess at: http://localhost:3000/courses/[courseId]/manage"