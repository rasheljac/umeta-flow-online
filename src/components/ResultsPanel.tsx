
import { Download, FileText, Table, BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ResultsPanelProps {
  results: any;
}

const ResultsPanel = ({ results }: ResultsPanelProps) => {
  const { toast } = useToast();

  // new: real file download functions (simulate CSV/XLSX/PDF as browser blobs)
  const handleDownload = (type: string) => {
    let blob: Blob | null = null;
    let filename = "";
    let contentType = "text/plain";
    if (type === "peak_list") {
      const csv = "m/z,intensity\n100,500\n101,1200\n"; // Replace with real output!
      blob = new Blob([csv], { type: "text/csv" });
      filename = "peak_list.csv";
      contentType = "text/csv";
    } else if (type === "compound_list") {
      const xlsxMock = "Compound\tFormula\tScore\nGlucose\tC6H12O6\t97\n"; // Replace with real output!
      blob = new Blob([xlsxMock], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      filename = "compound_list.xlsx";
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (type === "statistics") {
      const csv = "Feature,FoldChange,p-value\nA,2.2,0.01\nB,0.8,0.22\n";
      blob = new Blob([csv], { type: "text/csv" });
      filename = "statistics.csv";
      contentType = "text/csv";
    } else if (type === "qc_report") {
      const pdfBlob = new Blob(["Quality control report PDF mock"], { type: "application/pdf" });
      blob = pdfBlob;
      filename = "qc_report.pdf";
      contentType = "application/pdf";
    } else if (type === "complete_package") {
      // Create a zip mock (text file)
      blob = new Blob(["Results package archive mock"], { type: "application/zip" });
      filename = "full_results.zip";
      contentType = "application/zip";
    }
    if (blob) {
      toast({
        title: "Download started",
        description: `Downloading ${filename}...`
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  if (!results || !results.processed) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No results available yet.</p>
        <p className="text-sm">Run your analysis workflow to generate results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span>Analysis Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{results.peaksDetected}</p>
              <p className="text-sm text-green-600">Peaks Detected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{results.compoundsIdentified}</p>
              <p className="text-sm text-green-600">Compounds Identified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{results.processingTime}s</p>
              <p className="text-sm text-green-600">Processing Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Detection Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Peak Detection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Peaks</span>
              <Badge variant="secondary">{results.peaksDetected}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>High Quality Peaks</span>
              <Badge variant="secondary">{Math.floor(results.peaksDetected * 0.75)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Average S/N Ratio</span>
              <Badge variant="secondary">12.4</Badge>
            </div>
            <Separator />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('peak_list')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Peak List (CSV)
            </Button>
          </CardContent>
        </Card>

        {/* Compound Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Compound Identification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Identified Compounds</span>
              <Badge variant="secondary">{results.compoundsIdentified}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Confident IDs (Level 1)</span>
              <Badge variant="secondary">{Math.floor(results.compoundsIdentified * 0.3)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Putative IDs (Level 2)</span>
              <Badge variant="secondary">{Math.floor(results.compoundsIdentified * 0.7)}</Badge>
            </div>
            <Separator />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('compound_list')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Compound List (XLSX)
            </Button>
          </CardContent>
        </Card>

        {/* Statistical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Table className="w-5 h-5" />
              <span>Statistical Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Significant Features</span>
              <Badge variant="secondary">{Math.floor(results.peaksDetected * 0.15)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Fold Change &gt; 2</span>
              <Badge variant="secondary">{Math.floor(results.peaksDetected * 0.08)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>p-value &lt; 0.05</span>
              <Badge variant="secondary">{Math.floor(results.peaksDetected * 0.12)}</Badge>
            </div>
            <Separator />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('statistics')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Statistics (CSV)
            </Button>
          </CardContent>
        </Card>

        {/* Quality Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Quality Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Sample QC Status</span>
              <Badge variant="default" className="bg-green-600">Pass</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>CV &lt; 30% Features</span>
              <Badge variant="secondary">87%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Missing Values</span>
              <Badge variant="secondary">&lt; 5%</Badge>
            </div>
            <Separator />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDownload('qc_report')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QC Report (PDF)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Processing Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Processing Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="flex items-start space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Peak detection completed</p>
                <p className="text-slate-600">Found {results.peaksDetected} peaks across all samples</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Peak alignment completed</p>
                <p className="text-slate-600">Aligned peaks with RT tolerance 0.5 min</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Data filtering completed</p>
                <p className="text-slate-600">Removed low-quality peaks and outliers</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Compound identification completed</p>
                <p className="text-slate-600">Identified {results.compoundsIdentified} compounds using HMDB</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Statistical analysis completed</p>
                <p className="text-slate-600">Performed t-tests and generated fold change data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download All Results */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Complete Results Package</h3>
              <p className="text-blue-700">Download all analysis results in a comprehensive package</p>
            </div>
            <Button 
              size="lg"
              onClick={() => handleDownload('complete_package')}
              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPanel;
