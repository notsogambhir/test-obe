import { db } from '@/lib/db';

async function testCourseManagement() {
  try {
    console.log('=== TESTING COURSE MANAGEMENT FUNCTIONALITY ===');

    // 1. Check if courses exist
    const courses = await db.course.findMany({
      include: {
        batch: {
          include: {
            program: {
              include: {
                college: true
              }
            }
          }
        },
        courseOutcomes: true,
        assessments: true,
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });

    console.log(`\\nFound ${courses.length} courses in the database:`);
    
    courses.forEach((course, index) => {
      console.log(`\\n${index + 1}. ${course.code} - ${course.name}`);
      console.log(`   Program: ${course.batch.program.name} (${course.batch.program.code})`);
      console.log(`   College: ${course.batch.program.college.name}`);
      console.log(`   Batch: ${course.batch.name}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   COs: ${course.courseOutcomes.length}`);
      console.log(`   Assessments: ${course.assessments.length}`);
      console.log(`   Enrollments: ${course.enrollments.length}`);
    });

    // 2. Test API endpoints
    console.log('\\n=== TESTING API ENDPOINTS ===');
    
    const firstCourse = courses[0];
    if (firstCourse) {
      console.log(`\\nTesting with course: ${firstCourse.code} (${firstCourse.id})`);
      
      // Test COs API
      const cos = await db.cO.findMany({
        where: { courseId: firstCourse.id }
      });
      console.log(`COs for ${firstCourse.code}: ${cos.length}`);
      cos.forEach(co => {
        console.log(`  - ${co.code}: ${co.description.substring(0, 50)}...`);
      });

      // Test Assessments API
      const assessments = await db.assessment.findMany({
        where: { courseId: firstCourse.id }
      });
      console.log(`Assessments for ${firstCourse.code}: ${assessments.length}`);
      assessments.forEach(assessment => {
        console.log(`  - ${assessment.name} (${assessment.type}, ${assessment.weightage}%)`);
      });

      // Test Enrollments API
      const enrollments = await db.enrollment.findMany({
        where: { courseId: firstCourse.id },
        include: { student: true }
      });
      console.log(`Enrollments for ${firstCourse.code}: ${enrollments.length}`);
      enrollments.forEach(enrollment => {
        console.log(`  - ${enrollment.student.name} (${enrollment.student.studentId})`);
      });
    }

    // 3. Test users and their permissions
    console.log('\\n=== TESTING USER ACCESS ===');
    
    const users = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        college: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        }
      }
    });

    console.log(`\\nFound ${users.length} active users:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - ${user.email}`);
      console.log(`    College: ${user.college?.name || 'N/A'}`);
      console.log(`    Program: ${user.program?.name || 'N/A'}`);
    });

    // 4. Test POs for programs
    console.log('\\n=== TESTING PROGRAM OUTCOMES ===');
    
    const programs = await db.program.findMany({
      include: {
        college: true,
        pos: true
      }
    });

    programs.forEach(program => {
      console.log(`\\n${program.name} (${program.code}) - ${program.college.name}`);
      console.log(`  POs: ${program.pos.length}`);
      program.pos.forEach(po => {
        console.log(`    - ${po.code}: ${po.description.substring(0, 50)}...`);
      });
    });

    console.log('\\n=== TEST COMPLETE ===');
    console.log('\\nYou can now test the application with these credentials:');
    console.log('1. Admin: admin@obeportal.com / password123');
    console.log('2. Program Coordinator (BE ME): pc.beme@obeportal.com / password123');
    console.log('3. Teacher: teacher1@obeportal.com / password123');
    console.log('4. Student: alice.johnson@college.edu / password123');
    console.log('\\nNavigate to: http://localhost:3000/courses');
    console.log('Click on any course to test the management functionality.');

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testCourseManagement();