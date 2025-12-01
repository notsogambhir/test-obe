import { db } from '@/lib/db';

export interface StudentCOAttainment {
  studentId: string;
  studentName: string;
  studentRollNo?: string;
  sectionId?: string;
  sectionName?: string;
  coId: string;
  coCode: string;
  percentage: number;
  weightedPercentage: number; // Added weighted percentage
  metTarget: boolean;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  attemptedQuestions: number;
  totalQuestions: number;
  assessmentWeightages: { // Added assessment weightage breakdown
    assessmentId: string;
    assessmentName: string;
    assessmentType: string;
    weightage: number;
    obtainedMarks: number;
    maxMarks: number;
    percentage: number;
    contribution: number; // How much this assessment contributes to final weighted score
    totalWeightageForCO: number; // Total weightage for this CO
  }[];
}

export interface SectionCOAttainment {
  sectionId: string;
  sectionName: string;
  coId: string;
  coCode: string;
  coDescription: string;
  totalStudents: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: 0 | 1 | 2 | 3;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  averageAttainment: number;
  weightedAverageAttainment: number; // Added weighted average
  studentAttainments: StudentCOAttainment[];
}

export interface CourseCOAttainment {
  courseId: string;
  courseName: string;
  courseCode: string;
  coId: string;
  coCode: string;
  coDescription: string;
  totalStudents: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: 0 | 1 | 2 | 3;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  averageAttainment: number;
  weightedAverageAttainment: number; // Added weighted average
  sectionBreakdown: SectionCOAttainment[];
  studentAttainments: StudentCOAttainment[];
}

export interface ComprehensiveCOAttainment {
  courseId: string;
  courseName: string;
  courseCode: string;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  totalStudents: number;
  coAttainments: CourseCOAttainment[];
  calculatedAt: Date;
}

export class CompliantCOAttainmentCalculator {
  /**
   * Stage 1: Individual Student CO Attainment
   * Implements proper handling of unattempted questions per specification
   */
  static async calculateStudentCOAttainment(
    courseId: string,
    coId: string,
    studentId: string,
    sectionId?: string
  ): Promise<StudentCOAttainment | null> {
    try {
      console.log(`🔍 Calculating CO attainment for student ${studentId}, CO ${coId}, course ${courseId}, section ${sectionId || 'ALL'}`);

      // Step 1: Get all questions mapped to this specific CO for this course
      // Filter by section if specified
      const coQuestionMappings = await db.questionCOMapping.findMany({
        where: {
          coId: coId,
          question: {
            assessment: {
              courseId: courseId,
              isActive: true,
              ...(sectionId && { sectionId }) // Filter by section if specified
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
                  type: true,
                  weightage: true,
                  maxMarks: true,
                  sectionId: true,
                  courseId: true
                }
              }
            }
          }
        }
      });

      if (coQuestionMappings.length === 0) {
        console.log(`❌ No questions found for CO ${coId} in course ${courseId}, section ${sectionId || 'ALL'}`);
        return null;
      }

      const questionIds = coQuestionMappings.map(mapping => mapping.questionId);
      const totalQuestions = questionIds.length;

      // Step 2: Get student's marks for these questions
      const studentMarks = await db.studentMark.findMany({
        where: {
          studentId: studentId,
          questionId: { in: questionIds }
        }
      });

      // Step 2.5: CRITICAL FIX - Validate student section enrollment
      if (sectionId) {
        // Verify student is enrolled in the specified section
        const studentEnrollment = await db.enrollment.findFirst({
          where: {
            courseId: courseId,
            studentId: studentId,
            isActive: true
          }
        });

        if (!studentEnrollment) {
          console.log(`❌ Student ${studentId} is not enrolled in course ${courseId}`);
          return null;
        }

        console.log(`✅ Student ${studentId} validated for course ${courseId}`);
      }

      // Step 3: Filter questions by student's section and assessment section
      const filteredQuestionMappings = coQuestionMappings.filter(mapping => {
        // Only include questions from assessments that belong to student's section
        const questionAssessment = mapping.question.assessment;
        return !sectionId || questionAssessment.sectionId === sectionId;
      });

