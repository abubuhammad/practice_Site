# Bulk Question Upload Guide

## Overview
The Bulk Question Upload feature allows administrators to import multiple questions at once using Excel (.xlsx), CSV (.csv), or JSON (.json) files.

## Quick Start

### 1. Download the Template
1. Navigate to **Admin → Bulk Upload** in the navigation menu
2. Click the **"Download Template"** button
3. The template file (`question-bulk-template.xlsx`) will be downloaded to your computer

### 2. Template Structure

The template includes two sheets:

#### **Questions Sheet**
Contains the actual question data with the following columns:

| Column Name | Required | Description |
|------------|----------|-------------|
| `question_text` | ✅ Yes | The text of the question |
| `question_type` | ❌ No | Type of question (default: "multiple_choice") |
| `explanation` | ❌ No | Explanation shown after answering |
| `order_index` | ❌ No | Numeric value to control question order |
| `case_study_title` | ❌ No | Title of associated case study |
| `case_study_scenario` | ❌ No | Scenario text for case study |
| `option_1` | ✅ Yes | First answer option |
| `option_2` | ✅ Yes | Second answer option |
| `option_3` | ❌ No | Third answer option |
| `option_4` | ❌ No | Fourth answer option |
| `correct_answer_index` | ✅ Yes | Index of correct answer (1-based) |

**Note:** You can add more option columns (option_5, option_6, etc.) if needed.

#### **Instructions Sheet**
Contains detailed field descriptions and usage notes.

### 3. Fill in Your Questions

1. **Delete the sample data rows** (keep the header row!)
2. Add your questions, one per row
3. Fill in all required fields
4. For `correct_answer_index`, use 1-based indexing:
   - `1` = option_1 is correct
   - `2` = option_2 is correct
   - `3` = option_3 is correct
   - etc.

#### Example Row:
```
question_text: "What is Microsoft Azure?"
question_type: "multiple_choice"
explanation: "Azure is Microsoft's cloud computing platform..."
order_index: 1
option_1: "A cloud computing platform"
option_2: "A database management system"
option_3: "An operating system"
option_4: "A programming language"
correct_answer_index: 1
```

### 4. Upload Your File

1. Go to **Admin → Bulk Upload**
2. Select the exam you want to add questions to
3. Click **"Choose File"** and select your filled template
4. The system will preview your data
5. Map the columns (usually auto-detected correctly)
6. Click **"Upload Questions"**
7. Review the upload summary

## Column Mapping

The upload page allows you to map your spreadsheet columns to question fields. This is useful if:
- Your column names are different from the template
- You want to use a custom format
- You're importing from an existing spreadsheet

### Correct Answer Modes

You can specify how correct answers are indicated:

1. **Index (1-based)** - Default
   - Use a single column with the index number (1, 2, 3, etc.)
   - Example: `correct_answer_index: 2`

2. **Exact option text**
   - Use the exact text of the correct option
   - Example: `correct_answer: "A cloud computing platform"`

3. **Boolean columns**
   - Add a boolean column for each option (e.g., `option_1_isCorrect`)
   - Mark the correct option as `true` or `1`

## Case Studies

If your questions belong to case studies:

1. Fill in `case_study_title` and `case_study_scenario`
2. Choose the case study mode:
   - **Link to existing** - Links to case studies that already exist
   - **Create missing** - Automatically creates new case studies if they don't exist

## File Formats

### Excel (.xlsx)
- **Recommended format**
- Supports multiple sheets
- Best for complex data with formatting

### CSV (.csv)
- Simple text format
- Use commas to separate columns
- First row must be headers

### JSON (.json)
- Array of objects format
- Each object represents one question
- Example:
```json
[
  {
    "question_text": "What is Azure?",
    "option_1": "Cloud platform",
    "option_2": "Database",
    "correct_answer_index": "1"
  }
]
```

## Troubleshooting

### Template is 0KB or blank
Run this command to regenerate the template:
```bash
cd backend
npm run generate:template
```

### Upload fails with "Invalid file"
- Ensure the file format is .xlsx, .csv, or .json
- Check that the header row exists and matches expected column names
- Verify the file is not corrupted

### Questions not appearing
- Check that you selected the correct exam
- Verify all required fields are filled
- Review the upload summary for errors

### Incorrect answers marked as correct
- Double-check your `correct_answer_index` values
- Remember: indexing is 1-based (starts at 1, not 0)
- Ensure the index matches the option number

## Tips for Success

1. **Start small** - Test with 2-3 questions first
2. **Keep the header row** - Never delete or modify column names
3. **Use the template** - It has the correct format and examples
4. **Check your data** - Preview shows the first 3 rows before upload
5. **Review the summary** - Check how many questions were imported vs. skipped

## Advanced Features

### Custom Column Names
You can use different column names in your spreadsheet and map them during upload:
- Upload your file
- Use the "Column Mapping" section to match your columns to question fields
- The system will remember your mapping for the session

### Bulk Updates
To update existing questions:
1. Export current questions (if available)
2. Modify the data
3. Re-upload with the same question identifiers

### Multiple Option Columns
Add as many option columns as needed:
- `option_1`, `option_2`, `option_3`, `option_4` (standard)
- `option_5`, `option_6`, `option_7`, etc. (additional)

## Need Help?

If you encounter issues:
1. Check the upload summary for specific error messages
2. Verify your file format matches the template
3. Ensure all required fields are filled
4. Review the Instructions sheet in the template

---

**Last Updated:** January 2025
**Template Version:** 1.0