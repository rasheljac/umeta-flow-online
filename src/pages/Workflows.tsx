
import { Settings, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkflowBuilder from "@/components/WorkflowBuilder";
import { useState } from "react";

const Workflows = () => {
  const [workflowSteps, setWorkflowSteps] = useState([]);

  const handleRunWorkflow = () => {
    console.log("Running workflow with steps:", workflowSteps);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">Workflow Management</h1>
            </div>
            <Button 
              onClick={handleRunWorkflow}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Workflow
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Build Your Analysis Workflow
          </h2>
          <p className="text-lg text-slate-600">
            Create custom processing pipelines for your metabolomics data
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Workflow Builder</span>
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            <WorkflowBuilder 
              steps={workflowSteps} 
              onStepsChange={setWorkflowSteps}
              hasFiles={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Workflows;