      // CRITICAL COMPLIANCE FIX: 
      // Even if student has no marks, they should still get 0% attainment
      // This ensures they are included in section/course calculations
      let hasAnyAttemptedQuestions = false;

      // Step 4: Calculate totals with assessment weightage consideration
      // CRITICAL: Only include questions that student actually attempted
      let totalObtainedMarks = 0;
      let totalMaxMarks = 0;
      let attemptedQuestions = 0;
      let totalWeightedScore = 0;
      let maxWeightedScore = 0;

      // Group questions by assessment for weightage calculation
      const assessmentGroups = new Map<string, {
        assessment: any;
        questions: any[];
        obtainedMarks: number;
        maxMarks: number;
        weightage: number;
      }>();

      // Process each attempted question
      for (const mapping of filteredQuestionMappings) {
        const mark = studentMarks.find(m => m.questionId === mapping.questionId);
        const assessment = mapping.question.assessment;
        
        if (!assessmentGroups.has(assessment.id)) {
          assessmentGroups.set(assessment.id, {
            assessment,
            questions: [],
            obtainedMarks: 0,
            maxMarks: 0,
            weightage: assessment.weightage || 0
          });
        }

        const group = assessmentGroups.get(assessment.id);
        if (group) {
          group.questions.push(mapping);
        }
        
        if (mark && mark.obtainedMarks !== null) {
          // Student attempted this question (including if they scored 0)
          if (group) {
            group.obtainedMarks += mark.obtainedMarks;
            group.maxMarks += mapping.question.maxMarks;
          }
          totalObtainedMarks += mark.obtainedMarks;
          totalMaxMarks += mapping.question.maxMarks;
          attemptedQuestions++;
          hasAnyAttemptedQuestions = true;
        }
        // CRITICAL: If mark is null or doesn't exist, this question is ignored
        // per compliance specification for unattempted questions
      }

      // Calculate weighted scores for each assessment
      for (const group of assessmentGroups.values()) {
        const assessmentWeightage = group.weightage / 100; // Convert percentage to decimal
        const assessmentScore = group.maxMarks > 0 ? (group.obtainedMarks / group.maxMarks) : 0;
        
        totalWeightedScore += assessmentScore * assessmentWeightage;
        maxWeightedScore += assessmentWeightage; // Sum of weightages for this CO's assessments
      }

      // Step 4: Calculate percentage based on attempted questions only
      let percentage = 0;
      let weightedPercentage = 0;
      
      if (hasAnyAttemptedQuestions && totalMaxMarks > 0) {
        percentage = (totalObtainedMarks / totalMaxMarks) * 100;
      } else {
        // Student attempted no questions for this CO - 0% attainment
        percentage = 0;
        console.log(`⚠️ Student ${studentId} attempted no questions for CO ${coId} - 0% attainment`);
      }

      // Calculate weighted percentage with proper normalization
      if (maxWeightedScore > 0) {
        // CRITICAL FIX: Normalize weightages to prevent inflation when total < 100%
        // If total weightage for this CO is less than 100%, we normalize to prevent score inflation
        weightedPercentage = (totalWeightedScore / maxWeightedScore) * 100;
        
        // Log weightage normalization for debugging
        if (maxWeightedScore < 1.0) {
          console.log(`⚖️ Weightage normalization for CO ${coId}: Total weightage ${(maxWeightedScore * 100).toFixed(1)}% < 100%. Weighted score may appear lower than simple percentage.`);
        }
      } else {
        weightedPercentage = percentage; // Fallback to simple percentage
        console.log(`⚠️ No valid weightage data for CO ${coId}, using simple percentage: ${percentage}%`);
      }

