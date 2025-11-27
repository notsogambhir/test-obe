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
   * Following the correct formula: Direct PO = ∑(CO_Attainment × Mapping_Level) / ∑Mapping_Levels
   */
  private static async calculateIndividualPOAttainment(
    po: any,
    courses: any[],
    programId: string
  ): Promise<POAttainment | null> {
    try {
      console.log(`🎯 Calculating PO attainment for ${po.code} using correct NBA formula`);
      console.log(`📋 Courses available: ${courses.length}`);
      
      // Get all CO-PO mappings for this PO across all courses
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

      // Calculate Direct PO Attainment using the correct formula
      // Direct PO = ∑(CO_Attainment × Mapping_Level) / ∑Mapping_Levels
      let numerator = 0;
      let denominator = 0;
      const mappedCOsSet = new Set<string>();

      for (const mapping of allMappings) {
        try {
          // Get CO attainment for this specific CO from the course
          const coAttainment = await this.getCOAttainmentForCourse(mapping.coId, mapping.courseId);
          
          if (coAttainment !== null) {
            const contribution = coAttainment * mapping.level;
            numerator += contribution;
            denominator += mapping.level;
            mappedCOsSet.add(mapping.coId);
            
            console.log(`📊 CO ${mapping.co?.code || mapping.coId}: Attainment=${coAttainment.toFixed(2)}, Mapping=${mapping.level}, Contribution=${contribution.toFixed(2)}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not get attainment for CO ${mapping.coId} in course ${mapping.courseId}:`, error);
          // Skip this CO if we can't get its attainment
        }
      }

      // Calculate direct PO attainment
      const directPOAttainment = denominator > 0 ? numerator / denominator : 0;
      
      // Calculate indirect PO attainment (will be weighted at 0% for program-outcomes page)
      // For now, use a simple approach: average of direct attainment with some adjustment
      // In a full implementation, this would come from student surveys, alumni surveys, employer surveys
      const indirectPOAttainment = await this.calculateIndirectAttainment(po.id, courses);
      
      // Apply weights (100% direct, 0% indirect for program-outcomes page)
      const directWeight = 1.0;
      const indirectWeight = 0.0;
      
      // Final PO Attainment = (Direct_PO × 1.0) + (Indirect_PO × 0.0) = Direct_PO (100% direct for program-outcomes page)
      const finalPOAttainment = (directPOAttainment * directWeight) + (indirectPOAttainment * indirectWeight);

      // Get total COs for coverage calculation
      const totalCOs = new Set(courses.flatMap(course => course.courseOutcomes?.map(co => co.id) || []));
      const coCoverageFactor = totalCOs.size > 0 ? mappedCOsSet.size / totalCOs.size : 0;

      // Calculate average mapping level for display purposes
      const mappingLevels = allMappings.map(mapping => mapping.level);
      const avgMappingLevel = mappingLevels.length > 0 
        ? mappingLevels.reduce((sum, level) => sum + level, 0) / mappingLevels.length 
        : 0;

      // Convert attainment percentage to level status (using 0-3 scale as per PRD)
      const targetAttainment = 60; // NBA standard
      let status: 'Not Attained' | 'Level 1' | 'Level 2' | 'Level 3' = 'Not Attained';
      
      // Convert percentage to 0-3 scale for status determination
      const attainmentLevel = (finalPOAttainment / 100) * 3;
      if (attainmentLevel >= 2.5) status = 'Level 3';
      else if (attainmentLevel >= 2.0) status = 'Level 2';
      else if (attainmentLevel >= 1.5) status = 'Level 1';

      console.log(`✅ PO ${po.code}: Direct=${directPOAttainment.toFixed(2)} (100% weight), Final=${finalPOAttainment.toFixed(2)}, Status=${status}`);

      return {
        poId: po.id,
        poCode: po.code,
        poDescription: po.description,
        programId,
        targetAttainment,
        actualAttainment: Math.round(finalPOAttainment * 100) / 100, // Round to 2 decimal places
        coCount: totalCOs.size,
        mappedCOs: mappedCOsSet.size,
        avgMappingLevel: Math.round(avgMappingLevel * 10) / 10,
        status,
        coCoverageFactor: Math.round(coCoverageFactor * 100),
        baseAttainment: Math.round(directPOAttainment * 100) / 100 // Store direct attainment as base
      };
    } catch (error) {
      console.error(`❌ Error calculating PO attainment for ${po.code}:`, error);
      return null;
    }
  }

  /**
   * Get CO attainment for a specific CO in a course
   */
  private static async getCOAttainmentForCourse(
    coId: string,
    courseId: string
  ): Promise<number | null> {
    try {
      // Use the COAttainmentService to get the actual CO attainment
      const { COAttainmentService } = await import('@/lib/co-attainment');
      
      // Calculate CO attainment for this course
      const result = await COAttainmentService.calculateCOAttainment(courseId, coId);
      
      if (result) {
        // Convert attainment level to percentage
        // Level 3 = 100%, Level 2 = 75%, Level 1 = 50%, Level 0 = 0%
        let attainmentPercentage = 0;
        if (result.attainmentLevel >= 3) attainmentPercentage = 100;
        else if (result.attainmentLevel >= 2) attainmentPercentage = 75;
        else if (result.attainmentLevel >= 1) attainmentPercentage = 50;
        
        return attainmentPercentage;
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Error getting CO attainment for CO ${coId} in course ${courseId}:`, error);
      return null;
    }
  }

  /**
   * Calculate indirect PO attainment based on survey data or estimation
   */
  private static async calculateIndirectAttainment(
    poId: string,
    courses: any[]
  ): Promise<number> {
    try {
      // In a full implementation, this would query survey tables like:
      // - Student Exit Surveys
      // - Alumni Surveys  
      // - Employer Surveys
      // - Parent Feedback
      
      // For now, we'll use a simple estimation approach:
      // 1. Get average direct attainment across all POs for this program
      // 2. Apply a factor to simulate indirect assessment
      
      // Simple heuristic: indirect attainment is typically 10-15% lower than direct
      // This accounts for the fact that surveys often show slightly different perspectives
      
      // Get all POs for this program to calculate average
      const programId = courses[0]?.batch?.programId;
      if (!programId) return 2.0; // Default fallback
      
      const pos = await db.pO.findMany({
        where: { programId, isActive: true }
      });
      
      if (pos.length === 0) return 2.0; // Default fallback
      
      // Calculate average direct attainment for all POs (simple estimation)
      let totalDirectAttainment = 0;
      let poCount = 0;
      
      for (const po of pos) {
        // Get mappings for this PO
        const allMappings = courses.flatMap(course =>
          course.coPOMappings?.filter(mapping => mapping.poId === po.id) || []
        );
        
        if (allMappings.length > 0) {
          // Simple estimation: use average mapping level as proxy for attainment
          const avgMappingLevel = allMappings.reduce((sum, m) => sum + m.level, 0) / allMappings.length;
          totalDirectAttainment += avgMappingLevel;
          poCount++;
        }
      }
      
      const averageDirectAttainment = poCount > 0 ? totalDirectAttainment / poCount : 2.0;
      
      // Apply indirect factor (typically 85-90% of direct attainment)
      const indirectFactor = 0.85; // Conservative estimation
      const indirectAttainment = Math.max(1.0, averageDirectAttainment * indirectFactor);
      
      console.log(`📋 Indirect attainment for PO ${poId}: ${indirectAttainment.toFixed(2)} (based on avg direct: ${averageDirectAttainment.toFixed(2)})`);
      
      return Math.min(3.0, Math.max(0.0, indirectAttainment));
      
    } catch (error) {
      console.warn(`⚠️ Error calculating indirect attainment for PO ${poId}:`, error);
      return 2.0; // Default fallback
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
          programId: po.programId, // Add missing programId
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