// Test CSV template download by directly accessing the page
console.log('Testing CSV template download...');

// Test 1: Get course and assessment data
const testCourseId = 'cmie7t4op000rnak10hb8sv51';
const testAssessmentId = 'cmie7v678001nnak1xfw4eadj';

async function testTemplateDownload() {
  try {
    console.log('Step 1: Fetching template data...');
    
    const response = await fetch(`/api/courses/${testCourseId}/assessments/${testAssessmentId}/template`);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Template API error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('Step 2: Template data received:', {
      assessment: data.assessment?.name,
      hasTemplate: !!data.template,
      hasStudents: !!data.students,
      hasQuestions: !!data.questions,
      studentsCount: data.students?.length,
      questionsCount: data.questions?.length,
      headers: data.template?.headers
    });
    
    // Test 3: Generate CSV content
    if (data.template && data.students && data.questions) {
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
      
      console.log('Step 3: CSV content generated (first 200 chars):', csvContent.substring(0, 200));
      console.log('Step 4: CSV content length:', csvContent.length);
      
      // Test 4: Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      console.log('Step 5: Blob created, size:', blob.size);
      
      const url = window.URL.createObjectURL(blob);
      console.log('Step 6: Object URL created');
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.assessment.name}_Marks_Template.csv`;
      console.log('Step 7: Download link created, filename:', a.download);
      
      document.body.appendChild(a);
      console.log('Step 8: Link added to body');
      
      a.click();
      console.log('Step 9: Click triggered');
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Step 10: Cleanup completed');
      }, 1000);
      
      console.log('✅ CSV template download test completed successfully!');
    } else {
      console.error('❌ Template data is missing:', {
        hasTemplate: !!data.template,
        hasStudents: !!data.students,
        hasQuestions: !!data.questions
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run test
testTemplateDownload();