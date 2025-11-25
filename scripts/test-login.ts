import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

async function testLoginCredentials() {
  try {
    console.log('=== TESTING LOGIN CREDENTIALS ===');

    // Test admin user
    const adminUser = await db.user.findUnique({
      where: { email: 'admin@obeportal.com' },
      include: {
        college: true,
        department: true,
        program: true,
      }
    });

    if (adminUser) {
      console.log('\\n✅ Admin user found:');
      console.log('  Email:', adminUser.email);
      console.log('  Name:', adminUser.name);
      console.log('  Role:', adminUser.role);
      console.log('  Active:', adminUser.isActive);
      
      const isValidPassword = await verifyPassword('password123', adminUser.password);
      console.log('  Password valid:', isValidPassword);
    } else {
      console.log('\\n❌ Admin user NOT found');
    }

    // Test program coordinator
    const pcUser = await db.user.findUnique({
      where: { email: 'pc.beme@obeportal.com' },
      include: {
        college: true,
        department: true,
        program: true,
      }
    });

    if (pcUser) {
      console.log('\\n✅ Program Coordinator user found:');
      console.log('  Email:', pcUser.email);
      console.log('  Name:', pcUser.name);
      console.log('  Role:', pcUser.role);
      console.log('  College:', pcUser.college?.name);
      console.log('  Program:', pcUser.program?.name);
      console.log('  Active:', pcUser.isActive);
      
      const isValidPassword = await verifyPassword('password123', pcUser.password);
      console.log('  Password valid:', isValidPassword);
    } else {
      console.log('\\n❌ Program Coordinator user NOT found');
    }

    // Test teacher
    const teacherUser = await db.user.findUnique({
      where: { email: 'teacher1@obeportal.com' },
      include: {
        college: true,
        department: true,
        program: true,
      }
    });

    if (teacherUser) {
      console.log('\\n✅ Teacher user found:');
      console.log('  Email:', teacherUser.email);
      console.log('  Name:', teacherUser.name);
      console.log('  Role:', teacherUser.role);
      console.log('  College:', teacherUser.college?.name);
      console.log('  Program:', teacherUser.program?.name);
      console.log('  Active:', teacherUser.isActive);
      
      const isValidPassword = await verifyPassword('password123', teacherUser.password);
      console.log('  Password valid:', isValidPassword);
    } else {
      console.log('\\n❌ Teacher user NOT found');
    }

    // Test student
    const studentUser = await db.user.findUnique({
      where: { email: 'alice.johnson@college.edu' },
      include: {
        college: true,
        department: true,
        program: true,
      }
    });

    if (studentUser) {
      console.log('\\n✅ Student user found:');
      console.log('  Email:', studentUser.email);
      console.log('  Name:', studentUser.name);
      console.log('  Role:', studentUser.role);
      console.log('  Student ID:', studentUser.studentId);
      console.log('  College:', studentUser.college?.name);
      console.log('  Program:', studentUser.program?.name);
      console.log('  Active:', studentUser.isActive);
      
      const isValidPassword = await verifyPassword('password123', studentUser.password);
      console.log('  Password valid:', isValidPassword);
    } else {
      console.log('\\n❌ Student user NOT found');
    }

    // List all users for debugging
    console.log('\\n=== ALL USERS IN DATABASE ===');
    const allUsers = await db.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
        college: {
          select: { name: true }
        }
      },
      orderBy: { role: 'asc' }
    });

    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - ${user.email} - ${user.college?.name || 'No College'} - Active: ${user.isActive}`);
    });

    console.log('\\n=== TEST COMPLETE ===');
    console.log('\\nIf passwords are showing as invalid, the hashing might be inconsistent.');
    console.log('Try these login credentials:');
    console.log('1. Admin: admin@obeportal.com / password123');
    console.log('2. Program Coordinator: pc.beme@obeportal.com / password123');
    console.log('3. Teacher: teacher1@obeportal.com / password123');
    console.log('4. Student: alice.johnson@college.edu / password123');

  } catch (error) {
    console.error('Error testing login credentials:', error);
  }
}

testLoginCredentials();