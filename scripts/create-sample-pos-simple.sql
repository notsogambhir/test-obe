import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPOs() {
  try {
    console.log('=== CREATING SAMPLE POS ===');
    
    // Get all programs
    const programs = await prisma.program.findMany({
      include: {
        college: true
      }
    });
    
    console.log('Found programs:', programs.length);
    
    // Create POs for each program
    for (const program of programs) {
      console.log(`Creating POs for program: ${program.name} (${program.code})`);
      
      // Create POs following NBA guidelines
      const posData = [
        {
          code: 'PO1',
          description: 'Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to solve complex engineering problems',
        },
        {
          code: 'PO2',
          description: 'Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems using first principles of mathematics, natural sciences, and engineering sciences',
        },
        {
          code: 'PO3',
          description: 'Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet specified needs',
        },
        {
          code: 'PO4',
          description: 'Conduct investigations of complex problems: Use research-based knowledge and research methods to analyze complex engineering problems',
        },
        {
          code: 'PO5',
          description: 'Modern tool usage: Create, select, and apply appropriate techniques and tools for complex engineering problems',
        },
        {
          code: 'PO6',
          description: 'Engineering ethics: Apply ethical principles and commit to professional ethics and norms of the engineering practice',
        },
        {
          code: 'PO7',
          description: 'Individual and team work: Function effectively as an individual, and as a member or leader in diverse teams, and multidisciplinary settings',
        },
        {
          code: 'PO8',
          description: 'Communication: Communicate effectively on complex engineering activities with engineering community and society at large',
        },
        {
          code: 'PO9',
          description: 'Project management and finance: Demonstrate knowledge and understanding of engineering and management principles and apply these to one\'s own work',
        },
        {
          code: 'PO10',
          description: 'Life-long learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning',
        },
        {
          code: 'PO11',
          description: 'Social sciences and engineering: Apply social sciences and engineering principles to societal contexts and understand societal impacts',
        },
        {
          code: 'PO12',
          description: 'Environment and sustainability: Understand the impact of professional engineering solutions on societal and environmental contexts'
        }
      ];
      
      for (const poData of posData) {
        await prisma.pO.create({
          data: {
            programId: program.id,
            code: poData.code,
            description: poData.description
          }
        });
        console.log(`Created PO: ${poData.code}`);
      }
      
      console.log('POs created successfully');
    } else {
      console.log('No programs found');
    }
    
  } catch (error) {
    console.error('Error creating POs:', error);
  }
}

createPOs();