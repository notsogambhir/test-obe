import { db } from '../src/lib/db';

async function checkCurrentState() {
  try {
    console.log('=== CHECKING CURRENT DATABASE STATE ===\n');

    // Check students
    console.log('👥 Students:');
    const students = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        programId: true,
        batchId: true,
        isActive: true,
        program: {
          select: { name: true, code: true }
        },
        batch: {
          select: { name: true, startYear: true, endYear: true }
        }
      },
      take: 5
    });

    students.forEach(student => {
      console.log(`  - ${student.name} (${student.studentId}) - ${student.program?.name} - ${student.batch?.name}`);
    });

    // Check courses
    console.log('\n📚 Courses:');
    const courses = await db.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        batchId: true,
        isActive: true,
        batch: {
          select: { 
            name: true,
            program: {
              select: { name: true, code: true }
            }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      take: 5
    });

    courses.forEach(course => {
      console.log(`  - ${course.code}: ${course.name} (${course.status}) - ${course._count.enrollments} enrolled`);
    });

    // Check enrollments
    console.log('\n📝 Enrollments:');
    const enrollments = await db.enrollment.findMany({
      select: {
        id: true,
        courseId: true,
        studentId: true,
        isActive: true,
        createdAt: true,
        course: {
          select: { code: true, name: true, status: true }
        },
        student: {
          select: { name: true, studentId: true }
        }
      },
      take: 5
    });

    enrollments.forEach(enrollment => {
      console.log(`  - ${enrollment.student.name} enrolled in ${enrollment.course.code} (${enrollment.course.status})`);
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total Students: ${students.length} (showing first 5)`);
    console.log(`Total Courses: ${courses.length} (showing first 5)`);
    console.log(`Total Enrollments: ${enrollments.length} (showing first 5)`);

  } catch (error) {
    console.error('Error checking database state:', error);
  }
}

checkCurrentState();