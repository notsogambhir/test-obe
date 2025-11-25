import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function createAdditionalData() {
  try {
    console.log('🚀 Creating additional student and course data...');
    
    // Get existing data
    const programs = await db.program.findMany({
      include: { college: true }
    });
    const batches = await db.batch.findMany({
      include: { program: true }
    });
    
    console.log(`Found ${programs.length} programs, ${batches.length} batches`);
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create more students (20 total per batch)
    console.log('👨‍🎓 Creating additional students...');
    const students = [];
    let studentCounter = 100; // Start from 100 to avoid conflicts
    
    for (const batch of batches) {
      // Count existing students in this batch
      const existingStudentsCount = await db.user.count({
        where: {
          batchId: batch.id,
          role: 'STUDENT'
        }
      });
      
      const studentsToCreate = Math.max(0, 20 - existingStudentsCount);
      
      for (let i = 1; i <= studentsToCreate; i++) {
        const student = await db.user.create({
          data: {
            email: `student${studentCounter}@obeportal.com`,
            studentId: `STU${String(studentCounter).padStart(4, '0')}`,
            password: hashedPassword,
            name: `Student ${existingStudentsCount + i} - ${batch.program.name}`,
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
    console.log(`✅ Created ${students.length} additional students`);
    
    // Get existing courses to avoid duplicates
    const existingCourses = await db.course.findMany({
      include: { batch: true }
    });
    
    // Create more courses (8 total per batch)
    console.log('📚 Creating additional courses...');
    const courses = [];
    
    for (const batch of batches) {
      const existingCoursesCount = existingCourses.filter(c => c.batchId === batch.id).length;
      const coursesToCreate = Math.max(0, 8 - existingCoursesCount);
      
      for (let i = existingCoursesCount + 1; i <= existingCoursesCount + coursesToCreate; i++) {
        const course = await db.course.create({
          data: {
            code: `${batch.program.code}${batch.startYear % 100}0${i}`,
            name: `Course ${i} - ${batch.program.name}`,
            batchId: batch.id,
            description: `Course ${i} for ${batch.program.name} - Advanced topics and practical applications`,
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
    console.log(`✅ Created ${courses.length} additional courses`);
    
    // Create COs for new courses (4 per course)
    console.log('🎯 Creating COs for new courses...');
    const cos = [];
    for (const course of courses) {
      for (let i = 1; i <= 4; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `Course Outcome ${i} for ${course.name} - ${['Understanding fundamental concepts', 'Applying theoretical knowledge', 'Analyzing complex problems', 'Evaluating solutions'][i-1]}`,
          }
        });
        cos.push(co);
      }
    }
    console.log(`✅ Created ${cos.length} COs`);
    
    // Create enrollments for new courses
    console.log('📝 Creating enrollments for new courses...');
    const enrollments = [];
    
    for (const course of courses) {
      // Get all students in the same batch
      const batchStudents = await db.user.findMany({
        where: {
          batchId: course.batchId,
          role: 'STUDENT'
        }
      });
      
      for (const student of batchStudents) {
        // Check if already enrolled
        const existingEnrollment = await db.enrollment.findFirst({
          where: {
            courseId: course.id,
            studentId: student.id
          }
        });
        
        if (!existingEnrollment) {
          const enrollment = await db.enrollment.create({
            data: {
              courseId: course.id,
              studentId: student.id,
            }
          });
          enrollments.push(enrollment);
        }
      }
    }
    console.log(`✅ Created ${enrollments.length} enrollments`);
    
    // Create assessments for new courses
    console.log('📋 Creating assessments for new courses...');
    const assessments = [];
    
    for (const course of courses) {
      // Create 3 assessments per course
      const assessmentTypes = [
        { name: 'Assignment 1', type: 'assignment', maxMarks: 25, weightage: 20 },
        { name: 'Mid Term Exam', type: 'exam', maxMarks: 50, weightage: 30 },
        { name: 'Final Exam', type: 'exam', maxMarks: 100, weightage: 50 }
      ];
      
      for (const assessmentData of assessmentTypes) {
        const assessment = await db.assessment.create({
          data: {
            courseId: course.id,
            name: assessmentData.name,
            type: assessmentData.type,
            maxMarks: assessmentData.maxMarks,
            weightage: assessmentData.weightage,
          }
        });
        assessments.push({ ...assessment, courseId: course.id });
      }
    }
    console.log(`✅ Created ${assessments.length} assessments`);
    
    // Create questions for assessments
    console.log('❓ Creating questions for assessments...');
    const questions = [];
    
    for (const assessment of assessments) {
      const courseCOs = cos.filter(co => {
        const course = courses.find(c => c.id === assessment.courseId);
        return course && co.courseId === course.id;
      });
      
      // Create 4 questions per assessment
      for (let i = 1; i <= 4; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i} for ${assessment.name} - ${['Multiple choice question', 'Short answer question', 'Problem solving question', 'Essay question'][i-1]}`,
            maxMarks: Math.floor(assessment.maxMarks / 4),
          }
        });
        questions.push({ ...question, assessmentId: assessment.id, courseId: assessment.courseId });
      }
    }
    console.log(`✅ Created ${questions.length} questions`);
    
    // Create Question-CO mappings
    console.log('📊 Creating Question-CO mappings...');
    const questionCOMappings = [];
    
    for (const question of questions) {
      const courseCOs = cos.filter(co => co.courseId === question.courseId);
      
      // Map each question to a CO (round-robin)
      const coIndex = (questions.indexOf(question)) % courseCOs.length;
      const selectedCO = courseCOs[coIndex];
      
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
    console.log(`✅ Created ${questionCOMappings.length} Question-CO mappings`);
    
    console.log('\n🎉 Additional data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`- ${students.length} Additional Students`);
    console.log(`- ${courses.length} Additional Courses`);
    console.log(`- ${cos.length} Additional Course Outcomes`);
    console.log(`- ${enrollments.length} Additional Enrollments`);
    console.log(`- ${assessments.length} Additional Assessments`);
    console.log(`- ${questions.length} Additional Questions`);
    console.log(`- ${questionCOMappings.length} Question-CO mappings`);
    
    console.log('\n🔑 Login Credentials (Password: password123):');
    console.log('\nNew Students:');
    for (let i = 0; i < Math.min(5, students.length); i++) {
      console.log(`  ${students[i].email} (${students[i].studentId})`);
    }
    if (students.length > 5) {
      console.log(`  ... and ${students.length - 5} more students`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

createAdditionalData();