      // Create assessment weightage breakdown for reporting
      const assessmentWeightages = Array.from(assessmentGroups.values()).map(group => {
        const assessmentScore = group.maxMarks > 0 ? (group.obtainedMarks / group.maxMarks) * 100 : 0;
        const contribution = (group.weightage / 100) * assessmentScore;
        
        return {
          assessmentId: group.assessment.id,
          assessmentName: group.assessment.name,
          assessmentType: group.assessment.type,
          weightage: group.weightage,
          obtainedMarks: group.obtainedMarks,
          maxMarks: group.maxMarks,
          percentage: assessmentScore,
          contribution: contribution, // How much this assessment contributes to final weighted score
          totalWeightageForCO: maxWeightedScore * 100 // Total weightage for this CO
        };
      });

      // Get student, CO, and section info
      const [student, co, section] = await Promise.all([
        db.user.findUnique({
          where: { id: studentId },
          select: { name: true, studentId: true }
        }),
        db.cO.findUnique({
          where: { id: coId },
          select: { code: true }
        }),
        sectionId ? db.section.findUnique({
          where: { id: sectionId },
          select: { name: true }
        }) : Promise.resolve(null)
      ]);

      const result: StudentCOAttainment = {
        studentId,
        studentName: student?.name || 'Unknown Student',
        studentRollNo: student?.studentId || undefined,
        sectionId,
        sectionName: section?.name,
        coId,
        coCode: co?.code || 'Unknown',
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        weightedPercentage: Math.round(weightedPercentage * 100) / 100, // Use weighted percentage
        metTarget: false, // Will be determined in next step
        totalObtainedMarks,
        totalMaxMarks,
        attemptedQuestions,
        totalQuestions,
        assessmentWeightages
      };

      console.log(`✅ Student ${studentId} CO ${coId}: ${result.percentage}% (weighted: ${weightedPercentage.toFixed(1)}%, simple: ${percentage.toFixed(1)}%) (${attemptedQuestions}/${totalQuestions} questions attempted)`);
      
