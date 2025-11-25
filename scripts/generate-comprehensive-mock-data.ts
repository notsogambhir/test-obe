import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Simplified but comprehensive mock data generator
async function generateComprehensiveMockData() {
  try {
    console.log('🚀 Starting comprehensive mock data generation...');
    
    // Get existing data
    const colleges = await db.college.findMany();
    const programs = await db.program.findMany({
      include: { college: true }
    });
    const batches = await db.batch.findMany({
      include: { program: true }
    });
    const pos = await db.pO.findMany();
    
    console.log(`Found ${colleges.length} colleges, ${programs.length} programs, ${batches.length} batches`);
    
    // Clean existing detailed data
    console.log('🧹 Cleaning existing detailed data...');
    await db.studentMark.deleteMany();
    await db.cOAttainment.deleteMany();
    await db.enrollment.deleteMany();
    await db.questionCOMapping.deleteMany();
    await db.question.deleteMany();
    await db.assessment.deleteMany();
    await db.cOPOMapping.deleteMany();
    await db.cO.deleteMany();
    await db.course.deleteMany();
    
    // Remove teachers, students, and coordinators
    await db.user.deleteMany({
      where: {
        role: {
          in: ['TEACHER', 'STUDENT', 'PROGRAM_COORDINATOR']
        }
      }
    });
    
    console.log('✅ Existing detailed data cleaned');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Generate teachers for each program (5 per program)
    console.log('👨‍🏫 Generating teachers...');
    const teacherNames = {
      BEME: ['Dr. Rajesh Kumar', 'Prof. Amit Sharma', 'Dr. Suresh Patel', 'Prof. Vikram Singh', 'Dr. Anand Gupta'],
      BCSE: ['Dr. Priya Nair', 'Prof. Rohit Verma', 'Dr. Sneha Reddy', 'Prof. Karthik Iyer', 'Dr. Anjali Sharma'],
      BBA: ['Dr. Ramesh Kumar', 'Prof. Anita Singh', 'Dr. Vikram Malhotra', 'Prof. Sunita Rao', 'Dr. Rajesh Gupta'],
      BPHARM: ['Dr. Meera Patel', 'Prof. Ashok Kumar', 'Dr. Sneha Desai', 'Prof. Ramesh Iyer', 'Dr. Anjali Nair']
    };
    
    const teachers = [];
    for (const program of programs) {
      const names = teacherNames[program.code as keyof typeof teacherNames] || [];
      for (let i = 0; i < names.length; i++) {
        const teacher = await db.user.create({
          data: {
            email: `${program.code.toLowerCase()}.teacher${i + 1}@obeportal.com`,
            password: hashedPassword,
            name: names[i],
            role: 'TEACHER',
            collegeId: program.collegeId,
            programId: program.id,
          }
        });
        teachers.push(teacher);
      }
    }
    console.log(`✅ Created ${teachers.length} teachers`);
    
    // 2. Generate program coordinators
    console.log('👨‍💼 Generating program coordinators...');
    const coordinatorNames = {
      BEME: 'Dr. Mahesh Kumar',
      BCSE: 'Dr. Priya Sharma',
      BBA: 'Dr. Ramesh Patel',
      BPHARM: 'Dr. Anjali Gupta'
    };
    
    const coordinators = [];
    for (const program of programs) {
      const name = coordinatorNames[program.code as keyof typeof coordinatorNames];
      if (name) {
        const coordinator = await db.user.create({
          data: {
            email: `pc.${program.code.toLowerCase()}@obeportal.com`,
            password: hashedPassword,
            name: name,
            role: 'PROGRAM_COORDINATOR',
            collegeId: program.collegeId,
            programId: program.id,
          }
        });
        coordinators.push(coordinator);
      }
    }
    console.log(`✅ Created ${coordinators.length} program coordinators`);
    
    // 3. Generate courses for each batch
    console.log('📚 Generating courses...');
    const courseData = {
      BEME: [
        { code: 'ME101', name: 'Engineering Mathematics I', type: 'Theory' },
        { code: 'ME102', name: 'Engineering Physics', type: 'Theory' },
        { code: 'ME103', name: 'Engineering Chemistry', type: 'Theory' },
        { code: 'ME104', name: 'Basic Electrical Engineering', type: 'Theory' },
        { code: 'ME105', name: 'Manufacturing Processes', type: 'Theory' },
        { code: 'ME106', name: 'Engineering Graphics', type: 'Practical' },
        { code: 'ME201', name: 'Engineering Mathematics II', type: 'Theory' },
        { code: 'ME202', name: 'Mechanics of Materials', type: 'Theory' },
        { code: 'ME203', name: 'Fluid Mechanics', type: 'Theory' },
        { code: 'ME204', name: 'Thermodynamics', type: 'Theory' }
      ],
      BCSE: [
        { code: 'CS101', name: 'Programming Fundamentals', type: 'Theory' },
        { code: 'CS102', name: 'Digital Logic Design', type: 'Theory' },
        { code: 'CS103', name: 'Data Structures', type: 'Theory' },
        { code: 'CS104', name: 'Computer Organization', type: 'Theory' },
        { code: 'CS105', name: 'Database Systems', type: 'Theory' },
        { code: 'CS106', name: 'Operating Systems', type: 'Theory' },
        { code: 'CS107', name: 'Computer Networks', type: 'Theory' },
        { code: 'CS108', name: 'Software Engineering', type: 'Theory' },
        { code: 'CS109', name: 'Algorithms', type: 'Theory' },
        { code: 'CS110', name: 'Web Programming', type: 'Theory' }
      ],
      BBA: [
        { code: 'BA101', name: 'Business Communication', type: 'Theory' },
        { code: 'BA102', name: 'Financial Accounting', type: 'Theory' },
        { code: 'BA103', name: 'Business Economics', type: 'Theory' },
        { code: 'BA104', name: 'Management Principles', type: 'Theory' },
        { code: 'BA105', name: 'Marketing Management', type: 'Theory' },
        { code: 'BA106', name: 'Human Resource Management', type: 'Theory' },
        { code: 'BA107', name: 'Financial Management', type: 'Theory' },
        { code: 'BA108', name: 'Operations Management', type: 'Theory' },
        { code: 'BA109', name: 'Business Statistics', type: 'Theory' },
        { code: 'BA110', name: 'Entrepreneurship Development', type: 'Theory' }
      ],
      BPHARM: [
        { code: 'PH101', name: 'Pharmaceutical Chemistry', type: 'Theory' },
        { code: 'PH102', name: 'Pharmaceutics', type: 'Theory' },
        { code: 'PH103', name: 'Pharmacognosy', type: 'Theory' },
        { code: 'PH104', name: 'Human Anatomy & Physiology', type: 'Theory' },
        { code: 'PH105', name: 'Biochemistry', type: 'Theory' },
        { code: 'PH106', name: 'Pharmacology', type: 'Theory' },
        { code: 'PH107', name: 'Pharmaceutical Analysis', type: 'Theory' },
        { code: 'PH108', name: 'Industrial Pharmacy', type: 'Theory' },
        { code: 'PH109', name: 'Medicinal Chemistry', type: 'Theory' },
        { code: 'PH110', name: 'Clinical Pharmacy', type: 'Theory' }
      ]
    };
    
    const courses = [];
    for (const batch of batches) {
      const programCode = batch.program.code;
      const programCourses = courseData[programCode as keyof typeof courseData] || [];
      
      // Create 8-10 courses per batch
      const coursesToCreate = programCourses.slice(0, 8 + Math.floor(Math.random() * 3));
      
      for (const courseData of coursesToCreate) {
        const course = await db.course.create({
          data: {
            code: courseData.code,
            name: courseData.name,
            batchId: batch.id,
            description: `${courseData.name} - ${courseData.type} course`,
            status: Math.random() > 0.3 ? 'COMPLETED' : 'ACTIVE',
            targetPercentage: 60.0,
            level1Threshold: 60.0,
            level2Threshold: 75.0,
            level3Threshold: 85.0,
          }
        });
        courses.push({ ...course, programCode });
      }
    }
    console.log(`✅ Created ${courses.length} courses`);
    
    // 4. Generate Course Outcomes (COs)
    console.log('🎯 Generating Course Outcomes...');
    const cos = [];
    for (const course of courses) {
      for (let i = 0; i < 5; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i + 1}`,
            description: `Course Outcome ${i + 1} for ${course.name}`,
          }
        });
        cos.push(co);
      }
    }
    console.log(`✅ Created ${cos.length} Course Outcomes`);
    
    // 5. Generate students
    console.log('👨‍🎓 Generating students...');
    const students = [];
    const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Rohit', 'Anjali', 'Vikram', 'Meera'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair'];
    
    let studentCounter = 1;
    for (const batch of batches) {
      const studentsPerBatch = 20 + Math.floor(Math.random() * 10); // 20-30 students per batch
      
      for (let i = 0; i < studentsPerBatch; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const studentId = `STU${String(studentCounter).padStart(4, '0')}`;
        
        const student = await db.user.create({
          data: {
            email: `student${studentCounter}@obeportal.com`,
            studentId,
            password: hashedPassword,
            name: `${firstName} ${lastName}`,
            role: 'STUDENT',
            collegeId: batch.program.collegeId,
            programId: batch.programId,
            batchId: batch.id,
          }
        });
        students.push({ ...student, batchId: batch.id });
        studentCounter++;
      }
    }
    console.log(`✅ Created ${students.length} students`);
    
    // 6. Generate enrollments
    console.log('📝 Creating enrollments...');
    const enrollments = [];
    for (const student of students) {
      const batchCourses = courses.filter(c => {
        const course = courses.find(course => course.id === c.id);
        return course && batches.find(b => b.id === course.batchId && b.id === student.batchId);
      });
      
      for (const course of batchCourses) {
        const enrollment = await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: student.id,
          }
        });
        enrollments.push(enrollment);
      }
    }
    console.log(`✅ Created ${enrollments.length} enrollments`);
    
    // 7. Generate assessments
    console.log('📋 Generating assessments...');
    const assessments = [];
    for (const course of courses) {
      const assessmentTypes = [
        { type: 'Internal Assessment 1', weightage: 15, maxMarks: 30 },
        { type: 'Mid Semester Exam', weightage: 25, maxMarks: 50 },
        { type: 'Internal Assessment 2', weightage: 15, maxMarks: 30 },
        { type: 'End Semester Exam', weightage: 45, maxMarks: 100 }
      ];
      
      for (const assessmentType of assessmentTypes) {
        const assessment = await db.assessment.create({
          data: {
            courseId: course.id,
            name: assessmentType.type,
            type: assessmentType.type.toLowerCase().includes('exam') ? 'exam' : 'assignment',
            maxMarks: assessmentType.maxMarks,
            weightage: assessmentType.weightage,
          }
        });
        assessments.push({ ...assessment, courseId: course.id, courseCode: course.code });
      }
    }
    console.log(`✅ Created ${assessments.length} assessments`);
    
    // 8. Generate questions
    console.log('❓ Generating questions...');
    const questions = [];
    for (const assessment of assessments) {
      const questionCount = 5; // Reduced for performance
      
      for (let i = 0; i < questionCount; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Q${i + 1} for ${assessment.name}`,
            maxMarks: Math.floor(assessment.maxMarks / questionCount),
          }
        });
        questions.push({ ...question, assessmentId: assessment.id });
      }
    }
    console.log(`✅ Created ${questions.length} questions`);
    
    // 9. Generate CO-PO mappings
    console.log('🔗 Creating CO-PO mappings...');
    const coPOMappings = [];
    for (const course of courses) {
      const courseCOs = cos.filter(co => co.courseId === course.id);
      const batch = batches.find(b => b.id === course.batchId);
      const programPOs = pos.filter(po => po.programId === batch?.programId);
      
      for (const co of courseCOs) {
        const selectedPOs = programPOs
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        
        for (const po of selectedPOs) {
          const mapping = await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: 1 + Math.floor(Math.random() * 3),
            }
          });
          coPOMappings.push(mapping);
        }
      }
    }
    console.log(`✅ Created ${coPOMappings.length} CO-PO mappings`);
    
    // 10. Generate Question-CO mappings
    console.log('📊 Creating Question-CO mappings...');
    const questionCOMappings = [];
    for (const question of questions) {
      const assessment = assessments.find(a => a.id === question.assessmentId);
      if (assessment) {
        const courseCOs = cos.filter(co => co.courseId === assessment.courseId);
        const selectedCO = courseCOs[Math.floor(Math.random() * courseCOs.length)];
        
        if (selectedCO) {
          const mapping = await db.questionCOMapping.create({
            data: {
              questionId: question.id,
              coId: selectedCO.id,
            }
          });
          questionCOMappings.push(mapping);
        }
      }
    }
    console.log(`✅ Created ${questionCOMappings.length} Question-CO mappings`);
    
    // 11. Generate student marks
    console.log('📈 Generating student marks...');
    const studentMarks = [];
    for (const student of students.slice(0, 50)) { // Limit to first 50 students for performance
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            const percentage = 60 + Math.floor(Math.random() * 30); // 60-90%
            const obtainedMarks = Math.floor(question.maxMarks * percentage / 100);
            
            const mark = await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: student.id,
                obtainedMarks,
                maxMarks: question.maxMarks,
                academicYear: '2023-24',
              }
            });
            studentMarks.push(mark);
          }
        }
      }
    }
    console.log(`✅ Created ${studentMarks.length} student marks`);
    
    // 12. Calculate CO attainments
    console.log('🎯 Calculating CO attainments...');
    const coAttainments = [];
    
    for (const student of students.slice(0, 50)) { // Same limit as marks
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseCOs = cos.filter(co => co.courseId === enrollment.courseId);
        
        for (const co of courseCOs) {
          const coQuestions = questionCOMappings
            .filter(qcm => qcm.coId === co.id)
            .map(qcm => questions.find(q => q.id === qcm.questionId))
            .filter(q => q !== undefined);
          
          let totalObtained = 0;
          let totalMax = 0;
          
          for (const question of coQuestions) {
            const mark = studentMarks.find(sm => 
              sm.questionId === question.id && sm.studentId === student.id
            );
            if (mark) {
              totalObtained += mark.obtainedMarks;
              totalMax += mark.maxMarks;
            }
          }
          
          if (totalMax > 0) {
            const percentage = (totalObtained / totalMax) * 100;
            const course = courses.find(c => c.id === enrollment.courseId);
            const targetPercentage = course?.targetPercentage || 60.0;
            
            const attainment = await db.cOAttainment.create({
              data: {
                courseId: enrollment.courseId,
                coId: co.id,
                studentId: student.id,
                percentage,
                metTarget: percentage >= targetPercentage,
                academicYear: '2023-24',
              }
            });
            coAttainments.push(attainment);
          }
        }
      }
    }
    console.log(`✅ Created ${coAttainments.length} CO attainments`);
    
    console.log('\n🎉 Comprehensive mock data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${teachers.length} Teachers created`);
    console.log(`- ${coordinators.length} Program Coordinators created`);
    console.log(`- ${students.length} Students created`);
    console.log(`- ${courses.length} Courses created`);
    console.log(`- ${cos.length} Course Outcomes created`);
    console.log(`- ${assessments.length} Assessments created`);
    console.log(`- ${questions.length} Questions created`);
    console.log(`- ${coPOMappings.length} CO-PO mappings created`);
    console.log(`- ${questionCOMappings.length} Question-CO mappings created`);
    console.log(`- ${studentMarks.length} Student marks created`);
    console.log(`- ${coAttainments.length} CO attainments calculated`);
    console.log(`- ${enrollments.length} Enrollments created`);
    
    console.log('\n🔑 Sample Login Credentials:');
    console.log('\nTeachers (Password: password123):');
    for (const teacher of teachers.slice(0, 5)) {
      console.log(`  ${teacher.name}: ${teacher.email}`);
    }
    
    console.log('\nProgram Coordinators (Password: password123):');
    for (const coordinator of coordinators) {
      console.log(`  ${coordinator.name}: ${coordinator.email}`);
    }
    
    console.log('\nStudents (Password: password123):');
    console.log(`  Students: student1@obeportal.com to student${Math.min(students.length, 50)}@obeportal.com`);
    
  } catch (error) {
    console.error('❌ Error during comprehensive mock data generation:', error);
  } finally {
    await db.$disconnect();
  }
}

generateComprehensiveMockData();