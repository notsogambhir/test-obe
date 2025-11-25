import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function createSampleCourse() {
  try {
    console.log('Creating sample course data...');

    // Get first batch and program
    const batch = await db.batch.findFirst({
      include: {
        program: true
      }
    });

    if (!batch) {
      console.error('No batch found. Please seed the database first.');
      return;
    }

    console.log(`Using batch: ${batch.name} (${batch.program.name})`);

    // Create a sample course
    const course = await db.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Programming',
        semester: '1st',
        description: 'Fundamental concepts of programming and problem-solving',
        status: 'ACTIVE',
        batchId: batch.id
      }
    });

    console.log(`Created course: ${course.code} - ${course.name}`);

    // Create Course Outcomes
    const cos = await Promise.all([
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO1',
          description: 'Understand fundamental programming concepts and problem-solving techniques'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO2',
          description: 'Design and implement algorithms using appropriate data structures'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO3',
          description: 'Apply programming skills to solve real-world problems'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO4',
          description: 'Analyze and debug code effectively'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO5',
          description: 'Work collaboratively on software development projects'
        }
      })
    ]);

    console.log(`Created ${cos.length} course outcomes`);

    // Create Assessments
    const assessments = await Promise.all([
      db.assessment.create({
        data: {
          courseId: course.id,
          name: 'Mid Term Examination',
          type: 'exam',
          maxMarks: 50,
          weightage: 30,
          semester: '1st'
        }
      }),
      db.assessment.create({
        data: {
          courseId: course.id,
          name: 'Lab Assessment 1',
          type: 'assignment',
          maxMarks: 25,
          weightage: 20,
          semester: '1st'
        }
      }),
      db.assessment.create({
        data: {
          courseId: course.id,
          name: 'Final Examination',
          type: 'exam',
          maxMarks: 100,
          weightage: 50,
          semester: '1st'
        }
      })
    ]);

    console.log(`Created ${assessments.length} assessments`);

    // Get some students to enroll
    const students = await db.user.findMany({
      where: {
        role: 'STUDENT'
      },
      take: 10
    });

    if (students.length === 0) {
      // Create some sample students if none exist
      const hashedPassword = await hashPassword('password123');
      const sampleStudents = await Promise.all([
        db.user.create({
          data: {
            email: 'student1@obeportal.com',
            password: hashedPassword,
            name: 'Alice Johnson',
            role: 'STUDENT',
            studentId: '2021001',
            programId: batch.programId,
            batchId: batch.id
          }
        }),
        db.user.create({
          data: {
            email: 'student2@obeportal.com',
            password: hashedPassword,
            name: 'Bob Smith',
            role: 'STUDENT',
            studentId: '2021002',
            programId: batch.programId,
            batchId: batch.id
          }
        }),
        db.user.create({
          data: {
            email: 'student3@obeportal.com',
            password: hashedPassword,
            name: 'Charlie Brown',
            role: 'STUDENT',
            studentId: '2021003',
            programId: batch.programId,
            batchId: batch.id
          }
        })
      ]);
      
      // Enroll the sample students
      for (const student of sampleStudents) {
        await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: student.id,
            semester: '1st'
          }
        });
      }
      
      console.log(`Created and enrolled ${sampleStudents.length} sample students`);
    } else {
      // Enroll existing students
      for (const student of students.slice(0, 5)) {
        await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: student.id,
            semester: '1st'
          }
        });
      }
      
      console.log(`Enrolled ${Math.min(5, students.length)} existing students`);
    }

    console.log('\n✅ Sample course data created successfully!');
    console.log(`📚 Course ID: ${course.id}`);
    console.log(`🔗 Access the course at: http://localhost:3000/courses/${course.id}/manage`);
    console.log('\n👤 Login credentials (all passwords: password123):');
    console.log('   - Admin: admin@obeportal.com');
    console.log('   - Teacher: teacher1@obeportal.com');
    console.log('   - Student: student1@obeportal.com (if created)');

  } catch (error) {
    console.error('Error creating sample course:', error);
  }
}

createSampleCourse();