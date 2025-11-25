import { COAttainmentCalculator } from '@/lib/co-attainment-calculator';
import { db } from '@/lib/db';

async function quickTest() {
  try {
    console.log('🧪 Quick CO Attainment Test');
    
    // Get first course and CO
    const course = await db.course.findFirst({ where: { isActive: true } });
    const co = await db.cO.findFirst({ where: { isActive: true } });
    
    if (!course || !co) {
      console.log('❌ No course or CO found');
      return;
    }
    
    console.log(`📚 Course: ${course.code}`);
    console.log(`🎯 CO: ${co.code}`);
    
    // Test class attainment
    const result = await COAttainmentCalculator.calculateClassCOAttainment(
      course.id,
      co.id
    );
    
    if (result) {
      console.log(`✅ Success! Level: ${result.attainmentLevel}, Students: ${result.totalStudents}`);
    } else {
      console.log('❌ Failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();