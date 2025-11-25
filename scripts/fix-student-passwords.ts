import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function fixStudentPasswords() {
  try {
    console.log('=== FIXING STUDENT PASSWORDS ===');

    const students = [
      'alice.johnson@college.edu',
      'bob.smith@college.edu',
      'charlie.brown@college.edu',
      'diana.prince@college.edu',
      'edward.norton@college.edu'
    ];

    const hashedPassword = await hashPassword('password123');

    for (const email of students) {
      const user = await db.user.findUnique({
        where: { email }
      });

      if (user) {
        await db.user.update({
          where: { email },
          data: { password: hashedPassword }
        });
        console.log(`✅ Fixed password for: ${user.name} (${email})`);
      } else {
        console.log(`❌ Student not found: ${email}`);
      }
    }

    console.log('\\n=== PASSWORD FIX COMPLETE ===');
    console.log('\\nAll student passwords have been reset to: password123');
    console.log('\\nYou can now login with any of these student accounts:');
    console.log('- alice.johnson@college.edu / password123');
    console.log('- bob.smith@college.edu / password123');
    console.log('- charlie.brown@college.edu / password123');
    console.log('- diana.prince@college.edu / password123');
    console.log('- edward.norton@college.edu / password123');

  } catch (error) {
    console.error('Error fixing student passwords:', error);
  }
}

fixStudentPasswords();