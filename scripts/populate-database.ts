#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { UserRole } from '@prisma/client';

// Mock data generators
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 'William', 'Patricia', 'Richard', 'Jennifer', 'Charles', 'Linda', 'Joseph', 'Elizabeth', 'Thomas', 'Barbara', 'Christopher', 'Susan', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Anthony', 'Kimberly', 'Mark', 'Donna'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const courseNames = [
  'Introduction to Programming', 'Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks',
  'Operating Systems', 'Software Engineering', 'Web Development', 'Mobile App Development', 'Machine Learning',
  'Artificial Intelligence', 'Computer Graphics', 'Information Security', 'Cloud Computing', 'Big Data Analytics',
  'Internet of Things', 'Blockchain Technology', 'DevOps Engineering', 'Microservices Architecture', 'Full Stack Development',
  'Mathematics I', 'Mathematics II', 'Physics I', 'Physics II', 'Chemistry', 'English Communication', 'Engineering Mechanics',
  'Thermodynamics', 'Fluid Mechanics', 'Material Science', 'Circuit Theory', 'Digital Logic', 'Microprocessors',
  'Business Mathematics', 'Financial Accounting', 'Business Statistics', 'Marketing Management', 'Human Resource Management',
  'Operations Management', 'Strategic Management', 'Business Ethics', 'Entrepreneurship', 'International Business', 'Supply Chain Management'
];

const courseCodes = ['CS', 'SE', 'IT', 'CE', 'EE', 'ME', 'CHE', 'PHY', 'MATH', 'ENG', 'BUS', 'ACC', 'MKT', 'HR', 'OPS', 'ECO'];

const coDescriptions = [
  'Apply mathematical concepts to solve engineering problems',
  'Design and implement algorithms for complex problems',
  'Analyze and evaluate system performance',
  'Develop software solutions using modern methodologies',
  'Understand and apply professional ethics',
  'Communicate effectively in technical contexts',
  'Work collaboratively in multidisciplinary teams',
  'Apply knowledge of computing and mathematics',
  'Analyze a problem and define requirements',
  'Design, implement, and evaluate a system',
  'Function effectively on teams',
  'Understand professional, ethical, legal responsibilities',
  'Communicate effectively with stakeholders',
  'Analyze impact of computing on global society',
  'Engage in continuing professional development',
  'Apply mathematical foundations',
  'Apply computer science theory',
  'Design and conduct experiments',
  'Solve engineering problems',
  'Use modern engineering tools'
];

const poDescriptions = [
  'Engineering Knowledge: Apply knowledge of mathematics, science, engineering fundamentals',
  'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems',
  'Design/Development: Design solutions for complex engineering problems and design system components',
  'Conduct Investigations: Use research-based knowledge and research methods to provide valid conclusions',
  'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering tools',
  'The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues',
  'Environment and Sustainability: Understand the impact of engineering solutions in societal and environmental contexts',
  'Ethics: Apply ethical principles and commit to professional ethics and responsibilities',
  'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams',
  'Communication: Communicate effectively on complex engineering activities with the engineering community',
  'Project Management and Finance: Demonstrate knowledge and understanding of engineering and management principles',
  'Life-Long Learning: Recognize the need for, and have the preparation and ability to engage in independent and lifelong learning'
];

