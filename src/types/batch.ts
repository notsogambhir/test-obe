export type Batch = {
  id: string;
  name: string;
  programId: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  program?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    students: number;
    courses: number;
  };
};

export type BatchWithDetails = Batch & {
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
  students: Array<{
    id: string;
    name: string;
    email: string | null;
    studentId: string | null;
  }>;
  courses: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
  }>;
  _count: {
    students: number;
    courses: number;
  };
};