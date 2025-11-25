import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function createMissingUsers() {
  try {
    console.log('Creating missing admin and university users...');

    // Get colleges
    const colleges = await db.college.findMany();
    console.log('Available colleges:', colleges);

    // Create Admin user (no college restriction)
    const adminPassword = await bcrypt.hash('password123', 12);
    const admin = await db.user.upsert({
      where: { email: 'admin@obeportal.com' },
      update: {},
      create: {
        email: 'admin@obeportal.com',
        password: adminPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Created admin user:', admin);

    // Create University user (no college restriction)
    const universityPassword = await bcrypt.hash('password123', 12);
    const university = await db.user.upsert({
      where: { email: 'university@obeportal.com' },
      update: {},
      create: {
        email: 'university@obeportal.com',
        password: universityPassword,
        name: 'University Administrator',
        role: 'UNIVERSITY',
        isActive: true,
      },
    });
    console.log('Created university user:', university);

    // Create Department Head users for each college
    const deptHeadPassword = await bcrypt.hash('password123', 12);
    
    for (const college of colleges) {
      let email, name;
      
      if (college.code === 'CUIET') {
        email = 'cse@obeportal.com';
        name = 'Department Head - Computer Science & Engineering';
      } else if (college.code === 'CBS') {
        email = 'business@obeportal.com';
        name = 'Department Head - Business Studies';
      } else {
        continue; // Skip other colleges for now
      }

      const deptHead = await db.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: deptHeadPassword,
          name,
          role: 'DEPARTMENT',
          collegeId: college.id,
          isActive: true,
        },
      });
      console.log(`Created department head for ${college.name}:`, deptHead);
    }

    // Create teacher1@obeportal.com for CUIET if not exists
    const teacherPassword = await bcrypt.hash('password123', 12);
    const cuietCollege = colleges.find(c => c.code === 'CUIET');
    if (cuietCollege) {
      const teacher1 = await db.user.upsert({
        where: { email: 'teacher1@obeportal.com' },
        update: {},
        create: {
          email: 'teacher1@obeportal.com',
          password: teacherPassword,
          name: 'Teacher 1 - CUIET',
          role: 'TEACHER',
          collegeId: cuietCollege.id,
          isActive: true,
        },
      });
      console.log('Created teacher1:', teacher1);
    }

    console.log('Successfully created all missing users!');
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await db.$disconnect();
  }
}

createMissingUsers();