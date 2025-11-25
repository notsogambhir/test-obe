import { db } from '../src/lib/db';

async function generateBasicCOsAndAssessments() {
  try {
    console.log('🎯 Creating basic COs and assessments...');
    
    // Get all courses
    const courses = await db.course.findMany({
      include: { batch: { select: { name: true, program: { select: { code: true } } } }
      }
    });

    console.log(`Found ${courses.length} courses`);

    // Create 1 CO per course
    console.log('🎯 Creating COs...');
    const coData = [];
    for (const course of courses) {
      const co = {
        code: 'CO1',
        description: 'Understand and apply fundamental concepts in ' + course.name,
        courseId: course.id,
        isActive: true
      };
      coData.push(co);
    }

    if (coData.length > 0) {
      await db.cO.createMany({ data: coData });
      console.log(`✅ Created ${coData.length} COs`);
    }

    // Create 1 assessment per course
    console.log('📝 Creating assessments...');
    const assessmentData = [];
    for (const course of courses) {
      const assessment = {
        courseId: course.id,
        name: 'Mid-term Examination',
        type: 'exam',
        maxMarks: 100,
        weightage: 0.3,
        isActive: true
      };
      assessmentData.push(assessment);
    }

    if (assessmentData.length > 0) {
      await db.assessment.createMany({ data: assessmentData });
      console.log(`✅ Created ${assessmentData.length} assessments`);
    }

    console.log('🎉 Basic COs and assessments generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating basic COs and assessments:', error);
  } finally {
    await db.$disconnect();
  }
}

generateBasicCOsAndAssessments().catch(console.error);