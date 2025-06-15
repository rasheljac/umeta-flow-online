
import { FileText, Download, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResultsPanel from "@/components/ResultsPanel";
import DataVisualization from "@/components/DataVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { processingService } from "@/services/processingService";
import { ParsedMzData } from "@/utils/mzParser";

const Results = () => {
  const [results, setResults] = useState<any>(null);
  const [uploadedData, setUploadedData] = useState<ParsedMzData[]>([]);

  useEffect(() => {
    // Load results from processing service
    const lastResult = processingService.getLastResult();
    if (lastResult) {
      console.log('Loaded processing results:', lastResult);
      setResults(lastResult);
    } else {
      // Fallback to indicate no results available
      setResults({
        processed: false,
        peaksDetected: 0,
        compoundsIdentified: 0,
        processingTime: 0,
        message: "No analysis results available. Please run a workflow first.",
        processedData: []
      });
    }

    // Load uploaded data for visualization
    const storedData = localStorage.getItem('uploadedMzData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setUploadedData(parsed);
        console.log('Loaded uploaded data for results:', parsed.length, 'files');
      } catch (error) {
        console.error('Failed to load uploaded data:', error);
      }
    }
  }, []);

  const handleExportResults = () => {
    if (!results?.processedData || results.processedData.length === 0) {
      console.warn('No processed data available for export');
      return;
    }

    // Create CSV content from processed data
    const csvContent = generateCSVFromResults(results.processedData);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metabolomics_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSVFromResults = (processedData: any[]) => {
    let csvContent = 'Sample,Compound,Formula,Mass,Intensity,RetentionTime,MatchScore\n';
    
    processedData.forEach(sample => {
      const compounds = sample.identifiedCompounds || [];
      compounds.forEach((compound: any) => {
        const peak = compound.peaks[0];
        csvContent += `${sample.fileName},${compound.name},${compound.formula},${compound.mass},${peak?.intensity || 0},${peak?.retentionTime || 0},${compound.matchScore}\n`;
      });
    });
    
    return csvContent;
  };

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
                disabled={!results?.processed || !results?.processedData?.length}
                onClick={handleExportResults}
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
          {results?.processed && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>• Peaks Detected: {results.summary?.peaksDetected || 0}</span>
              <span>• Compounds Identified: {results.summary?.compoundsIdentified || 0}</span>
              <span>• Processing Time: {results.summary?.processingTime || 0}s</span>
              <span>• Samples Processed: {results.processedData?.length || 0}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="visualize" className="space-y-6">
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
                <DataVisualization 
                  results={results} 
                  uploadedDataOverride={uploadedData}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Results;
