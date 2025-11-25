const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMarksForAssessment() {
  try {
    console.log('Connecting to database...');
    
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
    
    console.log('Found', marks.length, 'marks for assessment');
    console.log('Sample marks:');
    marks.slice(0, 10).forEach(mark => {
      const studentId = mark.student?.studentId || 'N/A';
      const obtained = mark.obtainedMarks || 0;
      const maxMarks = mark.question?.maxMarks || 0;
      const questionId = mark.question?.id || 'N/A';
      
      console.log(`Student: ${studentId}, Obtained: ${obtained}/${maxMarks}, Question: ${mark.question}, Max: ${mark.questionMaxMarks}`);
    });
    
    return marks;
    
  } catch (error) {
    console.error('Prisma error:', error);
    return [];
  }
}

// Run the function
getMarksForAssessment();