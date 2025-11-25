# OBE Portal - Project State Document

## 1. High-Level Overview

### Purpose
The OBE (Outcome-Based Education) Management Portal is a comprehensive academic management system designed to help educational institutions implement and maintain compliance with National Board of Accreditation (NBA) requirements. The system provides tools for course management, student assessment tracking, outcome-based evaluation, and regulatory reporting.

### Core Functionality
- **Course Management**: Create, configure, and manage academic courses with learning outcomes and assessments
- **Assessment System**: Design assessments, track student performance, and calculate attainment levels
- **Student Management**: Enroll students, manage academic records, and track progress
- **Role-Based Access Control**: Different interfaces for administrators, coordinators, teachers, and students
- **Reporting & Analytics**: Generate compliance reports and visualize educational outcomes data
- **Program Outcome Mapping**: Map course outcomes to program outcomes for institutional assessment

### Target Audience
- **Educational Institutions**: Universities, colleges, and educational organizations seeking NBA compliance
- **Multiple User Roles**: Administrators, program coordinators, department heads, teachers, and students
- **Accreditation Bodies**: Institutions requiring systematic outcome-based education documentation

---

## 2. Architecture & Technology Stack

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5 for type safety and maintainability
- **Styling**: Tailwind CSS 4 with shadcn/ui component library
- **State Management**: React Context API for global state, Zustand for complex state
- **Routing**: File-based routing with protected routes
- **UI Components**: Custom components built on Radix UI primitives

### Backend Architecture
- **Server**: Next.js custom server (`server.ts`) with nodemon for development
- **Database**: Prisma ORM with SQLite for development and PostgreSQL for production
- **API Design**: RESTful API routes following Next.js 13+ conventions
- **Authentication**: JWT-based authentication with role-based access control
- **File Handling**: Local file uploads for bulk data operations

### Key Libraries & Dependencies
- **UI Framework**: shadcn/ui (New York style) with Radix UI primitives
- **Icons**: Lucide React icons for consistent iconography
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization and reporting
- **Data Tables**: Custom components with sorting, filtering, and pagination
- **Date Handling**: date-fns for date manipulation and formatting
- **HTTP Client**: Axios for API communication (fallback to fetch)

### Data Layer
- **ORM**: Prisma with typed database models
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **Schema**: Comprehensive relational model supporting multi-tenant academic structure

---

## 3. User Roles & Permissions

### Role Hierarchy
The system implements a hierarchical role-based access control model with the following user types:

#### **ADMIN (System Administrator)**
**Access Level**: **Full System Access**
- **Permissions**:
  - ✅ Create, read, update, delete all entities (colleges, programs, batches, courses, users)
  - ✅ Manage system settings and configurations
  - ✅ Access all reporting and analytics
  - ✅ Override any access restrictions
  - ✅ Manage teacher assignments across all programs
  - ✅ Bulk operations (course creation, user management)
  - ✅ View and manage all student data and assessments

#### **UNIVERSITY (Institution-Level Admin)**
**Access Level**: **Institution-Wide Access**
- **Permissions**:
  - ✅ Create, read, update programs and batches within institution
  - ✅ Manage courses across all programs in institution
  - ✅ Access reporting and analytics for institution
  - ✅ Manage department-level users
  - ✅ Bulk operations within scope
  - ❌ Cannot access other institutions' data
  - ❌ Cannot modify system-level settings

#### **DEPARTMENT (College/School Admin)**
**Access Level**: **College-Specific Access**
- **Permissions**:
  - ✅ Create, read, update programs and batches within assigned college
  - ✅ Manage courses within assigned college
  - ✅ Manage teachers and students within assigned college
  - ✅ Create and manage assessments for college courses
  - ✅ Access reporting for assigned college
  - ✅ Bulk operations within college scope
  - ❌ Cannot access other colleges' data
  - ❌ Cannot modify institution-level settings

#### **PROGRAM_COORDINATOR**
**Access Level**: **Program-Specific Access**
- **Permissions**:
  - ✅ Create and manage courses within assigned program
  - ✅ Manage course status (Future → Active → Completed)
  - ✅ Create and manage assessments for program courses
  - ✅ Enroll and manage students in program courses
  - ✅ View and edit course outcomes and PO mappings
  - ✅ Calculate and view CO/PO attainment reports
  - ✅ Bulk course operations within program
  - ❌ Cannot access other programs
  - ❌ Cannot modify program structure (requires admin/university)

#### **TEACHER**
**Access Level**: **Course-Specific Access**
- **Permissions**:
  - ✅ View assigned courses and course details
  - ✅ View enrolled students in assigned courses
  - ✅ Create and manage assessments for assigned courses
  - ✅ Upload and manage student marks and grades
  - ✅ View course outcomes and assessment details
  - ✅ Generate assessment templates for data entry
  - ✅ View CO attainment calculations for their students
  - ❌ Cannot create or delete courses
  - ❌ Cannot modify course structure
  - ❌ Cannot access other courses or programs
  - ❌ Cannot manage other teachers' assignments

