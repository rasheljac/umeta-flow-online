
import { FileText, Download, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResultsPanel from "@/components/ResultsPanel";
import DataVisualization from "@/components/DataVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { processingService } from "@/services/processingService";
import { ParsedMzData } from "@/utils/mzParser";
import { useToast } from "@/hooks/use-toast";

const Results = () => {
  const [results, setResults] = useState<any>(null);
  const [uploadedData, setUploadedData] = useState<ParsedMzData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load results from processing service
    const lastResult = processingService.getLastResult();
    console.log('Loading results in Results page:', lastResult);
    
    if (lastResult) {
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

  const handlePreview = () => {
    if (!results?.processed) {
      toast({
        title: "No analysis results",
        description: "Run an analysis workflow first to generate results.",
        variant: "destructive"
      });
      return;
    }

    // Show summary even if processedData is limited
    const summary = results.summary || {};
    const message = results.processedData && results.processedData.length > 0 
      ? `Analysis completed: ${summary.peaksDetected || 0} peaks detected, ${summary.compoundsIdentified || 0} compounds identified in ${results.processedData.length} samples.`
      : `Analysis completed: ${summary.peaksDetected || 0} peaks detected, ${summary.compoundsIdentified || 0} compounds identified. Processing time: ${summary.processingTime || 0}s.`;

    toast({
      title: "Analysis Results Preview",
      description: message
    });
  };

  const handleExportResults = () => {
    if (!results?.processed) {
      toast({
        title: "No analysis results",
        description: "Run an analysis workflow first to generate results.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create CSV content from available data
      const csvContent = generateExportCSV(results);
      
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

      toast({
        title: "Export successful",
        description: "Results have been exported to CSV file."
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateExportCSV = (results: any) => {
    let csvContent = 'Analysis Summary\n';
    csvContent += `Date,${new Date().toISOString()}\n`;
    csvContent += `Peaks Detected,${results.summary?.peaksDetected || 0}\n`;
    csvContent += `Compounds Identified,${results.summary?.compoundsIdentified || 0}\n`;
    csvContent += `Processing Time,${results.summary?.processingTime || 0}s\n\n`;
    
    csvContent += 'Processing Steps\n';
    csvContent += 'Step,Status,Message\n';
    if (results.results && results.results.length > 0) {
      results.results.forEach((step: any) => {
        csvContent += `${step.stepName},${step.success ? 'Success' : 'Failed'},"${step.message || ''}"\n`;
      });
    }
    
    if (results.processedData && results.processedData.length > 0) {
      csvContent += '\nSample Details\n';
      csvContent += 'Sample,Peaks,Compounds,Status\n';
      results.processedData.forEach((sample: any) => {
        const peaksCount = sample.detectedPeaks?.length || 0;
        const compoundsCount = sample.identifiedCompounds?.length || 0;
        const status = sample.processingStatus || 'unknown';
        csvContent += `${sample.fileName || 'Unknown'},${peaksCount},${compoundsCount},${status}\n`;
      });
    } else {
      csvContent += '\nNote: Detailed sample data not available due to storage limitations\n';
    }
    
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreview}
                disabled={!results?.processed}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!results?.processed}
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
          {results?.processed && results?.summary && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>• Peaks Detected: {results.summary.peaksDetected || 0}</span>
              <span>• Compounds Identified: {results.summary.compoundsIdentified || 0}</span>
              <span>• Processing Time: {results.summary.processingTime || 0}s</span>
              <span>• Samples Processed: {results.sampleCount || results.processedData?.length || 0}</span>
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
