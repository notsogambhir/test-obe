const sqlite3 = require('sqlite3');
const { open } = require('sqlite3').open;
const path = '/home/z/my-project/prisma/dev.db';

async function getMarksForAssessment() {
  try {
    // Connect to database
    const db = open(path, { readonly: true });
    
    // Query for marks
    const query = `
      SELECT sm.studentId, sm.obtainedMarks, sm.maxMarks, q.question, q.maxMarks
      FROM main.student_marks sm
      JOIN main.questions q ON sm.questionId = q.id
      JOIN main.assessments a ON a.id = sm.assessmentId
      WHERE a.id = 'cmie7v678001nnak1xfw4eadj'
      ORDER BY sm.studentId, q.question
    `;
    
    const stmt = db.prepare(query);
    const marks = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (!row) break;
      
      marks.push({
        studentId: row.studentId,
        obtainedMarks: row.obtainedMarks,
        maxMarks: row.maxMarks,
        questionText: row.question,
        questionMaxMarks: row.maxMarks
      });
    }
    
    stmt.finalize();
    
    console.log('Found', marks.length, 'marks for assessment');
    console.log('Sample marks:');
    marks.slice(0, 10).forEach(mark => {
      console.log(`Student: ${mark.studentId}, Obtained: ${mark.obtainedMarks}/${mark.maxMarks}, Question: ${mark.question}, Max: ${mark.questionMaxMarks}`);
    });
    
    return marks;
    
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

// Run the function
getMarksForAssessment();