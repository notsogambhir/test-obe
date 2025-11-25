import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Fast and simple mock data generation
async function generateFastMockData() {
  try {
    console.log('🚀 Fast mock data generation...');
    
    const programs = await db.program.findMany({ include: { college: true } });
    const batches = await db.batch.findMany({ include: { program: true } });
    const pos = await db.pO.findMany();
    
    // Clean data
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
      where: { role: { in: ['TEACHER', 'STUDENT', 'PROGRAM_COORDINATOR'] } }
    });
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Teachers (1 per program)
    console.log('Creating teachers...');
    const teachers = [];
    for (const program of programs) {
      const teacher = await db.user.create({
        data: {
          email: `teacher.${program.code.toLowerCase()}@obeportal.com`,
          password: hashedPassword,
          name: `Teacher - ${program.name}`,
          role: 'TEACHER',
          collegeId: program.collegeId,
          programId: program.id,
        }
      });
      teachers.push(teacher);
    }
    
    // Program coordinators
    console.log('Creating coordinators...');
    const coordinators = [];
    for (const program of programs) {
      const coordinator = await db.user.create({
        data: {
          email: `pc.${program.code.toLowerCase()}@obeportal.com`,
          password: hashedPassword,
          name: `PC - ${program.name}`,
          role: 'PROGRAM_COORDINATOR',
          collegeId: program.collegeId,
          programId: program.id,
        }
      });
      coordinators.push(coordinator);
    }
    
    // Courses (3 per batch)
    console.log('Creating courses...');
    const courses = [];
    for (const batch of batches) {
      for (let i = 1; i <= 3; i++) {
        const course = await db.course.create({
          data: {
            code: `${batch.program.code}${i}`,
            name: `Course ${i} - ${batch.program.name}`,
            batchId: batch.id,
            status: 'ACTIVE',
            targetPercentage: 60.0,
          }
        });
        courses.push(course);
      }
    }
    
    // COs (2 per course)
    console.log('Creating COs...');
    const cos = [];
    for (const course of courses) {
      for (let i = 1; i <= 2; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `CO${i} for ${course.name}`,
          }
        });
        cos.push(co);
      }
    }
    
    // Students (5 per batch)
    console.log('Creating students...');
    const students = [];
    let studentCounter = 1;
    for (const batch of batches) {
      for (let i = 1; i <= 5; i++) {
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
    
    // Enrollments
    console.log('Creating enrollments...');
    for (const student of students) {
      const batchCourses = courses.filter(c => 
        batches.find(b => b.id === c.batchId && b.id === student.batchId)
      );
      
      for (const course of batchCourses) {
        await db.enrollment.create({
          data: { courseId: course.id, studentId: student.id }
        });
      }
    }
    
    // Assessments (1 per course)
    console.log('Creating assessments...');
    const assessments = [];
    for (const course of courses) {
      const assessment = await db.assessment.create({
        data: {
          courseId: course.id,
          name: 'Final Exam',
          type: 'exam',
          maxMarks: 100,
          weightage: 100,
        }
      });
      assessments.push({ ...assessment, courseId: course.id });
    }
    
    // Questions (2 per assessment)
    console.log('Creating questions...');
    const questions = [];
    for (const assessment of assessments) {
      for (let i = 1; i <= 2; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i}`,
            maxMarks: 50,
          }
        });
        questions.push({ ...question, assessmentId: assessment.id });
      }
    }
    
    // CO-PO mappings
    console.log('Creating CO-PO mappings...');
    for (const course of courses) {
      const courseCOs = cos.filter(co => co.courseId === course.id);
      const batch = batches.find(b => b.id === course.batchId);
      const programPOs = pos.filter(po => po.programId === batch?.programId);
      
      for (const co of courseCOs) {
        for (const po of programPOs.slice(0, 1)) {
          await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: 2,
            }
          });
        }
      }
    }
    
    // Question-CO mappings
    console.log('Creating Question-CO mappings...');
    for (const question of questions) {
      const assessment = assessments.find(a => a.id === question.assessmentId);
      if (assessment) {
        const courseCOs = cos.filter(co => co.courseId === assessment.courseId);
        if (courseCOs.length > 0) {
          await db.questionCOMapping.create({
            data: {
              questionId: question.id,
              coId: courseCOs[0].id,
            }
          });
        }
      }
    }
    
    // Student marks (first 10 students)
    console.log('Creating student marks...');
    for (const student of students.slice(0, 10)) {
      const studentEnrollments = await db.enrollment.findMany({
        where: { studentId: student.id }
      });
      
      for (const enrollment of studentEnrollments) {
        const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            const obtainedMarks = 35 + Math.floor(Math.random() * 10); // 35-45 marks
            await db.studentMark.create({
              data: {
                questionId: question.id,
                studentId: student.id,
                obtainedMarks,
                maxMarks: question.maxMarks,
                academicYear: '2023-24',
              }
            });
          }
        }
      }
    }
    
    console.log('✅ Fast mock data generation completed!');
    console.log(`Created: ${teachers.length} teachers, ${coordinators.length} coordinators, ${students.length} students, ${courses.length} courses, ${cos.length} COs, ${assessments.length} assessments, ${questions.length} questions`);
    
    console.log('\n🔑 Login Credentials (password: password123):');
    console.log('Teachers:');
    teachers.forEach(t => console.log(`  ${t.email}`));
    console.log('Program Coordinators:');
    coordinators.forEach(c => console.log(`  ${c.email}`));
    console.log('Students:');
    console.log(`  student1@obeportal.com to student${students.length}@obeportal.com`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

generateFastMockData();