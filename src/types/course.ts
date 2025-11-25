export type Course = {
  id: string;
  code: string;
  name: string;
  batchId: string;
  description: string | null | undefined;
  status: 'FUTURE' | 'ACTIVE' | 'COMPLETED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  batch?: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
      code: string;
    };
  };
  _count?: {
    enrollments: number;
    courseOutcomes: number;
    assessments: number;
  };
};

export type CourseWithDetails = Course & {
  batch: {
    id: string;
    name: string;
    program: {
      id: string;
      name: string;
      code: string;
      college: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      name: string;
      email: string | null;
      studentId: string | null;
    };
  }>;
  courseOutcomes: Array<{
    id: string;
    code: string;
    description: string;
  }>;
  assessments: Array<{
    id: string;
    name: string;
    type: string;
    maxMarks: number;
    weightage: number;
  }>;
  _count: {
    enrollments: number;
    courseOutcomes: number;
    assessments: number;
  };
};

export type CourseStatus = 'FUTURE' | 'ACTIVE' | 'COMPLETED';

export type CourseFormData = {
  code: string;
  name: string;
  batchId: string;
  description?: string;
  status?: CourseStatus;
};