import React from 'react';
import { 
  TraditionalQuestionDisplay,
  HotspotDisplay,
  DragDropOrderingDisplay,
  BuildListDisplay,
  MatchingDisplay,
  FillInBlankDisplay,
  SequenceOrderingDisplay,
  SimulationDisplay
} from './index';
import { CaseStudyDisplay } from './CaseStudyDisplay';
import './QuestionPreview.css';

/**
 * Question Preview Component
 * Shows how questions will appear to exam takers in Microsoft exam format
 */
export const QuestionPreview = ({ question, showHeader = true, isPreviewMode = true }) => {
  if (!question) {
    return (
      <div className="question-preview-container">
        <div className="preview-error">
          No question data provided for preview
        </div>
      </div>
    );
  }

  const renderQuestionPreview = () => {
    // Mock answer data for preview purposes
    const mockAnswer = getMockAnswerForQuestionType(question.question_type);
    
    const questionProps = {
      question,
      answer: mockAnswer,
      onAnswerChange: () => {}, // No-op for preview
      isPreview: true
    };

    switch (question.question_type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'yes_no':
        return <TraditionalQuestionDisplay {...questionProps} />;
        
      case 'hotspot':
        return <HotspotDisplay {...questionProps} />;
        
      case 'drag_drop_ordering':
        return <DragDropOrderingDisplay {...questionProps} />;
        
      case 'build_list':
        return <BuildListDisplay {...questionProps} />;
        
      case 'matching':
        return <MatchingDisplay {...questionProps} />;
        
      case 'fill_in_blank':
        return <FillInBlankDisplay {...questionProps} />;
        
      case 'sequence_ordering':
        return <SequenceOrderingDisplay {...questionProps} />;
        
      case 'simulation':
        return <SimulationDisplay {...questionProps} />;
        
      case 'case_study':
        return (
          <CaseStudyDisplay
            question={question}
            caseStudy={{
              id: question.case_study_id,
              title: question.case_study_title || 'Sample Case Study',
              scenario: question.case_study_scenario || 'This is a sample case study scenario for preview purposes.'
            }}
            subQuestions={question.sub_questions || []}
            answers={{}}
            onAnswerChange={() => {}}
            currentSubQuestionIndex={0}
            onSubQuestionChange={() => {}}
          />
        );
        
      default:
        return (
          <div className="question-display">
            <div className="question-type-badge">
              {question.question_type?.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div className="question-text">{question.text}</div>
            <div className="preview-warning">
              Preview not available for question type: {question.question_type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="question-preview-container">
      {showHeader && (
        <div className="preview-header">
          <div className="preview-title">
            <h3>📋 Question Preview</h3>
            <span className="preview-subtitle">
              How this question will appear to exam takers
            </span>
          </div>
          <div className="question-type-info">
            <span className="type-label">Type:</span>
            <span className="type-value">
              {getQuestionTypeDisplayName(question.question_type)}
            </span>
          </div>
        </div>
      )}
      
      <div className="preview-content">
        {isPreviewMode && (
          <div className="preview-mode-indicator">
            <span className="indicator-text">👁️ Preview Mode</span>
            <span className="indicator-note">Interactions disabled</span>
          </div>
        )}
        
        <div className="question-preview-display">
          {renderQuestionPreview()}
        </div>
      </div>
      
      {showHeader && (
        <div className="preview-footer">
          <div className="preview-info">
            <span className="info-item">
              <strong>Question ID:</strong> {question.id || 'New'}
            </span>
            {question.explanation && (
              <span className="info-item">
                <strong>Has Explanation:</strong> ✅
              </span>
            )}
            <span className="info-item">
              <strong>Order:</strong> {question.order_index || 1}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Question Preview for lists/grids
 */
export const CompactQuestionPreview = ({ question, onClick }) => {
  return (
    <div className="compact-question-preview" onClick={onClick}>
      <div className="compact-header">
        <div className="question-type-badge compact">
          {getQuestionTypeDisplayName(question.question_type)}
        </div>
        <div className="question-id">#{question.id || 'New'}</div>
      </div>
      
      <div className="compact-content">
        <div className="question-text-preview">
          {truncateText(question.text, 100)}
        </div>
        
        <div className="compact-meta">
          {question.options?.length > 0 && (
            <span className="meta-item">
              {question.options.length} options
            </span>
          )}
          {question.explanation && (
            <span className="meta-item">Has explanation</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Question Type Examples Component
 * Shows examples of all question types
 */
export const QuestionTypeExamples = () => {
  const exampleQuestions = getExampleQuestions();
  
  return (
    <div className="question-type-examples">
      <div className="examples-header">
        <h2>📚 Question Type Examples</h2>
        <p>Preview of all supported Microsoft exam question types</p>
      </div>
      
      <div className="examples-grid">
        {Object.entries(exampleQuestions).map(([type, question]) => (
          <div key={type} className="example-card">
            <div className="example-header">
              <h3>{getQuestionTypeDisplayName(type)}</h3>
              <span className="example-type-code">{type}</span>
            </div>
            
            <div className="example-preview">
              <QuestionPreview 
                question={question} 
                showHeader={false} 
                isPreviewMode={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
const getMockAnswerForQuestionType = (questionType) => {
  switch (questionType) {
    case 'single_choice':
    case 'yes_no':
      return [1]; // First option selected
      
    case 'multiple_choice':
      return [1, 3]; // First and third options selected
      
    case 'hotspot':
      return [1]; // First hotspot area selected
      
    case 'drag_drop_ordering':
      return { 1: 2, 2: 1 }; // Items mapped to zones
      
    case 'build_list':
      return [
        { id: 1, text: 'First selected item', order: 1 },
        { id: 3, text: 'Second selected item', order: 2 }
      ];
      
    case 'matching':
      return [
        { left_id: 1, right_id: 1 },
        { left_id: 2, right_id: 2 }
      ];
      
    case 'fill_in_blank':
      return { 1: 'sample answer', 2: 'another answer' };
      
    case 'sequence_ordering':
      return [3, 1, 2, 4]; // Ordered item IDs
      
    default:
      return null;
  }
};

const getQuestionTypeDisplayName = (type) => {
  const displayNames = {
    'single_choice': 'Single Choice',
    'multiple_choice': 'Multiple Choice', 
    'yes_no': 'Yes/No',
    'drag_drop_ordering': 'Drag & Drop Ordering',
    'build_list': 'Build List',
    'matching': 'Matching',
    'fill_in_blank': 'Fill in the Blank',
    'hotspot': 'Hotspot',
    'sequence_ordering': 'Sequence Ordering',
    'simulation': 'Simulation',
    'case_study': 'Case Study'
  };
  
  return displayNames[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const getExampleQuestions = () => {
  return {
    'single_choice': {
      id: 1,
      text: 'Which Azure service provides Platform-as-a-Service (PaaS) for web applications?',
      question_type: 'single_choice',
      explanation: 'Azure App Service is a PaaS offering for hosting web applications.',
      options: [
        { id: 1, text: 'Azure Virtual Machines', is_correct: false },
        { id: 2, text: 'Azure App Service', is_correct: true },
        { id: 3, text: 'Azure Storage', is_correct: false },
        { id: 4, text: 'Azure Functions', is_correct: false }
      ]
    },
    
    'multiple_choice': {
      id: 2,
      text: 'Which Azure services provide compute capabilities? (Select all that apply)',
      question_type: 'multiple_choice',
      explanation: 'Multiple Azure services offer different types of compute resources.',
      options: [
        { id: 1, text: 'Azure Virtual Machines', is_correct: true },
        { id: 2, text: 'Azure Functions', is_correct: true },
        { id: 3, text: 'Azure Storage', is_correct: false },
        { id: 4, text: 'Azure App Service', is_correct: true }
      ]
    },
    
    'drag_drop_ordering': {
      id: 3,
      text: 'Match the Azure services with their appropriate categories',
      question_type: 'drag_drop_ordering',
      explanation: 'Understanding service categories helps with proper architecture.',
      drag_drop_ordering_data: {
        instructions: 'Drag the services to their correct category zones',
        drag_items: [
          { id: 1, text: 'Azure Virtual Machines' },
          { id: 2, text: 'Azure SQL Database' }
        ],
        drop_zones: [
          { id: 1, label: 'Infrastructure as a Service (IaaS)' },
          { id: 2, label: 'Platform as a Service (PaaS)' }
        ]
      }
    },
    
    'build_list': {
      id: 4,
      text: 'Build a list of deployment steps in the correct order',
      question_type: 'build_list',
      explanation: 'Proper deployment order ensures successful provisioning.',
      build_list_data: {
        instructions: 'Select and order the deployment steps (maximum 3 steps)',
        max_items: 3,
        available_items: [
          { id: 1, text: 'Create Resource Group', category: 'Setup' },
          { id: 2, text: 'Deploy ARM Template', category: 'Deployment' },
          { id: 3, text: 'Configure Settings', category: 'Config' },
          { id: 4, text: 'Test Application', category: 'Validation' }
        ]
      }
    },
    
    'matching': {
      id: 5,
      text: 'Match each Azure service with its primary category',
      question_type: 'matching',
      explanation: 'Understanding service categories is key to Azure architecture.',
      matching_data: {
        instructions: 'Match each service to its corresponding category',
        allow_multiple_matches: false,
        left_column: [
          { id: 1, text: 'Azure Virtual Machines' },
          { id: 2, text: 'Azure SQL Database' }
        ],
        right_column: [
          { id: 1, text: 'Infrastructure as a Service (IaaS)' },
          { id: 2, text: 'Platform as a Service (PaaS)' }
        ]
      }
    },
    
    'fill_in_blank': {
      id: 6,
      text: 'Complete the Azure PowerShell command',
      question_type: 'fill_in_blank',
      explanation: 'The New-AzResourceGroup cmdlet creates Azure resource groups.',
      fill_in_blank_data: {
        question_template: 'New-Az[BLANK_1] -Name "MyResourceGroup" -Location "[BLANK_2]"',
        blanks: [
          { blank_number: 1, expected_answers: ['ResourceGroup'], case_sensitive: false },
          { blank_number: 2, expected_answers: ['East US', 'West Europe'], case_sensitive: false }
        ]
      }
    },
    
    'hotspot': {
      id: 7,
      text: 'Click on the Load Balancer in the Azure portal diagram',
      question_type: 'hotspot',
      explanation: 'Load balancers distribute traffic across multiple instances.',
      hotspot_data: {
        image_url: '/images/azure-portal-diagram.png',
        image_width: 800,
        image_height: 600,
        instructions: 'Click on the correct areas to identify the Load Balancer'
      },
      hotspot_areas: [
        { id: 1, label: 'Load Balancer', coordinates: { x: 200, y: 150, width: 100, height: 50 } },
        { id: 2, label: 'Virtual Network', coordinates: { x: 350, y: 200, width: 120, height: 60 } }
      ]
    },
    
    'sequence_ordering': {
      id: 8,
      text: 'Arrange the deployment process steps in the correct order',
      question_type: 'sequence_ordering',
      explanation: 'Proper sequence ensures successful deployment.',
      sequence_ordering_data: {
        instructions: 'Put these steps in chronological order',
        sequence_items: [
          { id: 1, text: 'Create resource group' },
          { id: 2, text: 'Deploy ARM template' },
          { id: 3, text: 'Configure application settings' },
          { id: 4, text: 'Validate deployment' }
        ]
      }
    },
    
    'simulation': {
      id: 9,
      text: 'Configure the Azure Load Balancer for high availability',
      question_type: 'simulation',
      explanation: 'This simulation tests hands-on Azure configuration skills.',
      simulation_data: {
        scenario: 'You need to configure a Load Balancer to distribute traffic across 3 web servers',
        instructions: 'Follow the steps to configure the Load Balancer',
        tasks: [
          { id: 1, description: 'Create Load Balancer', type: 'configuration' },
          { id: 2, description: 'Add Backend Pool', type: 'configuration' },
          { id: 3, description: 'Configure Health Probe', type: 'configuration' }
        ]
      }
    },
    
    'case_study': {
      id: 10,
      text: 'Based on the migration scenario, answer the following questions',
      question_type: 'case_study',
      explanation: 'Case studies test real-world application of Azure knowledge.',
      case_study_title: 'Azure Migration Scenario',
      case_study_scenario: 'Contoso Ltd is planning to migrate their on-premises infrastructure to Azure. They have 100 VMs running various workloads including web servers, database servers, and domain controllers.',
      sub_questions: [
        {
          id: 101,
          text: 'What is the recommended migration approach?',
          question_type: 'single_choice',
          options: [
            { id: 1, text: 'Lift and shift migration' },
            { id: 2, text: 'Re-architected migration' },
            { id: 3, text: 'Hybrid approach' }
          ]
        }
      ]
    }
  };
};

export default QuestionPreview;