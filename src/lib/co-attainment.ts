import { db } from '../lib/db';

export interface COAttainmentResult {
  coId: string;
  coCode: string;
  coDescription: string;
  studentCount: number;
  studentsMeetingTarget: number;
  percentageMeetingTarget: number;
  attainmentLevel: 0 | 1 | 2 | 3;
  targetPercentage: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
}

export interface StudentCOAttainment {
  studentId: string;
  studentName: string;
  studentRollNo?: string;
  coId: string;
  coCode: string;
  percentage: number;
  metTarget: boolean;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  attemptedQuestions: number;
  totalQuestions: number;
}

export interface COAttainmentSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  academicYear?: string;
  totalStudents: number;
  overallAttainment: {
    level0Count: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  };
  coAttainments: COAttainmentResult[];
  studentAttainments: StudentCOAttainment[];
}

export class COAttainmentService {
  /**
   * Calculate CO attainment for a single student for a specific CO
   */
  static async calculateStudentCOAttainment(
    studentId: string,
    coId: string,
    academicYear?: string
  ): Promise<{ 
    percentage: number; 
    metTarget: boolean;
    totalObtainedMarks?: number;
    totalMaxMarks?: number;
    attemptedQuestions?: number;
    totalQuestions?: number;
  }> {
    try {
      // Get all questions mapped to this CO
      const questions = await db.question.findMany({
        where: {
          coMappings: {
            some: {
              coId
            }
          },
          isActive: true
        },
        include: {
          assessment: {
            select: {
              courseId: true,
              isActive: true
            }
          }
        }
      });

      // Filter for active assessments after the query
      const activeQuestions = questions.filter(q => q.assessment && q.assessment.isActive === true);

      if (activeQuestions.length === 0) {
        return { 
          percentage: 0, 
          metTarget: false,
          totalObtainedMarks: 0,
          totalMaxMarks: 0,
          attemptedQuestions: 0,
          totalQuestions: 0
        };
      }

      const questionIds = activeQuestions.map(q => q.id);
      const courseId = activeQuestions[0].assessment.courseId;

      // Get student marks for these questions
      const studentMarks = await db.studentMark.findMany({
        where: {
          studentId,
          questionId: { in: questionIds },
          ...(academicYear && { academicYear })
        }
      });

      // Calculate total obtained and maximum marks
      // CRITICAL FIX: Only include questions that student actually attempted
      let totalObtainedMarks = 0;
      let totalMaxMarks = 0;
      let attemptedQuestions = 0;

      activeQuestions.forEach(question => {
        const studentMark = studentMarks.find(mark => mark.questionId === question.id);
        if (studentMark && studentMark.obtainedMarks !== null) {
          // Student attempted this question (including if they scored 0)
          totalObtainedMarks += studentMark.obtainedMarks;
          totalMaxMarks += question.maxMarks;
          attemptedQuestions++;
        }
        // CRITICAL: If studentMark is null (unattempted/absent), 
        // we IGNORE this question entirely - don't add maxMarks to denominator
      });

      if (totalMaxMarks === 0) {
        return { percentage: 0, metTarget: false };
      }

      const percentage = (totalObtainedMarks / totalMaxMarks) * 100;

      // Get course target percentage
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { targetPercentage: true }
      });

      const targetPercentage = course?.targetPercentage || 50.0;
      const metTarget = percentage >= targetPercentage;

