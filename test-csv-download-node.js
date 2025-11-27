// Test CSV download in Node.js environment
const testCourseId = 'cmie7t4op000rnak10hb8sv51';
const testAssessmentId = 'cmie7v678001nnak1xfw4eadj';

// Get fresh auth token first
async function getAuthToken() {
  try {
    console.log('🔐 Getting fresh auth token...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@obeportal.com',
        password: 'admin123'
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Login failed:', error);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Auth token obtained');
    return data.token;
  } catch (error) {
    console.error('❌ Login failed:', error);
    return null;
    }
}

async function testCSVDownload() {
  console.log('🧪 Testing CSV download in Node.js environment...');
  
  try {
    // Test 1: Get auth token
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ Could not get auth token');
      return;
    }
    
    // Test 2: Get template data
    const response = await fetch(`http://localhost:3000/api/courses/${testCourseId}/assessments/${testAssessmentId}/template`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Template API error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Template data structure:', {
      assessment: data.assessment?.name,
      hasTemplate: !!data.template,
      hasStudents: !!data.students,
      hasQuestions: !!data.questions,
      studentsCount: data.students?.length,
      questionsCount: data.questions?.length,
      headers: data.template?.headers
    });
    
      // Test 3: Generate CSV content exactly like frontend
    const headers = data.template.headers;
    const csvContent = [
      headers.join(','),
      ...data.students.map((student) => {
        const studentId = student.studentId || '';
        const studentName = student.name || '';
        const studentEmail = student.email || '';
        const marks = row.slice(3).map(mark => String(mark || ''));
        return [studentId, studentName, studentEmail, ...marks];
      }).join(',');
    }).join('\n');
    
    console.log('📄 Generated CSV content (first 200 chars):', csvContent.substring(0, 200));
    console.log('📄 CSV content length:', csvContent.length);
    
    // Test 4: Create blob and save to file (simulating download)
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const fs = require('fs');
    const fileName = `${data.assessment.name}_Marks_Template.csv`;
    
    fs.writeFileSync(fileName, csvContent);
    console.log('✅ CSV file saved to:', fileName);
    console.log('📊 File size:', fs.statSync(fileName).size);
    
    console.log('🎉 CSV template download test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run test
testCSVDownload();