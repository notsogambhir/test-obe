import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse, canManageCourse, canTeacherManageCourse } from '@/lib/permissions';
import { CompliantCOAttainmentCalculator } from '@/lib/compliant-co-attainment-calculator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string }> }
) {
  try {
    console.log('🚀 Upload marks API called');
    const resolvedParams = await params;
    const { courseId, assessmentId } = resolvedParams;

    console.log('📋 Request params:', { courseId, assessmentId });

    if (!courseId || !assessmentId) {
      console.log('❌ Missing params');
      return NextResponse.json(
        { error: 'Course ID and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    console.log('👤 User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Check permissions - admins/PCs can manage course, teachers need to be assigned
    let hasPermission = canManageCourse(user) || canCreateCourse(user);
    
    // For teachers, we'll check assignment after fetching the assessment

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files (.csv) are supported' },
        { status: 400 }
      );
    }

    // Validate assessment exists and get questions, include section information
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        courseId,
        isActive: true
      },
      include: {
        questions: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Now check teacher permissions after we have the assessment
    if (user.role === 'TEACHER' && !hasPermission) {
      hasPermission = await canTeacherManageCourse(user.id, courseId, assessment.sectionId || undefined);
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload marks' },
        { status: 403 }
      );
    }

    // Note: sectionId is optional for assessments, allowing course-level assessments

    // Read CSV file
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    console.log('📊 CSV file processed:', {
      headers,
      rowCount: data.length,
      firstRow: data[0] || null
    });

    if (data.length === 0) {
      console.log('❌ CSV file is empty');
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Get students enrolled in the course
    // If assessment has a section, filter by that section, otherwise get all course students
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        isActive: true,
        ...(assessment.sectionId && {
          student: {
            sectionId: assessment.sectionId
          }
        })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        }
      }
    });

    const studentMap = new Map();
    console.log('📚 Found enrollments:', enrollments.length);
    enrollments.forEach(e => {
      studentMap.set(e.student.studentId, e.student);
      studentMap.set(e.student.email, e.student);
      studentMap.set(e.student.name, e.student);
    });

    // Process marks data
    const results: any[] = [];
    const errors: string[] = [];
    let processedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      // Try to find student by different identifiers
      let student: any = null;
      const possibleIdentifiers = [
        row['Student ID'],
        row['studentId'],
        row['student_id'],
        row['Email'],
        row['email'],
        row['Student Name'],
        row['studentName'],
        row['student_name']
      ];

      for (const identifier of possibleIdentifiers) {
        if (identifier && studentMap.has(identifier.toString())) {
          student = studentMap.get(identifier.toString());
          break;
        }
      }

      if (!student) {
        errors.push(`Row ${i + 1}: Student not found`);
        continue;
      }

      // Process marks for each question
      const questionMarks: any[] = [];
      for (let j = 0; j < assessment.questions.length; j++) {
        const question = assessment.questions[j];
        const maxMarks = question.maxMarks;
        
        // Try different possible column names for the question
        const possibleKeys = [
          `Q${j + 1}`,
          `Q${j + 1} (${maxMarks} marks)`,
          `Question ${j + 1}`,
          `Question ${j + 1} (${maxMarks} marks)`,
          `Q${j + 1}(${maxMarks} marks)`,
          `Question ${j + 1}(${maxMarks} marks)`
        ];
        
        let mark = undefined;
        for (const key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== '') {
            mark = row[key];
            break;
          }
        }
        
        // Keep mark as null if empty, otherwise parse as number
        const obtainedMarks = mark !== undefined && mark !== '' && mark !== null ? 
          (isNaN(Number(mark)) ? 0 : Number(mark)) : null;
        
        // Validate marks (only validate if marks are not null)
        if (obtainedMarks !== null && (obtainedMarks < 0 || obtainedMarks > question.maxMarks)) {
          errors.push(`Row ${i + 1}: Invalid marks for question ${j + 1}. Should be between 0 and ${question.maxMarks}`);
          continue;
        }

        questionMarks.push({
          questionId: question.id,
          obtainedMarks,
          maxMarks: question.maxMarks
        });
      }

      if (questionMarks.length === assessment.questions.length) {
        results.push({
          studentId: student.id,
          marks: questionMarks
        });
        processedCount++;
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No valid student records found in the file', errors },
        { status: 400 }
      );
    }

    // Save marks to database
    const academicYear = new Date().getFullYear().toString();
    const semester = ''; // Empty string since semester is no longer required

    await db.$transaction(async (tx) => {
      for (const result of results) {
        for (const mark of result.marks) {
          // Upsert student marks
          await tx.studentMark.upsert({
            where: {
              questionId_sectionId_studentId_academicYear: {
                questionId: mark.questionId,
                sectionId: assessment.sectionId || '',
                studentId: result.studentId,
                academicYear
              }
            },
            update: {
              obtainedMarks: mark.obtainedMarks,
              maxMarks: mark.maxMarks,
              submittedAt: new Date()
            },
            create: {
              questionId: mark.questionId,
              sectionId: assessment.sectionId || '',
              studentId: result.studentId,
              obtainedMarks: mark.obtainedMarks,
              maxMarks: mark.maxMarks,
              academicYear,
              submittedAt: new Date()
            }
          });
        }
      }
    });

    // Trigger CO attainment calculation after marks upload
    try {
      console.log('🔄 Triggering CO attainment calculation after marks upload...');
      await CompliantCOAttainmentCalculator.batchSaveCOAttainments(courseId, academicYear);
      console.log('✅ CO attainment calculation completed successfully');
    } catch (coError) {
      console.error('⚠️ Error calculating CO attainment after marks upload:', coError);
      // Don't fail the marks upload if CO calculation fails
      // Log the error but continue with success response
    }

    return NextResponse.json({
      message: 'Marks uploaded successfully',
      processedCount,
      totalRows: data.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error uploading marks:', error);
    return NextResponse.json(
      { error: 'Failed to upload marks' },
      { status: 500 }
    );
  }
}