const peoDescriptions = [
  'Successful career in industry/academia/research with strong technical competence',
  'Ability to provide engineering solutions to real world problems',
  'Leadership qualities with effective communication skills',
  'Continuous learning attitude for professional development',
  'Ethical and professional approach in engineering practice',
  'Entrepreneurial mindset and innovation capabilities',
  'Global perspective and cross-cultural competence',
  'Social responsibility and environmental awareness'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName: string, lastName: string, domain: string = 'obeportal.com'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 99)}@${domain}`;
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

async function createColleges() {
  console.log('🏫 Creating colleges...');
  
  const colleges = [
    {
      name: 'Institute of Technology and Engineering',
      code: 'ITE',
      description: 'Premier engineering institution focused on technical education and research'
    },
    {
      name: 'School of Business and Management',
      code: 'SBM',
      description: 'Leading business school offering comprehensive management programs'
    },
    {
      name: 'College of Pharmaceutical Sciences',
      code: 'CPS',
      description: 'Specialized institution for pharmaceutical education and research'
    }
  ];

  for (const college of colleges) {
    await db.college.create({ data: college });
  }
  
  console.log(`✅ Created ${colleges.length} colleges`);
  return await db.college.findMany();
}

async function createDepartments(colleges: any[]) {
  console.log('📚 Creating departments...');
  
  const departments = [
    { name: 'Computer Science Engineering', code: 'CSE', collegeId: colleges[0].id, description: 'Department of Computer Science and Engineering' },
    { name: 'Mechanical Engineering', code: 'ME', collegeId: colleges[0].id, description: 'Department of Mechanical Engineering' },
    { name: 'Electrical Engineering', code: 'EE', collegeId: colleges[0].id, description: 'Department of Electrical Engineering' },
    { name: 'Civil Engineering', code: 'CE', collegeId: colleges[0].id, description: 'Department of Civil Engineering' },
    { name: 'Business Administration', code: 'BA', collegeId: colleges[1].id, description: 'Department of Business Administration' },
    { name: 'Accounting and Finance', code: 'AF', collegeId: colleges[1].id, description: 'Department of Accounting and Finance' },
    { name: 'Marketing', code: 'MKT', collegeId: colleges[1].id, description: 'Department of Marketing' },
    { name: 'Pharmaceutical Chemistry', code: 'PC', collegeId: colleges[2].id, description: 'Department of Pharmaceutical Chemistry' },
    { name: 'Pharmacology', code: 'PH', collegeId: colleges[2].id, description: 'Department of Pharmacology' },
    { name: 'Pharmaceutics', code: 'PX', collegeId: colleges[2].id, description: 'Department of Pharmaceutics' }
  ];

  for (const dept of departments) {
    await db.department.create({ data: dept });
  }
  
  console.log(`✅ Created ${departments.length} departments`);
  return await db.department.findMany();
}

async function createPrograms(colleges: any[], departments: any[]) {
  console.log('🎓 Creating programs...');
  
  const programs = [
    { name: 'Bachelor of Computer Science Engineering', code: 'BCSE', collegeId: colleges[0].id, departmentId: departments[0].id, duration: 4, description: '4-year undergraduate program in Computer Science Engineering' },
    { name: 'Bachelor of Mechanical Engineering', code: 'BME', collegeId: colleges[0].id, departmentId: departments[1].id, duration: 4, description: '4-year undergraduate program in Mechanical Engineering' },
    { name: 'Bachelor of Electrical Engineering', code: 'BEE', collegeId: colleges[0].id, departmentId: departments[2].id, duration: 4, description: '4-year undergraduate program in Electrical Engineering' },
    { name: 'Bachelor of Civil Engineering', code: 'BCE', collegeId: colleges[0].id, departmentId: departments[3].id, duration: 4, description: '4-year undergraduate program in Civil Engineering' },
    { name: 'Master of Computer Science Engineering', code: 'MCSE', collegeId: colleges[0].id, departmentId: departments[0].id, duration: 2, description: '2-year postgraduate program in Computer Science Engineering' },
    { name: 'Master of Mechanical Engineering', code: 'MME', collegeId: colleges[0].id, departmentId: departments[1].id, duration: 2, description: '2-year postgraduate program in Mechanical Engineering' },
    { name: 'Bachelor of Business Administration', code: 'BBA', collegeId: colleges[1].id, departmentId: departments[4].id, duration: 3, description: '3-year undergraduate program in Business Administration' },
    { name: 'Master of Business Administration', code: 'MBA', collegeId: colleges[1].id, departmentId: departments[4].id, duration: 2, description: '2-year postgraduate program in Business Administration' },
    { name: 'Bachelor of Commerce', code: 'BCOM', collegeId: colleges[1].id, departmentId: departments[5].id, duration: 3, description: '3-year undergraduate program in Commerce' },
    { name: 'Bachelor of Pharmacy', code: 'BPHARM', collegeId: colleges[2].id, departmentId: departments[7].id, duration: 4, description: '4-year undergraduate program in Pharmacy' },
    { name: 'Master of Pharmacy', code: 'MPHARM', collegeId: colleges[2].id, departmentId: departments[8].id, duration: 2, description: '2-year postgraduate program in Pharmacy' },
    { name: 'Doctor of Pharmacy', code: 'DPHARM', collegeId: colleges[2].id, departmentId: departments[7].id, duration: 6, description: '6-year doctoral program in Pharmacy' }
  ];

  for (const program of programs) {
    await db.program.create({ data: program });
  }
  
  console.log(`✅ Created ${programs.length} programs`);
  return await db.program.findMany();
}

async function createBatches(programs: any[]) {
  console.log('📅 Creating batches...');
  
  const currentYear = new Date().getFullYear();
  const batches: any[] = [];

  for (const program of programs) {
    // Create multiple batches for each program
    for (let i = 0; i < 3; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + program.duration;
      
      batches.push({
        name: `${startYear}-${endYear}`,
        programId: program.id,
        startYear,
        endYear
      });
    }
  }

  for (const batch of batches) {
    await db.batch.create({ data: batch });
  }
  
  console.log(`✅ Created ${batches.length} batches`);
  return await db.batch.findMany({ include: { program: true } });
}

async function createUsers(colleges: any[], departments: any[], programs: any[], batches: any[]) {
  console.log('👥 Creating users...');
  
  const users: any[] = [];
  
  // Admin users
  users.push({
    email: 'admin@obeportal.com',
    password: 'admin123',
    name: 'System Administrator',
    role: UserRole.ADMIN,
    isActive: true
  });

  users.push({
    email: 'university@obeportal.com',
    password: 'university123',
    name: 'University Administrator',
    role: UserRole.UNIVERSITY,
    isActive: true
  });

  // Department heads
  for (const dept of departments) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    users.push({
      email: generateEmail(firstName, lastName),
      password: 'dept123',
      name: `${firstName} ${lastName}`,
      role: UserRole.DEPARTMENT,
      collegeId: dept.collegeId,
      departmentId: dept.id,
      isActive: true
    });
  }

  // Program coordinators
  for (const program of programs) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    
    users.push({
      email: generateEmail(firstName, lastName),
      password: 'pc123',
      name: `${firstName} ${lastName}`,
      role: UserRole.PROGRAM_COORDINATOR,
      collegeId: program.collegeId,
      departmentId: program.departmentId,
      programId: program.id,
      isActive: true
    });
  }

  // Teachers
  for (let i = 0; i < 20; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const program = getRandomElement(programs);
    
    users.push({
      email: generateEmail(firstName, lastName),
      password: 'teacher123',
      name: `${firstName} ${lastName}`,
      role: UserRole.TEACHER,
      collegeId: program.collegeId,
      departmentId: program.departmentId,
      programId: program.id,
      isActive: true
    });
  }

  // Students
  for (const batch of batches) {
    const studentCount = getRandomNumber(30, 80);
    
    for (let i = 0; i < studentCount; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      
      users.push({
        email: generateEmail(firstName, lastName),
        password: 'student123',
        name: `${firstName} ${lastName}`,
        role: UserRole.STUDENT,
        collegeId: batch.program.collegeId,
        departmentId: batch.program.departmentId,
        programId: batch.programId,
        batchId: batch.id,
        isActive: true
      });
    }
  }

  for (const user of users) {
    await db.user.create({ data: user });
  }
  
  console.log(`✅ Created ${users.length} users`);
  return await db.user.findMany();
}

async function createPOsAndPEOs(programs: any[]) {
  console.log('📋 Creating POs and PEOs...');
  
  // Create POs for each program
  for (const program of programs) {
    for (let i = 0; i < 12; i++) {
      await db.pO.create({
        data: {
          programId: program.id,
          code: `PO${i + 1}`,
          description: poDescriptions[i]
        }
      });
    }
  }

  // Create PEOs for each program
  for (const program of programs) {
    const peoCount = getRandomNumber(4, 6);
    for (let i = 0; i < peoCount; i++) {
      await db.pEO.create({
        data: {
          programId: program.id,
          code: `PEO${i + 1}`,
          description: peoDescriptions[i]
        }
      });
    }
  }
  
  console.log('✅ Created POs and PEOs');
}

async function createCourses(batches: any[]) {
  console.log('📚 Creating courses...');
  
  const courses: any[] = [];
  
  for (const batch of batches) {
    const courseCount = getRandomNumber(6, 12);
    const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const maxSemester = batch.program.duration * 2;
    
    for (let i = 0; i < courseCount; i++) {
      const coursePrefix = getRandomElement(courseCodes);
      const courseNumber = getRandomNumber(100, 499);
      const semester = semesters[getRandomNumber(0, maxSemester - 1)];
      
      const course = {
        code: `${coursePrefix}${courseNumber}`,
        name: getRandomElement(courseNames),
        batchId: batch.id,
        semester,
        description: `Comprehensive course on ${getRandomElement(courseNames).toLowerCase()} for ${semester} semester students`
      };
      
      courses.push(course);
    }
  }

  for (const course of courses) {
    await db.course.create({ data: course });
  }
  
  console.log(`✅ Created ${courses.length} courses`);
  return await db.course.findMany({ include: { batch: { include: { program: true } } } });
}

async function createCOs(courses: any[]) {
  console.log('🎯 Creating COs...');
  
  for (const course of courses) {
    const coCount = getRandomNumber(3, 6);
    
    for (let i = 0; i < coCount; i++) {
      await db.cO.create({
        data: {
          courseId: course.id,
          code: `CO${i + 1}`,
          description: getRandomElement(coDescriptions)
        }
      });
    }
  }
  
  console.log('✅ Created COs');
}

async function createAssessments(courses: any[]) {
  console.log('📝 Creating assessments...');
  
  const assessmentTypes = ['exam', 'quiz', 'assignment', 'project', 'lab'];
  const assessmentNames = [
    'Mid-term Examination', 'Final Examination', 'Quiz 1', 'Quiz 2', 'Assignment 1',
    'Assignment 2', 'Project Work', 'Lab Assessment', 'Internal Assessment', 'External Assessment'
  ];

  for (const course of courses) {
    const assessmentCount = getRandomNumber(3, 6);
    
    for (let i = 0; i < assessmentCount; i++) {
      await db.assessment.create({
        data: {
          courseId: course.id,
          name: getRandomElement(assessmentNames),
          type: getRandomElement(assessmentTypes),
          maxMarks: getRandomNumber(50, 100),
          weightage: getRandomNumber(10, 30) * 0.01,
          semester: course.semester
        }
      });
    }
  }
  
  console.log('✅ Created assessments');
}

async function createCOPOMappings() {
  console.log('🔗 Creating CO-PO mappings...');
  
  const courses = await db.course.findMany({ include: { batch: { include: { program: true } } } });
  
  for (const course of courses) {
    const cos = await db.cO.findMany({ where: { courseId: course.id } });
    const pos = await db.pO.findMany({ where: { programId: course.batch.programId } });
    
    for (const co of cos) {
      // Map each CO to 2-4 POs
      const mappingCount = getRandomNumber(2, 4);
      const selectedPOs: any[] = [];
      
      for (let i = 0; i < mappingCount; i++) {
        let po;
        do {
          po = getRandomElement(pos);
        } while (selectedPOs.includes(po.id));
        
        selectedPOs.push(po.id);
        
        await db.cOPOMapping.create({
          data: {
            courseId: course.id,
            coId: co.id,
            poId: po.id,
            level: getRandomNumber(1, 3)
          }
        });
      }
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
    
    for (const course of courses) {
      // Enroll 70-90% of students in each course
      const enrollmentCount = Math.floor(students.length * getRandomNumber(70, 90) / 100);
      const selectedStudents: any[] = [];
      
      for (let i = 0; i < enrollmentCount; i++) {
        let student;
        do {
          student = getRandomElement(students);
        } while (selectedStudents.includes(student.id));
        
        selectedStudents.push(student.id);
        
        await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: student.id,
            semester: course.semester
          }
        });
      }
    }
  }
  
  console.log('✅ Created enrollments');
}

async function main() {
  try {
    console.log('🚀 Starting database population...\n');
    
    await clearDatabase();
    
    const colleges = await createColleges();
    const departments = await createDepartments(colleges);
    const programs = await createPrograms(colleges, departments);
    const batches = await createBatches(programs);
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
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await db.$disconnect();
  }
}

main();