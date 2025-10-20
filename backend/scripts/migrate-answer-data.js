const { promisePool } = require('../config/database');

async function migrateAnswerData() {
  try {
    console.log('🔄 Running migration to add answer_data support...');
    
    // Add answer_data column to answers table
    console.log('📝 Adding answer_data column to answers table...');
    await promisePool.query(`
      ALTER TABLE answers 
      ADD COLUMN answer_data JSON DEFAULT NULL
    `);
    console.log('✅ Added answer_data column');
    
    // Update question_type enum to include new question types
    console.log('📝 Updating question_type enum...');
    await promisePool.query(`
      ALTER TABLE questions 
      MODIFY COLUMN question_type ENUM(
        'single_choice', 
        'multiple_choice', 
        'yes_no',
        'case_study',
        'drag_drop_ordering', 
        'build_list',
        'matching',
        'fill_in_blank',
        'hotspot',
        'sequence_ordering',
        'simulation'
      ) DEFAULT 'single_choice'
    `);
    console.log('✅ Updated question_type enum');
    
    // Add additional columns for complex question data
    console.log('📝 Adding complex question data columns...');
    
    // Add columns for drag drop ordering
    await promisePool.query(`
      ALTER TABLE questions 
      ADD COLUMN drag_drop_ordering_data JSON DEFAULT NULL,
      ADD COLUMN build_list_data JSON DEFAULT NULL,
      ADD COLUMN matching_data JSON DEFAULT NULL,
      ADD COLUMN fill_in_blank_data JSON DEFAULT NULL,
      ADD COLUMN hotspot_data JSON DEFAULT NULL,
      ADD COLUMN sequence_ordering_data JSON DEFAULT NULL,
      ADD COLUMN simulation_data JSON DEFAULT NULL
    `);
    console.log('✅ Added complex question data columns');
    
    // Create hotspot_areas table for hotspot questions
    console.log('📝 Creating hotspot_areas table...');
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS hotspot_areas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question_id INT NOT NULL,
        label VARCHAR(255),
        coordinates JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        INDEX idx_question_id (question_id)
      )
    `);
    console.log('✅ Created hotspot_areas table');
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Changes made:');
    console.log('   - Added answer_data column to answers table');
    console.log('   - Updated question_type enum with new question types');
    console.log('   - Added complex question data columns to questions table');
    console.log('   - Created hotspot_areas table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('💡 Columns may already exist. Checking existing schema...');
      
      // Check if columns exist
      try {
        const [columns] = await promisePool.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'answers' 
          AND COLUMN_NAME = 'answer_data'
        `);
        
        if (columns.length > 0) {
          console.log('✅ answer_data column already exists');
        }
        
        const [qtColumns] = await promisePool.query(`
          SELECT COLUMN_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'questions' 
          AND COLUMN_NAME = 'question_type'
        `);
        
        if (qtColumns.length > 0) {
          console.log(`📊 Current question_type: ${qtColumns[0].COLUMN_TYPE}`);
        }
        
      } catch (checkError) {
        console.error('Error checking schema:', checkError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateAnswerData().then(() => process.exit(0));
}

module.exports = migrateAnswerData;