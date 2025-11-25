#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { UserRole } from '@prisma/client';

// Mock data generators
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const courseNames = [
  'Introduction to Programming', 'Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks',
  'Operating Systems', 'Software Engineering', 'Web Development', 'Mathematics I', 'Physics I',
  'Business Mathematics', 'Financial Accounting', 'Marketing Management', 'Human Resource Management'
];

const courseCodes = ['CS', 'SE', 'IT', 'CE', 'EE', 'ME', 'MATH', 'PHY', 'ENG', 'BUS'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Delete in order of dependencies
  await db.enrollment.deleteMany();
  await db.question.deleteMany();
  await db.cOPOMapping.deleteMany();
  await db.assessment.deleteMany();
  await db.cO.deleteMany();
  await db.course.deleteMany();
  await db.pEO.deleteMany();
  await db.pO.deleteMany();
  await db.user.deleteMany();
  await db.batch.deleteMany();
  await db.program.deleteMany();
  await db.department.deleteMany();
  await db.college.deleteMany();
  
  console.log('✅ Database cleared');
}

async function createBasicStructure() {
  console.log('🏗️ Creating basic structure...');
  
  // Create colleges
  const colleges = await Promise.all([
    db.college.create({ 
      data: { name: 'Institute of Technology', code: 'IOT', description: 'Premier engineering institution' }
    }),
    db.college.create({ 
      data: { name: 'School of Business', code: 'SB', description: 'Leading business school' }
    })
  ]);

  // Create departments
  const departments = await Promise.all([
    db.department.create({ 
      data: { name: 'Computer Science', code: 'CSE', collegeId: colleges[0].id, description: 'CSE Department' }
    }),
    db.department.create({ 
      data: { name: 'Mechanical Engineering', code: 'ME', collegeId: colleges[0].id, description: 'ME Department' }
    }),
    db.department.create({ 
      data: { name: 'Business Administration', code: 'BA', collegeId: colleges[1].id, description: 'BA Department' }
    })
  ]);

  // Create programs
  const programs = await Promise.all([
    db.program.create({ 
      data: { name: 'Bachelor of Computer Science', code: 'BCS', collegeId: colleges[0].id, departmentId: departments[0].id, duration: 4 }
    }),
    db.program.create({ 
      data: { name: 'Bachelor of Mechanical Engineering', code: 'BME', collegeId: colleges[0].id, departmentId: departments[1].id, duration: 4 }
    }),
    db.program.create({ 
      data: { name: 'Bachelor of Business Administration', code: 'BBA', collegeId: colleges[1].id, departmentId: departments[2].id, duration: 3 }
    })
  ]);

  // Create batches
  const currentYear = new Date().getFullYear();
  const batches: (any & { program: any })[] = [];
  
  for (const program of programs) {
    for (let i = 0; i < 2; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + program.duration;
      
      const batch = {
        name: `${startYear}-${endYear}`,
        programId: program.id,
        startYear,
        endYear
      };
      
      const createdBatch = await db.batch.create({ data: batch });
      batches.push({
        ...createdBatch,
        program: program
      });
    }
  }

  console.log(`✅ Created ${colleges.length} colleges, ${departments.length} departments, ${programs.length} programs, ${batches.length} batches`);
  
  return { colleges, departments, programs, batches };
}

