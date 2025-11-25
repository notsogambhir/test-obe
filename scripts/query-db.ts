#!/usr/bin/env tsx

import { db } from '../src/lib/db';

async function queryDatabase() {
  try {
    console.log('🔍 Querying Database...\n');

    // List all tables
    console.log('📋 Tables:');
    const tables = await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.table(tables);
    console.log('\n');

    // Query users
    console.log('👥 Users:');
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        collegeId: true,
        programId: true,
        isActive: true,
        createdAt: true,
      }
    });
    console.table(users);
    console.log('\n');

    // Query courses
    console.log('📚 Courses:');
    const courses = await db.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        batchId: true,
        isActive: true,
        createdAt: true,
        description: true,
        status: true,
      }
    });
    console.table(courses);
    console.log('\n');

    // Query programs
    console.log('🎓 Programs:');
    const programs = await db.program.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        collegeId: true,
        duration: true,
        isActive: true,
      }
    });
    console.table(programs);
    console.log('\n');

    // Query batches
    console.log('📅 Batches:');
    const batches = await db.batch.findMany({
      select: {
        id: true,
        name: true,
        programId: true,
        startYear: true,
        endYear: true,
        isActive: true,
      }
    });
    console.table(batches);

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await db.$disconnect();
  }
}

queryDatabase();