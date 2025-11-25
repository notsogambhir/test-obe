import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function quickMockDataGeneration() {
  try {
    console.log('🚀 Quick mock data generation...');
    
    // Get existing data
    const programs = await db.program.findMany({
      include: { college: true }
    });
    const batches = await db.batch.findMany({
      include: { program: true }
    });
    const pos = await db.pO.findMany();
    
    console.log(`Found ${programs.length} programs, ${batches.length} batches`);
    
    // Clean data
    console.log('🧹 Cleaning data...');
    await db.studentMark.deleteMany();
    await db.cOAttainment.deleteMany();
    await db.enrollment.deleteMany();
    await db.questionCOMapping.deleteMany();
    await db.question.deleteMany();
    await db.assessment.deleteMany();
    await db.cOPOMapping.deleteMany();
    await db.cO.deleteMany();
    await db.course.deleteMany();
    await db.user.deleteMany({
      where: {
        role: {
          in: ['TEACHER', 'STUDENT', 'PROGRAM_COORDINATOR']
        }
      }
    });
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Generate teachers (2 per program)
    console.log('👨‍🏫 Creating teachers...');
    const teachers = [];
    for (const program of programs) {
      for (let i = 1; i <= 2; i++) {
        const teacher = await db.user.create({
          data: {
            email: `${program.code.toLowerCase()}.teacher${i}@obeportal.com`,
            password: hashedPassword,
            name: `Teacher ${i} - ${program.name}`,
            role: 'TEACHER',
            collegeId: program.collegeId,
            programId: program.id,
          }
        });
        teachers.push(teacher);
      }
    }
    console.log(`✅ Created ${teachers.length} teachers`);
    
    // Generate program coordinators
    console.log('👨‍💼 Creating program coordinators...');
    const coordinators = [];
    for (const program of programs) {
      const coordinator = await db.user.create({
        data: {
          email: `pc.${program.code.toLowerCase()}@obeportal.com`,
          password: hashedPassword,
          name: `Program Coordinator - ${program.name}`,
          role: 'PROGRAM_COORDINATOR',
          collegeId: program.collegeId,
          programId: program.id,
        }
      });
      coordinators.push(coordinator);
    }
    console.log(`✅ Created ${coordinators.length} coordinators`);
    
    // Generate courses (5 per batch)
    console.log('📚 Creating courses...');
    const courses = [];
    for (const batch of batches) {
      for (let i = 1; i <= 5; i++) {
        const course = await db.course.create({
          data: {
            code: `${batch.program.code}${batch.startYear % 100}0${i}`,
            name: `Course ${i} - ${batch.program.name}`,
            batchId: batch.id,
            description: `Course ${i} for ${batch.program.name}`,
            status: 'ACTIVE',
            targetPercentage: 60.0,
            level1Threshold: 60.0,
            level2Threshold: 75.0,
            level3Threshold: 85.0,
          }
        });
        courses.push(course);
      }
    }
    console.log(`✅ Created ${courses.length} courses`);
    
    // Generate COs (3 per course)
    console.log('🎯 Creating COs...');
    const cos = [];
    for (const course of courses) {
      for (let i = 1; i <= 3; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `Course Outcome ${i} for ${course.name}`,
          }
        });
        cos.push(co);
      }
    }
    console.log(`✅ Created ${cos.length} COs`);
    
    // Generate students (10 per batch)
    console.log('👨‍🎓 Creating students...');
    const students = [];
    let studentCounter = 1;
    for (const batch of batches) {
      for (let i = 1; i <= 10; i++) {
        const student = await db.user.create({
          data: {
            email: `student${studentCounter}@obeportal.com`,
            studentId: `STU${String(studentCounter).padStart(4, '0')}`,
            password: hashedPassword,
            name: `Student ${i} - ${batch.program.name}`,
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
    
    // Generate assessments (2 per course)
    console.log('📋 Creating assessments...');
    const assessments = [];
    for (const course of courses) {
      for (let i = 1; i <= 2; i++) {
        const assessment = await db.assessment.create({
          data: {
            courseId: course.id,
            name: `Assessment ${i}`,
            type: i === 1 ? 'assignment' : 'exam',
            maxMarks: i === 1 ? 30 : 70,
            weightage: i === 1 ? 30 : 70,
          }
        });
        assessments.push({ ...assessment, courseId: course.id });
      }
    }
    console.log(`✅ Created ${assessments.length} assessments`);
    
    // Generate questions (3 per assessment)
    console.log('❓ Creating questions...');
    const questions = [];
    for (const assessment of assessments) {
      for (let i = 1; i <= 3; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i} for ${assessment.name}`,
            maxMarks: Math.floor(assessment.maxMarks / 3),
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
      const batch = batches.find(b => b.id === course.batchId);
      const programPOs = pos.filter(po => po.programId === batch?.programId);
      
      for (const co of courseCOs) {
        for (const po of programPOs.slice(0, 2)) {
          const mapping = await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: 2,
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
        const selectedCO = courseCOs[0];
        
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
    
    // Generate student marks (for first 20 students)
    console.log('📈 Creating student marks...');
    const studentMarks = [];
    for (const student of students.slice(0, 20)) {
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            const percentage = 65 + Math.floor(Math.random() * 25);
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
    
    for (const student of students.slice(0, 20)) {
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
    
    console.log('\n🎉 Quick mock data generation completed!');
    console.log('\n📊 Summary:');
    console.log(`- ${teachers.length} Teachers`);
    console.log(`- ${coordinators.length} Program Coordinators`);
    console.log(`- ${students.length} Students`);
    console.log(`- ${courses.length} Courses`);
    console.log(`- ${cos.length} Course Outcomes`);
    console.log(`- ${assessments.length} Assessments`);
    console.log(`- ${questions.length} Questions`);
    console.log(`- ${coPOMappings.length} CO-PO mappings`);
    console.log(`- ${questionCOMappings.length} Question-CO mappings`);
    console.log(`- ${studentMarks.length} Student marks`);
    console.log(`- ${coAttainments.length} CO attainments`);
    console.log(`- ${enrollments.length} Enrollments`);
    
    console.log('\n🔑 Login Credentials (Password: password123):');
    console.log('\nTeachers:');
    for (const teacher of teachers.slice(0, 4)) {
      console.log(`  ${teacher.email}`);
    }
    
    console.log('\nProgram Coordinators:');
    for (const coordinator of coordinators) {
      console.log(`  ${coordinator.email}`);
    }
    
    console.log('\nStudents:');
    console.log(`  student1@obeportal.com to student${students.length}@obeportal.com`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

quickMockDataGeneration();