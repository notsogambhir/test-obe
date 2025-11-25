console.log('Testing file update...');

// Test that we can read the file
const fs = require('fs');
try {
  const content = fs.readFileSync('/home/z/my-project/src/components/course-creation.tsx', 'utf8');
  console.log('File content length:', content.length);
  console.log('File content preview:');
  console.log(content.substring(1000, 1500));
  console.log('...');
} catch (error) {
  console.error('Error reading file:', error);
}