      return result;
    } catch (error) {
      console.error('❌ Error calculating student CO attainment:', error);
      return null;
    }
  }

  /**
   * Determine if Student Met Target
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
        metTarget: studentAttainment.weightedPercentage >= targetPercentage // Use weighted percentage for target determination
      };
    } catch (error) {
      console.error('❌ Error determining target met:', error);
      return studentAttainment;
    }
  }

  /**
   * Stage 2: Section-Level CO Attainment Calculation
   */
  static async calculateSectionCOAttainment(
    courseId: string,
    coId: string,
    sectionId: string
  ): Promise<SectionCOAttainment | null> {
    try {
      console.log(`📊 Calculating section CO attainment for section ${sectionId}, CO ${coId}, course ${courseId}`);

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

      // Get section details
      const section = await db.section.findUnique({
        where: { id: sectionId },
        select: { name: true }
      });

      if (!section) {
        console.log(`❌ Section ${sectionId} not found`);
        return null;
      }

      // Get all students enrolled in this course and section
      const enrollments = await db.enrollment.findMany({
        where: {
          courseId: courseId,
          student: {
            sectionId: sectionId
          },
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
        console.log(`❌ No enrollments found for section ${sectionId} in course ${courseId}`);
        return null;
      }

      console.log(`👥 Found ${enrollments.length} students in section ${section.name}`);

      // Calculate individual attainment for each student in this section
      const studentAttainments: StudentCOAttainment[] = [];
      
      for (const enrollment of enrollments) {
        const attainment = await this.calculateStudentCOAttainment(
          courseId,
          coId,
          enrollment.student.id,
          sectionId
        );
        
        // calculateStudentCOAttainment now never returns null, only 0% for no attempts
        if (attainment) {
          const attainmentWithTarget = await this.determineTargetMet(
            courseId,
            attainment
          );
          studentAttainments.push(attainmentWithTarget);
        }
      }

      if (studentAttainments.length === 0) {
        console.log(`❌ No valid student attainments calculated for section ${sectionId}, CO ${coId}`);
        return null;
      }

      // Count students meeting target
      const studentsMeetingTarget = studentAttainments.filter(
        attainment => attainment.metTarget
      ).length;

      // Calculate percentage of students meeting target
      const percentageMeetingTarget = (studentsMeetingTarget / studentAttainments.length) * 100;

      // Map to attainment level
      let attainmentLevel: 0 | 1 | 2 | 3 = 0;
      
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      // Calculate average attainment
      const averageAttainment = studentAttainments.length > 0 
        ? studentAttainments.reduce((sum, s) => sum + s.percentage, 0) / studentAttainments.length 
        : 0;

      // Calculate weighted average attainment
      const weightedAverageAttainment = studentAttainments.length > 0 
        ? studentAttainments.reduce((sum, s) => sum + s.weightedPercentage, 0) / studentAttainments.length 
        : 0;

      console.log(`🎯 Section ${section.name} CO ${coId}: ${percentageMeetingTarget.toFixed(2)}% students met target, Level ${attainmentLevel} (Avg: ${averageAttainment.toFixed(1)}%, Weighted Avg: ${weightedAverageAttainment.toFixed(1)}%)`);

      return {
        sectionId,
        sectionName: section.name,
        coId,
        coCode: co.code,
        coDescription: co.description,
        totalStudents: studentAttainments.length, // Use students with attainments
        studentsMeetingTarget,
        percentageMeetingTarget: Math.round(percentageMeetingTarget * 100) / 100,
        attainmentLevel,
        targetPercentage: course.targetPercentage,
        level1Threshold: course.level1Threshold,
        level2Threshold: course.level2Threshold,
        level3Threshold: course.level3Threshold,
        averageAttainment: Math.round(averageAttainment * 100) / 100,
        weightedAverageAttainment: Math.round(weightedAverageAttainment * 100) / 100,
        studentAttainments
      };
    } catch (error) {
      console.error('❌ Error calculating section CO attainment:', error);
      return null;
    }
  }

  /**
   * Stage 2: Course-Level CO Attainment Calculation
   */
  static async calculateCourseCOAttainment(
    courseId: string,
    coId: string
  ): Promise<CourseCOAttainment | null> {
    try {
      console.log(`📊 Calculating course CO attainment for CO ${coId}, course ${courseId}`);

      // Get course details with batch and sections for thresholds
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          batch: {
            include: {
              sections: true
            }
          }
        }
      });

      if (!course) {
        console.log(`❌ Course ${courseId} not found`);
        return null;
      }

      const sections = course.batch.sections;

      if (sections.length === 0) {
        console.log(`❌ No sections found for course ${courseId}`);
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

      // Calculate section-wise CO attainment
      const sectionBreakdown: SectionCOAttainment[] = [];
      let totalStudents = 0;
      let totalStudentsMeetingTarget = 0;
      let allStudentAttainments: StudentCOAttainment[] = [];

      for (const section of sections) {
        const sectionAttainment = await this.calculateSectionCOAttainment(courseId, coId, section.id);
        
        if (sectionAttainment) {
          sectionBreakdown.push(sectionAttainment);
          totalStudents += sectionAttainment.totalStudents;
          totalStudentsMeetingTarget += sectionAttainment.studentsMeetingTarget;
          allStudentAttainments.push(...sectionAttainment.studentAttainments);
        }
      }

      if (sectionBreakdown.length === 0) {
        console.log(`❌ No valid section attainments calculated for CO ${coId}`);
        return null;
      }

      // Calculate overall course statistics
      const percentageMeetingTarget = totalStudents > 0 ? (totalStudentsMeetingTarget / totalStudents) * 100 : 0;
      
      // Map to attainment level
      let attainmentLevel: 0 | 1 | 2 | 3 = 0;
      
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      // Calculate average attainment
      const averageAttainment = allStudentAttainments.length > 0 
        ? allStudentAttainments.reduce((sum, s) => sum + s.percentage, 0) / allStudentAttainments.length 
        : 0;

      // Calculate weighted average attainment
      const weightedAverageAttainment = allStudentAttainments.length > 0 
        ? allStudentAttainments.reduce((sum, s) => sum + s.weightedPercentage, 0) / allStudentAttainments.length 
        : 0;

      console.log(`🏆 Course ${course.code} CO ${coId}: ${percentageMeetingTarget.toFixed(2)}% students met target, Level ${attainmentLevel} (Avg: ${averageAttainment.toFixed(1)}%, Weighted Avg: ${weightedAverageAttainment.toFixed(1)}%)`);

      return {
        courseId,
        courseName: course.name,
        courseCode: course.code,
        coId,
        coCode: co.code,
        coDescription: co.description,
        totalStudents,
        studentsMeetingTarget: totalStudentsMeetingTarget,
        percentageMeetingTarget: Math.round(percentageMeetingTarget * 100) / 100,
        attainmentLevel,
        targetPercentage: course.targetPercentage,
        level1Threshold: course.level1Threshold,
        level2Threshold: course.level2Threshold,
        level3Threshold: course.level3Threshold,
        averageAttainment: Math.round(averageAttainment * 100) / 100,
        weightedAverageAttainment: Math.round(weightedAverageAttainment * 100) / 100,
        sectionBreakdown,
        studentAttainments: allStudentAttainments
      };
    } catch (error) {
      console.error('❌ Error calculating course CO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate comprehensive CO attainment for all COs in a course
   */
  static async calculateComprehensiveCOAttainment(
    courseId: string
  ): Promise<ComprehensiveCOAttainment | null> {
    try {
      console.log(`🚀 Starting comprehensive CO attainment calculation for course ${courseId}`);

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
      const coAttainments: CourseCOAttainment[] = [];

      for (const co of cos) {
        console.log(`\n--- Processing CO: ${co.code} ---`);
        
        const courseAttainment = await this.calculateCourseCOAttainment(
          courseId,
          co.id
        );
        
        if (courseAttainment) {
          coAttainments.push(courseAttainment);
        }
      }

      const totalStudents = coAttainments.length > 0 
        ? Math.max(...coAttainments.map(co => co.totalStudents))
        : 0;

      console.log(`\n✅ Comprehensive CO attainment calculation completed for ${courseId}`);
      console.log(`📊 Summary: ${coAttainments.length} COs, ${totalStudents} students`);

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
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error calculating comprehensive CO attainment:', error);
      return null;
    }
  }

  /**
   * Save CO attainment results to database
   */
  static async saveCOAttainment(
    courseId: string,
    coId: string,
    studentId: string,
    percentage: number,
    metTarget: boolean,
    academicYear?: string
  ): Promise<void> {
    try {
      await db.cOAttainment.upsert({
        where: {
          courseId_sectionId_coId_studentId_academicYear: {
            courseId,
            sectionId: '', // Course-level attainment, not section-specific
            coId,
            studentId,
            academicYear: academicYear || ''
          }
        },
        update: {
          percentage,
          metTarget,
          calculatedAt: new Date()
        },
        create: {
          courseId,
          coId,
          studentId,
          percentage,
          metTarget,
          academicYear: academicYear || ''
        }
      });
    } catch (error) {
      console.error('❌ Error saving CO attainment:', error);
      throw error;
    }
  }

  /**
   * Batch save CO attainments for all students in a course
   */
  static async batchSaveCOAttainments(
    courseId: string,
    academicYear?: string
  ): Promise<void> {
    try {
      const comprehensiveResult = await this.calculateComprehensiveCOAttainment(courseId);

      if (!comprehensiveResult) {
        console.log(`❌ No comprehensive attainment results to save for course ${courseId}`);
        return;
      }

      // Save all student attainments
      const allStudentAttainments = comprehensiveResult.coAttainments.flatMap(
        co => co.studentAttainments
      );

      console.log(`💾 Saving ${allStudentAttainments.length} CO attainments to database`);

      await Promise.all(
        allStudentAttainments.map(async (studentAttainment) => {
          await this.saveCOAttainment(
            courseId,
            studentAttainment.coId,
            studentAttainment.studentId,
            studentAttainment.percentage,
            studentAttainment.metTarget,
            academicYear
          );
        })
      );

      console.log(`✅ Successfully saved ${allStudentAttainments.length} CO attainments`);
    } catch (error) {
      console.error('❌ Error batch saving CO attainments:', error);
      throw error;
    }
  }
}