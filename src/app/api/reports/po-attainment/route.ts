import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const batchId = searchParams.get('batchId');

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Get program details
    const program = await db.program.findUnique({
      where: { id: programId },
      include: {
        college: true,
        batches: {
          include: {
            courses: {
              include: {
                assessments: true,
                courseOutcomes: {
                  include: {
                    mappings: {
                      include: {
                        po: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        pos: true
      }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Default target percentage for POs
    const targetPercentage = 60.0;

    // Calculate PO attainment for each batch
    const batchData = await Promise.all(program.batches.map(async (batch) => {
      // Get all courses for this batch
      const courses = batch.courses;

      // Calculate PO attainment for this batch
      const poData = await Promise.all(program.pos.map(async (po) => {
        let totalAttainment = 0;
        let totalWeightage = 0;
        const coursesContribution: Array<{
          courseId: string;
          courseCode: string;
          courseName: string;
          contribution: number;
          attainment: number;
          weightage: number;
        }> = [];

        for (const course of courses) {
          // Get COs mapped to this PO in this course
          const coPOMappings = course.courseOutcomes.flatMap(co => 
            co.mappings.filter(mapping => mapping.poId === po.id)
          );

          if (coPOMappings.length === 0) continue;

          // Get CO attainment data for this course
          const coAttainments = await db.cOAttainment.findMany({
            where: {
              courseId: course.id,
              co: {
                mappings: {
                  some: {
                    poId: po.id
                  }
                }
              }
            }
          });

          if (coAttainments.length === 0) continue;

          // Calculate course contribution to this PO
          const courseAttainment = coAttainments.reduce((sum, att) => sum + att.percentage, 0) / coAttainments.length;
          const courseWeightage = coPOMappings.reduce((sum, mapping) => sum + mapping.level, 0) / coPOMappings.length;
          
          totalAttainment += courseAttainment * courseWeightage;
          totalWeightage += courseWeightage;

          coursesContribution.push({
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            contribution: courseWeightage,
            attainment: courseAttainment,
            weightage: courseWeightage
          });
        }

        const overallAttainment = totalWeightage > 0 ? totalAttainment / totalWeightage : 0;

        return {
          id: po.id,
          code: po.code,
          description: po.description,
          overallAttainment,
          targetPercentage,
          metTarget: overallAttainment >= targetPercentage,
          coursesContribution
        };
      }));

      // Calculate batch overall PO attainment
      const batchOverallAttainment = poData.length > 0 
        ? poData.reduce((sum, po) => sum + po.overallAttainment, 0) / poData.length 
        : 0;

      return {
        id: batch.id,
        name: batch.name,
        programId: program.id,
        programName: program.name,
        overallAttainment: batchOverallAttainment,
        targetPercentage,
        pos: poData
      };
    }));

    // Calculate overall program PO attainment
    const programPOData = await Promise.all(program.pos.map(async (po) => {
      let totalAttainment = 0;
      let totalWeightage = 0;
      const coursesContribution: Array<{
        courseId: string;
        courseCode: string;
        courseName: string;
        contribution: number;
        attainment: number;
        weightage: number;
      }> = [];

      for (const batch of program.batches) {
        for (const course of batch.courses) {
          // Get COs mapped to this PO in this course
          const coPOMappings = course.courseOutcomes.flatMap(co => 
            co.mappings.filter(mapping => mapping.poId === po.id)
          );

          if (coPOMappings.length === 0) continue;

          // Get CO attainment data for this course
          const coAttainments = await db.cOAttainment.findMany({
            where: {
              courseId: course.id,
              co: {
                mappings: {
                  some: {
                    poId: po.id
                  }
                }
              }
            }
          });

          if (coAttainments.length === 0) continue;

          // Calculate course contribution to this PO
          const courseAttainment = coAttainments.reduce((sum, att) => sum + att.percentage, 0) / coAttainments.length;
          const courseWeightage = coPOMappings.reduce((sum, mapping) => sum + mapping.level, 0) / coPOMappings.length;
          
          totalAttainment += courseAttainment * courseWeightage;
          totalWeightage += courseWeightage;

          if (!coursesContribution.find(c => c.courseId === course.id)) {
            coursesContribution.push({
              courseId: course.id,
              courseCode: course.code,
              courseName: course.name,
              contribution: courseWeightage,
              attainment: courseAttainment,
              weightage: courseWeightage
            });
          }
        }
      }

      const overallAttainment = totalWeightage > 0 ? totalAttainment / totalWeightage : 0;

      return {
        id: po.id,
        code: po.code,
        description: po.description,
        overallAttainment,
        targetPercentage,
        metTarget: overallAttainment >= targetPercentage,
        coursesContribution
      };
    }));

    // Calculate program overall attainment
    const programOverallAttainment = programPOData.length > 0 
      ? programPOData.reduce((sum, po) => sum + po.overallAttainment, 0) / programPOData.length 
      : 0;

    const result = {
      id: program.id,
      name: program.name,
      code: program.code,
      overallAttainment: programOverallAttainment,
      targetPercentage,
      batches: batchData,
      pos: programPOData
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching PO attainment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PO attainment data' },
      { status: 500 }
    );
  }
}