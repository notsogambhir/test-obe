#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { UserRole } from '@prisma/client';

async function getDatabaseSummary() {
  try {
    console.log('📊 Comprehensive Database Summary\n');
    
    // Count all records
    const colleges = await db.college.count();
    const departments = await db.department.count();
    const programs = await db.program.count();
    const batches = await db.batch.count();
    const users = await db.user.count();
    const courses = await db.course.count();
    const cos = await db.cO.count();
    const pos = await db.pO.count();
    const peos = await db.pEO.count();
    const assessments = await db.assessment.count();
    const mappings = await db.cOPOMapping.count();
    const enrollments = await db.enrollment.count();
    
    console.log('🏛️  Academic Structure:');
    console.log(`   Colleges: ${colleges}`);
    console.log(`   Departments: ${departments}`);
    console.log(`   Programs: ${programs}`);
    console.log(`   Batches: ${batches}`);
    
    console.log('\n👥 Users:');
    const adminCount = await db.user.count({ where: { role: UserRole.ADMIN } });
    const universityCount = await db.user.count({ where: { role: UserRole.UNIVERSITY } });
    const deptCount = await db.user.count({ where: { role: UserRole.DEPARTMENT } });
    const pcCount = await db.user.count({ where: { role: UserRole.PROGRAM_COORDINATOR } });
    const teacherCount = await db.user.count({ where: { role: UserRole.TEACHER } });
    const studentCount = await db.user.count({ where: { role: UserRole.STUDENT } });
    
    console.log(`   Total Users: ${users}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   University Admins: ${universityCount}`);
    console.log(`   Department Heads: ${deptCount}`);
    console.log(`   Program Coordinators: ${pcCount}`);
    console.log(`   Teachers: ${teacherCount}`);
    console.log(`   Students: ${studentCount}`);
    
    console.log('\n📚 Academic Content:');
    console.log(`   Courses: ${courses}`);
    console.log(`   Course Outcomes (COs): ${cos}`);
    console.log(`   Program Outcomes (POs): ${pos}`);
    console.log(`   Program Educational Objectives (PEOs): ${peos}`);
    console.log(`   Assessments: ${assessments}`);
    console.log(`   CO-PO Mappings: ${mappings}`);
    console.log(`   Student Enrollments: ${enrollments}`);
    
    console.log('\n📈 Batch Details:');
    const batchDetails = await db.batch.findMany({
      include: {
        program: {
          select: { name: true, code: true }
        },
        _count: {
          select: {
            courses: true,
            students: true
          }
        }
      },
      orderBy: { name: 'desc' }
    });
    
    batchDetails.forEach(batch => {
      console.log(`   ${batch.name} (${batch.program.code} - ${batch.program.name})`);
      console.log(`     Courses: ${batch._count.courses}, Students: ${batch._count.students}`);
    });
    
    console.log('\n🎯 Sample Login Credentials:');
    console.log('   Admin: admin@obeportal.com / admin123');
    console.log('   University: university@obeportal.com / university123');
    console.log('   Department: michael.martinez@dept.com / dept123');
    console.log('   Program Coordinator: emily.martinez@pc.com / pc123');
    console.log('   Teacher: sarah.brown0@teacher.com / teacher123');
    console.log('   Student: emily.rodriguez.10@student.com / student123');
    
    console.log('\n✅ Database is ready for testing!');
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
  } finally {
    await db.$disconnect();
  }
}

getDatabaseSummary();