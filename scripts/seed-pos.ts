import { db } from '@/lib/db';

async function seedPOs() {
  try {
    console.log('Seeding Program Outcomes (POs)...');

    // Get existing programs
    const programs = await db.program.findMany({
      select: { id: true, code: true }
    });

    console.log('Found programs:', programs);

    // Create Program Outcomes (POs) for each program
    const pos = await Promise.all([
      // BEME POs (Engineering)
      ...programs.filter(p => p.code === 'BEME').flatMap(program => 
        ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'].map((code, index) => 
          db.pO.create({
            data: {
              programId: program.id,
              code,
              description: [
                'Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.',
                'Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.',
                'Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.',
                'Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.',
                'Modern tool usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.',
                'The engineer and society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.',
                'Environment and sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.',
                'Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.',
                'Individual and team work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.',
                'Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.',
                'Project management and finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one\'s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.',
                'Life-long learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.'
              ][index],
            },
          })
        )
      ),
      // BBA POs (Business)
      ...programs.filter(p => p.code === 'BBA').flatMap(program => 
        ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'].map((code, index) => 
          db.pO.create({
            data: {
              programId: program.id,
              code,
              description: [
                'Business Knowledge: Apply fundamental knowledge of business administration, management principles, and economic theories to solve business problems.',
                'Critical Thinking: Analyze complex business situations, evaluate alternatives, and make informed decisions using appropriate analytical tools.',
                'Communication Skills: Communicate effectively in various business contexts using oral, written, and digital communication methods.',
                'Leadership and Teamwork: Demonstrate leadership qualities and work effectively in teams to achieve organizational goals.',
                'Ethical Responsibility: Apply ethical principles and social responsibility in business decision-making and professional conduct.',
                'Global Perspective: Understand and analyze business issues in a global context with awareness of cultural diversity and international business practices.'
              ][index],
            },
          })
        )
      ),
    ]);

    console.log(`Successfully created ${pos.length} Program Outcomes!`);
    console.log('POs seeded successfully!');

  } catch (error) {
    console.error('Error seeding POs:', error);
  }
}

seedPOs();