#### **STUDENT**
**Access Level**: **Personal Data Access**
- **Permissions**:
  - ✅ View enrolled courses and basic course information
  - ✅ View own assessments and grades
  - ✅ View personal CO attainment reports
  - ✅ Download assessment templates (if permitted by teacher)
  - ❌ Cannot modify any data
  - ❌ Cannot access other students' information
  - ❌ Cannot view institution-wide analytics

### Permission Matrix Summary
| Feature | Admin | University | Department | Program Coordinator | Teacher | Student |
|---------|-------|-----------|----------|------------------|---------|
| **View All Courses** | ✅ | ✅ | ✅ (college only) | ❌ (program only) | ❌ (assigned only) | ❌ |
| **Create Courses** | ✅ | ❌ | ❌ | ✅ (program only) | ❌ | ❌ |
| **Delete Courses** | ✅ | ❌ | ✅ (if no students) | ❌ | ❌ | ❌ |
| **Manage Status** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assessments** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Student Grades** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **CO/PO Mapping** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Reports** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Bulk Operations** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 4. Application Flow & Page-by-Page Functionality

### User Journey & Authentication Flow

#### 1. **Login & Authentication**
**Entry Point**: `/` (root route)
**Process**:
1. User enters credentials (email, password, optional college ID)
2. System validates input format and authenticates against database
3. JWT token generated and stored in localStorage
4. User role and permissions loaded into React context
5. Redirect to appropriate dashboard based on role

**Authentication Mechanism**:
- JWT tokens with configurable expiration
- Role-based access control enforced at API level
- Context-based state management for user session
- Automatic token refresh and session validation

#### 2. **Role-Based Routing & Dashboard**

**Admin/University/Department Users**:
- **Dashboard** (`/admin`): Administrative hub with tabs for Colleges, Programs, Batches
- **Full Access**: Can navigate to any functional area
- **Management**: Complete CRUD operations across all entities

**Program Coordinators**:
- **Program Selection**: Required first-time login to select assigned program
- **Dashboard** (`/courses`): Course management with program-scoped view
- **Limited Scope**: Can only manage courses within assigned program

**Teachers**:
- **Program Selection**: Required first-time login to select assigned program  
- **Dashboard** (`/courses`): Read-only view of assigned courses
- **Course Management**: Access via "Manage" button on each course
- **Student Interaction**: Grade management, assessment creation

**Students**:
- **Dashboard** (`/courses`): View enrolled courses and basic information
- **Assessment Access**: View assigned assessments and grades
- **Limited Interface**: No management capabilities

#### 3. **Core Application Workflows**

##### **Course Management Workflow**
1. **Course Creation**: Admin/University/Department creates courses with basic information
2. **Course Structure Setup**: 
   - Define course outcomes (COs) with descriptions
   - Create assessments with weightage distribution
   - Map COs to Program Outcomes (POs)
   - Set target attainment thresholds
3. **Batch & Section Assignment**: Assign courses to specific academic batches and sections
4. **Student Enrollment**: Bulk or individual student enrollment in courses
5. **Status Management**: Transition courses through lifecycle (Future → Active → Completed)

##### **Assessment Management Workflow**
1. **Assessment Design**: Create various assessment types (exams, quizzes, assignments, projects)
2. **Question Bank**: Add questions with maximum marks and CO mappings
3. **Template Generation**: Auto-generate Excel templates for data entry
4. **Grade Management**: 
   - Individual student grade entry
   - Bulk grade upload via Excel/CSV
   - Automatic calculation of total and percentage scores
5. **CO Attainment**: Automatic calculation based on student performance

##### **Student Lifecycle**
1. **Enrollment**: Students assigned to courses and sections
2. **Assessment Participation**: Students take assessments and receive grades
3. **Performance Tracking**: System calculates individual and aggregate performance
4. **Progress Reports**: Students can view their academic progress and CO attainment

#### 4. **Navigation & User Experience**
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Contextual Navigation**: Sidebar navigation with role-based menu items
- **Breadcrumbs**: Clear navigation hierarchy for deep pages
- **Loading States**: Skeleton screens and loading indicators for better UX
- **Error Handling**: Comprehensive error boundaries and user feedback

---

## 5. Core Business Logic

### Course Outcome (CO) Attainment Calculation

#### **CO Attainment Formula**
```
Student CO Attainment (%) = (Student's Obtained Marks in CO ÷ Total Marks for CO) × 100
```

#### **Dynamic Denominator Logic**
The system implements a sophisticated dynamic denominator approach:

1. **Assessment-Level Calculation**: 
   - Each assessment has a weightage percentage
   - CO attainment is calculated per assessment
   - Final CO attainment is weighted average across all assessments

2. **Question-Level Granularity**:
   - Each question can be mapped to multiple COs
   - System tracks individual question performance
   - Supports partial credit and multiple CO mappings per question

