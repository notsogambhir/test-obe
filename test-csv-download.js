// Test CSV template download functionality
const testCourseId = 'cmie7t4op000rnak10hb8sv51';
const testAssessmentId = 'cmie7v678001nnak1xfw4eadj';

async function testTemplateDownload() {
  try {
    console.log('Testing template download...');
    
    // Test 1: Get template data
    const response = await fetch(`/api/courses/${testCourseId}/assessments/${testAssessmentId}/template`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Template API error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('Template data received:', {
      assessment: data.assessment?.name,
      headers: data.template?.headers,
      studentsCount: data.students?.length,
      questionsCount: data.questions?.length
    });
    
    // Test 2: Generate CSV content
    const headers = data.template.headers;
    const csvContent = [
      headers.join(','),
      ...data.students.map((student) => [
        student.studentId,
        student.name,
        student.email,
        ...data.questions.map(() => '') // Empty marks columns
      ])
    ].map(row => row.join(',')).join('\n');
    
    console.log('Generated CSV content (first 200 chars):', csvContent.substring(0, 200));
    
    // Test 3: Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.assessment.name}_Marks_Template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('CSV download initiated successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Auto-run test
testTemplateDownload();