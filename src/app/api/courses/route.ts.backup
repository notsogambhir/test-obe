import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const collegeId = searchParams.get('collegeId');
    
    console.log('GET /api/courses called');
    console.log('Batch ID from params:', batchId);
    console.log('College ID from params:', collegeId);
    
    // Get the authenticated user to check permissions
    const user = await getUserFromRequest(request);
    console.log('Authenticated user:', user ? { id: user.id, role: user.role, batchId: user.batchId, collegeId: user.collegeId, programId: user.programId } : 'null');
    
    let courses;
    let coursesCount = 0;
    
    if (batchId) {
      // If batchId is provided, get courses for that specific batch
      // Verify user has access to this batch
      if (!user) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
      
      // For program coordinators, verify they have access to this batch
      if (user.role === 'PROGRAM_COORDINATOR') {
        const batch = await db.batch.findUnique({
          where: { id: batchId },
          include: { program: true }
        });
        
        if (!batch || batch.programId !== user.programId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
      
      courses = await db.course.findMany({
        where: {
          batchId: batchId
        },
        include: {
          batch: {
            include: {
              program: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          _count: {
            select: {
              courseOutcomes: true,
              assessments: true,
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      coursesCount = courses.length;
      console.log(`Found ${coursesCount} courses for batchId ${batchId}`);
    } else if (collegeId) {
      // If collegeId is provided, get courses from that college
      if (!user) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
      
      courses = await db.course.findMany({
        where: {
          batch: {
            program: {
              collegeId: collegeId
            }
          }
        },
        include: {
          batch: {
            include: {
              program: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          _count: {
            select: {
              courseOutcomes: true,
              assessments: true,
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // If no batchId, return courses based on user role
      if (!user) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
      
      switch (user.role) {
        case 'ADMIN':
        case 'UNIVERSITY':
          // Admin and University users can see all courses
          courses = await db.course.findMany({
            include: {
              batch: {
                include: {
                  program: {
                    select: {
                      name: true,
                      code: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  courseOutcomes: true,
                  assessments: true,
                  enrollments: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          break;
          
        case 'DEPARTMENT':
          // Department users can see courses from their college's programs
          courses = await db.course.findMany({
            where: {
              batch: {
                program: {
                  collegeId: user.collegeId
                }
              }
            },
            include: {
              batch: {
                include: {
                  program: {
                    select: {
                      name: true,
                      code: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  courseOutcomes: true,
                  assessments: true,
                  enrollments: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          break;
          
        case 'PROGRAM_COORDINATOR':
          // Program coordinators can see courses from their programs
          courses = await db.course.findMany({
            where: {
              batch: {
                programId: user.programId || undefined
              }
            },
            include: {
              batch: {
                include: {
                  program: {
                    select: {
                      name: true,
                      code: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  courseOutcomes: true,
                  assessments: true,
                  enrollments: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          break;
          
        default:
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    console.log(`Returning ${coursesCount} courses`);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/courses called');
  try {
    const user = await getUserFromRequest(request);
    
    console.log('User from request:', user);
    
    if (!user) {
      console.log('No user found - returning 401');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admin, university, department, and program coordinator roles can create courses.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, batchId, description } = body;

    if (!code || !name || !batchId) {
      return NextResponse.json({ 
        error: 'Course code, name, and batch ID are required' 
      }, { status: 400 });
    }

    // Validate that the user has access to the specified batch
    if (user.role === 'PROGRAM_COORDINATOR') {
      const batch = await db.batch.findUnique({
        where: { id: batchId },
        include: {
          program: true
        }
      });

      if (!batch || batch.programId !== user.programId) {
        return NextResponse.json(
          { error: 'You can only create courses for batches in your assigned program' },
          { status: 403 }
        );
      }
    }

    const existingCourse = await db.course.findFirst({
      where: {
        code,
        batchId
      }
    });

    if (existingCourse) {
      return NextResponse.json({ 
        error: 'Course with this code already exists in this batch' 
      }, { status: 409 });
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const course = await db.course.create({
      data: {
        code,
        name,
        description: description || '',
        status: 'FUTURE',
        batchId
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}