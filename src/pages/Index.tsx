
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ChromatogramViewer from "@/components/ChromatogramViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParsedMzData } from "@/utils/mzParser";
import { Upload, TrendingUp, Microscope, Database } from "lucide-react";

const Index = () => {
  const [uploadedData, setUploadedData] = useState<ParsedMzData[]>([]);

  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Advanced Metabolomics Analysis
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Upload your mass spectrometry data, build custom workflows, and discover metabolic insights 
              with our comprehensive analysis platform.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Supported Formats</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">mzML, mzXML</div>
                <p className="text-xs text-muted-foreground">
                  Standard MS data formats
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analysis Tools</CardTitle>
                <Microscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6+ Steps</div>
                <p className="text-xs text-muted-foreground">
                  Peak detection, alignment, identification
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Interactive</div>
                <p className="text-xs text-muted-foreground">
                  Chromatograms and mass spectra
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Upload Your Data
          </h2>
          <p className="text-lg text-slate-600">
            Start by uploading your mass spectrometry files to begin analysis
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>File Upload</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Data Visualization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Mass Spectrometry Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Chromatogram Visualization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChromatogramViewer data={uploadedData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
