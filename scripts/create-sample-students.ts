import { db } from '../src/lib/db';

async function createSampleStudents() {
  try {
    console.log('Creating sample students and enrollments...');

    // Get the course we created earlier
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
      console.error('❌ Course CS101 not found.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);

    // Create sample students
    const studentData = [
      { name: 'Alice Johnson', studentId: 'STU001' },
      { name: 'Bob Smith', studentId: 'STU002' },
      { name: 'Charlie Brown', studentId: 'STU003' },
      { name: 'Diana Prince', studentId: 'STU004' },
      { name: 'Edward Norton', studentId: 'STU005' },
      { name: 'Fiona Green', studentId: 'STU006' },
      { name: 'George Wilson', studentId: 'STU007' },
      { name: 'Hannah Davis', studentId: 'STU008' },
      { name: 'Ian McKellen', studentId: 'STU009' },
      { name: 'Julia Roberts', studentId: 'STU010' }
    ];

    const createdStudents = [];
    for (const student of studentData) {
      const newStudent = await db.user.create({
        data: {
          name: student.name,
          studentId: student.studentId,
          email: `${student.studentId.toLowerCase()}@university.edu`,
          password: '$2a$10$K8ZpdrjwzUWSTmtyYoNb6ujr.kNc3RQHQ3p3qNIYFvXJhBczQ1kO6', // password123
          role: 'STUDENT',
          collegeId: course.batch.program.collegeId || undefined,
          programId: course.batch.programId,
          batchId: course.batch.id,
          isActive: true
        }
      });
      createdStudents.push(newStudent);
      console.log(`✅ Created student: ${student.name} (${student.studentId})`);
    }

    // Enroll students in the course
    for (const student of createdStudents) {
      await db.enrollment.create({
        data: {
          courseId: course.id,
          studentId: student.id,
          semester: course.semester,
          isActive: true
        }
      });
      console.log(`✅ Enrolled ${student.name} in ${course.code}`);
    }

    console.log('\n🎉 Sample students and enrollments created successfully!');
    console.log(`Created ${createdStudents.length} students`);
    console.log(`All students enrolled in ${course.code}`);

  } catch (error) {
    console.error('❌ Error creating sample students:', error);
  } finally {
    await db.$disconnect();
  }
}

createSampleStudents();