async function createUsers(colleges: any[], departments: any[], programs: any[], batches: any[]) {
  console.log('👥 Creating users...');
  
  const users: any[] = [];
  
  // Admin users
  users.push({
    email: 'admin@obeportal.com',
    password: 'admin123',
    name: 'System Administrator',
    role: UserRole.ADMIN
  });

  users.push({
    email: 'university@obeportal.com',
    password: 'university123',
    name: 'University Administrator',
    role: UserRole.UNIVERSITY
  });

  // Department heads
  for (const dept of departments) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    users.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@dept.com`,
      password: 'dept123',
      name: `${firstName} ${lastName}`,
      role: UserRole.DEPARTMENT,
      collegeId: dept.collegeId,
      departmentId: dept.id
    });
  }

  // Program coordinators
  for (const program of programs) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    users.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@pc.com`,
      password: 'pc123',
      name: `${firstName} ${lastName}`,
      role: UserRole.PROGRAM_COORDINATOR,
      collegeId: program.collegeId,
      departmentId: program.departmentId,
      programId: program.id
    });
  }

  // Teachers
  for (let i = 0; i < 6; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const program = getRandomElement(programs);
    
    users.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@teacher.com`,
      password: 'teacher123',
      name: `${firstName} ${lastName}`,
      role: UserRole.TEACHER,
      collegeId: program.collegeId,
      departmentId: program.departmentId,
      programId: program.id
    });
  }

  // Students
  let studentCounter = 0;
  for (const batch of batches) {
    const studentCount = getRandomNumber(15, 25);
    
    for (let i = 0; i < studentCount; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      
      users.push({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${studentCounter++}@student.com`,
        password: 'student123',
        name: `${firstName} ${lastName}`,
        role: UserRole.STUDENT,
        collegeId: batch.program.collegeId,
        departmentId: batch.program.departmentId,
        programId: batch.programId,
        batchId: batch.id
      });
    }
  }

  const createdUsers = await Promise.all(
    users.map(user => db.user.create({ data: user }))
  );
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function createPOsAndPEOs(programs: any[]) {
  console.log('📋 Creating POs and PEOs...');
  
  // Create POs for each program
  for (const program of programs) {
    const poData: any[] = [];
    for (let i = 0; i < 6; i++) {
      poData.push({
        programId: program.id,
        code: `PO${i + 1}`,
        description: `Program Outcome ${i + 1}: Engineering knowledge and problem analysis`
      });
    }
    await db.pO.createMany({ data: poData });
  }

  // Create PEOs for each program
  for (const program of programs) {
    const peoData: any[] = [];
    for (let i = 0; i < 4; i++) {
      peoData.push({
        programId: program.id,
        code: `PEO${i + 1}`,
        description: `Program Educational Objective ${i + 1}: Career preparation and professional development`
      });
    }
    await db.pEO.createMany({ data: peoData });
  }
  
  console.log('✅ Created POs and PEOs');
}

async function createCourses(batches: any[]) {
  console.log('📚 Creating courses...');
  
  const courses: any[] = [];
  
  for (const batch of batches) {
    const courseCount = getRandomNumber(4, 6);
    const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const maxSemester = batch.program.duration * 2;
    
    for (let i = 0; i < courseCount; i++) {
      const coursePrefix = getRandomElement(courseCodes);
      const courseNumber = getRandomNumber(100, 399);
      const semester = semesters[getRandomNumber(0, Math.min(maxSemester - 1, 7))];
      
      courses.push({
        code: `${coursePrefix}${courseNumber}`,
        name: getRandomElement(courseNames),
        batchId: batch.id,
        semester,
        description: `Course on ${getRandomElement(courseNames).toLowerCase()}`
      });
    }
  }

  await db.course.createMany({ data: courses });
  console.log(`✅ Created ${courses.length} courses`);
  
  return await db.course.findMany({ include: { batch: { include: { program: true } } } });
}

async function createCOs(courses: any[]) {
  console.log('🎯 Creating COs...');
  
  for (const course of courses) {
    const coData: any[] = [];
    const coCount = getRandomNumber(3, 5);
    
    for (let i = 0; i < coCount; i++) {
      coData.push({
        courseId: course.id,
        code: `CO${i + 1}`,
        description: `Course Outcome ${i + 1}: Apply knowledge and skills`
      });
    }
    
    await db.cO.createMany({ data: coData });
  }
  
  console.log('✅ Created COs');
}

async function createAssessments(courses: any[]) {
  console.log('📝 Creating assessments...');
  
  const assessmentTypes = ['exam', 'quiz', 'assignment', 'project'];
  const assessmentNames = ['Mid-term', 'Final', 'Quiz 1', 'Assignment 1', 'Project'];

  for (const course of courses) {
    const assessmentData: any[] = [];
    const assessmentCount = getRandomNumber(2, 4);
    
    for (let i = 0; i < assessmentCount; i++) {
      assessmentData.push({
        courseId: course.id,
        name: `${getRandomElement(assessmentNames)} - ${course.code}`,
        type: getRandomElement(assessmentTypes),
        maxMarks: getRandomNumber(50, 100),
        weightage: getRandomNumber(10, 25) * 0.01,
        semester: course.semester
      });
    }
    
    await db.assessment.createMany({ data: assessmentData });
  }
  
  console.log('✅ Created assessments');
}

