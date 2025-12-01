import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');

    if (!courseId || !batchId) {
      return NextResponse.json(
        { error: 'Course ID and Batch ID are required' },
        { status: 400 }
      );
    }

    // Get course details with target percentages
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get course outcomes
    const courseOutcomes = await db.cO.findMany({
      where: { courseId },
      include: {
        coAttainments: {
          where: {
            student: {
              batchId: batchId
            }
          },
          include: {
            student: true
          }
        }
      }
    });

    // Get assessments for this course
    const assessments = await db.assessment.findMany({
      where: { courseId },
      include: {
        questions: {
          include: {
            coMappings: {
              include: {
                co: true
              }
            },
            studentMarks: {
              where: {
                student: {
                  batchId: batchId
                }
              },
              include: {
                student: true
              }
            }
          }
        },
        section: true
      }
    });

    // Get sections for this batch
    const sections = await db.section.findMany({
      where: { batchId },
      include: {
        students: {
          where: {
            enrollments: {
              some: {
                courseId: courseId
              }
            }
          }
        }
      }
    });

    // Calculate CO attainment data
    const coData = await Promise.all(courseOutcomes.map(async (co) => {
      // Get all attainments for this CO
      const attainments = co.coAttainments;
      
      // Calculate overall attainment
      const totalAttainment = attainments.reduce((sum, att) => sum + att.percentage, 0);
      const overallAttainment = attainments.length > 0 ? totalAttainment / attainments.length : 0;
      
      // Get assessment-wise data
      const assessmentData = await Promise.all(assessments.map(async (assessment) => {
        // Get questions mapped to this CO in this assessment
        const coQuestions = assessment.questions.filter(q => 
          q.coMappings.some(mapping => mapping.coId === co.id)
        );

        if (coQuestions.length === 0) {
          return {
            id: assessment.id,
            name: assessment.name,
            type: assessment.type,
            maxMarks: assessment.maxMarks,
            weightage: assessment.weightage,
            averageAttainment: 0,
            sectionWiseAttainment: []
          };
        }

        // Calculate section-wise attainment
        const sectionWiseData = await Promise.all(sections.map(async (section) => {
          const sectionStudents = section.students;
          
          if (sectionStudents.length === 0) {
            return {
              sectionName: section.name,
              studentCount: 0,
              averageAttainment: 0,
              students: []
            };
          }

          const studentAttainments = await Promise.all(sectionStudents.map(async (student) => {
            // Get student's marks for CO questions in this assessment
            const studentTotalMarks = coQuestions.reduce((sum, question) => {
              const studentMark = question.studentMarks.find(mark => mark.studentId === student.id);
              return sum + (studentMark?.obtainedMarks || 0);
            }, 0);

            const totalPossibleMarks = coQuestions.reduce((sum, question) => sum + question.maxMarks, 0);
            const attainment = totalPossibleMarks > 0 ? (studentTotalMarks / totalPossibleMarks) * 100 : 0;

            return {
              studentId: student.id,
              studentName: student.name,
              studentEmail: student.email || '',
              attainment,
              metTarget: attainment >= course.targetPercentage
            };
          }));

          const sectionAverageAttainment = studentAttainments.length > 0 
            ? studentAttainments.reduce((sum, s) => sum + s.attainment, 0) / studentAttainments.length 
            : 0;

          return {
            sectionName: section.name,
            studentCount: sectionStudents.length,
            averageAttainment: sectionAverageAttainment,
            students: studentAttainments
          };
        }));

        // Calculate overall assessment average
        const allStudents = sectionWiseData.flatMap(s => s.students);
        const assessmentAverage = allStudents.length > 0 
          ? allStudents.reduce((sum, s) => sum + s.attainment, 0) / allStudents.length 
          : 0;

        return {
          id: assessment.id,
          name: assessment.name,
          type: assessment.type,
          maxMarks: assessment.maxMarks,
          weightage: assessment.weightage,
          averageAttainment: assessmentAverage,
          sectionWiseAttainment: sectionWiseData
        };
      }));

      return {
        id: co.id,
        code: co.code,
        description: co.description,
        overallAttainment,
        targetPercentage: course.targetPercentage,
        metTarget: overallAttainment >= course.targetPercentage,
        studentsCount: co.coAttainments.length,
        assessments: assessmentData
      };
    }));

    // Calculate course overall attainment
    const courseOverallAttainment = coData.length > 0 
      ? coData.reduce((sum, co) => sum + co.overallAttainment, 0) / coData.length 
      : 0;

    const result = {
      id: course.id,
      code: course.code,
      name: course.name,
      overallAttainment: courseOverallAttainment,
      targetPercentage: course.targetPercentage,
      cos: coData,
      sections: sections.map(s => s.name)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching CO attainment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CO attainment data' },
      { status: 500 }
    );
  }
}