import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Clean existing data in correct order (respect foreign key constraints)
    // Start from the most dependent tables
    await db.studentMark.deleteMany({});
    await db.cOAttainment.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.questionCOMapping.deleteMany({});
    await db.question.deleteMany({});
    await db.assessment.deleteMany({});
    await db.teacherAssignment.deleteMany({});
    await db.cOPOMapping.deleteMany({});
    await db.cO.deleteMany({});
    await db.course.deleteMany({});
    await db.section.deleteMany({});
    await db.batch.deleteMany({});
    await db.user.deleteMany({});
    await db.pO.deleteMany({});
    await db.program.deleteMany({});
    await db.college.deleteMany({});
    await db.pEO.deleteMany({});
    
    // Create colleges
    const colleges = await Promise.all([
      db.college.create({
        data: {
          name: 'CUIET',
          code: 'CUIET',
          description: 'College of Engineering and Technology',
        },
      }),
      db.college.create({
        data: {
          name: 'CBS',
          code: 'CBS',
          description: 'College of Business Studies',
        },
      }),
    ]);

    // Create programs
    const programs = await Promise.all([
      db.program.create({
        data: {
          name: 'BE ME',
          code: 'BEME',
          collegeId: colleges[0].id,
          duration: 4,
        },
      }),
      db.program.create({
        data: {
          name: 'BBA',
          code: 'BBA',
          collegeId: colleges[1].id,
          duration: 3,
        },
      }),
    ]);

    // Create batches
    await Promise.all([
      db.batch.create({
        data: {
          name: '2020-2024',
          programId: programs[0].id,
          startYear: 2020,
          endYear: 2024,
        },
      }),
      db.batch.create({
        data: {
          name: '2021-2025',
          programId: programs[0].id,
          startYear: 2021,
          endYear: 2025,
        },
      }),
    ]);

    // Create users with correct passwords for quick login
    await Promise.all([
      // Admin
      db.user.create({
        data: {
          email: 'admin@obeportal.com',
          password: await hashPassword('admin123'),
          name: 'System Administrator',
          role: 'ADMIN',
        },
      }),
      // University
      db.user.create({
        data: {
          email: 'university@obeportal.com',
          password: await hashPassword('university123'),
          name: 'University Admin',
          role: 'UNIVERSITY',
        },
      }),
      // Department users
      db.user.create({
        data: {
          email: 'cse@obeportal.com',
          password: await hashPassword('department123'),
          name: 'CUIET Department Head',
          role: 'DEPARTMENT',
          collegeId: colleges[0].id,
        },
      }),
      db.user.create({
        data: {
          email: 'business@obeportal.com',
          password: await hashPassword('department123'),
          name: 'CBS Department Head',
          role: 'DEPARTMENT',
          collegeId: colleges[1].id,
        },
      }),
      // Program Coordinators
      db.user.create({
        data: {
          email: 'pc.bba@obeportal.com',
          password: await hashPassword('coordinator123'),
          name: 'BBA Program Coordinator',
          role: 'PROGRAM_COORDINATOR',
          collegeId: colleges[1].id,
          programId: programs[1].id,
        },
      }),
      db.user.create({
        data: {
          email: 'pc.beme@obeportal.com',
          password: await hashPassword('coordinator123'),
          name: 'BE ME Program Coordinator',
          role: 'PROGRAM_COORDINATOR',
          collegeId: colleges[0].id,
          programId: programs[0].id,
        },
      }),
      // Teachers
      db.user.create({
        data: {
          email: 'teacher1@obeportal.com',
          password: await hashPassword('teacher123'),
          name: 'John Teacher',
          role: 'TEACHER',
          collegeId: colleges[0].id,
          programId: programs[0].id,
        },
      }),
      db.user.create({
        data: {
          email: 'teacher2@obeportal.com',
          password: await hashPassword('teacher123'),
          name: 'Jane Teacher',
          role: 'TEACHER',
          collegeId: colleges[1].id,
          programId: programs[1].id,
        },
      }),
    ]);

    return NextResponse.json({ 
      message: 'Database seeded successfully!',
      credentials: {
        admin: 'admin@obeportal.com / admin123',
        university: 'university@obeportal.com / university123',
        department_cuiet: 'cse@obeportal.com / department123',
        department_cbs: 'business@obeportal.com / department123',
        pc_bba: 'pc.bba@obeportal.com / coordinator123',
        pc_beme: 'pc.beme@obeportal.com / coordinator123',
        teacher1: 'teacher1@obeportal.com / teacher123',
        teacher2: 'teacher2@obeportal.com / teacher123',
      }
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}