async function createCOPOMappings() {
  console.log('🔗 Creating CO-PO mappings...');
  
  const courses = await db.course.findMany({ include: { batch: { include: { program: true } } } });
  
  for (const course of courses) {
    const cos = await db.cO.findMany({ where: { courseId: course.id } });
    const pos = await db.pO.findMany({ where: { programId: course.batch.programId } });
    
    const mappingData: any[] = [];
    
    for (const co of cos) {
      // Map each CO to 2-3 POs
      const mappingCount = getRandomNumber(2, 3);
      const selectedPOs: any[] = [];
      
      for (let i = 0; i < mappingCount; i++) {
        let po;
        do {
          po = getRandomElement(pos);
        } while (selectedPOs.includes(po.id));
        
        selectedPOs.push(po.id);
        
        mappingData.push({
          courseId: course.id,
          coId: co.id,
          poId: po.id,
          level: getRandomNumber(1, 3)
        });
      }
    }
    
    if (mappingData.length > 0) {
      await db.cOPOMapping.createMany({ data: mappingData });
    }
  }
  
  console.log('✅ Created CO-PO mappings');
}

async function createEnrollments(batches: any[]) {
  console.log('📝 Creating enrollments...');
  
  for (const batch of batches) {
    const courses = await db.course.findMany({ where: { batchId: batch.id } });
    const students = await db.user.findMany({ 
      where: { 
        role: UserRole.STUDENT, 
        batchId: batch.id 
      } 
    });
    
    const enrollmentData: any[] = [];
    
    for (const course of courses) {
      // Enroll 80% of students in each course
      const enrollmentCount = Math.floor(students.length * 0.8);
      const selectedStudents: any[] = [];
      
      for (let i = 0; i < enrollmentCount; i++) {
        let student;
        do {
          student = getRandomElement(students);
        } while (selectedStudents.includes(student.id));
        
        selectedStudents.push(student.id);
        
        enrollmentData.push({
          courseId: course.id,
          studentId: student.id,
          semester: course.semester
        });
      }
    }
    
    if (enrollmentData.length > 0) {
      await db.enrollment.createMany({ data: enrollmentData });
    }
  }
  
  console.log('✅ Created enrollments');
}

async function main() {
  try {
    console.log('🚀 Starting database population...\n');
    
    await clearDatabase();
    
    const { colleges, departments, programs, batches } = await createBasicStructure();
    const users = await createUsers(colleges, departments, programs, batches);
    
    await createPOsAndPEOs(programs);
    const courses = await createCourses(batches);
    await createCOs(courses);
    await createAssessments(courses);
    await createCOPOMappings();
    await createEnrollments(batches);
    
    console.log('\n📊 Database population summary:');
    console.log(`   Colleges: ${colleges.length}`);
    console.log(`   Departments: ${departments.length}`);
    console.log(`   Programs: ${programs.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Courses: ${courses.length}`);
    
    const adminUsers = users.filter(u => u.role === UserRole.ADMIN).length;
    const deptUsers = users.filter(u => u.role === UserRole.DEPARTMENT).length;
    const pcUsers = users.filter(u => u.role === UserRole.PROGRAM_COORDINATOR).length;
    const teacherUsers = users.filter(u => u.role === UserRole.TEACHER).length;
    const studentUsers = users.filter(u => u.role === UserRole.STUDENT).length;
    
    console.log(`   Admins: ${adminUsers}`);
    console.log(`   Department Heads: ${deptUsers}`);
    console.log(`   Program Coordinators: ${pcUsers}`);
    console.log(`   Teachers: ${teacherUsers}`);
    console.log(`   Students: ${studentUsers}`);
    
    const totalCOs = await db.cO.count();
    const totalPOs = await db.pO.count();
    const totalPEOs = await db.pEO.count();
    const totalAssessments = await db.assessment.count();
    const totalMappings = await db.cOPOMapping.count();
    const totalEnrollments = await db.enrollment.count();
    
    console.log(`   COs: ${totalCOs}`);
    console.log(`   POs: ${totalPOs}`);
    console.log(`   PEOs: ${totalPEOs}`);
    console.log(`   Assessments: ${totalAssessments}`);
    console.log(`   CO-PO Mappings: ${totalMappings}`);
    console.log(`   Enrollments: ${totalEnrollments}`);
    
    console.log('\n✅ Database populated successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@obeportal.com / admin123');
    console.log('   University: university@obeportal.com / university123');
    console.log('   Department: [name].[lastname]@dept.com / dept123');
    console.log('   Program Coordinator: [name].[lastname]@pc.com / pc123');
    console.log('   Teacher: [name].[lastname][n]@teacher.com / teacher123');
    console.log('   Student: [name].[lastname][n]@student.com / student123');
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await db.$disconnect();
  }
}

main();