3. **Threshold-Based Classification**:
   - **Level 1**: Student meets basic competency (e.g., 50-59%)
   - **Level 2**: Student demonstrates good competency (e.g., 60-79%)  
   - **Level 3**: Student shows excellent competency (e.g., 80-100%)
   - Customizable thresholds per course/institution

#### **Roll-Up Calculation**
- **Program Outcome (PO) Attainment**: Weighted aggregation of CO attainments
- **Institutional Targets**: Configurable target percentages for compliance
- **Historical Tracking**: Maintain attainment history for longitudinal analysis

### Data Flow Architecture

1. **Assessment Creation** → **Question Mapping** → **Student Performance** → **CO Attainment**
2. **Real-Time Calculation**: Attainment metrics updated as grades are entered
3. **Batch Processing**: Bulk operations for efficient data management
4. **Report Generation**: Automatic compliance and performance reports

### Key Business Rules

#### **Grade Management**
- **Minimum Score Validation**: Ensure grades don't exceed maximum marks
- **Data Consistency**: Maintain referential integrity across assessments
- **Audit Trail**: Track all grade modifications with timestamps and user attribution
- **Recovery Mechanisms**: Undo functionality for data entry errors

#### **Compliance Engine**
- **NBA Compliance**: Built-in templates for regulatory reporting
- **Institutional Standards**: Configurable outcome thresholds and metrics
- **Automated Reporting**: Scheduled generation of compliance reports
- **Exception Handling**: Clear protocols for special cases and grade appeals

---

## 6. Summary of Current State & Limitations

### ✅ **Current Implementation Status**
- **Complete Role-Based Access Control**: Fully implemented hierarchical permissions
- **Comprehensive Course Management**: Full CRUD operations with status tracking
- **Advanced Assessment System**: Multi-type assessments with CO mapping
- **Dynamic CO Attainment**: Real-time calculation with customizable thresholds
- **Responsive UI Design**: Mobile-optimized interface with progressive enhancement
- **Bulk Data Operations**: Efficient Excel/CSV import/export capabilities

### ⚠️ **Current Limitations**
- **Database**: SQLite database (development) - not production-ready
- **Data Persistence**: All data is stored in SQLite database without persistence layer
- **Real-Time Features**: No WebSocket implementation for live updates
- **Email Notifications**: No automated email system for notifications
- **File Storage**: Local file system (no cloud storage integration)
- **Multi-Tenancy**: Single-tenant architecture (not multi-institution)
- **Backup System**: No automated backup mechanism
- **API Rate Limiting**: No rate limiting implementation

### 🔧 **Recommended Production Enhancements**
1. **Database Migration**: PostgreSQL for production deployment
2. **Real-Time Updates**: WebSocket implementation for live grade updates and notifications
3. **Email Integration**: Automated notification system for assessment deadlines and events
4. **Cloud Storage**: Integration with cloud storage for file management
5. **Multi-Tenant Architecture**: Support for multiple institutions
6. **Backup System**: Automated daily database backups
7. **API Rate Limiting**: Implement usage controls and DDoS protection
8. **Caching Layer**: Redis integration for performance optimization

---

## 7. Development Guidelines

### For New Developers

#### **Understanding the Architecture**
1. **Start with `/src/app/page.tsx`**: Main application entry point
2. **Follow the Component Hierarchy**: `AppWrapper` → `GlobalLayout` → `Sidebar` → Page Components
3. **Role-Based Routing**: Different user experiences based on authentication context
4. **State Management**: Use React Context for global state, Zustand for complex component state

#### **Database Schema**
- **Study `prisma/schema.prisma`**: Comprehensive relational model
- **Understand Entity Relationships**: Courses → Batches → Programs → Colleges
- **Key Tables**: users, colleges, programs, batches, courses, assessments, questions, enrollments, grades

#### **API Development**
- **Follow Route Conventions**: RESTful APIs in `/src/app/api/`
- **Authentication First**: All routes require valid JWT token
- **Role-Based Authorization**: Implement permission checks at route level
- **Error Handling**: Use standardized error responses and logging

#### **Component Development**
- **Use shadcn/ui Components**: Leverage existing UI library
- **Follow Patterns**: Consistent styling and interaction patterns
- **TypeScript**: Maintain strict typing throughout the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Key Files to Understand
- `src/components/app-wrapper.tsx`: Application wrapper with authentication logic
- `src/components/global-layout.tsx`: Main layout with sidebar and content area
- `src/components/sidebar.tsx`: Navigation component with role-based menu items
- `src/hooks/use-auth.tsx`: Authentication hook and context provider
- `src/lib/auth.ts`: Authentication utilities and JWT handling
- `src/lib/db.ts`: Database connection and Prisma client
- Route components in `/src/app/(routes)/`: Page implementations for different user roles

This document provides a comprehensive foundation for understanding and extending the OBE Portal application. The system is well-architected with clear separation of concerns and robust role-based access control suitable for educational institution deployment.