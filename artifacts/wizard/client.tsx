import { Artifact } from '@/components/create-artifact';
import { ClockRewind, UndoIcon, RedoIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'radio';
  options?: string[];
}

interface WizardContent {
  questions: Question[];
  answers: Record<string, string>;
  recommendation?: string;
}

interface WizardMetadata {
  currentStep: number;
  isSubmitted: boolean;
}

export const wizardArtifact = new Artifact<'wizard', WizardMetadata>({
  kind: 'wizard',
  description: 'A step-by-step wizard for answering questions.',
  
  initialize: async ({ setMetadata }) => {
    setMetadata({
      currentStep: 0,
      isSubmitted: false,
    });
  },

  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'wizard-data') {
      const questions = streamPart.content as any[];
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: {
          questions: questions.map((q, index) => ({
            id: `q${index + 1}`,
            question: q.question || q,
            type: 'text',
            options: [],
          })),
          answers: {},
        },
        status: 'streaming',
        isVisible: true,
      }));
    }
  },

  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
    setMetadata,
  }) => {
    if (isLoading || !content) {
      return <div>Loading wizard...</div>;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return (
        <div>
          <h3>Diff View</h3>
          <pre>{JSON.stringify(oldContent, null, 2)}</pre>
          <pre>{JSON.stringify(newContent, null, 2)}</pre>
        </div>
      );
    }

    const wizardContent = content as WizardContent;
    const [answers, setAnswers] = useState<Record<string, string>>(() => {
      const saved = localStorage.getItem(`wizard-${currentVersionIndex}`);
      return saved ? JSON.parse(saved) : (wizardContent.answers || {});
    });
    const [recommendation, setRecommendation] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      localStorage.setItem(`wizard-${currentVersionIndex}`, JSON.stringify(answers));
    }, [answers, currentVersionIndex]);

    const currentStep = metadata?.currentStep || 0;
    const currentQuestion = wizardContent.questions[currentStep];

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
      if (currentStep < wizardContent.questions.length - 1) {
        setMetadata({ ...metadata, currentStep: currentStep + 1 });
      }
    };

    const handlePrevious = () => {
      if (currentStep > 0) {
        setMetadata({ ...metadata, currentStep: currentStep - 1 });
      }
    };

    const handleFinish = async () => {
      setIsSubmitting(true);
      try {
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
          method: "POST",
          headers: {
            "Authorization": "Bearer app-NNHbfEHHSv5hdb4njvwzt6Hz",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {},
            query: `Based on your preferences:\n\n${wizardContent.questions
              .map((q) => `• ${q.question}\n  Answer: ${answers[q.id] || 'Not answered'}`)
              .join("\n\n")}`,
            response_mode: "blocking",
            user: "test_122",
          }),
        });

        const data = await response.json();
        setRecommendation(data.answer);
        
        onSaveContent({
          ...wizardContent,
          answers,
          recommendation: data.answer,
        });
        
        localStorage.removeItem(`wizard-${currentVersionIndex}`);
        toast.success('Answers submitted successfully!');
      } catch (error) {
        console.error('Error submitting answers:', error);
        toast.error('Failed to submit answers. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const isLastStep = currentStep === wizardContent.questions.length - 1;
    const canProceed = answers[currentQuestion?.id]?.trim() !== '';

    return (
      <div className="wizard-container">
        <div className="wizard-header">
          <h2 className="wizard-title">
            Step {currentStep + 1} of {wizardContent.questions.length}
          </h2>
          <span className="wizard-progress">
            {Math.round(((currentStep + 1) / wizardContent.questions.length) * 100)}% Complete
          </span>
        </div>
        
        <div className="wizard-question">
          <div className="flex items-start gap-2">
            <span className="wizard-question-number">
              {currentStep + 1}.
            </span>
            <p className="wizard-question-text flex-1">
              {currentQuestion?.question}
            </p>
          </div>
          <div className="pl-6">
            <input
              type="text"
              value={answers[currentQuestion?.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion?.id, e.target.value)}
              placeholder="Type your answer here..."
              className="wizard-input mt-2"
              autoFocus
            />
          </div>
        </div>

        <div className="wizard-navigation">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="wizard-btn-previous"
          >
            Previous
          </button>
          {isLastStep ? (
            <button 
              onClick={handleFinish}
              disabled={!canProceed || isSubmitting}
              className="wizard-btn-finish"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : (
            <button 
              onClick={handleNext}
              disabled={!canProceed}
              className="wizard-btn-next"
            >
              Next
            </button>
          )}
        </div>

        {recommendation && (
          <div className="mt-8 border-t pt-6">
            <div className="wizard-summary">
              <h3 className="text-lg font-semibold mb-4">Your Summary:</h3>
              {wizardContent.questions.map((q) => (
                <div key={q.id} className="mb-2">
                  <span className="font-medium">{q.question}</span>
                  <p className="text-gray-600 dark:text-gray-300 ml-4">
                    {answers[q.id]}
                  </p>
                </div>
              ))}
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Our Recommendations:</h3>
                <div className="recommendation p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {recommendation}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },

  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    }
  ],
}); 