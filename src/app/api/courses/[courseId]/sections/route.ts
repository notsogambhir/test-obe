import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get course information to find the batch
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { batchId: true }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get sections for this course's batch
    const sections = await db.section.findMany({
      where: {
        batchId: course.batchId
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${sections.length} sections for batch ${course.batchId}`);

    // Get student counts for each section
    const sectionsWithCounts = await Promise.all(
      sections.map(async (section) => {
        try {
          // Count unique students enrolled in this course who have marks in this section
          const studentMarks = await db.studentMark.findMany({
            where: {
              sectionId: section.id,
              student: {
                enrollments: {
                  some: {
                    courseId: courseId,
                    isActive: true
                  }
                }
              }
            },
            select: {
              studentId: true
            }
          });

          const uniqueStudentCount = new Set(studentMarks.map(mark => mark.studentId)).size;
          console.log(`Section ${section.name}: ${uniqueStudentCount} students with marks`);

          return {
            id: section.id,
            name: section.name,
            studentCount: uniqueStudentCount
          };
        } catch (error) {
          console.error(`Error counting students for section ${section.name}:`, error);
          return {
            id: section.id,
            name: section.name,
            studentCount: 0
          };
        }
      })
    );

    return NextResponse.json(sectionsWithCounts);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}