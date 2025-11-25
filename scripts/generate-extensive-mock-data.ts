import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Comprehensive mock data generator for OBE Portal
async function generateExtensiveMockData() {
  try {
    console.log('🚀 Starting extensive mock data generation...');
    
    // Get existing data
    const colleges = await db.college.findMany();
    const programs = await db.program.findMany({
      include: { college: true }
    });
    const batches = await db.batch.findMany({
      include: { program: true }
    });
    const existingUsers = await db.user.findMany();
    const pos = await db.pO.findMany();
    
    console.log(`Found ${colleges.length} colleges, ${programs.length} programs, ${batches.length} batches`);
    console.log(`Found ${pos.length} Program Outcomes`);
    
    // Clean existing detailed data (keep basic structure)
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
    
    // Keep only admin, university, and department heads, remove teachers and students
    await db.user.deleteMany({
      where: {
        role: {
          in: ['TEACHER', 'STUDENT', 'PROGRAM_COORDINATOR']
        }
      }
    });
    
    console.log('✅ Existing detailed data cleaned');
    
    // Course data for different programs
    const courseData = {
      // BEME (Mechanical Engineering) courses
      BEME: [
        { code: 'ME101', name: 'Engineering Mathematics I', credits: 4, type: 'Theory' },
        { code: 'ME102', name: 'Engineering Physics', credits: 3, type: 'Theory' },
        { code: 'ME103', name: 'Engineering Chemistry', credits: 3, type: 'Theory' },
        { code: 'ME104', name: 'Basic Electrical Engineering', credits: 3, type: 'Theory' },
        { code: 'ME105', name: 'Basic Electronics Engineering', credits: 3, type: 'Theory' },
        { code: 'ME106', name: 'Engineering Graphics', credits: 4, type: 'Practical' },
        { code: 'ME107', name: 'Workshop Practice', credits: 3, type: 'Practical' },
        { code: 'ME108', name: 'Communication Skills', credits: 2, type: 'Theory' },
        { code: 'ME201', name: 'Engineering Mathematics II', credits: 4, type: 'Theory' },
        { code: 'ME202', name: 'Mechanics of Materials', credits: 4, type: 'Theory' },
        { code: 'ME203', name: 'Fluid Mechanics', credits: 4, type: 'Theory' },
        { code: 'ME204', name: 'Thermodynamics', credits: 4, type: 'Theory' },
        { code: 'ME205', name: 'Manufacturing Processes', credits: 4, type: 'Theory' },
        { code: 'ME206', name: 'Engineering Mechanics', credits: 4, type: 'Theory' },
        { code: 'ME207', name: 'Material Science', credits: 3, type: 'Theory' },
        { code: 'ME301', name: 'Heat Transfer', credits: 4, type: 'Theory' },
        { code: 'ME302', name: 'Machine Design I', credits: 4, type: 'Theory' },
        { code: 'ME303', name: 'Fluid Machinery', credits: 4, type: 'Theory' },
        { code: 'ME304', name: 'Industrial Engineering', credits: 3, type: 'Theory' },
        { code: 'ME305', name: 'Automobile Engineering', credits: 3, type: 'Theory' },
        { code: 'ME401', name: 'Machine Design II', credits: 4, type: 'Theory' },
        { code: 'ME402', name: 'Refrigeration & Air Conditioning', credits: 3, type: 'Theory' },
        { code: 'ME403', name: 'CAD/CAM', credits: 3, type: 'Theory' },
        { code: 'ME404', name: 'Project Work', credits: 6, type: 'Project' }
      ],
      // BCSE (Computer Science) courses
      BCSE: [
        { code: 'CS101', name: 'Programming Fundamentals', credits: 4, type: 'Theory' },
        { code: 'CS102', name: 'Digital Logic Design', credits: 4, type: 'Theory' },
        { code: 'CS103', name: 'Discrete Mathematics', credits: 4, type: 'Theory' },
        { code: 'CS104', name: 'Computer Organization', credits: 4, type: 'Theory' },
        { code: 'CS105', name: 'Data Structures', credits: 4, type: 'Theory' },
        { code: 'CS106', name: 'Web Programming', credits: 3, type: 'Theory' },
        { code: 'CS107', name: 'Database Systems', credits: 4, type: 'Theory' },
        { code: 'CS108', name: 'Operating Systems', credits: 4, type: 'Theory' },
        { code: 'CS201', name: 'Algorithms', credits: 4, type: 'Theory' },
        { code: 'CS202', name: 'Computer Networks', credits: 4, type: 'Theory' },
        { code: 'CS203', name: 'Software Engineering', credits: 3, type: 'Theory' },
        { code: 'CS204', name: 'Theory of Computation', credits: 4, type: 'Theory' },
        { code: 'CS205', name: 'Microprocessors', credits: 4, type: 'Theory' },
        { code: 'CS206', name: 'Cloud Computing', credits: 3, type: 'Theory' },
        { code: 'CS301', name: 'Artificial Intelligence', credits: 4, type: 'Theory' },
        { code: 'CS302', name: 'Machine Learning', credits: 4, type: 'Theory' },
        { code: 'CS303', name: 'Cyber Security', credits: 3, type: 'Theory' },
        { code: 'CS304', name: 'Big Data Analytics', credits: 3, type: 'Theory' },
        { code: 'CS305', name: 'Mobile Application Development', credits: 3, type: 'Theory' },
        { code: 'CS401', name: 'Distributed Systems', credits: 4, type: 'Theory' },
        { code: 'CS402', name: 'Compiler Design', credits: 4, type: 'Theory' },
        { code: 'CS403', name: 'Blockchain Technology', credits: 3, type: 'Theory' },
        { code: 'CS404', name: 'Capstone Project', credits: 6, type: 'Project' }
      ],
      // BBA (Business Administration) courses
      BBA: [
        { code: 'BA101', name: 'Business Communication', credits: 3, type: 'Theory' },
        { code: 'BA102', name: 'Business Mathematics', credits: 3, type: 'Theory' },
        { code: 'BA103', name: 'Financial Accounting', credits: 4, type: 'Theory' },
        { code: 'BA104', name: 'Business Economics', credits: 4, type: 'Theory' },
        { code: 'BA105', name: 'Management Principles', credits: 3, type: 'Theory' },
        { code: 'BA106', name: 'Business Law', credits: 3, type: 'Theory' },
        { code: 'BA107', name: 'Marketing Management', credits: 4, type: 'Theory' },
        { code: 'BA108', name: 'Human Resource Management', credits: 4, type: 'Theory' },
        { code: 'BA201', name: 'Financial Management', credits: 4, type: 'Theory' },
        { code: 'BA202', name: 'Operations Management', credits: 4, type: 'Theory' },
        { code: 'BA203', name: 'Business Statistics', credits: 3, type: 'Theory' },
        { code: 'BA204', name: 'Entrepreneurship Development', credits: 3, type: 'Theory' },
        { code: 'BA205', name: 'International Business', credits: 3, type: 'Theory' },
        { code: 'BA206', name: 'Business Analytics', credits: 3, type: 'Theory' },
        { code: 'BA301', name: 'Strategic Management', credits: 4, type: 'Theory' },
        { code: 'BA302', name: 'Supply Chain Management', credits: 3, type: 'Theory' },
        { code: 'BA303', name: 'Digital Marketing', credits: 3, type: 'Theory' },
        { code: 'BA304', name: 'Project Management', credits: 3, type: 'Theory' },
        { code: 'BA305', name: 'Business Ethics', credits: 2, type: 'Theory' },
        { code: 'BA401', name: 'Leadership Development', credits: 3, type: 'Theory' },
        { code: 'BA402', name: 'Innovation Management', credits: 3, type: 'Theory' },
        { code: 'BA403', name: 'Business Research Project', credits: 6, type: 'Project' }
      ],
      // BPHARM (Pharmacy) courses
      BPHARM: [
        { code: 'PH101', name: 'Pharmaceutical Chemistry', credits: 4, type: 'Theory' },
        { code: 'PH102', name: 'Pharmaceutics', credits: 4, type: 'Theory' },
        { code: 'PH103', name: 'Pharmacognosy', credits: 4, type: 'Theory' },
        { code: 'PH104', name: 'Human Anatomy & Physiology', credits: 4, type: 'Theory' },
        { code: 'PH105', name: 'Biochemistry', credits: 4, type: 'Theory' },
        { code: 'PH106', name: 'Pharmaceutical Analysis', credits: 3, type: 'Theory' },
        { code: 'PH107', name: 'Computer Applications', credits: 2, type: 'Theory' },
        { code: 'PH108', name: 'Communication Skills', credits: 2, type: 'Theory' },
        { code: 'PH201', name: 'Pharmacology', credits: 4, type: 'Theory' },
        { code: 'PH202', name: 'Pharmaceutical Engineering', credits: 4, type: 'Theory' },
        { code: 'PH203', name: 'Industrial Pharmacy', credits: 4, type: 'Theory' },
        { code: 'PH204', name: 'Medicinal Chemistry', credits: 4, type: 'Theory' },
        { code: 'PH205', name: 'Pharmacovigilance', credits: 3, type: 'Theory' },
        { code: 'PH206', name: 'Regulatory Affairs', credits: 3, type: 'Theory' },
        { code: 'PH301', name: 'Pharmaceutical Biotechnology', credits: 4, type: 'Theory' },
        { code: 'PH302', name: 'Clinical Pharmacy', credits: 4, type: 'Theory' },
        { code: 'PH303', name: 'Pharmaceutical Marketing', credits: 3, type: 'Theory' },
        { code: 'PH304', name: 'Quality Assurance', credits: 3, type: 'Theory' },
        { code: 'PH305', name: 'Hospital Pharmacy', credits: 3, type: 'Theory' },
        { code: 'PH401', name: 'Pharmaceutical Formulation', credits: 4, type: 'Theory' },
        { code: 'PH402', name: 'Drug Design', credits: 3, type: 'Theory' },
        { code: 'PH403', name: 'Pharmacy Practice Project', credits: 6, type: 'Project' }
      ]
    };
    
    // Generate teachers for each program
    console.log('👨‍🏫 Generating teachers...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const teacherNames = {
      BEME: ['Dr. Rajesh Kumar', 'Prof. Amit Sharma', 'Dr. Suresh Patel', 'Prof. Vikram Singh', 'Dr. Anand Gupta'],
      BCSE: ['Dr. Priya Nair', 'Prof. Rohit Verma', 'Dr. Sneha Reddy', 'Prof. Karthik Iyer', 'Dr. Anjali Sharma'],
      BBA: ['Dr. Ramesh Kumar', 'Prof. Anita Singh', 'Dr. Vikram Malhotra', 'Prof. Sunita Rao', 'Dr. Rajesh Gupta'],
      BPHARM: ['Dr. Meera Patel', 'Prof. Ashok Kumar', 'Dr. Sneha Desai', 'Prof. Ramesh Iyer', 'Dr. Anjali Nair']
    };
    
    const teachers = [];
    for (const program of programs) {
      const programCode = program.code;
      const names = teacherNames[programCode as keyof typeof teacherNames] || [];
      
      for (let i = 0; i < names.length; i++) {
        const teacher = await db.user.create({
          data: {
            email: `${programCode.toLowerCase()}.teacher${i + 1}@obeportal.com`,
            password: hashedPassword,
            name: names[i],
            role: 'TEACHER',
            collegeId: program.collegeId,
            programId: program.id,
          }
        });
        teachers.push({ ...teacher, programCode });
      }
    }
    
    console.log(`✅ Created ${teachers.length} teachers`);
    
    // Generate program coordinators
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
    
    // Generate courses for each batch
    console.log('📚 Generating courses...');
    const courses = [];
    let courseIndex = 1;
    
    for (const batch of batches) {
      const programCode = batch.program.code;
      const programCourses = courseData[programCode as keyof typeof courseData] || [];
      
      // Distribute courses across years (1st year: 8 courses, 2nd year: 6 courses, 3rd year: 5 courses, 4th year: 4 courses)
      const year = Math.floor((courseIndex - 1) / programCourses.length * 4) + 1;
      let coursesInYear = 0;
      
      switch (year) {
        case 1: coursesInYear = 8; break;
        case 2: coursesInYear = 6; break;
        case 3: coursesInYear = 5; break;
        case 4: coursesInYear = 4; break;
      }
      
      const startIndex = (year - 1) * coursesInYear;
      const endIndex = Math.min(startIndex + coursesInYear, programCourses.length);
      
      for (let i = startIndex; i < endIndex && i < programCourses.length; i++) {
        const courseData = programCourses[i];
        const status = year < 4 ? 'COMPLETED' : 'ACTIVE';
        
        const course = await db.course.create({
          data: {
            code: courseData.code,
            name: courseData.name,
            batchId: batch.id,
            description: `${courseData.name} - ${courseData.type} course for ${courseData.credits} credits`,
            status,
            targetPercentage: 60.0,
            level1Threshold: 60.0,
            level2Threshold: 75.0,
            level3Threshold: 85.0,
          }
        });
        courses.push({ ...course, programCode, courseData });
      }
    }
    
    console.log(`✅ Created ${courses.length} courses`);
    
    // Generate Course Outcomes (COs)
    console.log('🎯 Generating Course Outcomes...');
    const coTemplates = {
      Theory: [
        'Understand the fundamental concepts and principles',
        'Apply theoretical knowledge to solve practical problems',
        'Analyze and evaluate complex scenarios',
        'Design solutions for engineering problems',
        'Integrate knowledge from multiple domains'
      ],
      Practical: [
        'Demonstrate hands-on skills in laboratory experiments',
        'Operate equipment safely and efficiently',
        'Interpret experimental data accurately',
        'Document experimental procedures and results',
        'Troubleshoot common technical issues'
      ],
      Project: [
        'Plan and execute complex projects',
        'Work effectively in team environments',
        'Communicate project outcomes clearly',
        'Apply interdisciplinary knowledge',
        'Demonstrate leadership and initiative'
      ]
    };
    
    const cos = [];
    for (const course of courses) {
      const templates = coTemplates[course.courseData.type as keyof typeof coTemplates] || coTemplates.Theory;
      
      for (let i = 0; i < 5; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i + 1}`,
            description: `${templates[i]} of ${course.name}`,
          }
        });
        cos.push(co);
      }
    }
    
    console.log(`✅ Created ${cos.length} Course Outcomes`);
    
    // Generate students for each batch
    console.log('👨‍🎓 Generating students...');
    const students = [];
    const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Rohit', 'Anjali', 'Vikram', 'Meera', 'Karthik', 'Sunita', 
                       'Ramesh', 'Anita', 'Suresh', 'Priyanka', 'Vijay', 'Deepika', 'Arun', 'Kavita', 'Manish', 'Neha'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Verma', 'Malhotra',
                      'Rao', 'Desai', 'Joshi', 'Mehta', 'Shah', 'Pillai', 'Menon', 'Chatterjee', 'Mukherjee', 'Banerjee'];
    
    let studentCounter = 1;
    for (const batch of batches) {
      const studentsPerBatch = 30 + Math.floor(Math.random() * 20); // 30-50 students per batch
      
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
    
    // Generate enrollments
    console.log('📝 Creating enrollments...');
    const enrollments = [];
    for (const student of students) {
      const batchCourses = courses.filter(c => {
        const courseBatch = batches.find(b => b.id === c.id);
        return courseBatch && courseBatch.id === student.batchId;
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
    
    // Generate assessments for each course
    console.log('📋 Generating assessments...');
    const assessments = [];
    for (const course of courses) {
      const assessmentTypes = [
        { type: 'Internal Assessment 1', weightage: 10, maxMarks: 30 },
        { type: 'Internal Assessment 2', weightage: 10, maxMarks: 30 },
        { type: 'Mid Semester Exam', weightage: 20, maxMarks: 50 },
        { type: 'Internal Assessment 3', weightage: 10, maxMarks: 30 },
        { type: 'End Semester Exam', weightage: 50, maxMarks: 100 }
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
    
    // Generate questions for assessments
    console.log('❓ Generating questions...');
    const questions = [];
    for (const assessment of assessments) {
      const questionCount = assessment.type === 'exam' ? 10 : 5;
      
      for (let i = 0; i < questionCount; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i + 1} for ${assessment.name} in ${assessment.courseCode}`,
            maxMarks: Math.floor(assessment.maxMarks / questionCount),
          }
        });
        questions.push({ ...question, assessmentId: assessment.id });
      }
    }
    
    console.log(`✅ Created ${questions.length} questions`);
    
    // Generate CO-PO mappings
    console.log('🔗 Creating CO-PO mappings...');
    const coPOMappings = [];
    for (const course of courses) {
      const courseCOs = cos.filter(co => co.courseId === course.id);
      const programPOs = pos.filter(po => po.programId === batches.find(b => b.id === course.batchId)?.programId);
      
      for (const co of courseCOs) {
        // Map each CO to 2-3 POs with correlation levels
        const selectedPOs = programPOs
          .sort(() => Math.random() - 0.5)
          .slice(0, 2 + Math.floor(Math.random() * 2));
        
        for (const po of selectedPOs) {
          const mapping = await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: 1 + Math.floor(Math.random() * 3), // 1-3 correlation level
            }
          });
          coPOMappings.push(mapping);
        }
      }
    }
    
    console.log(`✅ Created ${coPOMappings.length} CO-PO mappings`);
    
    // Generate Question-CO mappings
    console.log('📊 Creating Question-CO mappings...');
    const questionCOMappings = [];
    for (const question of questions) {
      const assessment = assessments.find(a => a.id === question.assessmentId);
      if (assessment) {
        const courseCOs = cos.filter(co => co.courseId === assessment.courseId);
        const selectedCOs = courseCOs.slice(0, 1 + Math.floor(Math.random() * 2));
        
        for (const co of selectedCOs) {
          const mapping = await db.questionCOMapping.create({
            data: {
              questionId: question.id,
              coId: co.id,
            }
          });
          questionCOMappings.push(mapping);
        }
      }
    }
    
    console.log(`✅ Created ${questionCOMappings.length} Question-CO mappings`);
    
    // Generate student marks
    console.log('📈 Generating student marks...');
    const studentMarks = [];
    for (const student of students) {
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            // Generate realistic marks (normal distribution around 70%)
            const percentage = Math.min(100, Math.max(0, 70 + (Math.random() - 0.5) * 40));
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
    
    // Calculate CO attainments
    console.log('🎯 Calculating CO attainments...');
    const coAttainments = [];
    
    for (const student of students) {
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseCOs = cos.filter(co => co.courseId === enrollment.courseId);
        
        for (const co of courseCOs) {
          // Calculate marks obtained for questions mapped to this CO
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
    
    console.log('\n🎉 Extensive mock data generation completed successfully!');
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
    
    console.log('\n🔑 New Login Credentials:');
    console.log('\nTeachers (Password: password123):');
    for (const teacher of teachers.slice(0, 10)) {
      console.log(`  ${teacher.name}: ${teacher.email}`);
    }
    console.log(`  ... and ${teachers.length - 10} more teachers`);
    
    console.log('\nProgram Coordinators (Password: password123):');
    for (const coordinator of coordinators) {
      console.log(`  ${coordinator.name}: ${coordinator.email}`);
    }
    
    console.log('\nStudents (Password: password123):');
    console.log(`  Students: student1@obeportal.com to student${students.length}@obeportal.com`);
    
  } catch (error) {
    console.error('❌ Error during extensive mock data generation:', error);
  } finally {
    await db.$disconnect();
  }
}

generateExtensiveMockData();