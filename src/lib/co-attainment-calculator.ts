import { db } from '@/lib/db';

export interface StudentCOAttainment {
  studentId: string;
  studentName: string;
  coId: string;
  coCode: string;
  percentage: number;
  metTarget: boolean;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  attemptedQuestions: number;
  totalQuestions: number;
}

export interface ClassCOAttainment {
  coId: string;
  coCode: string;
  coDescription: string;
  totalStudents: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: number; // 0, 1, 2, or 3
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

export interface COAttainmentSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  totalStudents: number;
  coAttainments: ClassCOAttainment[];
  studentAttainments: StudentCOAttainment[];
  calculatedAt: Date;
}

export class COAttainmentCalculator {
  /**
   * Stage 1: Calculate Individual Student CO Attainment
   * This follows the exact logic described:
   * 1. Get all questions mapped to the specific CO
   * 2. Get student's marks for ONLY attempted questions
   * 3. Ignore unattempted questions completely (not treated as zero)
   * 4. Calculate percentage based on attempted questions only
   */
  static async calculateStudentCOAttainment(
    courseId: string,
    coId: string,
    studentId: string
  ): Promise<StudentCOAttainment | null> {
    try {
      console.log(`🔍 Calculating CO attainment for student ${studentId}, CO ${coId}, course ${courseId}`);

      // Step 1: Get all questions mapped to this specific CO for this course
      const coQuestionMappings = await db.questionCOMapping.findMany({
        where: {
          coId: coId,
          question: {
            assessment: {
              courseId: courseId
            }
          }
        },
        include: {
          question: {
            include: {
              assessment: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              }
            }
          }
        }
      });

      if (coQuestionMappings.length === 0) {
        console.log(`❌ No questions found for CO ${coId} in course ${courseId}`);
        return null;
      }

      const questionIds = coQuestionMappings.map(mapping => mapping.questionId);
      const totalQuestions = questionIds.length;

      // Step 2: Get student's marks for these questions (only attempted ones)
      const studentMarks = await db.studentMark.findMany({
        where: {
          studentId: studentId,
          questionId: {
            in: questionIds
          }
        }
      });

      if (studentMarks.length === 0) {
        console.log(`⚠️ No marks found for student ${studentId} for CO ${coId} questions`);
        // This means student attempted no questions for this CO
        return null;
      }

      // Step 3: Calculate totals for ATTEMPTED questions only
      let totalObtainedMarks = 0;
      let totalMaxMarks = 0;
      let attemptedQuestions = 0;

      // Process each attempted question
      for (const mark of studentMarks) {
        // Only include marks that are not null (null means unattempted)
        if (mark.obtainedMarks !== null) {
          totalObtainedMarks += mark.obtainedMarks;
          totalMaxMarks += mark.maxMarks;
          attemptedQuestions++;
        }
      }

      // Step 4: Calculate percentage based on attempted questions only
      if (totalMaxMarks === 0) {
        console.log(`❌ No maximum marks found for student ${studentId} in CO ${coId}`);
        return null;
      }

      const percentage = (totalObtainedMarks / totalMaxMarks) * 100;

      // Get student and CO info
      const [student, co] = await Promise.all([
        db.user.findUnique({
          where: { id: studentId },
          select: { name: true, studentId: true }
        }),
        db.cO.findUnique({
          where: { id: coId },
          select: { code: true }
        })
      ]);

      const result = {
        studentId,
        studentName: student?.name || 'Unknown Student',
        coId,
        coCode: co?.code || 'Unknown',
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        metTarget: false, // Will be determined in next step
        totalObtainedMarks,
        totalMaxMarks,
        attemptedQuestions,
        totalQuestions
      };

      console.log(`✅ Student ${studentId} CO ${coId}: ${result.percentage}% (${attemptedQuestions}/${totalQuestions} questions attempted)`);
      
      return result;
    } catch (error) {
      console.error('❌ Error calculating student CO attainment:', error);
      return null;
    }
  }

  /**
   * Step 2: Determine if Student Met Target
   * Compares individual student's percentage with course target
   */
  static async determineTargetMet(
    courseId: string,
    studentAttainment: StudentCOAttainment
  ): Promise<StudentCOAttainment> {
    try {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { targetPercentage: true }
      });

      const targetPercentage = course?.targetPercentage || 50.0;
      
      return {
        ...studentAttainment,
        metTarget: studentAttainment.percentage >= targetPercentage
      };
    } catch (error) {
      console.error('❌ Error determining target met:', error);
      return studentAttainment;
    }
  }

  /**
   * Stage 2: Overall Course CO Attainment Calculation
   * Step A: Calculate Percentage of Students Who Met Target
   */
  static async calculateClassCOAttainment(
    courseId: string,
    coId: string,
    filters?: {
      section?: string;
      academicYear?: string;
    }
  ): Promise<ClassCOAttainment | null> {
    try {
      console.log(`📊 Calculating class CO attainment for CO ${coId}, course ${courseId}`);

      // Get course details for thresholds
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: {
          targetPercentage: true,
          level1Threshold: true,
          level2Threshold: true,
          level3Threshold: true
        }
      });

      if (!course) {
        console.log(`❌ Course ${courseId} not found`);
        return null;
      }

      // Get CO details
      const co = await db.cO.findUnique({
        where: { id: coId },
        select: {
          code: true,
          description: true
        }
      });

      if (!co) {
        console.log(`❌ CO ${coId} not found`);
        return null;
      }

      // Get all enrolled students for this course
      const enrollments = await db.enrollment.findMany({
        where: {
          courseId: courseId,
          isActive: true
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentId: true
            }
          }
        }
      });

      if (enrollments.length === 0) {
        console.log(`❌ No enrollments found for course ${courseId}`);
        return null;
      }

      console.log(`👥 Found ${enrollments.length} enrolled students`);

      // Calculate individual attainment for each student
      const studentAttainments: StudentCOAttainment[] = [];
      
      for (const enrollment of enrollments) {
        const attainment = await this.calculateStudentCOAttainment(
          courseId,
          coId,
          enrollment.student.id
        );
        
        if (attainment) {
          const attainmentWithTarget = await this.determineTargetMet(
            courseId,
            attainment
          );
          studentAttainments.push(attainmentWithTarget);
        }
      }

      if (studentAttainments.length === 0) {
        console.log(`❌ No valid student attainments calculated for CO ${coId}`);
        return null;
      }

      console.log(`📈 Calculated attainments for ${studentAttainments.length} students`);

      // Count students meeting target
      const studentsMeetingTarget = studentAttainments.filter(
        attainment => attainment.metTarget
      ).length;

      // Step A: Calculate percentage of students meeting target
      const percentageMeetingTarget = (studentsMeetingTarget / studentAttainments.length) * 100;

      console.log(`🎯 ${studentsMeetingTarget}/${studentAttainments.length} students met target (${percentageMeetingTarget.toFixed(2)}%)`);

      // Step B: Map success rate to final attainment level (buckets)
      let attainmentLevel = 0;
      
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      console.log(`🏆 Final attainment level: ${attainmentLevel}`);

      return {
        coId,
        coCode: co.code,
        coDescription: co.description,
        totalStudents: studentAttainments.length,
        studentsMeetingTarget,
        percentageMeetingTarget: Math.round(percentageMeetingTarget * 100) / 100,
        attainmentLevel,
        targetPercentage: course.targetPercentage,
        level1Threshold: course.level1Threshold,
        level2Threshold: course.level2Threshold,
        level3Threshold: course.level3Threshold
      };
    } catch (error) {
      console.error('❌ Error calculating class CO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate attainment for all COs in a course
   */
  static async calculateCourseAttainment(
    courseId: string,
    filters?: {
      section?: string;
      academicYear?: string;
    }
  ): Promise<COAttainmentSummary | null> {
    try {
      console.log(`🚀 Starting course attainment calculation for course ${courseId}`);

      // Get course details
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          name: true,
          code: true,
          targetPercentage: true,
          level1Threshold: true,
          level2Threshold: true,
          level3Threshold: true
        }
      });

      if (!course) {
        console.log(`❌ Course ${courseId} not found`);
        return null;
      }

      // Get all COs for this course
      const cos = await db.cO.findMany({
        where: {
          courseId: courseId,
          isActive: true
        },
        orderBy: { code: 'asc' }
      });

      if (cos.length === 0) {
        console.log(`❌ No COs found for course ${courseId}`);
        return null;
      }

      console.log(`📚 Found ${cos.length} COs for course ${courseId}`);

      // Calculate attainment for each CO
      const coAttainments: ClassCOAttainment[] = [];
      const allStudentAttainments: StudentCOAttainment[] = [];

      for (const co of cos) {
        console.log(`\n--- Processing CO: ${co.code} ---`);
        
        const classAttainment = await this.calculateClassCOAttainment(
          courseId,
          co.id,
          filters
        );
        
        if (classAttainment) {
          coAttainments.push(classAttainment);
        }

        // Also get individual student attainments for this CO
        const enrollments = await db.enrollment.findMany({
          where: {
            courseId: courseId,
            isActive: true
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                studentId: true
              }
            }
          }
        });

        for (const enrollment of enrollments) {
          const studentAttainment = await this.calculateStudentCOAttainment(
            courseId,
            co.id,
            enrollment.student.id
          );
          
          if (studentAttainment) {
            const attainmentWithTarget = await this.determineTargetMet(
              courseId,
              studentAttainment
            );
            allStudentAttainments.push(attainmentWithTarget);
          }
        }
      }

      const totalStudents = new Set(allStudentAttainments.map(a => a.studentId)).size;

      console.log(`\n✅ Course attainment calculation completed for ${courseId}`);
      console.log(`📊 Summary: ${coAttainments.length} COs, ${totalStudents} students, ${allStudentAttainments.length} total attainments`);

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        targetPercentage: course.targetPercentage,
        level1Threshold: course.level1Threshold,
        level2Threshold: course.level2Threshold,
        level3Threshold: course.level3Threshold,
        totalStudents,
        coAttainments,
        studentAttainments: allStudentAttainments,
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error calculating course attainment:', error);
      return null;
    }
  }

  /**
   * Save calculated attainments to database
   */
  static async saveAttainments(
    courseId: string,
    studentAttainments: StudentCOAttainment[],
    academicYear?: string
  ): Promise<void> {
    try {
      console.log(`💾 Saving ${studentAttainments.length} attainments to database`);

      const data = studentAttainments.map(attainment => ({
        courseId,
        coId: attainment.coId,
        studentId: attainment.studentId,
        percentage: attainment.percentage,
        metTarget: attainment.metTarget,
        academicYear: academicYear || '2023-24'
      }));

      // Use upsert to handle duplicates
      await Promise.all(
        data.map(item =>
          db.cOAttainment.upsert({
            where: {
              courseId_sectionId_coId_studentId_academicYear: {
                courseId: item.courseId,
                sectionId: '', // Course-level attainment, not section-specific
                coId: item.coId,
                studentId: item.studentId,
                academicYear: item.academicYear
              }
            },
            update: {
              percentage: item.percentage,
              metTarget: item.metTarget,
              calculatedAt: new Date()
            },
            create: {
              ...item,
              calculatedAt: new Date()
            }
          })
        )
      );

      console.log(`✅ Successfully saved ${data.length} attainments`);
    } catch (error) {
      console.error('❌ Error saving attainments:', error);
      throw error;
    }
  }

  /**
   * Generate detailed report for a specific CO
   */
  static async generateCOReport(
    courseId: string,
    coId: string
  ): Promise<{
    classAttainment: ClassCOAttainment | null;
    studentBreakdown: StudentCOAttainment[];
    examples: {
      standardCase?: StudentCOAttainment;
      unattemptedCase?: StudentCOAttainment;
    };
  } | null> {
    try {
      const classAttainment = await this.calculateClassCOAttainment(courseId, coId);
      
      if (!classAttainment) {
        return null;
      }

      // Get detailed student breakdown
      const enrollments = await db.enrollment.findMany({
        where: { courseId, isActive: true },
        include: {
          student: { select: { id: true, name: true } }
        }
      });

      const studentBreakdown: StudentCOAttainment[] = [];
      
      for (const enrollment of enrollments) {
        const attainment = await this.calculateStudentCOAttainment(
          courseId,
          coId,
          enrollment.student.id
        );
        
        if (attainment) {
          const withTarget = await this.determineTargetMet(courseId, attainment);
          studentBreakdown.push(withTarget);
        }
      }

      // Find examples for documentation
      const examples = {
        standardCase: studentBreakdown.find(s => s.attemptedQuestions === s.totalQuestions && s.metTarget),
        unattemptedCase: studentBreakdown.find(s => s.attemptedQuestions < s.totalQuestions)
      };

      return {
        classAttainment,
        studentBreakdown,
        examples
      };
    } catch (error) {
      console.error('❌ Error generating CO report:', error);
      return null;
    }
  }
}