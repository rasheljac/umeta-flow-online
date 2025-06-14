
import { useState } from "react";
import { Upload, Play, BarChart3, Settings, FileText, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import DataVisualization from "@/components/DataVisualization";
import ResultsPanel from "@/components/ResultsPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Files uploaded:", files);
  };

  const handleRunWorkflow = () => {
    // Simulate workflow execution
    console.log("Running workflow with steps:", workflowSteps);
    setTimeout(() => {
      setAnalysisResults({
        processed: true,
        peaksDetected: Math.floor(Math.random() * 1000) + 500,
        compoundsIdentified: Math.floor(Math.random() * 200) + 100,
        processingTime: Math.floor(Math.random() * 30) + 10
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">MetaFlow Analyzer</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Dashboard</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Workflows</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Results</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 font-medium">Help</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Untargeted Metabolomics Analysis Platform
          </h2>
          <p className="text-lg text-slate-600">
            Process, analyze, and visualize your metabolomics data with advanced computational workflows
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Files Uploaded</p>
                  <p className="text-2xl font-bold">{uploadedFiles.length}</p>
                </div>
                <Upload className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Workflow Steps</p>
                  <p className="text-2xl font-bold">{workflowSteps.length}</p>
                </div>
                <Settings className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Peaks Detected</p>
                  <p className="text-2xl font-bold">{analysisResults?.peaksDetected || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Compounds ID'd</p>
                  <p className="text-2xl font-bold">{analysisResults?.compoundsIdentified || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Data</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Build Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Visualize</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Data Upload</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Workflow Builder</span>
                </CardTitle>
                <Button 
                  onClick={handleRunWorkflow}
                  disabled={uploadedFiles.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </Button>
              </CardHeader>
              <CardContent>
                <WorkflowBuilder 
                  steps={workflowSteps} 
                  onStepsChange={setWorkflowSteps}
                  hasFiles={uploadedFiles.length > 0}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Data Visualization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataVisualization results={analysisResults} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Analysis Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsPanel results={analysisResults} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
