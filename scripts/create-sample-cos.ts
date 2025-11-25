import { db } from '../src/lib/db';

async function createSampleCOs() {
  try {
    console.log('Creating sample Course Outcomes...');

    // Get the first course
    const course = await db.course.findFirst({
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });
    
    if (!course) {
      console.error('No course found. Please create a course first.');
      return;
    }

    console.log(`Using course: ${course.code} - ${course.name}`);
    console.log(`Program: ${course.batch.program.name}`);

    // Create sample COs
    const cos = await Promise.all([
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO1',
          description: 'Understand fundamental programming concepts and problem-solving techniques including algorithms, data structures, and computational thinking.'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO2',
          description: 'Design and implement efficient algorithms using appropriate data structures for solving complex computational problems.'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO3',
          description: 'Apply programming skills to develop software solutions for real-world engineering problems and applications.'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO4',
          description: 'Analyze, debug, and optimize code effectively using modern debugging tools and performance analysis techniques.'
        }
      }),
      db.cO.create({
        data: {
          courseId: course.id,
          code: 'CO5',
          description: 'Work collaboratively in teams to design, develop, and document software projects following industry best practices.'
        }
      })
    ]);

    console.log(`✅ Created ${cos.length} Course Outcomes`);
    console.log('\n📝 Created COs:');
    cos.forEach(co => {
      console.log(`   ${co.code}: ${co.description.substring(0, 80)}...`);
    });

    console.log('\n🔗 COs are now available for CO-PO mapping in the course management page.');
    console.log(`📚 Course ID: ${course.id}`);
    console.log(`🔗 Access at: http://localhost:3000/courses/${course.id}/manage`);

  } catch (error) {
    console.error('Error creating sample COs:', error);
  }
}

createSampleCOs();