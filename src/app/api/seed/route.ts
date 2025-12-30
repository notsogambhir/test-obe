import { NextRequest, NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // Use the comprehensive seed function from lib/seed.ts
    await seed();

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
        students: 'student1@obeportal.com through student60@obeportal.com / student123'
      }
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}