#!/bin/bash

echo "Testing OBE Portal functionality..."

# Step 1: Test admin login
echo "1. Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@obeportal.com", "password": "password123"}')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
  echo "✓ Admin login successful"
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
  echo "Token: $TOKEN"
else
  echo "✗ Admin login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

# Step 2: Test getting a course
echo "2. Testing course listing..."
COURSES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/courses")

if [[ $COURSES_RESPONSE == *"id"* ]]; then
  echo "✓ Course listing successful"
  COURSE_ID=$(echo $COURSES_RESPONSE | jq -r '.[0].id // empty')
  echo "Course ID: $COURSE_ID"
else
  echo "✗ Course listing failed - checking with collegeId filter..."
  # Try with collegeId filter
  COLLEGE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/colleges")
  if [[ $COLLEGE_RESPONSE == *"id"* ]]; then
    COLLEGE_ID=$(echo $COLLEGE_RESPONSE | jq -r '.[0].id')
    echo "College ID: $COLLEGE_ID"
    COURSES_WITH_FILTER=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/courses?collegeId=$COLLEGE_ID")
    if [[ $COURSES_WITH_FILTER == *"id"* ]]; then
      echo "✓ Course listing with college filter successful"
      COURSE_ID=$(echo $COURSES_WITH_FILTER | jq -r '.[0].id')
      echo "Course ID: $COURSE_ID"
    else
      echo "✗ Course listing with college filter failed"
      echo "Response: $COURSES_WITH_FILTER"
      exit 1
    fi
  else
    echo "✗ College listing failed"
    echo "Response: $COLLEGE_RESPONSE"
    exit 1
  fi
fi

# Step 3: Test teacher assignments
echo "3. Testing teacher assignments..."
TEACHER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/courses/$COURSE_ID/teacher-assignments")

if [[ $TEACHER_RESPONSE == *"assignments"* ]]; then
  echo "✓ Teacher assignments API working"
  echo "Response sample: $(echo $TEACHER_RESPONSE | head -100)"
else
  echo "✗ Teacher assignments failed"
  echo "Response: $TEACHER_RESPONSE"
  exit 1
fi

# Step 4: Test sections
echo "4. Testing sections API..."
# Extract batchId from the course we retrieved earlier
BATCH_ID=$(echo $COURSES_RESPONSE | jq -r '.[0].batchId // empty')
if [[ -n "$BATCH_ID" ]]; then
  SECTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/sections?batchId=$BATCH_ID")
else
  SECTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3000/api/sections")
fi

if [[ $SECTIONS_RESPONSE == *"id"* ]]; then
  echo "✓ Sections API working"
  SECTION_COUNT=$(echo $SECTIONS_RESPONSE | jq 'length')
  echo "Found $SECTION_COUNT sections"
else
  echo "✗ Sections API failed"
  echo "Response: $SECTIONS_RESPONSE"
  exit 1
fi

echo "All tests completed successfully!"