#!/usr/bin/env tsx

import { db } from '../src/lib/db';

async function testDatabaseConnection() {
  console.log('🗄️  Testing Database Connection...\n');

  try {
    console.log('📡 Connecting to database...');
    await db.$connect();
    console.log('✅ Database connected successfully');

    console.log('\n🔍 Testing basic query...');
    const result = await db.$queryRaw`SELECT 1 as test, datetime('now') as current_time`;
    console.log('✅ Basic query successful:', result);

    console.log('\n👥 Testing user table access...');
    const userCount = await db.user.count();
    console.log(`✅ Found ${userCount} users in database`);

    console.log('\n📚 Testing course table access...');
    const courseCount = await db.course.count();
    console.log(`✅ Found ${courseCount} courses in database`);

    console.log('\n🎓 Testing enrollment table access...');
    const enrollmentCount = await db.enrollment.count();
    console.log(`✅ Found ${enrollmentCount} enrollments in database`);

    console.log('\n✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

testDatabaseConnection();