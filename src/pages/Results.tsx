import { FileText, Download, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResultsPanel from "@/components/ResultsPanel";
import DataVisualization from "@/components/DataVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

const Results = () => {
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Load results from processing service
    const lastResult = processingService.getLastResult();
    if (lastResult) {
      setResults({
        processed: lastResult.success,
        peaksDetected: lastResult.summary.peaksDetected,
        compoundsIdentified: lastResult.summary.compoundsIdentified,
        processingTime: lastResult.summary.processingTime,
        steps: lastResult.results
      });
    } else {
      // Fallback to mock data if no results available
      setResults({
        processed: false,
        peaksDetected: 0,
        compoundsIdentified: 0,
        processingTime: 0,
        message: "No analysis results available. Please run a workflow first."
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-slate-900">Analysis Results</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!results?.processed}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Analysis Results & Visualization
          </h2>
          <p className="text-lg text-slate-600">
            View, analyze, and export your metabolomics processing results
          </p>
        </div>

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit">
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Results Summary</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Data Visualization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Processing Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsPanel results={results} />
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
                <DataVisualization results={results} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Results;
