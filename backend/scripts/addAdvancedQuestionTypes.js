const { promisePool } = require('../config/database');

async function addAdvancedQuestionTypes() {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🚀 Starting migration to add advanced question types...');
    
    // 1. Update questions table to add new question types
    console.log('📝 Updating questions table with new question types...');
    await connection.query(`
      ALTER TABLE questions 
      MODIFY COLUMN question_type ENUM(
        'single_choice', 
        'multiple_choice', 
        'drag_drop', 
        'hotspot',
        'drag_drop_ordering',
        'build_list', 
        'simulation',
        'active_screen',
        'testlet',
        'fill_in_blank',
        'matching',
        'sequence_ordering',
        'yes_no',
        'case_study'
      ) DEFAULT 'single_choice'
    `);
    
    // 2. Create drag_drop_ordering_data table
    console.log('📝 Creating drag_drop_ordering_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS drag_drop_ordering_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        drag_items JSON NOT NULL COMMENT 'Array of draggable items with id, text, correct_position',
        drop_zones JSON NOT NULL COMMENT 'Array of drop zones with id, label, position',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 3. Create build_list_data table
    console.log('📝 Creating build_list_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS build_list_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        available_items JSON NOT NULL COMMENT 'Array of items that can be added to the list',
        correct_list JSON NOT NULL COMMENT 'Array of correct items in correct order',
        max_items INT DEFAULT NULL COMMENT 'Maximum number of items in the list',
        allow_duplicates BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 4. Create simulation_data table
    console.log('📝 Creating simulation_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS simulation_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        simulation_type VARCHAR(50) DEFAULT 'general' COMMENT 'Type: azure_portal, powershell, cmd, gui, etc.',
        initial_state JSON COMMENT 'Initial configuration/state of the simulation',
        tasks JSON NOT NULL COMMENT 'Array of tasks the user needs to complete',
        validation_rules JSON NOT NULL COMMENT 'Rules to validate user actions',
        solution_steps JSON COMMENT 'Step-by-step solution for reference',
        time_limit_seconds INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 5. Create active_screen_data table
    console.log('📝 Creating active_screen_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS active_screen_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        screen_image_url VARCHAR(500),
        interactive_elements JSON NOT NULL COMMENT 'Array of clickable/interactive elements with coordinates and actions',
        correct_actions JSON NOT NULL COMMENT 'Array of correct actions user should perform',
        validation_mode ENUM('exact_sequence', 'any_order', 'contains_required') DEFAULT 'exact_sequence',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 6. Create testlet_data table
    console.log('📝 Creating testlet_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS testlet_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        scenario_text TEXT NOT NULL COMMENT 'The scenario/case study for this testlet',
        sub_questions JSON NOT NULL COMMENT 'Array of sub-questions within this testlet',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 7. Create fill_in_blank_data table
    console.log('📝 Creating fill_in_blank_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fill_in_blank_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        question_template TEXT NOT NULL COMMENT 'Question text with [BLANK_1], [BLANK_2], etc. placeholders',
        blanks JSON NOT NULL COMMENT 'Array of blanks with possible answers and correct answer',
        case_sensitive BOOLEAN DEFAULT FALSE,
        partial_credit BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 8. Create matching_data table
    console.log('📝 Creating matching_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS matching_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        left_column JSON NOT NULL COMMENT 'Array of items for the left column',
        right_column JSON NOT NULL COMMENT 'Array of items for the right column',
        correct_matches JSON NOT NULL COMMENT 'Array of correct matches {left_id, right_id}',
        allow_multiple_matches BOOLEAN DEFAULT FALSE COMMENT 'Can one left item match multiple right items',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 9. Create sequence_ordering_data table
    console.log('📝 Creating sequence_ordering_data table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sequence_ordering_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        instructions TEXT,
        sequence_items JSON NOT NULL COMMENT 'Array of items that need to be ordered',
        correct_order JSON NOT NULL COMMENT 'Array of item IDs in correct order',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 10. Update existing drag_drop to be more specific if needed
    console.log('📝 Checking if drag_drop needs updates...');
    const [dragDropExists] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'drag_drop_data'
    `);
    
    if (dragDropExists[0].count === 0) {
      console.log('📝 Creating drag_drop_data table for general drag-drop...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS drag_drop_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question_id INT NOT NULL,
          instructions TEXT,
          drag_items JSON NOT NULL COMMENT 'Items that can be dragged',
          drop_zones JSON NOT NULL COMMENT 'Areas where items can be dropped',
          correct_placements JSON NOT NULL COMMENT 'Correct item-zone mappings',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);
    }
    
    await connection.commit();
    console.log('✅ Migration completed successfully!');
    console.log('📊 Summary of changes:');
    console.log('  • Updated questions table with 9 new question types');
    console.log('  • Created drag_drop_ordering_data table');
    console.log('  • Created build_list_data table');
    console.log('  • Created simulation_data table');
    console.log('  • Created active_screen_data table');
    console.log('  • Created testlet_data table');
    console.log('  • Created fill_in_blank_data table');
    console.log('  • Created matching_data table');
    console.log('  • Created sequence_ordering_data table');
    console.log('  • Created drag_drop_data table (if not exists)');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration
if (require.main === module) {
  addAdvancedQuestionTypes()
    .then(() => {
      console.log('🎉 Advanced question types migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addAdvancedQuestionTypes };