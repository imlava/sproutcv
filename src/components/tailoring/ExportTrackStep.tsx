import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  Plus,
  Calendar,
  Building,
  ExternalLink,
  Bookmark,
  Clock,
  Target,
  BarChart3,
  Award
} from 'lucide-react';

interface ExportTrackStepProps {
  state: {
    versions: any[];
    tracker: any[];
    downloadHistory: any[];
  };
  onUpdate: (exportData: any) => void;
  onNext: () => void;
  onPrev: () => void;
  profile: any;
  targetJob: any;
  tailoring: any;
}

const ExportTrackStep: React.FC<ExportTrackStepProps> = ({ 
  state, 
  onUpdate, 
  onNext, 
  onPrev, 
  profile, 
  targetJob, 
  tailoring 
}) => {
  const [downloading, setDownloading] = useState(false);
  const [addingToTracker, setAddingToTracker] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (format: string) => {
    setDownloading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate file download
      const downloadItem = {
        id: Date.now(),
        fileName: `${targetJob.title}_Resume_${targetJob.company}.${format}`,
        format,
        downloadedAt: new Date(),
        version: 'tailored'
      };

      onUpdate({
        ...state,
        downloadHistory: [...state.downloadHistory, downloadItem]
      });

      toast({
        title: "Download Complete",
        description: `Your tailored resume has been downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleAddToTracker = async () => {
    setAddingToTracker(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const trackerItem = {
        id: Date.now(),
        jobTitle: targetJob.title,
        company: targetJob.company,
        appliedDate: new Date(),
        status: 'applied',
        resumeVersion: 'tailored',
        matchScore: 78,
        notes: ''
      };

      onUpdate({
        ...state,
        tracker: [...state.tracker, trackerItem]
      });

      toast({
        title: "Added to Tracker",
        description: "Application has been added to your job tracker.",
      });
    } catch (error) {
      toast({
        title: "Failed to Add",
        description: "Failed to add to tracker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToTracker(false);
    }
  };

  // Mock existing applications
  const existingApplications = [
    {
      id: 1,
      jobTitle: 'Frontend Developer',
      company: 'StartupCorp',
      appliedDate: '2024-03-01',
      status: 'interview',
      matchScore: 85
    },
    {
      id: 2,
      jobTitle: 'React Developer',
      company: 'BigTech',
      appliedDate: '2024-02-28',
      status: 'pending',
      matchScore: 72
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 4: Export & Track</h2>
        <p className="text-gray-600">Download your tailored resume and add the application to your tracker.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Options */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2 text-blue-600" />
              Download Resume
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {targetJob.title} - {targetJob.company}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Tailored version with 78% keyword match
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleDownload('pdf')}
                    disabled={downloading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    onClick={() => handleDownload('docx')}
                    disabled={downloading}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                </div>
              </div>

              {state.downloadHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Recent Downloads</h4>
                  <div className="space-y-2">
                    {state.downloadHistory.slice(-3).map((download, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm font-medium">{download.fileName}</span>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {download.format.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" />
              Add to Application Tracker
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Application Date</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select defaultValue="applied">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleAddToTracker}
                disabled={addingToTracker}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {addingToTracker ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Add to Tracker
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Application Tracker */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Application Tracker
            </h3>
            
            <div className="space-y-4">
              {/* Current Application */}
              {state.tracker.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">
                      {state.tracker[state.tracker.length - 1].jobTitle}
                    </h4>
                    <Badge className={getStatusColor(state.tracker[state.tracker.length - 1].status)}>
                      {state.tracker[state.tracker.length - 1].status}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 mb-1">
                    {state.tracker[state.tracker.length - 1].company}
                  </p>
                  <div className="flex items-center text-sm text-green-600">
                    <Target className="h-3 w-3 mr-1" />
                    {state.tracker[state.tracker.length - 1].matchScore}% match
                  </div>
                </div>
              )}

              {/* Existing Applications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Recent Applications</h4>
                {existingApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-800">{app.jobTitle}</h5>
                      <p className="text-sm text-gray-600">{app.company}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {app.appliedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {app.matchScore}% match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-orange-600" />
              Success Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-blue-700">Applications</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">1</div>
                <div className="text-sm text-green-700">Interviews</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">78%</div>
                <div className="text-sm text-purple-700">Avg Match</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">33%</div>
                <div className="text-sm text-orange-700">Response Rate</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back: Tailor Resume
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-green-600 hover:bg-green-700"
        >
          Next: Interview Prep
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {downloading && (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            Generating your tailored resume download...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExportTrackStep;
