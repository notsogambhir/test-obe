# Course Outcome (CO) Attainment Calculation System

This document explains the comprehensive CO attainment calculation system implemented in the OBE platform, following the exact two-stage process described in the requirements.

## Overview

The CO attainment calculation is a two-stage process designed to:
1. **Stage 1**: Measure individual student performance for each Course Outcome (CO)
2. **Stage 2**: Aggregate individual results to evaluate overall class performance

## Stage 1: Individual Student CO Attainment Calculation

### Purpose
Answers the question: "How well did a single student master a specific skill?"

### Process Flow

#### 1. Data Aggregation
For each student and CO combination, the system:
- Gets all assessments conducted for the sections the student is enrolled in
- Identifies all questions within those assessments
- Filters questions that have been mapped to the target CO
- Collects all marks the student has received in those assessments

#### 2. Handling Unattempted Questions (Key Design Choice)
- **Unattempted questions are completely ignored** - not treated as zero
- Both potential marks and maximum marks are excluded from the student's calculation
- This prevents unfair penalization for missed assessments

#### 3. Calculation Formula
```
Student CO Attainment % = (Total Obtained Marks on Attempted Questions / Total Maximum Marks of Attempted Questions) × 100
```

### Example Implementation

**Example 1: Standard Case (All Questions Attempted)**
- CO: "CO1: Understand database concepts"
- Questions mapped to CO1:
  - Sessional Test 1, Q2 (10 marks) - Student scored 8/10
  - Mid-Term Exam, Q4a (5 marks) - Student scored 4/5
  - Final Exam, Q1 (15 marks) - Student scored 10/15

**Calculation:**
- Total Obtained Marks = 8 + 4 + 10 = 22
- Total Maximum Marks = 10 + 5 + 15 = 30
- Attainment % = (22 / 30) × 100 = 73.33%

**Example 2: Unattempted Assessment**
- CO: "CO3: Formulate queries using SQL"
- Questions mapped to CO3:
  - Mid-Term Exam, Q5 (10 marks) - Student scored 7/10
  - Lab Assignment 3, Q1 (5 marks) - Student scored 5/5
  - Lab Assignment 3, Q2 (5 marks) - Student scored 3/5
  - Final Exam, Q6 (20 marks) - Student absent (no marks)

**Calculation:**
- Final Exam Q6 is completely ignored
- Total Obtained Marks = 7 + 5 + 3 = 15
- Total Maximum Marks = 10 + 5 + 5 = 20
- Attainment % = (15 / 20) × 100 = 75.00%

## Stage 2: Overall Course CO Attainment Calculation

### Purpose
Answers the question: "How well did the entire class master the learning outcome?"

### Step A: Calculate Percentage of Students Who Met Target

#### 1. Define CO Target
- Set by Program Coordinator in Course Settings (default: 60%)
- Minimum percentage an individual student must achieve to be considered "successful"

#### 2. Count Successful Students
- System iterates through every student in the course/section
- Performs individual CO attainment calculation (Stage 1) for each student
- Compares student's percentage with course target
- Counts students meeting or exceeding the target

#### 3. Calculate Class Success Rate
```
Class Success Rate % = (Number of Students Who Met Target / Total Number of Students) × 100
```

### Step B: Map Success Rate to Final Attainment Level (3-2-1 Buckets)

#### Attainment Level Thresholds
Set by Program Coordinator in Course Settings:
- **Level 3 (High)**: Highest threshold (default: 80%)
- **Level 2 (Medium)**: Middle threshold (default: 70%)
- **Level 1 (Low)**: Lowest threshold (default: 60%)
- **Level 0**: Below all thresholds

#### Mapping Logic
```javascript
if (ClassSuccessRate >= Level3Threshold) {
  AttainmentLevel = 3;
} else if (ClassSuccessRate >= Level2Threshold) {
  AttainmentLevel = 2;
} else if (ClassSuccessRate >= Level1Threshold) {
  AttainmentLevel = 1;
} else {
  AttainmentLevel = 0;
}
```

