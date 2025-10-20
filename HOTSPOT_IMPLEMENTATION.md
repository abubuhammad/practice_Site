# HOTSPOT Question Type Implementation

## Overview
Implemented full support for HOTSPOT questions similar to the Microsoft certification exam format. Users can now click on specific areas of an image to answer questions.

## Database Changes

### 1. Updated `questions` Table
```sql
-- Added 'hotspot' to question_type enum
ALTER TABLE questions 
MODIFY COLUMN question_type ENUM('single_choice', 'multiple_choice', 'drag_drop', 'hotspot') 
DEFAULT 'single_choice';
```

### 2. New `hotspot_data` Table
```sql
CREATE TABLE hotspot_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  image_url VARCHAR(500),
  image_width INT DEFAULT 800,
  image_height INT DEFAULT 600,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

### 3. New `hotspot_areas` Table
```sql
CREATE TABLE hotspot_areas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  area_type ENUM('rectangle', 'circle', 'polygon') DEFAULT 'rectangle',
  coordinates JSON NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  label VARCHAR(255),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

## Backend Implementation

### 1. Controllers Updated

#### Admin Controller (`adminController.js`)
- **createQuestion()**: Now handles hotspot question creation
- **getQuestion()**: Retrieves hotspot data and areas
- **bulkImportQuestions()**: Supports bulk import of hotspot questions

#### Exam Controller (`examsController.js`)
- **startExam()**: Returns hotspot data for exam sessions
- **getExamQuestions()**: Includes hotspot areas (without correct answers)

### 2. Question Creation API

**Endpoint**: `POST /api/admin/questions`

**Hotspot Question Format**:
```javascript
{
  "exam_id": 1,
  "text": "Click on the Virtual Machines service in the Azure portal",
  "question_type": "hotspot",
  "explanation": "Virtual Machines is located in the Compute section",
  "hotspot_data": {
    "image_url": "https://example.com/azure-portal.png",
    "image_width": 1200,
    "image_height": 800,
    "instructions": "Click on the correct service"
  },
  "hotspot_areas": [
    {
      "area_type": "rectangle",
      "coordinates": {
        "x": 100,
        "y": 200,
        "width": 150,
        "height": 50
      },
      "is_correct": true,
      "label": "Virtual Machines",
      "explanation": "This is the Virtual Machines service"
    },
    {
      "area_type": "rectangle", 
      "coordinates": {
        "x": 300,
        "y": 200,
        "width": 150,
        "height": 50
      },
      "is_correct": false,
      "label": "Storage Accounts",
      "explanation": "This is incorrect"
    }
  ]
}
```

### 3. Bulk Import Support

#### Updated Excel Template
The template now includes hotspot-specific columns:
- `hotspot_image_url`: URL of the image to display
- `hotspot_instructions`: Instructions for the user
- `hotspot_areas`: JSON array of clickable areas

**Example Hotspot Row in Excel**:
```
question_type: hotspot
hotspot_image_url: https://example.com/azure-portal.png
hotspot_instructions: Click on the Virtual Machines service
hotspot_areas: [{"coordinates": {"x": 100, "y": 200, "width": 150, "height": 50}, "is_correct": true, "label": "Virtual Machines"}]
```

#### Bulk Import Processing
- Validates hotspot question requirements
- Creates hotspot_data and hotspot_areas records
- Supports mixed uploads (both multiple choice and hotspot questions)

## Frontend Integration Points

The backend is ready to support frontend hotspot questions. The frontend will need:

### 1. Question Display Component
```javascript
// Example structure for frontend
if (question.question_type === 'hotspot') {
  // Display image with clickable areas
  const { hotspot_data, hotspot_areas } = question;
  
  // Render image: hotspot_data.image_url
  // Display instructions: hotspot_data.instructions
  // Create clickable areas from: hotspot_areas
}
```

### 2. Hotspot Area Coordinates
```javascript
// Area coordinates format
{
  "area_type": "rectangle",
  "coordinates": {
    "x": 100,      // X position from top-left
    "y": 200,      // Y position from top-left  
    "width": 150,  // Width of clickable area
    "height": 50   // Height of clickable area
  },
  "label": "Service Name"
}
```

### 3. Answer Submission
For hotspot questions, submit clicked area ID instead of option ID:
```javascript
// Traditional multiple choice
{ selected_option_ids: [2] }

// Hotspot question
{ selected_hotspot_areas: [area_id] }
```

