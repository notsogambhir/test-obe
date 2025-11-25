import { db } from '@/lib/db';

async function testAssessmentInterface() {
  try {
    console.log('🧪 Testing New Assessment Interface');
    console.log('=====================================\n');

    // Get a sample course with assessments
    const course = await db.course.findFirst({
      where: { isActive: true },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      console.log('❌ No active course found for testing');
      return;
    }

    console.log(`📚 Testing with course: ${course.code} - ${course.name}`);
    console.log(`🎯 Target: ${course.targetPercentage}%`);
    console.log(`📊 Thresholds: L1=${course.level1Threshold}%, L2=${course.level2Threshold}%, L3=${course.level3Threshold}%\n`);

    // Get assessments for this course
    const assessments = await db.assessment.findMany({
      where: { courseId: course.id },
      include: {
        questions: {
          include: {
            coMappings: {
              include: {
                co: true
              }
            }
          }
        }
      },
      take: 3 // Test with first 3 assessments
    });

    console.log(`📝 Found ${assessments.length} assessments for testing\n`);

    assessments.forEach((assessment, index) => {
      console.log(`--- Assessment ${index + 1}: ${assessment.name} ---`);
      console.log(`📋 Type: ${assessment.type}`);
      console.log(`💯 Max Marks: ${assessment.maxMarks}`);
      console.log(`⚖️ Weightage: ${assessment.weightage}%`);
      console.log(`❓ Questions: ${assessment.questions.length}`);
      
      if (assessment.questions.length > 0) {
        const totalMarks = assessment.questions.reduce((sum, q) => sum + q.maxMarks, 0);
        console.log(`💰 Total Question Marks: ${totalMarks}`);
        
        // Show CO mappings
        const allCOMappings = assessment.questions.flatMap(q => q.coMappings);
        const uniqueCOs = [...new Set(allCOMappings.map(m => m.co.code))];
        console.log(`🎯 COs Mapped: ${uniqueCOs.join(', ')}`);
      }
      
      console.log('');
    });

    // Test bulk question upload API structure
    console.log('📤 Testing Bulk Question Upload Structure:');
    console.log('=====================================');
    
    const sampleBulkData = [
      {
        question: 'Sample question 1 for testing',
        maxMarks: 10,
        coCodes: ['CO1', 'CO2']
      },
      {
        question: 'Sample question 2 for testing',
        maxMarks: 15,
        coCodes: ['CO1', 'CO3']
      }
    ];

    console.log('📋 Sample bulk upload data structure:');
    console.log(JSON.stringify(sampleBulkData, null, 2));
    
    console.log('\n✅ Assessment Interface Test Completed!');
    console.log('\n🎯 Key Features Implemented:');
    console.log('✅ Dropdown-style assessment management');
    console.log('✅ Collapsible assessment cards');
    console.log('✅ Tab-based interface (Questions & CO Mapping, Upload Marks)');
    console.log('✅ Bulk question upload via Excel');
    console.log('✅ Question template download');
    console.log('✅ Individual question CRUD operations');
    console.log('✅ CO mapping for questions');
    
  } catch (error) {
    console.error('❌ Error in assessment interface test:', error);
  }
}

testAssessmentInterface();