import { db } from '../src/lib/db';

async function testCOAttainmentAPI() {
  try {
    console.log('Testing CO Attainment API...\n');

    // Get the sample course
    const course = await db.course.findFirst({
      where: { code: 'CS101' }
    });

    if (!course) {
      console.error('❌ Sample course not found.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);
    console.log(`   Target Percentage: ${course.targetPercentage}%`);
    console.log(`   Level 1 Threshold: ${course.level1Threshold}%`);
    console.log(`   Level 2 Threshold: ${course.level2Threshold}%`);
    console.log(`   Level 3 Threshold: ${course.level3Threshold}%\n`);

    // Test the CO attainment calculation
    const { COAttainmentService } = await import('../src/lib/co-attainment');
    
    const result = await COAttainmentService.calculateCourseCOAttainment(
      course.id,
      '2024-2025',
      '1'
    );

    console.log('📊 CO Attainment Results:');
    console.log(`Course: ${result.courseName} (${result.courseCode})`);
    console.log(`Total Students: ${result.totalStudents}`);
    console.log(`Academic Year: ${result.academicYear}`);
    console.log(`Semester: ${result.semester}\n`);

    console.log('🎯 CO-wise Attainment:');
    result.coAttainments.forEach(co => {
      console.log(`  ${co.coCode}: Level ${co.attainmentLevel} (${co.percentageMeetingTarget.toFixed(1)}%) - ${co.studentsMeetingTarget}/${co.studentCount} students met target`);
    });

    console.log('\n📈 Overall Distribution:');
    console.log(`  Level 3: ${result.overallAttainment.level3Count} COs`);
    console.log(`  Level 2: ${result.overallAttainment.level2Count} COs`);
    console.log(`  Level 1: ${result.overallAttainment.level1Count} COs`);
    console.log(`  Not Attained: ${result.overallAttainment.level0Count} COs`);

    console.log('\n👥 Sample Student Performance:');
    const sampleStudents = result.studentAttainments.slice(0, 3);
    const studentNames = [...new Set(sampleStudents.map(s => s.studentName))];
    
    studentNames.forEach(studentName => {
      const studentData = result.studentAttainments.filter(s => s.studentName === studentName);
      console.log(`\n  ${studentName}:`);
      studentData.forEach(co => {
        console.log(`    ${co.coCode}: ${co.percentage.toFixed(1)}% (${co.metTarget ? '✅ Met' : '❌ Not Met'})`);
      });
    });

    console.log('\n🎉 CO Attainment API test completed successfully!');
    console.log('The CO attainment functionality is ready for use.');

  } catch (error) {
    console.error('❌ Error testing CO Attainment API:', error);
  } finally {
    await db.$disconnect();
  }
}

testCOAttainmentAPI();