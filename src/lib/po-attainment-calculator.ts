import { db } from '@/lib/db';
import { CourseStatus } from '@prisma/client';

export interface POAttainment {
  poId: string;
  poCode: string;
  poDescription: string;
  programId: string;
  targetAttainment: number;
  actualAttainment: number;
  coCount: number;
  mappedCOs: number;
  avgMappingLevel: number;
  status: 'Not Attained' | 'Level 1' | 'Level 2' | 'Level 3';
  coCoverageFactor: number;
  baseAttainment: number;
}

export interface ProgramPOAttainmentSummary {
  programId: string;
  programName: string;
  programCode: string;
  targetAttainment: number;
  overallAttainment: number;
  nbaComplianceScore: number;
  totalPOs: number;
  attainedPOs: number;
  level3POs: number;
  level2POs: number;
  level1POs: number;
  notAttainedPOs: number;
  isCompliant: boolean;
  poAttainments: POAttainment[];
  calculatedAt: Date;
}

export interface BatchPOAttainmentSummary {
  batchId: string;
  batchName: string;
  batchStartYear: number;
  batchEndYear: number;
  programId: string;
  programName: string;
  programCode: string;
  targetAttainment: number;
  overallAttainment: number;
  nbaComplianceScore: number;
  totalPOs: number;
  attainedPOs: number;
  level3POs: number;
  level2POs: number;
  level1POs: number;
  notAttainedPOs: number;
  isCompliant: boolean;
  poAttainments: POAttainment[];
  totalCourses: number;
  completedCourses: number;
  calculatedAt: Date;
}

