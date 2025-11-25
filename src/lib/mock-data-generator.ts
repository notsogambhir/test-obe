import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

// Mock data generation utility
export class MockDataGenerator {
  /**
   * Generate comprehensive mock data for all colleges, programs, batches, students, courses, POs, COs, and CO-PO mappings
   */
  static async generateAllMockData() {
    console.log('🚀 Starting comprehensive mock data generation...');
    
    try {
      // 1. Create Colleges
      const colleges = await this.createColleges();
      console.log(`✅ Created ${colleges.length} colleges`);

      // 2. Create Programs for each college
      const programs = await this.createPrograms(colleges);
      console.log(`✅ Created ${programs.length} programs`);

      // 3. Create Batches for each program
      const batches = await this.createBatches(programs);
      console.log(`✅ Created ${batches.length} batches`);

      // 4. Create Students for each batch
      const students = await this.createStudents(batches);
      console.log(`✅ Created ${students.length} students`);

      // 5. Create Courses for each batch
      const courses = await this.createCourses(batches);
      console.log(`✅ Created ${courses.length} courses`);

      // 6. Create POs for each program
      const pos = await this.createPOs(programs);
      console.log(`✅ Created ${pos.length} POs`);

      // 7. Create COs for each course
      const cos = await this.createCOs(courses);
      console.log(`✅ Created ${cos.length} COs`);

      // 8. Create CO-PO mappings
      const coPOMappings = await this.createCOPOMappings(courses, cos, pos);
      console.log(`✅ Created ${coPOMappings.length} CO-PO mappings`);

      // 9. Create Users for authentication
      const users = await this.createUsers(colleges, students);
      console.log(`✅ Created ${users.length} users`);

      // 10. Create Enrollments
      const enrollments = await this.createEnrollments(students, courses);
      console.log(`✅ Created ${enrollments.length} enrollments`);

      console.log('🎉 Mock data generation completed successfully!');
      
      return {
        colleges: colleges.length,
        programs: programs.length,
        batches: batches.length,
        students: students.length,
        courses: courses.length,
        pos: pos.length,
        cos: cos.length,
        coPOMappings: coPOMappings.length,
        users: users.length,
        enrollments: enrollments.length
      };

    } catch (error) {
      console.error('❌ Error generating mock data:', error);
      throw error;
    }
  }

  /**
   * Create Colleges
   */
  private static async createColleges() {
    const colleges = [
      {
        name: 'Institute of Engineering and Technology',
        code: 'IET',
        description: 'Premier engineering institution focused on technical education and research',
        address: '123 Education Boulevard, Academic City, State 123456',
        phone: '+91-80-12345678',
        email: 'info@iet.edu',
        website: 'https://iet.edu',
        type: 'ENGINEERING'
      },
      {
        name: 'University of Computer Science',
        code: 'UCS',
        description: 'Leading institution for computer science education and innovation',
        address: '456 Tech Park Avenue, Silicon Valley, State 789012',
        phone: '+1-555-123-4567',
        email: 'admissions@ucs.edu',
        website: 'https://ucs.edu',
        type: 'UNIVERSITY'
      },
      {
        name: 'College of Management Studies',
        code: 'CMS',
        description: 'Business school offering comprehensive management and business administration programs',
        address: '789 Business District, Commerce City, State 345678',
        phone: '+91-22-34567890',
        email: 'info@cms.edu',
        website: 'https://cms.edu',
        type: 'MANAGEMENT'
      }
    ];

    const createdColleges = [];
    for (const college of colleges) {
      const created = await db.college.create({
        data: college
      });
      createdColleges.push(created);
    }

    return createdColleges;
  }

  /**
   * Create Programs for each college
   */
  private static async createPrograms(colleges: any[]) {
    const programTemplates = [
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        duration: 4,
        description: 'Comprehensive program covering computer science fundamentals and engineering principles',
        type: 'ENGINEERING'
      },
      {
        name: 'Information Technology',
        code: 'IT',
        duration: 4,
        description: 'Program focusing on information technology applications and systems',
        type: 'ENGINEERING'
      },
      {
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        duration: 4,
        description: 'Program covering electronics, communication systems, and embedded technologies',
        type: 'ENGINEERING'
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        duration: 4,
        description: 'Program covering mechanical design, thermodynamics, and manufacturing processes',
        type: 'ENGINEERING'
      },
      {
        name: 'Master of Business Administration',
        code: 'MBA',
        duration: 2,
        description: 'Graduate program focusing on business management and leadership',
        type: 'MANAGEMENT'
      },
      {
        name: 'Bachelor of Business Administration',
        code: 'BBA',
        duration: 3,
        description: 'Undergraduate program covering business fundamentals and management principles',
        type: 'MANAGEMENT'
      }
    ];

