import { db } from '@/lib/db';

export interface EnhancedStudentCOAttainment {
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
  sectionId?: string;
  sectionName?: string;
  weightedScore: number;
  maxWeightedScore: number;
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
  attainmentLevel: number; // 0, 1, 2, or 3
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  averageAttainment: number;
  weightedAverageAttainment: number;
  totalAssessments: number;
  assessmentWeightages: {
    assessmentId: string;
    assessmentName: string;
    assessmentType: string;
    weightage: number;
    maxMarks: number;
  }[];
}

export interface EnhancedClassCOAttainment {
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
  sectionBreakdown: SectionCOAttainment[];
  averageAttainment: number;
  weightedAverageAttainment: number;
}

export class EnhancedCOAttainmentCalculator {
  /**
   * Enhanced Student CO Attainment Calculation with Assessment Weightage
   * This considers assessment weightages and provides section-level breakdown
   */
  static async calculateEnhancedStudentCOAttainment(
    courseId: string,
    coId: string,
    studentId: string,
    sectionId?: string
  ): Promise<EnhancedStudentCOAttainment | null> {
    try {
      console.log(`🔍 Enhanced CO calculation for student ${studentId}, CO ${coId}, course ${courseId}, section ${sectionId || 'ALL'}`);

      // Step 1: Get all questions mapped to this specific CO for this course
      // Filter by section if specified
      const coQuestionMappings = await db.questionCOMapping.findMany({
        where: {
          coId: coId,
          question: {
            assessment: {
              courseId: courseId,
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
                  sectionId: true
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

      // Step 2: Get student's marks for these questions (only attempted ones)
      const studentMarks = await db.studentMark.findMany({
        where: {
          studentId: studentId,
          questionId: { in: questionIds }
        }
      });

      if (studentMarks.length === 0) {
        console.log(`⚠️ No marks found for student ${studentId} for CO ${coId} questions`);
        return null;
      }

      // Step 3: Calculate totals with assessment weightage consideration
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
      for (const mark of studentMarks) {
        const question = coQuestionMappings.find(m => m.questionId === mark.questionId);
        if (!question) continue;

        const assessment = question.question.assessment;
        
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
          group.questions.push(question);
          if (mark.obtainedMarks !== null) {
            group.obtainedMarks += mark.obtainedMarks;
          }
          group.maxMarks += question.question.maxMarks;
        }
        
        if (mark.obtainedMarks !== null) {
          totalObtainedMarks += mark.obtainedMarks;
          totalMaxMarks += mark.maxMarks; // This is correct - using student mark's maxMarks
          attemptedQuestions++;
        }
      }

      // Calculate weighted scores for each assessment
      for (const group of assessmentGroups.values()) {
        const assessmentWeightage = group.weightage / 100; // Convert percentage to decimal
        const assessmentScore = group.maxMarks > 0 ? (group.obtainedMarks / group.maxMarks) : 0;
        
        totalWeightedScore += assessmentScore * assessmentWeightage;
        maxWeightedScore += assessmentWeightage; // Sum of weightages (should be 1.0 or close)
      }

      // Step 4: Calculate percentage based on attempted questions only
      if (totalMaxMarks === 0) {
        console.log(`❌ No maximum marks found for student ${studentId} in CO ${coId}`);
        return null;
      }

      const simplePercentage = (totalObtainedMarks / totalMaxMarks) * 100;
      const weightedPercentage = maxWeightedScore > 0 ? (totalWeightedScore / maxWeightedScore) * 100 : simplePercentage;

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

      const result: EnhancedStudentCOAttainment = {
        studentId,
        studentName: student?.name || 'Unknown Student',
        coId,
        coCode: co?.code || 'Unknown',
        percentage: Math.round(weightedPercentage * 100) / 100, // Use weighted percentage
        metTarget: false, // Will be determined in next step
        totalObtainedMarks,
        totalMaxMarks,
        attemptedQuestions,
        totalQuestions,
        sectionId,
        sectionName: assessmentGroups.values()[0]?.assessment?.sectionId ? 
          await this.getSectionName(assessmentGroups.values()[0]?.assessment?.sectionId) : undefined,
        weightedScore: totalWeightedScore,
        maxWeightedScore
      };

      console.log(`✅ Enhanced Student ${studentId} CO ${coId}: ${result.percentage}% (weighted: ${weightedPercentage.toFixed(1)}%, simple: ${simplePercentage.toFixed(1)}%) (${attemptedQuestions}/${totalQuestions} questions attempted)`);

      return result;
    } catch (error) {
      console.error('❌ Error calculating enhanced student CO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate Section-Level CO Attainment
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

      // Get all students enrolled in this section
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

      console.log(`👥 Found ${enrollments.length} students in section ${sectionId}`);

      // Calculate enhanced attainment for each student in this section
      const studentAttainments: EnhancedStudentCOAttainment[] = [];
      
      for (const enrollment of enrollments) {
        const attainment = await this.calculateEnhancedStudentCOAttainment(
          courseId,
          coId,
          enrollment.student.id,
          sectionId
        );
        
        if (attainment) {
          const attainmentWithTarget = await this.determineTargetMet(courseId, attainment);
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
      let attainmentLevel = 0;
      
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      // Calculate average attainments
      const averageAttainment = studentAttainments.length > 0 
        ? studentAttainments.reduce((sum, s) => sum + s.percentage, 0) / studentAttainments.length 
        : 0;

      const weightedAverageAttainment = studentAttainments.length > 0 
        ? studentAttainments.reduce((sum, s) => sum + (s.weightedScore / s.maxWeightedScore * 100), 0) / studentAttainments.length 
        : 0;

      // Get assessment details for this section and CO
      const assessmentDetails = await this.getSectionAssessmentDetails(courseId, coId, sectionId);

      const sectionName = await this.getSectionName(sectionId);

      console.log(`🎯 Section ${sectionName} CO ${coId}: ${percentageMeetingTarget.toFixed(2)}% students met target, Level ${attainmentLevel}`);

      return {
        sectionId,
        sectionName,
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
        level3Threshold: course.level3Threshold,
        averageAttainment: Math.round(averageAttainment * 100) / 100,
        weightedAverageAttainment: Math.round(weightedAverageAttainment * 100) / 100,
        totalAssessments: assessmentDetails.length,
        assessmentWeightages: assessmentDetails
      };
    } catch (error) {
      console.error('❌ Error calculating section CO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate Enhanced Class CO Attainment with Section Breakdown
   */
  static async calculateEnhancedClassCOAttainment(
    courseId: string,
    coId: string
  ): Promise<EnhancedClassCOAttainment | null> {
    try {
      console.log(`📊 Enhanced Class CO attainment calculation for CO ${coId}, course ${courseId}`);

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

      // Get all sections for this course via batches
      const sections = await db.section.findMany({
        where: {
          batch: {
            courses: {
              some: {
                id: courseId
              }
            }
          }
        }
      });

      if (sections.length === 0) {
        console.log(`❌ No sections found for course ${courseId}`);
        return null;
      }

      // Calculate section-wise CO attainment
      const sectionBreakdown: SectionCOAttainment[] = [];
      let totalStudents = 0;
      let totalStudentsMeetingTarget = 0;
      let allStudentAttainments: EnhancedStudentCOAttainment[] = [];

      for (const section of sections) {
        const sectionAttainment = await this.calculateSectionCOAttainment(courseId, coId, section.id);
        
        if (sectionAttainment) {
          sectionBreakdown.push(sectionAttainment);
          totalStudents += sectionAttainment.totalStudents;
          totalStudentsMeetingTarget += sectionAttainment.studentsMeetingTarget;

          // Get individual student attainments for this section
          const enrollments = await db.enrollment.findMany({
            where: {
              courseId: courseId,
              student: { sectionId: section.id },
              isActive: true
            },
            include: {
              student: {
                select: { id: true, name: true, studentId: true }
              }
            }
          });

          for (const enrollment of enrollments) {
            const studentAttainment = await this.calculateEnhancedStudentCOAttainment(
              courseId, coId, enrollment.student.id, section.id
            );
            
            if (studentAttainment) {
              const attainmentWithTarget = await this.determineTargetMet(courseId, studentAttainment);
              allStudentAttainments.push(attainmentWithTarget);
            }
          }
        }
      }

      if (sectionBreakdown.length === 0) {
        console.log(`❌ No valid section attainments calculated for CO ${coId}`);
        return null;
      }

      // Calculate overall class statistics
      const percentageMeetingTarget = totalStudents > 0 ? (totalStudentsMeetingTarget / totalStudents) * 100 : 0;
      
      // Map to attainment level
      let attainmentLevel = 0;
      
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      // Calculate average attainments
      const averageAttainment = allStudentAttainments.length > 0 
        ? allStudentAttainments.reduce((sum, s) => sum + s.percentage, 0) / allStudentAttainments.length 
        : 0;

      const weightedAverageAttainment = allStudentAttainments.length > 0 
        ? allStudentAttainments.reduce((sum, s) => sum + (s.weightedScore / s.maxWeightedScore * 100), 0) / allStudentAttainments.length 
        : 0;

      console.log(`🎯 Enhanced Class CO ${coId}: ${percentageMeetingTarget.toFixed(2)}% students met target, Level ${attainmentLevel}`);

      return {
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
        sectionBreakdown,
        averageAttainment: Math.round(averageAttainment * 100) / 100,
        weightedAverageAttainment: Math.round(weightedAverageAttainment * 100) / 100
      };
    } catch (error) {
      console.error('❌ Error calculating enhanced class CO attainment:', error);
      return null;
    }
  }

  /**
   * Helper: Determine if student met target
   */
  static async determineTargetMet(
    courseId: string,
    studentAttainment: EnhancedStudentCOAttainment
  ): Promise<EnhancedStudentCOAttainment> {
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
   * Helper: Get section name
   */
  static async getSectionName(sectionId: string): Promise<string> {
    try {
      const section = await db.section.findUnique({
        where: { id: sectionId },
        select: { name: true }
      });
      return section?.name || `Section ${sectionId}`;
    } catch (error) {
      console.error('❌ Error getting section name:', error);
      return `Section ${sectionId}`;
    }
  }

  /**
   * Helper: Get assessment details for a section
   */
  static async getSectionAssessmentDetails(
    courseId: string,
    coId: string,
    sectionId: string
  ): Promise<any[]> {
    try {
      const assessments = await db.assessment.findMany({
        where: {
          courseId: courseId,
          sectionId: sectionId
        },
        include: {
          questions: {
            where: {
              coMappings: {
                some: { coId: coId }
              }
            },
            select: {
              maxMarks: true
            }
          }
        }
      });

      return assessments.map(assessment => ({
        assessmentId: assessment.id,
        assessmentName: assessment.name,
        assessmentType: assessment.type,
        weightage: assessment.weightage,
        maxMarks: assessment.maxMarks
      }));
    } catch (error) {
      console.error('❌ Error getting assessment details:', error);
      return [];
    }
  }
}