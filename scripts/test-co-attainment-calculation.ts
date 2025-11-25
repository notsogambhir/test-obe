import { COAttainmentCalculator } from '@/lib/co-attainment-calculator';
import { db } from '@/lib/db';

async function testCOAttainmentCalculation() {
  console.log('🧪 TESTING CO ATTAINMENT CALCULATION');
  console.log('=====================================\n');

  try {
    // Get a sample course to test with
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

    // Get first CO for testing
    const co = await db.cO.findFirst({
      where: { 
        courseId: course.id,
        isActive: true 
      }
    });

    if (!co) {
      console.log('❌ No CO found for testing');
      return;
    }

    console.log(`🎯 Testing CO: ${co.code} - ${co.description}\n`);

    // Test 1: Individual Student Calculations
    console.log('📊 STAGE 1: INDIVIDUAL STUDENT CO ATTAINMENT');
    console.log('==============================================\n');

    // Get enrolled students
    const enrollments = await db.enrollment.findMany({
      where: { 
        courseId: course.id,
        isActive: true 
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        }
      },
      take: 5 // Test with first 5 students
    });

    console.log(`👥 Testing with ${enrollments.length} students:\n`);

    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      console.log(`--- Student ${i + 1}: ${enrollment.student.name} (${enrollment.student.studentId}) ---`);
      
      const attainment = await COAttainmentCalculator.calculateStudentCOAttainment(
        course.id,
        co.id,
        enrollment.student.id
      );

      if (attainment) {
        const withTarget = await COAttainmentCalculator.determineTargetMet(course.id, attainment);
        
        console.log(`📈 Questions Attempted: ${withTarget.attemptedQuestions}/${withTarget.totalQuestions}`);
        console.log(`💯 Marks: ${withTarget.totalObtainedMarks}/${withTarget.totalMaxMarks}`);
        console.log(`📊 Percentage: ${withTarget.percentage}%`);
        console.log(`🎯 Target Met: ${withTarget.metTarget ? '✅ YES' : '❌ NO'} (Target: ${course.targetPercentage}%)`);
        
        // Simulate the examples from your description
        if (withTarget.attemptedQuestions === withTarget.totalQuestions) {
          console.log(`📝 Example Type: Standard Case (All questions attempted)`);
        } else if (withTarget.attemptedQuestions < withTarget.totalQuestions) {
          console.log(`📝 Example Type: Unattempted Questions Case (${withTarget.totalQuestions - withTarget.attemptedQuestions} questions skipped)`);
        }
      } else {
        console.log(`❌ No attainment data available`);
      }
      console.log('');
    }

    // Test 2: Overall Course CO Attainment
    console.log('\n📊 STAGE 2: OVERALL COURSE CO ATTAINMENT');
    console.log('==========================================\n');

    const classAttainment = await COAttainmentCalculator.calculateClassCOAttainment(
      course.id,
      co.id
    );

    if (classAttainment) {
      console.log(`🎯 CO: ${classAttainment.coCode} - ${classAttainment.coDescription}`);
      console.log(`👥 Total Students: ${classAttainment.totalStudents}`);
      console.log(`✅ Students Meeting Target: ${classAttainment.studentsMeetingTarget}`);
      console.log(`📊 Percentage Meeting Target: ${classAttainment.percentageMeetingTarget}%`);
      console.log(`🎯 Individual Target: ${classAttainment.targetPercentage}%`);
      console.log(`📊 Level Thresholds: L1=${classAttainment.level1Threshold}%, L2=${classAttainment.level2Threshold}%, L3=${classAttainment.level3Threshold}%`);
      console.log(`🏆 Final Attainment Level: ${classAttainment.attainmentLevel}`);
      
      // Explain the attainment level calculation
      console.log(`\n📋 Attainment Level Calculation:`);
      console.log(`   Is ${classAttainment.percentageMeetingTarget}% >= ${classAttainment.level3Threshold}% (Level 3)? ${classAttainment.percentageMeetingTarget >= classAttainment.level3Threshold ? '✅ YES' : '❌ NO'}`);
      if (classAttainment.percentageMeetingTarget < classAttainment.level3Threshold) {
        console.log(`   Is ${classAttainment.percentageMeetingTarget}% >= ${classAttainment.level2Threshold}% (Level 2)? ${classAttainment.percentageMeetingTarget >= classAttainment.level2Threshold ? '✅ YES' : '❌ NO'}`);
      }
      if (classAttainment.percentageMeetingTarget < classAttainment.level2Threshold) {
        console.log(`   Is ${classAttainment.percentageMeetingTarget}% >= ${classAttainment.level1Threshold}% (Level 1)? ${classAttainment.percentageMeetingTarget >= classAttainment.level1Threshold ? '✅ YES' : '❌ NO'}`);
      }
      if (classAttainment.percentageMeetingTarget < classAttainment.level1Threshold) {
        console.log(`   No thresholds met → Level 0`);
      }
    }

    // Test 3: Full Course Attainment Summary
    console.log('\n📊 FULL COURSE ATTAINMENT SUMMARY');
    console.log('===================================\n');

    const courseSummary = await COAttainmentCalculator.calculateCourseAttainment(course.id);

    if (courseSummary) {
      console.log(`📚 Course: ${courseSummary.courseCode} - ${courseSummary.courseName}`);
      console.log(`👥 Total Students: ${courseSummary.totalStudents}`);
      console.log(`🎯 Target: ${courseSummary.targetPercentage}%`);
      console.log(`📊 Thresholds: L1=${courseSummary.level1Threshold}%, L2=${courseSummary.level2Threshold}%, L3=${courseSummary.level3Threshold}%`);
      
      console.log(`\n📈 CO-wise Results:`);
      for (const coAtt of courseSummary.coAttainments) {
        const levelEmoji = coAtt.attainmentLevel === 3 ? '🏆' : coAtt.attainmentLevel === 2 ? '🥈' : coAtt.attainmentLevel === 1 ? '🥉' : '❌';
        console.log(`   ${levelEmoji} ${coAtt.coCode}: Level ${coAtt.attainmentLevel} (${coAtt.percentageMeetingTarget}% students met target)`);
      }

      // Save results to database
      console.log(`\n💾 Saving attainments to database...`);
      await COAttainmentCalculator.saveAttainments(
        course.id,
        courseSummary.studentAttainments,
        '2023-24'
      );
      console.log(`✅ Saved ${courseSummary.studentAttainments.length} student attainments`);
    }

    console.log('\n🎉 CO ATTAINMENT CALCULATION TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error in CO attainment calculation test:', error);
  }
}

// Run the test
testCOAttainmentCalculation();