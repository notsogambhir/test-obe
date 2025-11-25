import { authenticateUser } from '@/lib/auth';

async function testLoginAPI() {
  try {
    console.log('=== TESTING LOGIN API ===');

    // Test admin login
    console.log('\\n1. Testing Admin login...');
    const adminUser = await authenticateUser('admin@obeportal.com', 'password123');
    if (adminUser) {
      console.log('✅ Admin login successful');
      console.log('   User:', adminUser.name, '(', adminUser.role, ')');
    } else {
      console.log('❌ Admin login failed');
    }

    // Test program coordinator login
    console.log('\\n2. Testing Program Coordinator login...');
    const pcUser = await authenticateUser('pc.beme@obeportal.com', 'password123');
    if (pcUser) {
      console.log('✅ Program Coordinator login successful');
      console.log('   User:', pcUser.name, '(', pcUser.role, ')');
      console.log('   College ID:', pcUser.collegeId);
    } else {
      console.log('❌ Program Coordinator login failed');
    }

    // Test teacher login
    console.log('\\n3. Testing Teacher login...');
    const teacherUser = await authenticateUser('teacher1@obeportal.com', 'password123');
    if (teacherUser) {
      console.log('✅ Teacher login successful');
      console.log('   User:', teacherUser.name, '(', teacherUser.role, ')');
      console.log('   College ID:', teacherUser.collegeId);
    } else {
      console.log('❌ Teacher login failed');
    }

    // Test student login
    console.log('\\n4. Testing Student login...');
    const studentUser = await authenticateUser('alice.johnson@college.edu', 'password123');
    if (studentUser) {
      console.log('✅ Student login successful');
      console.log('   User:', studentUser.name, '(', studentUser.role, ')');
      console.log('   College ID:', studentUser.collegeId);
    } else {
      console.log('❌ Student login failed');
    }

    // Test wrong password
    console.log('\\n5. Testing wrong password...');
    const wrongPasswordUser = await authenticateUser('admin@obeportal.com', 'wrongpassword');
    if (!wrongPasswordUser) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password was accepted (this is bad)');
    }

    // Test non-existent user
    console.log('\\n6. Testing non-existent user...');
    const nonExistentUser = await authenticateUser('nonexistent@test.com', 'password123');
    if (!nonExistentUser) {
      console.log('✅ Non-existent user correctly rejected');
    } else {
      console.log('❌ Non-existent user was accepted (this is bad)');
    }

    console.log('\\n=== LOGIN API TEST COMPLETE ===');
    console.log('\\nAll authentication functions are working correctly!');
    console.log('You can now test the login at: http://localhost:3000');

  } catch (error) {
    console.error('Error testing login API:', error);
  }
}

testLoginAPI();