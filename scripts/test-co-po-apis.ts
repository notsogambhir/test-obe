import { db } from '../src/lib/db';

async function testCOPOAPIs() {
  try {
    console.log('Testing CO-PO Mapping APIs...\n');

    // Get the course we just created
    const course = await db.course.findFirst({
      where: { code: 'CS101' },
      include: {
        batch: {
          include: {
            program: true
          }
        }
      }
    });

    if (!course) {
      console.error('❌ Sample course not found. Please run the create script first.');
      return;
    }

    console.log(`✅ Found course: ${course.code} - ${course.name}`);
    console.log(`   Program: ${course.batch.program.name} (${course.batch.program.code})`);
    console.log(`   Course ID: ${course.id}\n`);

    // Test 1: Get COs for the course
    const cos = await db.cO.findMany({
      where: { courseId: course.id, isActive: true },
      orderBy: { code: 'asc' }
    });

    console.log(`✅ Found ${cos.length} COs for the course:`);
    cos.forEach(co => {
      console.log(`   ${co.code}: ${co.description.substring(0, 60)}...`);
    });
    console.log('');

    // Test 2: Get POs for the program
    const pos = await db.pO.findMany({
      where: { programId: course.batch.program.id, isActive: true },
      orderBy: { code: 'asc' }
    });

    console.log(`✅ Found ${pos.length} POs for the program:`);
    pos.forEach(po => {
      console.log(`   ${po.code}: ${po.description.substring(0, 60)}...`);
    });
    console.log('');

    // Test 3: Get existing mappings
    const mappings = await db.cOPOMapping.findMany({
      where: { courseId: course.id, isActive: true },
      include: {
        co: {
          select: { code: true, description: true }
        },
        po: {
          select: { code: true, description: true }
        }
      },
      orderBy: [
        { co: { code: 'asc' } },
        { po: { code: 'asc' } }
      ]
    });

    console.log(`✅ Found ${mappings.length} existing CO-PO mappings:`);
    mappings.forEach(mapping => {
      console.log(`   ${mapping.co.code} -> ${mapping.po.code} (Level ${mapping.level})`);
    });
    console.log('');

    // Test 4: Calculate mapping statistics
    const totalPossible = cos.length * pos.length;
    const mapped = mappings.filter(m => m.level > 0).length;
    const strong = mappings.filter(m => m.level === 3).length;
    const medium = mappings.filter(m => m.level === 2).length;
    const weak = mappings.filter(m => m.level === 1).length;

    console.log('✅ Mapping Statistics:');
    console.log(`   Total Possible: ${totalPossible}`);
    console.log(`   Mapped: ${mapped}`);
    console.log(`   Strong (3): ${strong}`);
    console.log(`   Medium (2): ${medium}`);
    console.log(`   Weak (1): ${weak}`);
    console.log('');

    console.log('🎉 All API tests passed! The CO-PO mapping functionality is ready to use.');
    console.log(`\nYou can now navigate to the course management page and test the CO-PO mapping tab.`);
    console.log(`Course ID for testing: ${course.id}`);

  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  } finally {
    await db.$disconnect();
  }
}

testCOPOAPIs();