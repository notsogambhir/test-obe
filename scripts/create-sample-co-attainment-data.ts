import { db } from '../src/lib/db';

async function createSampleCOAttainmentData() {
  try {
    console.log('Creating sample data for CO attainment testing...');

    // Get the sample course we created earlier
    const course = await db.course.findFirst({
      where: { code: 'CS101' },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      console.error('❌ Sample course not found. Please run the create-sample-course-co-po script first.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);

    // Get COs for the course
    const cos = await db.cO.findMany({
      where: { courseId: course.id, isActive: true },
      orderBy: { code: 'asc' }
    });

    console.log(`✅ Found ${cos.length} COs`);

    // Create sample assessments with questions
    const assessments = [];
    for (let i = 1; i <= 3; i++) {
      const assessment = await db.assessment.create({
        data: {
          courseId: course.id,
          name: `Assessment ${i}`,
          type: i === 1 ? 'quiz' : i === 2 ? 'exam' : 'assignment',
          maxMarks: 100,
          weightage: i * 10,
          isActive: true
        }
      });
      assessments.push(assessment);
      console.log(`✅ Created assessment: ${assessment.name}`);
    }

    // Create questions mapped to COs
    const questions = [];
    let questionIndex = 1;
    
    for (const assessment of assessments) {
      for (const co of cos) {
        // Create 2-3 questions per CO per assessment
        const questionsPerCO = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < questionsPerCO; i++) {
          const question = await db.question.create({
            data: {
              assessmentId: assessment.id,
              question: `Question ${questionIndex}: ${co.description.substring(0, 50)}...`,
              maxMarks: 10,
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
          questionIndex++;
        }
      }
    }

    console.log(`✅ Created ${questions.length} questions mapped to COs`);

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

    if (enrollments.length === 0) {
      // Create some sample students if none exist
      const batch = await db.batch.findFirst({
        where: { programId: course.batch.programId }
      });

      if (batch) {
        const sampleStudents = [];
        for (let i = 1; i <= 5; i++) {
          const student = await db.user.create({
            data: {
              name: `Student ${i}`,
              email: `student${i}@example.com`,
              password: 'password123',
              role: 'STUDENT',
              collegeId: course.batch.program.collegeId || undefined,
              programId: course.batch.programId,
              batchId: batch.id,
              studentId: `STU${String(i).padStart(4, '0')}`,
              isActive: true
            }
          });

          // Enroll the student
          await db.enrollment.create({
            data: {
              courseId: course.id,
              studentId: student.id,
              semester: '1',
              isActive: true
            }
          });

          sampleStudents.push({ studentId: student.id, studentName: student.name });
        }

        enrollments.push(...sampleStudents.map(s => ({
          student: { id: s.studentId, name: s.studentName }
        })));
        console.log(`✅ Created ${sampleStudents.length} sample students`);
      }
    }

    // Generate student marks for questions
    const academicYear = '2024-2025';
    const semester = '1';
    
    for (const enrollment of enrollments) {
      for (const question of questions) {
        // Generate realistic marks with some variation
        const basePerformance = Math.random(); // 0-1
        let obtainedMarks;
        
        if (basePerformance < 0.2) {
          // Poor performance (0-40%)
          obtainedMarks = Math.floor(Math.random() * 4) + 1;
        } else if (basePerformance < 0.5) {
          // Average performance (40-70%)
          obtainedMarks = Math.floor(Math.random() * 4) + 4;
        } else if (basePerformance < 0.8) {
          // Good performance (70-90%)
          obtainedMarks = Math.floor(Math.random() * 3) + 7;
        } else {
          // Excellent performance (90-100%)
          obtainedMarks = Math.floor(Math.random() * 2) + 9;
        }

        await db.studentMark.create({
          data: {
            questionId: question.id,
            studentId: enrollment.student.id,
            obtainedMarks,
            maxMarks: question.maxMarks,
            academicYear,
            semester
          }
        });
      }
    }

    console.log(`✅ Generated student marks for ${enrollments.length} students`);

    // Calculate and save CO attainments
    const { COAttainmentService } = await import('../src/lib/co-attainment');
    
    await COAttainmentService.batchSaveCOAttainments(
      course.id,
      academicYear,
      semester
    );

    console.log('✅ Calculated and saved CO attainments');

    // Display summary
    const attainmentSummary = await COAttainmentService.calculateCourseCOAttainment(
      course.id,
      academicYear,
      semester
    );

    console.log('\n📊 CO Attainment Summary:');
    console.log(`Course: ${attainmentSummary.courseName} (${attainmentSummary.courseCode})`);
    console.log(`Total Students: ${attainmentSummary.totalStudents}`);
    console.log(`Academic Year: ${academicYear}`);
    console.log(`Semester: ${semester}`);
    console.log('\nCO Attainment Levels:');
    
    attainmentSummary.coAttainments.forEach(co => {
      console.log(`  ${co.coCode}: Level ${co.attainmentLevel} (${co.percentageMeetingTarget.toFixed(1)}%)`);
    });

    console.log('\nOverall Distribution:');
    console.log(`  Level 3: ${attainmentSummary.overallAttainment.level3Count} COs`);
    console.log(`  Level 2: ${attainmentSummary.overallAttainment.level2Count} COs`);
    console.log(`  Level 1: ${attainmentSummary.overallAttainment.level1Count} COs`);
    console.log(`  Not Attained: ${attainmentSummary.overallAttainment.level0Count} COs`);

    console.log('\n🎉 Sample CO attainment data created successfully!');
    console.log('You can now test the CO attainment functionality in the application.');

  } catch (error) {
    console.error('❌ Error creating sample CO attainment data:', error);
  } finally {
    await db.$disconnect();
  }
}

createSampleCOAttainmentData();