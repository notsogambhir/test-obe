import { db } from '@/lib/db';

async function checkData() {
  const students = await db.user.findMany({ where: { role: 'STUDENT' } });
  const courses = await db.course.findMany();
  const cos = await db.cO.findMany();
  const assessments = await db.assessment.findMany();
  
  console.log('📊 Current Database Status:');
  console.log('Students:', students.length);
  console.log('Courses:', courses.length);
  console.log('Course Outcomes:', cos.length);
  console.log('Assessments:', assessments.length);
}

checkData();