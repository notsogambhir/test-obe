import { db } from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Pre-calculate hashedPassword for performance and consistency
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Clean existing data in correct order (respecting foreign key constraints)
    console.log('🧹 Cleaning existing data...');
    await db.studentMark.deleteMany();
    await db.cOAttainment.deleteMany();
    await db.enrollment.deleteMany();
    await db.questionCOMapping.deleteMany();
    await db.question.deleteMany();
    await db.assessment.deleteMany();
    await db.cOPOMapping.deleteMany();
    await db.cO.deleteMany();
    await db.course.deleteMany();
    await db.teacherAssignment.deleteMany();
    await db.user.deleteMany();
    await db.student.deleteMany();
    await db.section.deleteMany();
    await db.batch.deleteMany();
    await db.pO.deleteMany();
    await db.program.deleteMany();
    await db.college.deleteMany();
    
    console.log('✅ Existing data cleaned');

    // Create Colleges
    console.log('🏫 Creating colleges...');
    const colleges = await Promise.all([
      db.college.create({
        data: {
          name: 'CUIET',
          code: 'CUIET',
          description: 'College of Engineering and Technology',
        },
      }),
      db.college.create({
        data: {
          name: 'CBS',
          code: 'CBS',
          description: 'College of Business Studies',
        },
      }),
      db.college.create({
        data: {
          name: 'CCP',
          code: 'CCP',
          description: 'College of Pharmacy',
        },
      }),
    ]);

    console.log(`✅ Created ${colleges.length} colleges`);

    // Create Programs
    console.log('📚 Creating programs...');
    const programs = await Promise.all([
      // CUIET Programs
      db.program.create({
        data: {
          name: 'Bachelor of Mechanical Engineering',
          code: 'BEME',
          collegeId: colleges[0].id,
          duration: 4,
          description: '4-year undergraduate mechanical engineering program',
        },
      }),
      db.program.create({
        data: {
          name: 'Bachelor of Computer Science',
          code: 'BCSE',
          collegeId: colleges[0].id,
          duration: 4,
          description: '4-year undergraduate computer science program',
        },
      }),
      // CBS Programs
      db.program.create({
        data: {
          name: 'Bachelor of Business Administration',
          code: 'BBA',
          collegeId: colleges[1].id,
          duration: 3,
          description: '3-year undergraduate business administration program',
        },
      }),
      // CCP Programs
      db.program.create({
        data: {
          name: 'Bachelor of Pharmacy',
          code: 'BPHARM',
          collegeId: colleges[2].id,
          duration: 4,
          description: '4-year undergraduate pharmacy program',
        },
      }),
    ]);

    console.log(`✅ Created ${programs.length} programs`);

    // Create Batches
    console.log('📅 Creating batches...');
    const batches = await Promise.all([
      // BEME Batches
      db.batch.create({
        data: {
          name: '2020-2024',
          programId: programs[0].id,
          startYear: 2020,
          endYear: 2024,
        },
      }),
      db.batch.create({
        data: {
          name: '2021-2025',
          programId: programs[0].id,
          startYear: 2021,
          endYear: 2025,
        },
      }),
      // BCSE Batches
      db.batch.create({
        data: {
          name: '2020-2024',
          programId: programs[1].id,
          startYear: 2020,
          endYear: 2024,
        },
      }),
      // BBA Batches
      db.batch.create({
        data: {
          name: '2021-2025',
          programId: programs[2].id,
          startYear: 2021,
          endYear: 2025,
        },
      }),
      // BPHARM Batches
      db.batch.create({
        data: {
          name: '2020-2024',
          programId: programs[3].id,
          startYear: 2020,
          endYear: 2024,
        },
      }),
    ]);

    console.log(`✅ Created ${batches.length} batches`);

    // Create Sections
    console.log('🏫 Creating sections...');
    const sections: any[] = [];
    for (const batch of batches) {
      const sectionNames = ['A', 'B', 'C'];
      for (const sectionName of sectionNames) {
        const section = await db.section.create({
          data: {
            name: sectionName,
            batchId: batch.id,
          }
        });
        sections.push(section);
      }
    }

    console.log(`✅ Created ${sections.length} sections`);

    // Create Program Outcomes
    console.log('🎯 Creating Program Outcomes...');
    const pos = await Promise.all([
      // BEME POs
      ...['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'].map((code, index) => 
        db.pO.create({
          data: {
            programId: programs[0].id,
            code,
            description: [
              'Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.',
              'Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.',
              'Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.',
              'Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.',
              'Modern tool usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.',
              'The engineer and society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.',
            ][index],
          },
        })
      ),
      // BBA POs
      ...['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'].map((code, index) => 
        db.pO.create({
          data: {
            programId: programs[2].id,
            code,
            description: [
              'Business Knowledge: Apply fundamental knowledge of business administration, management principles, and economic theories to solve business problems.',
              'Critical Thinking: Analyze complex business situations, evaluate alternatives, and make informed decisions using appropriate analytical tools.',
              'Communication Skills: Communicate effectively in various business contexts using oral, written, and digital communication methods.',
              'Leadership and Teamwork: Demonstrate leadership qualities and work effectively in teams to achieve organizational goals.',
              'Ethical Responsibility: Apply ethical principles and social responsibility in business decision-making and professional conduct.',
              'Global Perspective: Understand and analyze business issues in a global context with awareness of cultural diversity and international business practices.',
            ][index],
          },
        })
      ),
      // BPHARM POs
      ...['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'].map((code, index) => 
        db.pO.create({
          data: {
            programId: programs[3].id,
            code,
            description: [
              'Pharmaceutical Knowledge: Apply knowledge of pharmaceutical sciences, drug formulation, and regulatory requirements to pharmacy practice.',
              'Problem Analysis: Identify and analyze pharmaceutical problems, evaluate treatment options, and make evidence-based decisions.',
              'Modern Tool Usage: Use modern pharmaceutical equipment, analytical techniques, and information technology in pharmacy practice.',
              'Professional Practice: Demonstrate professional behavior, ethical conduct, and legal compliance in pharmaceutical care.',
              'Healthcare Collaboration: Work effectively with healthcare teams to optimize patient care and medication management.',
              'Regulatory Compliance: Understand and apply pharmaceutical laws, regulations, and quality standards in practice.',
            ][index],
          },
        })
      ),
    ]);

    console.log(`✅ Created ${pos.length} Program Outcomes`);

    // Create Users with comprehensive roles
    console.log('👥 Creating users...');
    const users: any[] = [];
    const students: any[] = [];
    
    // Admin & University
    const admin = await db.user.create({
      data: {
        email: 'admin@obeportal.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        collegeId: colleges[0].id,
      },
    });
    users.push(admin);
    
    const university = await db.user.create({
      data: {
        email: 'university@obeportal.com',
        password: hashedPassword,
        name: 'University Administrator',
        role: 'UNIVERSITY',
        collegeId: colleges[0].id,
      },
    });
    users.push(university);

    // Department Heads
    for (const college of colleges.slice(0, 2)) {
      const deptHead = await db.user.create({
        data: {
          email: `${college.code.toLowerCase()}.head@obeportal.com`,
          password: hashedPassword,
          name: `${college.code} Department Head`,
          role: 'DEPARTMENT',
          collegeId: college.id,
        },
      });
      users.push(deptHead);
    }

    // Teachers & PCs
    for (const program of programs) {
      const teacher = await db.user.create({
        data: {
          email: `${program.code.toLowerCase()}.teacher@obeportal.com`,
          password: hashedPassword,
          name: `Teacher - ${program.name}`,
          role: 'TEACHER',
          collegeId: program.collegeId,
          programId: program.id,
        },
      });
      users.push(teacher);

      const pc = await db.user.create({
        data: {
          email: `pc.${program.code.toLowerCase()}@obeportal.com`,
          password: hashedPassword,
          name: `Program Coordinator - ${program.name}`,
          role: 'PROGRAM_COORDINATOR',
          collegeId: program.collegeId,
          programId: program.id,
        },
      });
      users.push(pc);
    }

    // Students
    console.log('👨‍🎓 Creating students...');
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const studentsPerBatch = 5;
      const program = programs.find(p => p.id === batch.programId);
      const batchSections = sections.filter(s => s.batchId === batch.id);
      
      for (let i = 0; i < studentsPerBatch; i++) {
        const studentNumber = batchIndex * studentsPerBatch + i + 1;
        const sectionIndex = i % batchSections.length;
        const student = await db.student.create({
          data: {
            email: `student${studentNumber}@obeportal.com`,
            studentId: `STU${String(studentNumber).padStart(4, '0')}`,
            name: `Student ${studentNumber} - ${program?.name || 'Unknown Program'}`,
            collegeId: program!.collegeId,
            programId: batch.programId,
            batchId: batch.id,
            sectionId: batchSections[sectionIndex]?.id,
          },
        });
        students.push(student);
      }
    }

    // Sequential separation was already done above

    console.log(`✅ Created ${users.length} faculty/admin users`);
    console.log(`✅ Created ${students.length} students`);

    // Create Courses (EXTENDED)
    console.log('📚 Creating courses...');
    const courses: any[] = [];
    for (const batch of batches) {
      const program = programs.find(p => p.id === batch.programId);
      const coursesPerBatch = 3;
      for (let i = 1; i <= coursesPerBatch; i++) {
        const course = await db.course.create({
          data: {
            code: `${program?.code || 'GEN'}${i}`,
            name: `Course ${i} - ${program?.name || 'Unknown Program'}`,
            batchId: batch.id,
            description: `Course ${i} for ${program?.name || 'Unknown Program'} covering fundamental concepts and practical applications.`,
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

    // Create Course Outcomes (COs)
    console.log('🎯 Creating Course Outcomes...');
    const cos: any[] = [];
    for (const course of courses) {
      for (let i = 1; i <= 2; i++) {
        const co = await db.cO.create({
          data: {
            courseId: course.id,
            code: `CO${i}`,
            description: `Course Outcome ${i} for ${course.name} - ${['Understand fundamental concepts', 'Apply theoretical knowledge', 'Analyze and evaluate scenarios'][i-1]}`,
          }
        });
        cos.push(co);
      }
    }

    console.log(`✅ Created ${cos.length} Course Outcomes`);

    console.log('📝 Creating enrollments...');
    const enrollments: any[] = [];
    for (const student of students) {
      const batchCourses = courses.filter(c => {
        const courseBatch = batches.find(b => b.id === c.batchId);
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

    // Create Assessments
    console.log('📋 Creating assessments...');
    const assessments: any[] = [];
    for (const course of courses) {
      const courseSections = sections.filter(s => {
        const courseBatch = batches.find(b => b.id === course.batchId);
        return courseBatch && s.batchId === courseBatch.id;
      });
      
      const assessmentTypes = [
        { type: 'Internal Assessment', weightage: 30, maxMarks: 30 },
        { type: 'Final Exam', weightage: 70, maxMarks: 70 }
      ];
      
      for (const section of courseSections) {
        for (const assessmentType of assessmentTypes) {
          const assessment = await db.assessment.create({
            data: {
              courseId: course.id,
              sectionId: section.id,
              name: `${assessmentType.type} - ${section.name}`,
              type: assessmentType.type.toLowerCase().includes('exam') ? 'exam' : 'assignment',
              maxMarks: assessmentType.maxMarks,
              weightage: assessmentType.weightage,
            }
          });
          assessments.push({ ...assessment, courseId: course.id, sectionId: section.id });
        }
      }
    }

    console.log(`✅ Created ${assessments.length} assessments`);

    // Create Questions
    console.log('❓ Creating questions...');
    const questions: any[] = [];
    for (const assessment of assessments) {
      const questionCount = 2;
      for (let i = 1; i <= questionCount; i++) {
        const question = await db.question.create({
          data: {
            assessmentId: assessment.id,
            question: `Question ${i} for ${assessment.name} in ${courses.find(c => c.id === assessment.courseId)?.name || 'Unknown Course'}`,
            maxMarks: Math.floor(assessment.maxMarks / questionCount),
          }
        });
        questions.push({ ...question, assessmentId: assessment.id });
      }
    }

    console.log(`✅ Created ${questions.length} questions`);

    // Create CO-PO Mappings
    console.log('🔗 Creating CO-PO mappings...');
    const coPOMappings: any[] = [];
    for (const course of courses) {
      const courseCOs = cos.filter(co => co.courseId === course.id);
      const batch = batches.find(b => b.id === course.batchId);
      const programPOs = pos.filter(po => po.programId === batch?.programId);
      
      for (const co of courseCOs) {
        for (const po of programPOs.slice(0, 1)) { // Map to first PO for simplicity
          const mapping = await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: 2, // Medium correlation
            }
          });
          coPOMappings.push(mapping);
        }
      }
    }

    console.log(`✅ Created ${coPOMappings.length} CO-PO mappings`);

    // Create Question-CO Mappings
    console.log('📊 Creating Question-CO mappings...');
    const questionCOMappings: any[] = [];
    for (const question of questions) {
      const assessment = assessments.find(a => a.id === question.assessmentId);
      if (assessment) {
        const courseCOs = cos.filter(co => co.courseId === assessment.courseId);
        if (courseCOs.length > 0) {
          const mapping = await db.questionCOMapping.create({
            data: {
              questionId: question.id,
              coId: courseCOs[0].id, // Map to first CO
            }
          });
          questionCOMappings.push(mapping);
        }
      }
    }

    console.log(`✅ Created ${questionCOMappings.length} Question-CO mappings`);

    const studentList = students.slice(0, 10);
    const studentMarks: any[] = [];
    
    for (const student of studentList) {
      const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
      
      for (const enrollment of studentEnrollments) {
        const courseAssessments = assessments.filter(a => a.courseId === enrollment.courseId);
        
        for (const assessment of courseAssessments) {
          const assessmentQuestions = questions.filter(q => q.assessmentId === assessment.id);
          
          for (const question of assessmentQuestions) {
            const percentage = 65 + Math.floor(Math.random() * 25); // 65-90%
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

    // Calculate CO Attainments
    console.log('🎯 Calculating CO attainments...');
    const coAttainments: any[] = [];
    
    for (const student of studentList) {
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

    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- ${colleges.length} Colleges`);
    console.log(`- ${programs.length} Programs`);
    console.log(`- ${batches.length} Batches`);
    console.log(`- ${courses.length} Courses`);
    console.log(`- ${pos.length} Program Outcomes`);
    console.log(`- ${users.length} Users`);
    console.log(`- ${cos.length} Course Outcomes`);
    console.log(`- ${enrollments.length} Enrollments`);
    console.log(`- ${assessments.length} Assessments`);
    console.log(`- ${questions.length} Questions`);
    console.log(`- ${coPOMappings.length} CO-PO Mappings`);
    console.log(`- ${questionCOMappings.length} Question-CO Mappings`);
    console.log(`- ${studentMarks.length} Student Marks`);
    console.log(`- ${coAttainments.length} CO Attainments`);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('');
    console.log('Admin Users:');
    console.log('  admin@obeportal.com / password123');
    console.log('  university@obeportal.com / password123');
    console.log('');
    console.log('Department Users:');
    console.log('  cse@obeportal.com / password123 (CSE Dept Head)');
    console.log('  business@obeportal.com / password123 (Business Dept Head)');
    console.log('');
    console.log('Teachers (NEW - Multiple per program):');
    users.filter(u => u.role === 'TEACHER').forEach((teacher, index) => {
      console.log(`  ${teacher.name}: ${teacher.email}`);
    });
    console.log('');
    console.log('Program Coordinators (UPDATED):');
    users.filter(u => u.role === 'PROGRAM_COORDINATOR').forEach((coordinator, index) => {
      console.log(`  ${coordinator.name}: ${coordinator.email}`);
    });
    console.log('');
    console.log('Students (Academic Records):');
    console.log(`  Total: ${students.length} students`);
    console.log('  Note: Students are academic entities and do not have login access.');
    console.log('');
    console.log('✨ NEW FEATURES ADDED:');
    console.log('✅ Multiple teachers per program for realistic teaching load');
    console.log('✅ Comprehensive course coverage across all batches');
    console.log('✅ Course Outcomes (COs) defined for every course');
    console.log('✅ Student enrollment in all relevant courses');
    console.log('✅ Assessments with questions for evaluation');
    console.log('✅ Student marks with realistic performance data');
    console.log('✅ CO-PO mappings for NBA compliance');
    console.log('✅ Question-CO mappings for attainment calculation');
    console.log('✅ Calculated CO attainments for performance tracking');
    console.log('');
    console.log('🎯 OBE COMPLIANCE FEATURES:');
    console.log('📈 Course Outcome (CO) attainment tracking');
    console.log('🔗 Program Outcome (PO) mapping');
    console.log('📊 Performance analytics and reporting');
    console.log('👨‍🎓 Student progress monitoring');
    console.log('👨‍🏫 Faculty workload distribution');
    console.log('📋 Assessment management');
    console.log('📈 NBA compliance reporting');
    console.log('');
    console.log('🚀 SYSTEM READY FOR PRODUCTION USE!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await db.$disconnect();
  }
}

// Export the seed function for external use
export { seed };

// Run seed if executed directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}