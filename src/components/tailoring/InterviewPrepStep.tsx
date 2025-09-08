import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageSquare, 
  Brain, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  Star,
  RefreshCw
} from 'lucide-react';

interface InterviewPrepStepProps {
  state: {
    insights: any[];
    questions: any[];
    skillGaps: any[];
    prepMaterials: any[];
  };
  onUpdate: (interview: any) => void;
  onPrev: () => void;
  profile: any;
  targetJob: any;
  tailoring: any;
}

const InterviewPrepStep: React.FC<InterviewPrepStepProps> = ({ 
  state, 
  onUpdate, 
  onPrev, 
  profile, 
  targetJob, 
  tailoring 
}) => {
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const { toast } = useToast();

  // Mock interview data
  const interviewInsights = [
    {
      type: 'strength',
      title: 'Strong Technical Background',
      description: 'Your React and TypeScript experience aligns perfectly with the role requirements.',
      impact: 'high'
    },
    {
      type: 'opportunity',
      title: 'API Integration Experience',
      description: 'Emphasize your API integration projects during the interview.',
      impact: 'medium'
    },
    {
      type: 'gap',
      title: 'GraphQL Knowledge',
      description: 'Consider mentioning your willingness to learn GraphQL quickly.',
      impact: 'low'
    }
  ];

  const practiceQuestions = [
    {
      id: 1,
      category: 'Technical',
      question: 'Can you walk me through how you would optimize a React application for performance?',
      tips: [
        'Mention React.memo and useMemo',
        'Discuss code splitting and lazy loading',
        'Talk about bundle optimization'
      ],
      difficulty: 'Medium',
      expectedDuration: '3-5 minutes'
    },
    {
      id: 2,
      category: 'Behavioral',
      question: 'Tell me about a time when you had to learn a new technology quickly for a project.',
      tips: [
        'Use the STAR method (Situation, Task, Action, Result)',
        'Highlight your learning approach',
        'Show measurable outcomes'
      ],
      difficulty: 'Easy',
      expectedDuration: '2-3 minutes'
    },
    {
      id: 3,
      category: 'Technical',
      question: 'How would you handle state management in a large React application?',
      tips: [
        'Compare different approaches (Context, Redux, Zustand)',
        'Discuss when to use each approach',
        'Mention performance considerations'
      ],
      difficulty: 'Hard',
      expectedDuration: '5-7 minutes'
    }
  ];

  const skillGaps = [
    {
      skill: 'GraphQL',
      priority: 'High',
      timeToLearn: '1-2 weeks',
      resources: ['GraphQL official docs', 'Apollo Client tutorial'],
      impact: 'Would significantly strengthen your application'
    },
    {
      skill: 'Advanced React Patterns',
      priority: 'Medium',
      timeToLearn: '2-3 weeks',
      resources: ['React patterns course', 'Advanced React hooks'],
      impact: 'Would demonstrate deep React knowledge'
    }
  ];

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Questions Generated",
        description: "Personalized interview questions based on the job requirements.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handlePracticeAnswer = () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer to practice.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Great Practice!",
      description: "Your answer has been recorded. Try to keep it concise and specific.",
    });
    setUserAnswer('');
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200 text-green-800';
      case 'opportunity': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'gap': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 5: Interview Preparation</h2>
        <p className="text-gray-600">Get personalized insights, practice questions, and skill gap analysis to ace your interview.</p>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="questions">Practice Questions</TabsTrigger>
          <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
          <TabsTrigger value="materials">Prep Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              Interview Insights
            </h3>
            
            <div className="space-y-4">
              {interviewInsights.map((insight, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 text-center">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">78%</div>
              <div className="text-sm text-gray-600">Job Match Score</div>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">Interview Readiness</div>
            </Card>
            <Card className="p-4 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">2</div>
              <div className="text-sm text-gray-600">Skill Gaps</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                Practice Questions
              </h3>
              <Button 
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
                variant="outline"
              >
                {generatingQuestions ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate More
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question List */}
              <div className="lg:col-span-1 space-y-3">
                {practiceQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuestion === index 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedQuestion(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getDifficultyColor(q.difficulty)}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-xs text-gray-500">{q.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">
                      {q.question}
                    </p>
                  </div>
                ))}
              </div>

              {/* Question Detail */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getDifficultyColor(practiceQuestions[selectedQuestion].difficulty)}>
                        {practiceQuestions[selectedQuestion].difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {practiceQuestions[selectedQuestion].expectedDuration}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-3">
                      {practiceQuestions[selectedQuestion].question}
                    </h4>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700">💡 Tips:</h5>
                      <ul className="space-y-1">
                        {practiceQuestions[selectedQuestion].tips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <Star className="h-3 w-3 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Practice Your Answer:</h5>
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your answer here to practice..."
                      className="min-h-32"
                    />
                    <Button 
                      onClick={handlePracticeAnswer}
                      className="mt-2 bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Practice Answer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Skill Gap Analysis
            </h3>
            
            <div className="space-y-4">
              {skillGaps.map((gap, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{gap.skill}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={
                        gap.priority === 'High' ? 'border-red-200 text-red-700' :
                        gap.priority === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }>
                        {gap.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="text-blue-700">
                        {gap.timeToLearn}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{gap.impact}</p>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Recommended Resources:</h5>
                    <ul className="space-y-1">
                      {gap.resources.map((resource, resourceIndex) => (
                        <li key={resourceIndex} className="text-sm text-blue-600 hover:underline cursor-pointer">
                          📚 {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Company Research
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Company Overview</h4>
                  <p className="text-sm text-green-700">Research {targetJob.company}'s mission, values, and recent news</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Team Structure</h4>
                  <p className="text-sm text-blue-700">Understand the engineering team and department structure</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">Tech Stack</h4>
                  <p className="text-sm text-purple-700">Review their technology choices and engineering blog</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Questions to Ask
              </h3>
              
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded text-sm">
                  "What does a typical day look like for this role?"
                </div>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  "What are the biggest technical challenges the team is facing?"
                </div>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  "How do you measure success in this position?"
                </div>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  "What opportunities are there for professional development?"
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back: Export & Track
        </Button>
        
        <Alert className="max-w-md">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You've completed the entire resume tailoring process! Good luck with your interview.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default InterviewPrepStep;
