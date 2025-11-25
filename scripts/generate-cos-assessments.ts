import { db } from '../src/lib/db';

async function generateCOsAndAssessments() {
  try {
    console.log('🎯 Creating COs and assessments for existing courses...');
    
    // Get all courses
    const courses = await db.course.findMany({
      include: {
        batch: { 
          select: { name: true, program: { select: { code: true } } 
        }
      }
    });
    
    console.log(`Found ${courses.length} courses to process`);

    // Create COs for all courses
    console.log('🎯 Creating Course Outcomes...');
    let coCount = 0;
    for (const course of courses) {
      const cos = generateCOsForCourse(course.code);
      await db.cO.createMany({
        data: cos.map(co => ({ ...co, courseId: course.id, isActive: true }))
      });
      coCount += cos.length;
    }
    console.log(`✅ Created ${coCount} Course Outcomes`);

    // Create assessments for all courses
    console.log('📝 Creating assessments...');
    let assessmentCount = 0;
    for (const course of courses) {
      const assessments = generateAssessmentsForCourse(course.id);
      await db.assessment.createMany({
        data: assessments
      });
      assessmentCount += assessments.length;
    }
    console.log(`✅ Created ${assessmentCount} assessments`);

    // Create questions for assessments
    console.log('❓ Creating questions...');
    let questionCount = 0;
    for (const assessment of assessments) {
      const questions = generateQuestionsForAssessment(assessment.id);
      await db.question.createMany({
        data: questions
      });
      questionCount += questions.length;
    }
    console.log(`✅ Created ${questionCount} questions`);

    // Create CO-Question mappings
    console.log('🔗 Creating CO-Question mappings...');
    const allCOs = await db.cO.findMany();
    let mappingCount = 0;
    
    for (const question of questions) {
      // Get 2-3 random COs for this question
      const availableCOs = allCOs.filter(co => co.courseId === question.assessment?.courseId);
      const selectedCOs = availableCOs
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, availableCOs.length));
      
      await db.questionCOMapping.createMany({
        data: selectedCOs.map(co => ({
          questionId: question.id,
          coId: co.id,
          isActive: true
        }))
      });
      mappingCount += selectedCOs.length;
    }
    console.log(`✅ Created ${mappingCount} CO-Question mappings`);

    console.log('🎉 COs and assessments generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating COs and assessments:', error);
  } finally {
    await db.$disconnect();
  }
}

function generateCOsForCourse(courseCode: string) {
  const baseCOs = {
    'ME': [
      { code: 'ME101-CO1', description: 'Apply calculus concepts to solve engineering problems' },
      { code: 'ME101-CO2', description: 'Analyze forces and moments in mechanical systems' },
      { code: 'ME101-CO3', description: 'Design mechanical components considering safety and reliability' },
      { code: 'ME102-CO1', description: 'Apply principles of statics to analyze structures' },
      { code: 'ME102-CO2', description: 'Understand material properties and their applications' },
      { code: 'ME103-CO1', description: 'Apply laws of thermodynamics to engineering systems' },
      { code: 'ME103-CO2', description: 'Analyze heat transfer mechanisms and efficiency' },
    ],
    'CS': [
      { code: 'CS101-CO1', description: 'Design and implement algorithms to solve computational problems' },
      { code: 'CS101-CO2', description: 'Analyze time and space complexity of algorithms' },
      { code: 'CS102-CO1', description: 'Implement data structures for efficient data organization' },
      { code: 'CS102-CO2', description: 'Compare and evaluate different data structure implementations' },
      { code: 'CS103-CO1', description: 'Understand computer architecture and instruction sets' },
      { code: 'CS103-CO2', description: 'Analyze performance characteristics of computer systems' },
    ],
    'BA': [
      { code: 'BA101-CO1', description: 'Apply mathematical concepts to business decision making' },
      { code: 'BA101-CO2', description: 'Use statistical methods for business analysis' },
      { code: 'BA102-CO1', description: 'Develop effective business communication strategies' },
      { code: 'BA102-CO2', description: 'Create professional business documents and presentations' },
    ],
    'PH': [
      { code: 'PH101-CO1', description: 'Apply chemical principles to pharmaceutical formulations' },
      { code: 'PH101-CO2', description: 'Analyze chemical reactions and mechanisms in drugs' },
      { code: 'PH102-CO1', description: 'Understand drug mechanisms and therapeutic effects' },
      { code: 'PH102-CO2', description: 'Evaluate drug efficacy and safety profiles' },
    ],
  };

  const prefix = courseCode.substring(0, 2);
  const cos = baseCOs[prefix as keyof typeof baseCOs] || baseCOs['ME'];
  return cos.map(co => ({ ...co, isActive: true }));
}

function generateAssessmentsForCourse(courseId: string) {
  const assessmentTypes = ['exam', 'quiz', 'assignment', 'project'];
  return assessmentTypes.map((type, index) => ({
    courseId,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
    type,
    maxMarks: type === 'exam' ? 100 : type === 'project' ? 50 : 25,
    weightage: type === 'exam' ? 0.4 : type === 'project' ? 0.2 : 0.1,
    isActive: true
  }));
}

function generateQuestionsForAssessment(assessmentId: string) {
  const questions = [];
  const questionCount = Math.floor(Math.random() * 5) + 5; // 5-10 questions per assessment
  
  for (let i = 0; i < questionCount; i++) {
    questions.push({
      assessmentId,
      question: `Question ${i + 1}: ${generateQuestionText()}`,
      maxMarks: Math.floor(Math.random() * 10) + 10, // 10-20 marks per question
      isActive: true
    });
  }
  
  return questions;
}

function generateQuestionText(): string {
  const templates = [
    'Analyze the given scenario and provide a detailed solution',
    'Calculate the required values using the provided formulas',
    'Design a system that meets the specified requirements',
    'Evaluate the given options and select the most appropriate one',
    'Explain the underlying principles and their applications',
    'Compare and contrast the different approaches mentioned',
    'Apply the theoretical concepts to a practical problem',
    'Justify your answer with relevant examples and reasoning',
    'Propose improvements to the existing system'
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

generateCOsAndAssessments().catch(console.error);