    const createdPrograms = [];
    for (const college of colleges) {
      // Assign relevant programs based on college type
      const relevantPrograms = college.type === 'ENGINEERING' 
        ? programTemplates.filter(p => p.type === 'ENGINEERING')
        : college.type === 'MANAGEMENT'
        ? programTemplates.filter(p => p.type === 'MANAGEMENT')
        : programTemplates.filter(p => p.type === 'UNIVERSITY');

      for (const program of relevantPrograms) {
        const created = await db.program.create({
          data: {
            ...program,
            collegeId: college.id
          }
        });
        createdPrograms.push(created);
      }
    }

    return createdPrograms;
  }

  /**
   * Create Batches for each program
   */
  private static async createBatches(programs: any[]) {
    const currentYear = new Date().getFullYear();
    const createdBatches = [];

    for (const program of programs) {
      // Create multiple batches per program
      const batchYears = program.duration === 2 
        ? [currentYear - 1, currentYear]  // 2-year program
        : [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];  // 4-year program

      for (let i = 0; i < batchYears.length; i++) {
        const batchName = `${batchYears[i]}-${batchYears[i] + 1}`;
        
        const created = await db.batch.create({
          data: {
            name: batchName,
            startYear: batchYears[i],
            endYear: batchYears[i] + 1,
            programId: program.id
          }
        });
        createdBatches.push(created);
      }
    }

    return createdBatches;
  }

  /**
   * Create Students for each batch
   */
  private static async createStudents(batches: any[]) {
    const firstNames = [
      'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Kavita', 'Suresh', 'Meena',
      'Arjun', 'Pooja', 'Karan', 'Neha', 'Aditya', 'Swati', 'Manish', 'Divya',
      'Rajesh', 'Lakshmi', 'Vijay', 'Anita', 'Mohan', 'Rekha', 'Sunil', 'Sunita'
    ];

    const lastNames = [
      'Kumar', 'Sharma', 'Verma', 'Singh', 'Patel', 'Yadav', 'Jain', 'Gupta', 'Mishra',
      'Reddy', 'Nair', 'Pillai', 'Choudhary', 'Mishra', 'Agarwal', 'Iyer', 'Pillai',
      'Shukla', 'Tripathi', 'Chaturvedi', 'Bhat', 'Joshi', 'Mehta'
    ];

    const createdStudents = [];
    let studentCounter = 1;

    for (const batch of batches) {
      // Create 40-60 students per batch
      const studentsInBatch = Math.floor(Math.random() * 20) + 40; // 40-60 students

      for (let i = 0; i < studentsInBatch; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const studentId = `${batch.name.replace('-', '')}${String(studentCounter).padStart(3, '0')}`;
        
        const created = await db.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentCounter}@mockmail.edu`,
            password: 'password123', // Default password
            role: 'STUDENT',
            studentId: studentId,
            collegeId: batch.program.collegeId,
            programId: batch.programId,
            batchId: batch.id,
            isActive: true
          }
        });
        createdStudents.push(created);
        studentCounter++;
      }
    }

    return createdStudents;
  }

  /**
   * Create Courses for each batch
   */
  private static async createCourses(batches: any[]) {
    const courseTemplates = {
      'CSE': [
        { name: 'Programming Fundamentals', code: 'CS101', credits: 4, semester: '1' },
        { name: 'Data Structures and Algorithms', code: 'CS102', credits: 4, semester: '1' },
        { name: 'Digital Logic Design', code: 'CS103', credits: 3, semester: '2' },
        { name: 'Computer Organization', code: 'CS104', credits: 4, semester: '2' },
        { name: 'Database Management Systems', code: 'CS105', credits: 4, semester: '3' },
        { name: 'Operating Systems', code: 'CS106', credits: 4, semester: '3' },
        { name: 'Computer Networks', code: 'CS107', credits: 4, semester: '4' },
        { name: 'Software Engineering', code: 'CS108', credits: 4, semester: '4' },
        { name: 'Theory of Computation', code: 'CS109', credits: 3, semester: '5' },
        { name: 'Compiler Design', code: 'CS110', credits: 3, semester: '5' },
        { name: 'Artificial Intelligence', code: 'CS111', credits: 3, semester: '6' },
        { name: 'Machine Learning', code: 'CS112', credits: 4, semester: '6' },
        { name: 'Web Technologies', code: 'CS113', credits: 3, semester: '7' },
        { name: 'Cybersecurity', code: 'CS114', credits: 3, semester: '7' },
        { name: 'Cloud Computing', code: 'CS115', credits: 3, semester: '8' }
      ],
      'ECE': [
        { name: 'Basic Electronics', code: 'EC101', credits: 4, semester: '1' },
        { name: 'Electronic Devices and Circuits', code: 'EC102', credits: 4, semester: '1' },
        { name: 'Digital Signal Processing', code: 'EC103', credits: 3, semester: '2' },
        { name: 'Analog and Digital Communication', code: 'EC104', credits: 4, semester: '2' },
        { name: 'Microprocessors and Microcontrollers', code: 'EC105', credits: 4, semester: '3' },
        { name: 'VLSI Design', code: 'EC106', credits: 3, semester: '3' },
        { name: 'Embedded Systems', code: 'EC107', credits: 4, semester: '4' },
        { name: 'Communication Engineering', code: 'EC108', credits: 4, semester: '4' },
        { name: 'Antenna and Wave Propagation', code: 'EC109', credits: 3, semester: '5' },
        { name: 'Digital Signal Processing Applications', code: 'EC110', credits: 3, semester: '5' },
        { name: 'Wireless and Mobile Communication', code: 'EC111', credits: 4, semester: '6' }
      ],
      'ME': [
        { name: 'Engineering Mathematics', code: 'ME101', credits: 4, semester: '1' },
        { name: 'Engineering Graphics', code: 'ME102', credits: 3, semester: '1' },
        { name: 'Mechanics of Solids', code: 'ME103', credits: 4, semester: '2' },
        { name: 'Fluid Mechanics', code: 'ME104', credits: 4, semester: '2' },
        { name: 'Thermodynamics', code: 'ME105', credits: 3, semester: '3' },
        { name: 'Manufacturing Processes', code: 'ME106', credits: 4, semester: '3' },
        { name: 'Machine Design', code: 'ME107', credits: 4, semester: '4' },
        { name: 'Industrial Engineering', code: 'ME108', credits: 3, semester: '4' },
        { name: 'Heat Transfer', code: 'ME109', credits: 3, semester: '5' },
        { name: 'Vibrations and Noise Control', code: 'ME110', credits: 3, semester: '5' }
      ],
      'MBA': [
        { name: 'Managerial Economics', code: 'MBA101', credits: 3, semester: '1' },
        { name: 'Financial Management', code: 'MBA102', credits: 3, semester: '1' },
        { name: 'Marketing Management', code: 'MBA103', credits: 3, semester: '2' },
        { name: 'Human Resource Management', code: 'MBA104', credits: 3, semester: '2' },
        { name: 'Operations Management', code: 'MBA105', credits: 3, semester: '3' },
        { name: 'Strategic Management', code: 'MBA106', credits: 3, semester: '3' },
        { name: 'Business Analytics', code: 'MBA107', credits: 3, semester: '4' }
      ],
      'BBA': [
        { name: 'Business Mathematics', code: 'BBA101', credits: 3, semester: '1' },
        { name: 'Financial Accounting', code: 'BBA102', credits: 4, semester: '1' },
        { name: 'Business Statistics', code: 'BBA103', credits: 3, semester: '2' },
        { name: 'Business Law', code: 'BBA104', credits: 3, semester: '2' },
        { name: 'Organizational Behavior', code: 'BBA105', credits: 3, semester: '3' },
        { name: 'Principles of Management', code: 'BBA106', credits: 4, semester: '3' }
      ]
    };

    const createdCourses = [];

    for (const batch of batches) {
      const programCode = batch.program.code;
      const coursesForProgram = courseTemplates[programCode as keyof typeof courseTemplates] || [];
      
      for (const course of coursesForProgram) {
        // Create a mix of course statuses for realistic OBE testing
        // Older batches have more completed courses
        const batchYear = parseInt(batch.name.split('-')[0]);
        const currentYear = new Date().getFullYear();
        const yearsSinceStart = currentYear - batchYear;
        
        let courseStatus: 'FUTURE' | 'ACTIVE' | 'COMPLETED' = 'ACTIVE';
        
        if (yearsSinceStart >= 4) {
          // Batches 4+ years old: mostly completed courses
          courseStatus = Math.random() > 0.2 ? 'COMPLETED' : 'ACTIVE';
        } else if (yearsSinceStart >= 2) {
          // Batches 2-3 years old: mix of active and completed
          courseStatus = Math.random() > 0.5 ? 'COMPLETED' : 'ACTIVE';
        } else if (yearsSinceStart >= 1) {
          // Batches 1-2 years old: mostly active courses
          courseStatus = Math.random() > 0.8 ? 'COMPLETED' : 'ACTIVE';
        } else {
          // Recent batches: mostly active courses, some future
          const rand = Math.random();
          if (rand > 0.9) courseStatus = 'FUTURE';
          else if (rand > 0.2) courseStatus = 'ACTIVE';
          else courseStatus = 'COMPLETED';
        }
        
        const created = await db.course.create({
          data: {
            ...course,
            batchId: batch.id,
            status: courseStatus
          }
        });
        createdCourses.push(created);
      }
    }

    return createdCourses;
  }

  /**
   * Create POs for each program
   */
  private static async createPOs(programs: any[]) {
    const poTemplates = {
      'ENGINEERING': [
        { code: 'PO1', description: 'Apply knowledge of mathematics, science, and engineering fundamentals' },
        { code: 'PO2', description: 'Design and conduct experiments, analyze data, and interpret results' },
        { code: 'PO3', description: 'Design systems, components, or processes to meet specified needs' },
        { code: 'PO4', description: 'Function effectively as an individual and as a member or leader in diverse teams' },
        { code: 'PO5', description: 'Understand professional and ethical responsibilities' },
        { code: 'PO6', description: 'Communicate effectively with a range of audiences' },
        { code: 'PO7', description: 'Use modern engineering tools, techniques, and skills' },
        { code: 'PO8', description: 'Understand the impact of engineering solutions in global context' },
        { code: 'PO9', description: 'Engage in lifelong learning to adapt to technological changes' },
        { code: 'PO10', description: 'Apply knowledge of management principles and practices' },
        { code: 'PO11', description: 'Understand financial, economic, and legal aspects of business' },
        { code: 'PO12', description: 'Use analytical and quantitative methods for business decision-making' }
      ],
      'MANAGEMENT': [
        { code: 'PO1', description: 'Demonstrate knowledge of core business disciplines' },
        { code: 'PO2', description: 'Apply analytical and critical thinking skills to business problems' },
        { code: 'PO3', description: 'Communicate effectively in business contexts' },
        { code: 'PO4', description: 'Lead and work effectively in diverse team environments' },
        { code: 'PO5', description: 'Apply ethical principles in business decision-making' },
        { code: 'PO6', description: 'Use information technology for business solutions' },
        { code: 'PO7', description: 'Understand global business environments and practices' },
        { code: 'PO8', description: 'Develop entrepreneurial mindset and innovation skills' }
      ]
    };

    const createdPOs = [];

    for (const program of programs) {
      const poSet = poTemplates[program.type as keyof typeof poTemplates] || poTemplates['ENGINEERING'];
      
      for (const po of poSet) {
        const created = await db.pO.create({
          data: {
            ...po,
            programId: program.id
          }
        });
        createdPOs.push(created);
      }
    }

    return createdPOs;
  }

  /**
   * Create COs for each course
   */
  private static async createCOs(courses: any[]) {
    const coTemplates = {
      'CS101': [
        { code: 'CO1', description: 'Understand basic programming concepts and problem-solving techniques' },
        { code: 'CO2', description: 'Apply fundamental data structures and algorithms' },
        { code: 'CO3', description: 'Use version control systems and collaborative development tools' }
      ],
      'CS102': [
        { code: 'CO1', description: 'Analyze time and space complexity of algorithms' },
        { code: 'CO2', description: 'Design and implement efficient data structures' },
        { code: 'CO3', description: 'Apply algorithmic problem-solving techniques' }
      ],
      'EC101': [
        { code: 'CO1', description: 'Understand basic electronic components and circuits' },
        { code: 'CO2', description: 'Apply Ohm\'s law and Kirchhoff\'s laws to circuit analysis' },
        { code: 'CO3', description: 'Use electronic measurement instruments and tools' }
      ],
      'ME101': [
        { code: 'CO1', description: 'Apply mathematical concepts to engineering problems' },
        { code: 'CO2', description: 'Understand principles of mechanics and statics' },
        { code: 'CO3', description: 'Use engineering graphics and CAD tools' }
      ],
      'MBA101': [
        { code: 'CO1', description: 'Understand microeconomic principles and market dynamics' },
        { code: 'CO2', description: 'Apply economic analysis to business decision-making' },
        { code: 'CO3', description: 'Evaluate financial statements and business performance' }
      ]
    };

    const createdCOs = [];

    for (const course of courses) {
      const courseCOs = coTemplates[course.code as keyof typeof coTemplates] || [];
      
      for (const co of courseCOs) {
        const created = await db.cO.create({
          data: {
            ...co,
            courseId: course.id
          }
        });
        createdCOs.push(created);
      }
    }

    return createdCOs;
  }

  /**
   * Create CO-PO mappings
   */
  private static async createCOPOMappings(courses: any[], cos: any[], pos: any[]) {
    const createdMappings = [];

    for (const course of courses) {
      const courseCOs = cos.filter(co => co.courseId === course.id);
      const programPOs = pos.filter(po => po.programId === course.batch.programId);

      for (const co of courseCOs) {
        // Map each CO to 2-4 relevant POs with random correlation levels
        const numPOsToMap = Math.floor(Math.random() * 3) + 2; // 2-4 POs per CO
        const selectedPOs = this.getRandomElements(programPOs, numPOsToMap);

        for (const po of selectedPOs) {
          const correlationLevel = Math.floor(Math.random() * 3) + 1; // Levels 1-3
          
          const created = await db.cOPOMapping.create({
            data: {
              coId: co.id,
              poId: po.id,
              courseId: course.id,
              level: correlationLevel
            }
          });
          createdMappings.push(created);
        }
      }
    }

    return createdMappings;
  }

  /**
   * Create Users for authentication
   */
  private static async createUsers(colleges: any[], students: any[]) {
    const adminUsers = [
      {
        name: 'System Administrator',
        email: 'admin@obe.system',
        password: 'admin123',
        role: 'ADMIN',
        collegeId: colleges[0]?.id
      },
      {
        name: 'University Director',
        email: 'director@university.edu',
        password: 'director123',
        role: 'UNIVERSITY',
        collegeId: colleges[1]?.id
      },
      {
        name: 'Department Head',
        email: 'hod@college.edu',
        password: 'hod123',
        role: 'DEPARTMENT',
        collegeId: colleges[0]?.id
      }
    ];

    const programCoordinators = [];
    for (const program of [...new Set(students.map(s => s.programId))]) {
      const programCoordinators = [
        {
          name: `PC ${program.code}`,
          email: `pc.${program.code.toLowerCase()}@college.edu`,
          password: 'pc123',
          role: 'PROGRAM_COORDINATOR',
          collegeId: program.collegeId,
          programId: program.id
        },
        {
          name: `Teacher 1 ${program.code}`,
          email: `teacher1.${program.code.toLowerCase()}@college.edu`,
          password: 'teacher123',
          role: 'TEACHER',
          collegeId: program.collegeId,
          programId: program.id
        },
        {
          name: `Teacher 2 ${program.code}`,
          email: `teacher2.${program.code.toLowerCase()}@college.edu`,
          password: 'teacher123',
          role: 'TEACHER',
          collegeId: program.collegeId,
          programId: program.id
        }
      ];
      programCoordinators.push(...programCoordinators);
    }

    const allUsers = [...adminUsers, ...programCoordinators];
    const createdUsers = [];

    for (const user of allUsers) {
      const created = await db.user.create({
        data: user
      });
      createdUsers.push(created);
    }

    return createdUsers;
  }

  /**
   * Create Enrollments
   */
  private static async createEnrollments(students: any[], courses: any[]) {
    const createdEnrollments = [];

    for (const course of courses) {
      const batchStudents = students.filter(student => student.batchId === course.batchId);
      
      // Enroll 80-90% of batch students in each course
      const enrollmentRate = 0.8 + Math.random() * 0.1; // 80-90%
      const numEnrollments = Math.floor(batchStudents.length * enrollmentRate);
      
      const selectedStudents = this.getRandomElements(batchStudents, numEnrollments);

      for (const student of selectedStudents) {
        const created = await db.enrollment.create({
          data: {
            courseId: course.id,
            studentId: student.id,
            isActive: true
          }
        });
        createdEnrollments.push(created);
      }
    }

    return createdEnrollments;
  }

  /**
   * Utility function to get random elements from array
   */
  private static getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Clean existing data and regenerate
   */
  static async cleanAndRegenerate() {
    console.log('🧹 Cleaning existing data and regenerating...');
    
    try {
      // Delete in order to respect foreign key constraints
      await db.enrollment.deleteMany({});
      await db.cOPOMapping.deleteMany({});
      await db.cO.deleteMany({});
      await db.course.deleteMany({});
      await db.pO.deleteMany({});
      await db.batch.deleteMany({});
      await db.user.deleteMany({
        where: {
          role: 'STUDENT'
        }
      });
      await db.program.deleteMany({});
      await db.college.deleteMany({});

      console.log('✅ Cleaned existing data');
      
      // Regenerate all data
      const result = await this.generateAllMockData();
      
      console.log('🎉 Mock data regeneration completed!');
      return result;
      
    } catch (error) {
      console.error('❌ Error during data regeneration:', error);
      throw error;
    }
  }
}