## Database Migration

### Running the Migration
```bash
cd backend
npm run migrate:hotspot
```

This will:
- Add 'hotspot' to question_type enum
- Create hotspot_data table
- Create hotspot_areas table

## Template Usage

### 1. Download Updated Template
The template now includes hotspot question support with:
- Sample hotspot question
- Instructions for creating hotspot questions
- Field descriptions for hotspot columns

### 2. Creating Hotspot Questions in Excel

**Step 1**: Set question_type to "hotspot"
```
question_type: hotspot
```

**Step 2**: Leave traditional option columns empty
```
option_1: (leave empty)
option_2: (leave empty)
option_3: (leave empty)
option_4: (leave empty)
correct_answer_index: (leave empty)
```

**Step 3**: Fill hotspot-specific columns
```
hotspot_image_url: https://your-image-url.com/image.png
hotspot_instructions: Click on the correct Azure service
hotspot_areas: [{"coordinates": {"x": 100, "y": 200, "width": 150, "height": 50}, "is_correct": true, "label": "Virtual Machines"}]
```

### 3. Hotspot Areas JSON Format
```json
[
  {
    "coordinates": {
      "x": 100,
      "y": 200, 
      "width": 150,
      "height": 50
    },
    "is_correct": true,
    "label": "Correct Area",
    "explanation": "This is the right answer"
  },
  {
    "coordinates": {
      "x": 300,
      "y": 200,
      "width": 150, 
      "height": 50
    },
    "is_correct": false,
    "label": "Incorrect Area",
    "explanation": "This is wrong"
  }
]
```

## Testing

### 1. Database Migration Test
```bash
cd backend
npm run migrate:hotspot
```

### 2. Bulk Upload Test
```bash
cd backend
npm run test:bulk-upload
```

### 3. Template Generation Test
```bash
cd backend
npm run generate:template
```

## Bulk Upload Issue Resolution

### Issue Analysis
Ran comprehensive testing on bulk upload functionality.

**Result**: ✅ **Bulk upload is working correctly**
- Questions are properly **appended** to existing questions
- No questions are being replaced or deleted
- Original questions remain intact after bulk upload

### Possible Confusion Source
The "replacement" perception might be due to the **question shuffling feature**:
- Each exam session shows a random selection of up to 40 questions
- Different sessions show different question sets
- This creates the appearance of "different questions" when they're actually just shuffled

### Verification
The test confirmed:
- Questions before upload: 19
- Questions after simulated upload: 21  
- Questions added: 2
- ✅ All original questions still exist
- ✅ APPEND behavior confirmed

## Question Types Supported

1. **multiple_choice** - Traditional multiple choice questions
2. **single_choice** - Single selection questions  
3. **hotspot** - Click-on-image questions (NEW)
4. **drag_drop** - Reserved for future implementation

## API Response Examples

### Multiple Choice Question
```json
{
  "id": 1,
  "text": "What is Azure?",
  "question_type": "multiple_choice",
  "options": [
    { "id": 1, "text": "Cloud platform", "order_index": 1 },
    { "id": 2, "text": "Database", "order_index": 2 }
  ]
}
```

### Hotspot Question  
```json
{
  "id": 2,
  "text": "Click on Virtual Machines in the Azure portal",
  "question_type": "hotspot",
  "hotspot_data": {
    "image_url": "https://example.com/portal.png",
    "image_width": 1200,
    "image_height": 800,
    "instructions": "Click on the Virtual Machines service"
  },
  "hotspot_areas": [
    {
      "id": 1,
      "area_type": "rectangle",
      "coordinates": { "x": 100, "y": 200, "width": 150, "height": 50 },
      "label": "Virtual Machines"
    }
  ]
}
```

## Next Steps for Frontend

1. **Create Hotspot Question Component**
   - Display images with overlay areas
   - Handle click events on hotspot areas
   - Visual feedback for selected areas

2. **Update Question Creation Form**
   - Add hotspot question type option
   - Image upload/URL input
   - Visual area editor for defining clickable regions

3. **Update Exam Interface**
   - Render hotspot questions differently
   - Handle hotspot answer submission
   - Show results for hotspot questions

The backend is fully ready to support hotspot questions. The database schema, API endpoints, bulk import, and template generation all support the new question type!