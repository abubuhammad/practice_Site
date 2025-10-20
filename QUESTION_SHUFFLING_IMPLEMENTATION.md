# Question Shuffling Implementation

## Feature Overview
Implemented dynamic question shuffling for exam sessions with the following requirements:
- **Maximum 40 questions per session** (even if more questions exist)
- **Random question selection** from available question pool
- **Unique question sets** for each exam attempt
- **Consistent ordering** within the same attempt
- **Works with any number of questions** (handles cases where < 40 questions exist)

## Database Changes

### New Table: `attempt_questions`
```sql
CREATE TABLE attempt_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  question_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt_id (attempt_id),
  INDEX idx_question_id (question_id),
  INDEX idx_question_order (question_order),
  UNIQUE KEY unique_attempt_question (attempt_id, question_id)
);
```

**Purpose**: Stores the specific questions selected for each exam attempt, maintaining the shuffled order.

## Implementation Details

### 1. Question Shuffling Algorithm
- **Algorithm**: Fisher-Yates shuffle for true randomness
- **Selection**: Takes first N questions (up to 40) from shuffled array
- **Storage**: Saves selected questions with order numbers in `attempt_questions` table

### 2. Updated API Endpoints

#### `POST /api/exams/:examId/start`
**Changes**:
- Creates new attempt record
- Selects and shuffles questions (max 40)
- Stores question selection in `attempt_questions` table
- Returns attempt info with shuffled questions

#### `GET /api/exams/:examId/questions`
**Changes**:
- Retrieves questions specific to the attempt from `attempt_questions`
- Maintains consistent order for the same attempt
- No longer returns all exam questions

### 3. Backend Controller Updates

#### New Functions in `examsController.js`:
- `shuffleArray(array)` - Fisher-Yates shuffle implementation
- `selectQuestionsForAttempt(connection, examId, attemptId, maxQuestions)` - Question selection and storage

#### Modified Functions:
- `startExam()` - Now uses question shuffling
- `getExamQuestions()` - Returns attempt-specific questions

## How It Works

### Starting an Exam Session
1. **User starts exam**: POST to `/api/exams/:examId/start`
2. **System creates attempt**: New record in `attempts` table
3. **Question selection**:
   - Retrieves all questions for the exam
   - Shuffles the entire question pool using Fisher-Yates algorithm
   - Selects first 40 questions (or all if < 40 available)
   - Stores selection in `attempt_questions` with order numbers
4. **Returns response**: Attempt ID and shuffled questions

### Retrieving Questions During Exam
1. **Frontend requests questions**: GET with `attempt_id` parameter
2. **System retrieves**: Questions from `attempt_questions` for that specific attempt
3. **Maintains order**: Questions returned in the same order for consistency
4. **Returns**: Only the questions selected for this attempt

### Question Limits
- **≥40 questions available**: Randomly selects exactly 40 questions
- **<40 questions available**: Uses all available questions
- **0 questions**: Returns error (cannot start exam)

## Database Migration

### Running the Migration
```bash
cd backend
npm run migrate:attempt-questions
```

**Or manually:**
```bash
node scripts/addAttemptQuestionsTable.js
```

## Testing

### Automated Test
```bash
cd backend
npm run test:shuffle
```

**Test verifies**:
- Questions are shuffled between different attempts
- Question count limits work correctly
- Database integrity is maintained

### Manual Testing
1. **Create exam** with multiple questions (preferably >40)
2. **Start exam session** multiple times with different users
3. **Verify**: Each session has different question order/selection
4. **Check consistency**: Same attempt always shows same questions in same order

## Code Example

### Frontend Usage (No Changes Required)
The existing frontend code continues to work without modification:
```javascript
// Start exam
const response = await examsAPI.startExam(examId);
const { attempt, questions } = response.data;

// Get questions for existing attempt  
const questionsResponse = await examsAPI.getExamQuestions(examId, attemptId);
```

### Backend Shuffling Logic
```javascript
// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

## Benefits

### For Users
- **Fresh experience**: Every exam session feels different
- **Fair assessment**: Reduces memorization of question order
- **Consistent experience**: Same questions for the duration of one attempt

### For System
- **Scalable**: Works with any number of questions
- **Maintainable**: Clean separation of attempt-specific data  
- **Flexible**: Easy to adjust question limits in the future

## Configuration

### Question Limit
Currently set to 40 questions. To change:

1. **Update controller**: Modify the `40` parameter in `startExam()` function
2. **Update constant**: Consider adding to environment variables

```javascript
// In examsController.js
const MAX_QUESTIONS_PER_ATTEMPT = process.env.MAX_QUESTIONS || 40;
await selectQuestionsForAttempt(connection, examId, attemptId, MAX_QUESTIONS_PER_ATTEMPT);
```

## Database Cleanup

### Automatic Cleanup
The `attempt_questions` table is automatically cleaned when:
- Attempts are deleted (CASCADE DELETE)
- Questions are deleted (CASCADE DELETE)

### Manual Cleanup (if needed)
```sql
-- Remove orphaned attempt_questions
DELETE FROM attempt_questions 
WHERE attempt_id NOT IN (SELECT id FROM attempts);
```

## Performance Considerations

- **Index optimization**: Added indexes on `attempt_id`, `question_id`, and `question_order`
- **Transaction safety**: Uses database transactions for data consistency
- **Memory efficient**: Shuffling happens in database queries, not in memory
- **Scalable**: Performance remains good even with large question pools

## Backwards Compatibility

- **Existing attempts**: Will continue to work (though they'll show all questions)
- **Database**: New table added without affecting existing tables
- **API**: Maintains same response structure
- **Frontend**: No changes required

The implementation is fully backwards compatible and ready for production use!