      return { 
        percentage, 
        metTarget,
        totalObtainedMarks,
        totalMaxMarks,
        attemptedQuestions,
        totalQuestions: activeQuestions.length
      };
    } catch (error) {
      console.error('Error calculating student CO attainment:', error);
      throw error;
    }
  }

  /**
   * Calculate CO attainment for all students in a course for a specific CO
   */
  static async calculateCOAttainment(
    courseId: string,
    coId: string,
    academicYear?: string
  ): Promise<COAttainmentResult> {
    try {
      // Get CO and course details
      const [co, course] = await Promise.all([
        db.cO.findUnique({
          where: { id: coId },
          select: { id: true, code: true, description: true }
        }),
        db.course.findUnique({
          where: { id: courseId },
          select: {
            targetPercentage: true,
            level1Threshold: true,
            level2Threshold: true,
            level3Threshold: true
          }
        })
      ]);

      if (!co || !course) {
        throw new Error('CO or Course not found');
      }

      // Get all enrolled students
      const enrollments = await db.enrollment.findMany({
        where: {
          courseId,
          isActive: true
        },
        include: {
          student: {
            select: { id: true, name: true, studentId: true }
          }
        }
      });

      const students = enrollments.map(e => e.student);
      const totalStudents = students.length;

      if (totalStudents === 0) {
        return {
          coId: co.id,
          coCode: co.code,
          coDescription: co.description,
          studentCount: 0,
          studentsMeetingTarget: 0,
          percentageMeetingTarget: 0,
          attainmentLevel: 0,
          targetPercentage: course.targetPercentage,
          level1Threshold: course.level1Threshold,
          level2Threshold: course.level2Threshold,
          level3Threshold: course.level3Threshold
        };
      }

      // Calculate attainment for each student
      const studentAttainments = await Promise.all(
        students.map(async (student) => {
          const attainment = await this.calculateStudentCOAttainment(
            student.id,
            coId,
            academicYear
          );
          return {
            studentId: student.id,
            studentName: student.name,
            ...attainment
          };
        })
      );

      // Count students meeting target
      const studentsMeetingTarget = studentAttainments.filter(
        sa => sa.metTarget
      ).length;

      const percentageMeetingTarget = (studentsMeetingTarget / totalStudents) * 100;

      // Determine attainment level
      let attainmentLevel: 0 | 1 | 2 | 3 = 0;
      if (percentageMeetingTarget >= course.level3Threshold) {
        attainmentLevel = 3;
      } else if (percentageMeetingTarget >= course.level2Threshold) {
        attainmentLevel = 2;
      } else if (percentageMeetingTarget >= course.level1Threshold) {
        attainmentLevel = 1;
      }

      return {
        coId: co.id,
        coCode: co.code,
        coDescription: co.description,
        studentCount: totalStudents,
        studentsMeetingTarget,
        percentageMeetingTarget,
        attainmentLevel,
        targetPercentage: course.targetPercentage,
        level1Threshold: course.level1Threshold,
        level2Threshold: course.level2Threshold,
        level3Threshold: course.level3Threshold
      };
    } catch (error) {
      console.error('Error calculating CO attainment:', error);
      throw error;
    }
  }

  /**
   * Calculate CO attainment for all COs in a course
   */
  static async calculateCourseCOAttainment(
    courseId: string,
    academicYear?: string
  ): Promise<COAttainmentSummary> {
    try {
      // Get course details and COs
      const [course, cos] = await Promise.all([
        db.course.findUnique({
          where: { id: courseId },
          select: { id: true, name: true, code: true }
        }),
        db.cO.findMany({
          where: {
            courseId,
            isActive: true
          },
          orderBy: { code: 'asc' }
        })
      ]);

      if (!course) {
        throw new Error('Course not found');
      }

      // Calculate attainment for each CO
      const coAttainments = await Promise.all(
        cos.map(co => 
          this.calculateCOAttainment(courseId, co.id, academicYear)
        )
      );

      // Get all student attainments for detailed view
      const studentAttainments: StudentCOAttainment[] = [];
      for (const co of cos) {
        const coResult = coAttainments.find(ca => ca.coId === co.id);
        if (coResult) {
          // Get individual student attainments for this CO
          const enrollments = await db.enrollment.findMany({
            where: {
              courseId,
              isActive: true
            },
            include: {
              student: {
                select: { id: true, name: true, studentId: true }
              }
            }
          });

          for (const enrollment of enrollments) {
            const studentAttainment = await this.calculateStudentCOAttainment(
              enrollment.student.id,
              co.id,
              academicYear
            );

            studentAttainments.push({
              studentId: enrollment.student.id,
              studentName: enrollment.student.name,
              studentRollNo: enrollment.student.studentId || undefined, // Use actual student roll number
              coId: co.id,
              coCode: co.code,
              percentage: studentAttainment.percentage,
              metTarget: studentAttainment.metTarget,
              totalObtainedMarks: studentAttainment.totalObtainedMarks || 0,
              totalMaxMarks: studentAttainment.totalMaxMarks || 0,
              attemptedQuestions: studentAttainment.attemptedQuestions || 0,
              totalQuestions: studentAttainment.totalQuestions || 0
            });
          }
        }
      }

      // Calculate overall attainment statistics
      const overallAttainment = {
        level0Count: coAttainments.filter(ca => ca.attainmentLevel === 0).length,
        level1Count: coAttainments.filter(ca => ca.attainmentLevel === 1).length,
        level2Count: coAttainments.filter(ca => ca.attainmentLevel === 2).length,
        level3Count: coAttainments.filter(ca => ca.attainmentLevel === 3).length
      };

      const totalStudents = await db.enrollment.count({
        where: {
          courseId,
          isActive: true
        }
      });

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        academicYear,
        totalStudents,
        overallAttainment,
        coAttainments,
        studentAttainments
      };
    } catch (error) {
      console.error('Error calculating course CO attainment:', error);
      throw error;
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
          academicYear
        }
      });
    } catch (error) {
      console.error('Error saving CO attainment:', error);
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
      const attainmentSummary = await this.calculateCourseCOAttainment(
        courseId,
        academicYear
      );

      // Save all student attainments
      await Promise.all(
        attainmentSummary.studentAttainments.map(async (studentAttainment) => {
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
    } catch (error) {
      console.error('Error batch saving CO attainments:', error);
      throw error;
    }
  }
}