### Example Implementation

**Example 1: High Attainment Scenario**
- Course Settings:
  - CO Target: 50%
  - Level 3: 80%, Level 2: 70%, Level 1: 60%
- Class Size: 40 students
- CO2 Results: 34/40 students achieved ≥ 50%

**Calculation:**
- Step A: (34 / 40) × 100 = 85% class success rate
- Step B: 85% ≥ 80% → Final Attainment = Level 3

**Example 2: Borderline Attainment**
- Course Settings:
  - CO Target: 55%
  - Level 3: 85%, Level 2: 75%, Level 1: 65%
- Class Size: 120 students
- CO4 Results: 89/120 students achieved ≥ 55%

**Calculation:**
- Step A: (89 / 120) × 100 = 74.17% class success rate
- Step B: 74.17% < 75% but ≥ 65% → Final Attainment = Level 1

## Technical Implementation

### API Endpoints

#### 1. Course Settings API
```
GET /api/courses/[courseId]/settings
PUT /api/courses/[courseId]/settings
```
- Manages CO targets and attainment level thresholds
- Only Program Coordinators can modify settings

#### 2. CO Attainment Calculation API
```
GET /api/courses/[courseId]/attainments
POST /api/courses/[courseId]/attainments
```
- Calculates individual and class CO attainments
- Supports filtering by section, academic year, specific CO, or student
- Saves results to database when `force: true` is specified

### Core Calculator Class

The `COAttainmentCalculator` class implements the complete logic:

```typescript
// Individual student attainment
COAttainmentCalculator.calculateStudentCOAttainment(courseId, coId, studentId)

// Class CO attainment
COAttainmentCalculator.calculateClassCOAttainment(courseId, coId, filters)

// Full course attainment
COAttainmentCalculator.calculateCourseAttainment(courseId, filters)

// Save to database
COAttainmentCalculator.saveAttainments(courseId, studentAttainments, academicYear)
```

### Database Schema

#### Course Settings
- `targetPercentage`: Individual student target (default: 50%)
- `level1Threshold`: Level 1 threshold (default: 50%)
- `level2Threshold`: Level 2 threshold (default: 70%)
- `level3Threshold`: Level 3 threshold (default: 80%)
- `internalWeightage`: Internal assessment weightage (default: 40%)
- `externalWeightage`: External assessment weightage (default: 60%)

#### CO Attainment Storage
- `COAttainment` table stores individual student results
- Includes: courseId, coId, studentId, percentage, metTarget, calculatedAt
- Supports filtering by academic year and section

## Frontend Integration

### Overview Tab
- Displays and allows editing of course settings
- Shows CO target, assessment weightage, and attainment level thresholds
- Real-time validation of threshold values and weightage sums

### CO Attainments Tab
- Shows calculated attainment results for all COs
- Displays individual student breakdowns
- Supports manual recalculation of attainments
- Visual representation of attainment levels and distributions

### Key Features
- **Real-time Calculation**: On-demand calculation with detailed logging
- **Historical Tracking**: Academic year filtering for historical analysis
- **Section-level Analysis**: Independent calculation for each section
- **Visual Feedback**: Color-coded attainment levels and progress indicators
- **Comprehensive Reporting**: Detailed breakdown for accreditation requirements

## Usage Flow

1. **Setup**: Program Coordinator configures course settings in Overview tab
2. **Data Entry**: Teachers upload marks through Marks Upload tab
3. **Mapping**: Questions are mapped to COs through assessment management
4. **Calculation**: System calculates attainments using the two-stage process
5. **Analysis**: Results viewed in CO Attainments tab with detailed breakdowns
6. **Reporting**: Data available for accreditation and institutional reporting

This implementation ensures accurate, fair, and transparent CO attainment calculations that align with NBA accreditation requirements and educational best practices.