export class POAttainmentCalculator {
  /**
   * Calculate PO attainment for a specific batch
   * Following NBA guidelines for Program Outcome attainment at batch level
   */
  static async calculateBatchPOAttainment(
    batchId: string,
    options?: {
      academicYear?: string;
      includeInactiveCourses?: boolean;
      courseStatus?: CourseStatus[];
    }
  ): Promise<BatchPOAttainmentSummary | null> {
    try {
      console.log(`🎯 Calculating PO attainment for batch: ${batchId}`);

      // Default to COMPLETED courses only for PO attainment calculation as per NBA guidelines
      const allowedStatuses = options?.courseStatus || ['COMPLETED'];
      console.log(`📚 Using courses with status: ${allowedStatuses.join(', ')} for batch PO calculation`);

      // Get batch details with courses
      const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
          program: {
            include: {
              college: {
                select: {
                  name: true
                }
              }
            }
          },
          courses: {
            where: { 
              status: { in: allowedStatuses },
              ...(options?.includeInactiveCourses ? {} : { isActive: true })
            },
            include: {
              courseOutcomes: {
                where: { isActive: true }
              },
              coPOMappings: {
                where: { isActive: true },
                include: {
                  co: true,
                  po: true
                }
              }
            }
          }
        }
      });

      if (!batch) {
        console.log(`❌ Batch not found: ${batchId}`);
        return null;
      }

      // Get all POs for the batch's program
      const pos = await db.pO.findMany({
        where: { 
          programId: batch.programId,
          isActive: true 
        },
        orderBy: { code: 'asc' }
      });

      if (pos.length === 0) {
        console.log(`❌ No POs found for batch's program: ${batch.programId}`);
        return null;
      }

      const totalCourses = batch.courses.length;
      console.log(`📚 Found ${pos.length} POs and ${totalCourses} courses for batch calculation`);
      
      // Calculate PO attainment for each PO using only this batch's courses
      const poAttainments: POAttainment[] = [];

      for (const po of pos) {
        const poAttainment = await this.calculateIndividualPOAttainment(
          po,
          batch.courses, // Only courses from this batch
          batch.programId
        );
        
        if (poAttainment) {
          poAttainments.push(poAttainment);
        }
      }

      // Calculate overall statistics
      const targetAttainment = 60; // NBA standard
      const overallAttainment = poAttainments.length > 0 
        ? poAttainments.reduce((sum, po) => sum + po.actualAttainment, 0) / poAttainments.length 
        : 0;

      const nbaComplianceScore = poAttainments.length > 0 
        ? (poAttainments.filter(po => po.actualAttainment >= targetAttainment).length / poAttainments.length) * 100 
        : 0;

      const summary: BatchPOAttainmentSummary = {
        batchId: batch.id,
        batchName: batch.name,
        batchStartYear: batch.startYear,
        batchEndYear: batch.endYear,
        programId: batch.program.id,
        programName: batch.program.name,
        programCode: batch.program.code,
        targetAttainment,
        overallAttainment: Math.round(overallAttainment * 100) / 100,
        nbaComplianceScore: Math.round(nbaComplianceScore * 100) / 100,
        totalPOs: pos.length,
        attainedPOs: poAttainments.filter(po => po.actualAttainment >= targetAttainment).length,
        level3POs: poAttainments.filter(po => po.status === 'Level 3').length,
        level2POs: poAttainments.filter(po => po.status === 'Level 2').length,
        level1POs: poAttainments.filter(po => po.status === 'Level 1').length,
        notAttainedPOs: poAttainments.filter(po => po.status === 'Not Attained').length,
        isCompliant: nbaComplianceScore >= 60, // NBA requires minimum 60% compliance
        poAttainments,
        totalCourses,
        completedCourses: totalCourses, // All courses are completed due to filtering
        calculatedAt: new Date()
      };

      console.log(`✅ Batch PO attainment calculation completed for batch: ${batchId}`);
      console.log(`📊 Batch Summary: ${summary.overallAttainment}% overall, ${summary.nbaComplianceScore}% NBA compliance`);

      return summary;
    } catch (error) {
      console.error('❌ Error calculating batch PO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate PO attainment for a specific program
   * Following NBA guidelines for Program Outcome attainment
   */
  static async calculateProgramPOAttainment(
    programId: string,
    options?: {
      academicYear?: string;
      includeInactiveCourses?: boolean;
      courseStatus?: CourseStatus[];
    }
  ): Promise<ProgramPOAttainmentSummary | null> {
    try {
      console.log(`🎯 Calculating PO attainment for program: ${programId}`);

      // Default to COMPLETED courses only for PO attainment calculation as per NBA guidelines
      const allowedStatuses = options?.courseStatus || ['COMPLETED'];
      console.log(`📚 Using courses with status: ${allowedStatuses.join(', ')} for PO calculation`);
      
      // Get program details
      const program = await db.program.findUnique({
        where: { id: programId },
        include: {
          batches: {
            include: {
              courses: {
                where: { 
                  status: { in: allowedStatuses },
                  ...(options?.includeInactiveCourses ? {} : { isActive: true })
                },
                include: {
                  courseOutcomes: {
                    where: { isActive: true }
                  },
                  coPOMappings: {
                    where: { isActive: true },
                    include: {
                      co: true,
                      po: true
                    }
                  }
                }
              }
            }
          },
          pos: {
            where: { isActive: true }
          }
        }
      });

      if (!program) {
        console.log(`❌ Program not found: ${programId}`);
        return null;
      }

      // Get all POs for the program
      const pos = await db.pO.findMany({
        where: { 
          programId,
          isActive: true 
        },
        orderBy: { code: 'asc' }
      });

      if (pos.length === 0) {
        console.log(`❌ No POs found for program: ${programId}`);
        return null;
      }

      const allCourses = program.batches.flatMap(batch => batch.courses);
      console.log(`📚 Found ${pos.length} POs, ${program.batches.length} batches, and ${allCourses.length} courses for calculation`);
      
      // Calculate PO attainment for each PO
      const poAttainments: POAttainment[] = [];

      for (const po of pos) {
        const poAttainment = await this.calculateIndividualPOAttainment(
          po,
          program.batches.flatMap(batch => batch.courses),
          programId
        );
        
        if (poAttainment) {
          poAttainments.push(poAttainment);
        }
      }

      // Calculate overall statistics
      const targetAttainment = 60; // NBA standard
      const overallAttainment = poAttainments.length > 0 
        ? poAttainments.reduce((sum, po) => sum + po.actualAttainment, 0) / poAttainments.length 
        : 0;

      const nbaComplianceScore = poAttainments.length > 0 
        ? (poAttainments.filter(po => po.actualAttainment >= targetAttainment).length / poAttainments.length) * 100 
        : 0;

      const summary: ProgramPOAttainmentSummary = {
        programId: program.id,
        programName: program.name,
        programCode: program.code,
        targetAttainment,
        overallAttainment: Math.round(overallAttainment * 100) / 100,
        nbaComplianceScore: Math.round(nbaComplianceScore * 100) / 100,
        totalPOs: pos.length,
        attainedPOs: poAttainments.filter(po => po.actualAttainment >= targetAttainment).length,
        level3POs: poAttainments.filter(po => po.status === 'Level 3').length,
        level2POs: poAttainments.filter(po => po.status === 'Level 2').length,
        level1POs: poAttainments.filter(po => po.status === 'Level 1').length,
        notAttainedPOs: poAttainments.filter(po => po.status === 'Not Attained').length,
        isCompliant: nbaComplianceScore >= 60, // NBA requires minimum 60% compliance
        poAttainments,
        calculatedAt: new Date()
      };

      console.log(`✅ PO attainment calculation completed for program: ${programId}`);
      console.log(`📊 Summary: ${summary.overallAttainment}% overall, ${summary.nbaComplianceScore}% NBA compliance`);

      return summary;
    } catch (error) {
      console.error('❌ Error calculating program PO attainment:', error);
      return null;
    }
  }

  /**
   * Calculate individual PO attainment based on NBA guidelines
   */
  private static async calculateIndividualPOAttainment(
    po: any,
    courses: any[],
    programId: string
  ): Promise<POAttainment | null> {
    try {
      // Get all CO-PO mappings for this PO across all courses in the program
      const allMappings = courses.flatMap(course =>
        course.coPOMappings?.filter(mapping => mapping.poId === po.id) || []
      );

      if (allMappings.length === 0) {
        console.log(`⚠️ No CO-PO mappings found for PO: ${po.code}`);
        return {
          poId: po.id,
          poCode: po.code,
          poDescription: po.description,
          programId,
          targetAttainment: 60,
          actualAttainment: 0,
          coCount: 0,
          mappedCOs: 0,
          avgMappingLevel: 0,
          status: 'Not Attained',
          coCoverageFactor: 0,
          baseAttainment: 0
        };
      }

      // Get unique COs mapped to this PO
      const mappedCOs = new Set(allMappings.map(mapping => mapping.coId));
      const totalCOs = new Set(courses.flatMap(course => course.courseOutcomes?.map(co => co.id) || []));

      // Step 1: Calculate average mapping level for this PO
      const mappingLevels = allMappings.map(mapping => mapping.level);
      const avgMappingLevel = mappingLevels.length > 0 
        ? mappingLevels.reduce((sum, level) => sum + level, 0) / mappingLevels.length 
        : 0;

      // Step 2: Convert mapping level to attainment percentage
      // Level 3 = 100%, Level 2 = 75%, Level 1 = 50%
      let baseAttainment = 0;
      if (avgMappingLevel >= 3) baseAttainment = 100;
      else if (avgMappingLevel >= 2) baseAttainment = 75;
      else if (avgMappingLevel >= 1) baseAttainment = 50;

      // Step 3: Apply CO coverage factor
      const coCoverageFactor = totalCOs.size > 0 
        ? mappedCOs.size / totalCOs.size 
        : 0;

      // Step 4: Calculate final PO attainment
      const actualAttainment = Math.round(baseAttainment * coCoverageFactor);

      // Step 5: Determine attainment level
      const targetAttainment = 60; // NBA standard
      let status: 'Not Attained' | 'Level 1' | 'Level 2' | 'Level 3' = 'Not Attained';
      
      if (actualAttainment >= 80) status = 'Level 3';
      else if (actualAttainment >= 65) status = 'Level 2';
      else if (actualAttainment >= targetAttainment) status = 'Level 1';

      return {
        poId: po.id,
        poCode: po.code,
        poDescription: po.description,
        programId,
        targetAttainment,
        actualAttainment,
        coCount: totalCOs.size,
        mappedCOs: mappedCOs.size,
        avgMappingLevel: Math.round(avgMappingLevel * 10) / 10,
        status,
        coCoverageFactor: Math.round(coCoverageFactor * 100),
        baseAttainment
      };
    } catch (error) {
      console.error(`❌ Error calculating PO attainment for ${po.code}:`, error);
      return null;
    }
  }

  /**
   * Generate NBA compliance recommendations
   */
  static generateRecommendations(poAttainments: POAttainment[]): string[] {
    const recommendations: string[] = [];
    
    const notAttained = poAttainments.filter(po => po.status === 'Not Attained');
    const level1 = poAttainments.filter(po => po.status === 'Level 1');
    
    if (notAttained.length > 0) {
      recommendations.push(`${notAttained.length} PO(s) not attained. Review mapping levels and CO coverage.`);
    }
    
    if (level1.length > 0) {
      recommendations.push(`${level1.length} PO(s) at minimum level. Consider strengthening CO-PO correlations.`);
    }
    
    const avgCoverage = poAttainments.reduce((sum, po) => sum + po.coCoverageFactor, 0) / poAttainments.length;
    if (avgCoverage < 80) {
      recommendations.push('Low CO coverage detected. Map more COs to POs for better attainment.');
    }
    
    const avgMappingLevel = poAttainments.reduce((sum, po) => sum + po.avgMappingLevel, 0) / poAttainments.length;
    if (avgMappingLevel < 2) {
      recommendations.push('Low mapping levels detected. Use stronger correlations (Level 2-3) where appropriate.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Excellent PO attainment! Consider maintaining current mapping strategy.');
    }
    
    return recommendations;
  }

  /**
   * Calculate PO attainment for a specific course (existing API functionality)
   */
  static async calculateCoursePOAttainment(
    courseId: string
  ): Promise<any> {
    try {
      console.log(`🎯 Calculating PO attainment for course: ${courseId}`);

      // Get course details with COs and POs
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          batch: {
            include: {
              program: true
            }
          },
          courseOutcomes: {
            where: { isActive: true }
          }
        }
      });

      if (!course) {
        console.log(`❌ Course not found: ${courseId}`);
        return null;
      }

      // Check if course is completed - only calculate PO attainment for completed courses
      if (course.status !== 'COMPLETED') {
        console.log(`⚠️ Course ${courseId} is not completed (status: ${course.status}). PO attainment calculation skipped.`);
        return {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          courseStatus: course.status,
          message: 'PO attainment calculation only available for completed courses',
          poAttainments: [],
          overallAttainment: 0,
          nbaComplianceScore: 0,
          targetAttainment: 60,
          totalPOs: 0,
          attainedPOs: 0,
          isCompliant: false
        };
      }

      // Get POs for the program
      const pos = await db.pO.findMany({
        where: { 
          programId: course.batch.programId,
          isActive: true 
        },
        orderBy: { code: 'asc' }
      });

      // Get CO-PO mappings for this course
      const mappings = await db.cOPOMapping.findMany({
        where: { 
          courseId,
          isActive: true 
        },
        include: {
          co: true,
          po: true
        }
      });

      // Calculate PO attainments following NBA guidelines
      const targetAttainment = 60; // NBA standard
      const poAttainments = pos.map(po => {
        const relatedMappings = mappings.filter(m => m.poId === po.id);
        const mappedCOs = relatedMappings.length;
        
        // NBA PO Attainment Calculation
        // Step 1: Calculate average mapping level for this PO
        const avgMappingLevel = mappedCOs > 0 
          ? relatedMappings.reduce((sum, m) => sum + m.level, 0) / mappedCOs 
          : 0;
        
        // Step 2: Convert mapping level to attainment percentage
        let baseAttainment = 0;
        if (avgMappingLevel >= 3) baseAttainment = 100;
        else if (avgMappingLevel >= 2) baseAttainment = 75;
        else if (avgMappingLevel >= 1) baseAttainment = 50;
        
        // Step 3: Apply CO coverage factor
        const coCoverageFactor = course.courseOutcomes.length > 0 
          ? mappedCOs / course.courseOutcomes.length 
          : 0;
        
        // Step 4: Calculate final PO attainment
        const actualAttainment = Math.round(baseAttainment * coCoverageFactor);
        
        // Step 5: Determine attainment level
        let status: 'Not Attained' | 'Level 1' | 'Level 2' | 'Level 3' = 'Not Attained';
        if (actualAttainment >= 80) status = 'Level 3';
        else if (actualAttainment >= 65) status = 'Level 2';
        else if (actualAttainment >= targetAttainment) status = 'Level 1';
        
        return {
          poId: po.id,
          poCode: po.code,
          poDescription: po.description,
          targetAttainment,
          actualAttainment,
          coCount: course.courseOutcomes.length,
          mappedCOs,
          avgMappingLevel: Math.round(avgMappingLevel * 10) / 10,
          status,
          coCoverageFactor: Math.round(coCoverageFactor * 100),
          baseAttainment
        };
      });

      // Calculate overall statistics
      const overallAttainment = poAttainments.length > 0 
        ? poAttainments.reduce((sum, po) => sum + po.actualAttainment, 0) / poAttainments.length 
        : 0;

      const nbaComplianceScore = poAttainments.length > 0 
        ? (poAttainments.filter(po => po.actualAttainment >= targetAttainment).length / poAttainments.length) * 100 
        : 0;

      return {
        poAttainments,
        overallAttainment: Math.round(overallAttainment * 100) / 100,
        nbaComplianceScore: Math.round(nbaComplianceScore * 100) / 100,
        targetAttainment,
        totalPOs: pos.length,
        attainedPOs: poAttainments.filter(po => po.actualAttainment >= targetAttainment).length,
        complianceAnalysis: {
          totalPOs: pos.length,
          attainedPOs: poAttainments.filter(po => po.actualAttainment >= targetAttainment).length,
          level3POs: poAttainments.filter(po => po.status === 'Level 3').length,
          level2POs: poAttainments.filter(po => po.status === 'Level 2').length,
          level1POs: poAttainments.filter(po => po.status === 'Level 1').length,
          notAttainedPOs: poAttainments.filter(po => po.status === 'Not Attained').length,
          overallAttainment,
          nbaComplianceScore,
          isCompliant: nbaComplianceScore >= 60,
          recommendations: this.generateRecommendations(poAttainments)
        }
      };
    } catch (error) {
      console.error('❌ Error calculating course PO attainment:', error);
      return null;
    }
  }
}