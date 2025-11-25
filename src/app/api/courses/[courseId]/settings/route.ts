import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    console.log(`🔍 API: Fetching course settings for courseId: ${courseId}`);

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get course settings
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        targetPercentage: true,
        level1Threshold: true,
        level2Threshold: true,
        level3Threshold: true,
      }
    });

    if (!course) {
      console.log(`❌ API: Course not found for courseId: ${courseId}`);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Return default values if not set
    const settings = {
      coTarget: course.targetPercentage || 60,
      level1Threshold: course.level1Threshold || 60,
      level2Threshold: course.level2Threshold || 70,
      level3Threshold: course.level3Threshold || 80,
    };

    console.log(`📊 API: Returning course settings for ${courseId}:`, settings);
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching course settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;
    const body = await request.json();
    const { 
      coTarget,
      level1Threshold,
      level2Threshold,
      level3Threshold
    } = body;

    console.log(`💾 API: Updating course settings for courseId: ${courseId}`, body);

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Only Program Coordinators and above can edit course settings
    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit course settings' },
        { status: 403 }
      );
    }

    // Validate thresholds are in ascending order
    if (level1Threshold >= level2Threshold || level2Threshold >= level3Threshold) {
      return NextResponse.json(
        { error: 'Thresholds must be in ascending order: Level 1 < Level 2 < Level 3' },
        { status: 400 }
      );
    }

    // Update course settings
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        targetPercentage: coTarget,
        level1Threshold,
        level2Threshold,
        level3Threshold,
      },
      select: {
        id: true,
        targetPercentage: true,
        level1Threshold: true,
        level2Threshold: true,
        level3Threshold: true,
      }
    });

    const settings = {
      coTarget: updatedCourse.targetPercentage,
      level1Threshold: updatedCourse.level1Threshold,
      level2Threshold: updatedCourse.level2Threshold,
      level3Threshold: updatedCourse.level3Threshold,
    };

    console.log(`✅ API: Course settings updated successfully for ${courseId}:`, settings);

    return NextResponse.json({
      message: 'Course settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating course settings:', error);
    return NextResponse.json(
      { error: 'Failed to update course settings' },
      { status: 500 }
    );
  }
}