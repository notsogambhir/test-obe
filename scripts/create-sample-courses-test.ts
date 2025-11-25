import { db } from '@/lib/db';

async function createSampleCourses() {
  try {
    console.log('Creating sample courses...');

    // Get the first batch and program
    const batch = await db.batch.findFirst({
      include: {
        program: true
      }
    });

    if (!batch) {
      console.error('No batch found. Please ensure you have batches in the database.');
      return;
    }

    console.log(`Using batch: ${batch.name} (${batch.program.name})`);

    // Create sample courses
    const courses = [
      {
        code: 'CS101',
        name: 'Introduction to Programming',
        semester: '1st Semester',
        description: 'Fundamental concepts of programming using C++',
        status: 'ACTIVE' as const,
        batchId: batch.id
      },
      {
        code: 'CS102',
        name: 'Data Structures',
        semester: '2nd Semester',
        description: 'Introduction to data structures and algorithms',
        status: 'ACTIVE' as const,
        batchId: batch.id
      },
      {
        code: 'CS103',
        name: 'Database Management Systems',
        semester: '3rd Semester',
        description: 'Database design and SQL programming',
        status: 'FUTURE' as const,
        batchId: batch.id
      },
      {
        code: 'CS104',
        name: 'Web Development',
        semester: '4th Semester',
        description: 'Modern web development with React and Node.js',
        status: 'FUTURE' as const,
        batchId: batch.id
      }
    ];

    for (const courseData of courses) {
      // Check if course already exists
      const existingCourse = await db.course.findFirst({
        where: {
          code: courseData.code,
          batchId: courseData.batchId
        }
      });

      if (existingCourse) {
        console.log(`Course ${courseData.code} already exists, skipping...`);
        continue;
      }

      const course = await db.course.create({
        data: courseData
      });

      console.log(`Created course: ${course.code} - ${course.name}`);

      // Create some sample COs for each course
      const cos = [
        {
          code: 'CO1',
          description: `Understand fundamental concepts of ${course.name.toLowerCase()}`,
          courseId: course.id
        },
        {
          code: 'CO2',
          description: `Apply theoretical knowledge to solve practical problems in ${course.name.toLowerCase()}`,
          courseId: course.id
        },
        {
          code: 'CO3',
          description: `Design and implement solutions using ${course.name.toLowerCase()} techniques`,
          courseId: course.id
        }
      ];

      for (const coData of cos) {
        const co = await db.cO.create({
          data: coData
        });
        console.log(`  Created CO: ${co.code}`);
      }

      // Create sample assessments
      const assessments = [
        {
          name: 'Mid Term Examination',
          type: 'exam',
          maxMarks: 100,
          weightage: 30,
          semester: course.semester,
          courseId: course.id
        },
        {
          name: 'Lab Assessment',
          type: 'assignment',
          maxMarks: 50,
          weightage: 20,
          semester: course.semester,
          courseId: course.id
        },
        {
          name: 'Final Examination',
          type: 'exam',
          maxMarks: 100,
          weightage: 50,
          semester: course.semester,
          courseId: course.id
        }
      ];

      for (const assessmentData of assessments) {
        const assessment = await db.assessment.create({
          data: assessmentData
        });
        console.log(`  Created Assessment: ${assessment.name}`);
      }
    }

    console.log('Sample courses created successfully!');
    console.log('\\nYou can now test the course management functionality.');
    console.log('Try accessing: /courses');
    console.log('Login with: pc.beme@obeportal.com / password123 (Program Coordinator)');
    
  } catch (error) {
    console.error('Error creating sample courses:', error);
  }
}

createSampleCourses();