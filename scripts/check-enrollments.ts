#!/usr/bin/env tsx

import { db } from '../src/lib/db';

async function checkEnrollments() {
  try {
    console.log('🔍 Checking Enrollments...\n');

    // Check current enrollments
    console.log('📝 Current Enrollments:');
    const enrollments = await db.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true,
            isActive: true,
            batchId: true,
            programId: true,
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            batchId: true,
          }
        }
      }
    });
    
    console.table(enrollments.map(e => ({
      enrollmentId: e.id,
      studentName: e.student.name,
      studentId: e.student.studentId,
      studentActive: e.student.isActive,
      courseCode: e.course.code,
      courseName: e.course.name,
      courseStatus: e.course.status,
      enrollmentActive: e.isActive,
    })));

    // Check students with their batch and program info
    console.log('\n👥 Students with Batch/Program Info:');
    const students = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true,
        isActive: true,
        batchId: true,
        programId: true,
        batch: {
          select: {
            id: true,
            name: true,
            programId: true,
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });
    
    console.table(students.map(s => ({
      studentName: s.name,
      studentId: s.studentId,
      isActive: s.isActive,
      batchId: s.batchId,
      batchName: s.batch?.name,
      programId: s.programId,
      programName: s.program?.name,
      programCode: s.program?.code,
    })));

    // Check courses with batch info
    console.log('\n📚 Courses with Batch Info:');
    const courses = await db.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        batchId: true,
        batch: {
          select: {
            id: true,
            name: true,
            programId: true,
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });
    
    console.table(courses.map(c => ({
      courseCode: c.code,
      courseName: c.name,
      courseStatus: c.status,
      batchName: c.batch?.name,
      programName: c.batch?.program?.name,
      programCode: c.batch?.program?.code,
      enrollmentCount: c._count.enrollments,
    })));

  } catch (error) {
    console.error('❌ Error checking enrollments:', error);
  } finally {
    await db.$disconnect();
  }
}

checkEnrollments();