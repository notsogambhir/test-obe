const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMarksForAssessment() {
  try {
    const marks = await prisma.studentMark.findMany({
      where: {
        assessment: {
          id: 'cmie7v678001nnak1xfw4eadj'
        }
      },
      include: {
        student: {
          select: {
            studentId: true
          }
        },
        question: {
          select: {
            question: true,
            maxMarks: true
          }
        }
      }
    });
    
    console.log('Found', marks.length, 'marks for assessment cmie7v678001nnak1xfw4eadj');
    
    // Output CSV header
    console.log('StudentID,ObtainedMarks,MaxMarks,QuestionID,MaxMarks');
    
    marks.forEach(mark => {
      const studentId = mark.student?.studentId || 'N/A';
      const obtained = mark.obtainedMarks || 0;
      const maxMarks = mark.question?.maxMarks || 0;
      const questionId = mark.question?.id || 'N/A';
      const maxQuestionMarks = mark.question?.maxMarks || 0;
      
      console.log(`${studentId},${obtained},${maxMarks},${questionId},${maxQuestionMarks}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getMarksForAssessment();