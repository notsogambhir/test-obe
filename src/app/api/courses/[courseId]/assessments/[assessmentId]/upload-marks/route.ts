import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/server-auth';
import { canCreateCourse } from '@/lib/permissions';
import * as XLSX from 'xlsx';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string, assessmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId, assessmentId } = resolvedParams;

    if (!courseId || !assessmentId) {
      return NextResponse.json(
        { error: 'Course ID and Assessment ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user and check permissions
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (!canCreateCourse(user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload marks' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Only Excel files (.xlsx, .xls) are supported' },
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

    if (!assessment.sectionId) {
      return NextResponse.json(
        { error: 'Assessment must be associated with a section' },
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Excel file is empty' },
        { status: 400 }
      );
    }

    // Get students enrolled in the specific section for this assessment
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId,
        isActive: true,
        student: {
          sectionId: assessment.sectionId
        }
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
        const markKey = `Q${j + 1}`;
        const altMarkKey = `Question ${j + 1}`;
        const mark = row[markKey] || row[altMarkKey] || 0;
        
        const obtainedMarks = parseInt(mark) || 0;
        
        // Validate marks
        if (obtainedMarks < 0 || obtainedMarks > question.maxMarks) {
          errors.push(`Row ${i + 1}: Invalid marks for ${markKey}. Should be between 0 and ${question.maxMarks}`);
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