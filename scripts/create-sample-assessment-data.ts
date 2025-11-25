import { db } from '../src/lib/db';

async function createSampleAssessmentData() {
  try {
    console.log('Creating sample assessment data for CO attainment testing...');

    // Get the course we created earlier
    const course = await db.course.findFirst({
      where: { code: 'CS101' },
      include: {
        courseOutcomes: true
      }
    });

    if (!course) {
      console.error('❌ Course CS101 not found. Please run the create sample course script first.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);
    console.log(`   Found ${course.courseOutcomes.length} COs`);

    // Create sample assessments
    const assessments = [
      {
        name: 'Mid Term Examination',
        type: 'exam',
        maxMarks: 100,
        weightage: 30
      },
      {
        name: 'Lab Assessment 1',
        type: 'assignment',
        maxMarks: 50,
        weightage: 15
      },
      {
        name: 'Final Examination',
        type: 'exam',
        maxMarks: 100,
        weightage: 40
      }
    ];

    const createdAssessments: any[] = [];
    for (const assessmentData of assessments) {
      const assessment = await db.assessment.create({
        data: {
          courseId: course.id,
          ...assessmentData
        }
      });
      createdAssessments.push(assessment);
      console.log(`✅ Created assessment: ${assessment.name}`);
    }

    // Create questions mapped to COs
    const questionTemplates = [
      // CO1 Questions
      { coIndex: 0, description: 'Explain the basic concepts of programming', maxMarks: 10 },
      { coIndex: 0, description: 'Define programming terminology', maxMarks: 5 },
      { coIndex: 0, description: 'Write simple programs using basic syntax', maxMarks: 15 },
      
      // CO2 Questions
      { coIndex: 1, description: 'Design algorithms for given problems', maxMarks: 12 },
      { coIndex: 1, description: 'Implement problem-solving techniques', maxMarks: 8 },
      { coIndex: 1, description: 'Analyze algorithm efficiency', maxMarks: 10 },
      
      // CO3 Questions
      { coIndex: 2, description: 'Develop efficient programs', maxMarks: 15 },
      { coIndex: 2, description: 'Apply coding best practices', maxMarks: 10 },
      { coIndex: 2, description: 'Optimize code performance', maxMarks: 5 },
      
      // CO4 Questions
      { coIndex: 3, description: 'Debug given code snippets', maxMarks: 8 },
      { coIndex: 3, description: 'Identify and fix errors', maxMarks: 12 },
      
      // CO5 Questions
      { coIndex: 4, description: 'Compare programming paradigms', maxMarks: 10 },
      { coIndex: 4, description: 'Evaluate different approaches', maxMarks: 5 }
    ];

    const questions: any[] = [];
    let questionIndex = 0;

    for (const assessment of createdAssessments) {
      const questionsPerAssessment = Math.floor(questionTemplates.length / createdAssessments.length);
      const startIndex = questionIndex;
      const endIndex = Math.min(startIndex + questionsPerAssessment, questionTemplates.length);

      for (let i = startIndex; i < endIndex; i++) {
        const template = questionTemplates[i];
        const co = course.courseOutcomes[template.coIndex];
        
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: template.description,
            maxMarks: template.maxMarks,
            isActive: true,
            coMappings: {
              create: {
                coId: co.id,
                isActive: true
              }
            }
          }
        });
        
        questions.push(question);
        console.log(`✅ Created question: ${template.description.substring(0, 30)}... (CO${co.code})`);
      }
      
      questionIndex = endIndex;
    }

    // Create mock student marks data
    // Get enrolled students
    const enrollments = await db.enrollment.findMany({
      where: { courseId: course.id, isActive: true },
      include: {
        student: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`✅ Found ${enrollments.length} enrolled students`);

    // Create a simple table to store student marks (in a real app, this would be a proper table)
    // For now, we'll create a mock data structure
    const studentMarks: any[] = [];
    
    for (const enrollment of enrollments) {
      for (const question of questions) {
        // Generate realistic marks (some students perform well, others poorly)
        const basePerformance = Math.random(); // 0 to 1
        let obtainedMarks;
        
        if (basePerformance > 0.8) {
          // High performers: 80-100% of marks
          obtainedMarks = Math.floor(question.maxMarks * (0.8 + Math.random() * 0.2));
        } else if (basePerformance > 0.6) {
          // Average performers: 60-80% of marks
          obtainedMarks = Math.floor(question.maxMarks * (0.6 + Math.random() * 0.2));
        } else if (basePerformance > 0.4) {
          // Below average: 40-60% of marks
          obtainedMarks = Math.floor(question.maxMarks * (0.4 + Math.random() * 0.2));
        } else {
          // Poor performers: 20-40% of marks
          obtainedMarks = Math.floor(question.maxMarks * (0.2 + Math.random() * 0.2));
        }
        
        studentMarks.push({
          studentId: enrollment.student.id,
          studentName: enrollment.student.name,
          questionId: question.id,
          obtainedMarks,
          maxMarks: question.maxMarks
        });
      }
    }

    // Store mock marks data in a temporary structure for the calculator to use
    // In a real implementation, this would be stored in a proper database table
    console.log(`✅ Generated ${studentMarks.length} student mark records`);

    // Update course with attainment thresholds
    await db.course.update({
      where: { id: course.id },
      data: {
        targetPercentage: 50.0,
        level1Threshold: 50.0,
        level2Threshold: 70.0,
        level3Threshold: 80.0
      }
    });

    console.log('✅ Updated course with attainment thresholds');

    // Store mock data in a JSON file for the calculator to read
    const fs = require('fs');
    const path = require('path');
    
    const mockDataPath = path.join(__dirname, 'mock-student-marks.json');
    fs.writeFileSync(mockDataPath, JSON.stringify(studentMarks, null, 2));
    
    console.log(`✅ Mock student data saved to ${mockDataPath}`);
    console.log('\n🎉 Sample assessment data created successfully!');
    console.log('You can now test the CO attainment calculation functionality.');
    console.log(`Course ID: ${course.id}`);
    console.log(`Assessments: ${createdAssessments.length}`);
    console.log(`Questions: ${questions.length}`);
    console.log(`Student records: ${studentMarks.length}`);

  } catch (error) {
    console.error('❌ Error creating sample assessment data:', error);
  } finally {
    await db.$disconnect();
  }
}

createSampleAssessmentData();