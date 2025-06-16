
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChromatogramExtractionProps {
  uploadedData: any[];
}

const ChromatogramExtraction = ({ uploadedData }: ChromatogramExtractionProps) => {
  const [extractionParams, setExtractionParams] = useState({
    mzValue: '',
    mzTolerance: '0.01',
    rtStart: '',
    rtEnd: ''
  });
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtractChromatogram = async () => {
    if (!extractionParams.mzValue) {
      toast({
        title: "Missing parameter",
        description: "Please enter an m/z value to extract",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const mzTarget = parseFloat(extractionParams.mzValue);
      const tolerance = parseFloat(extractionParams.mzTolerance);
      const rtStart = extractionParams.rtStart ? parseFloat(extractionParams.rtStart) : undefined;
      const rtEnd = extractionParams.rtEnd ? parseFloat(extractionParams.rtEnd) : undefined;

      // Extract chromatogram from uploaded data
      const chromatogramData: any[] = [];

      uploadedData.forEach((sample, sampleIndex) => {
        if (sample.spectra) {
          sample.spectra.forEach((spectrum: any) => {
            // Check retention time filter
            if (rtStart !== undefined && spectrum.retentionTime < rtStart) return;
            if (rtEnd !== undefined && spectrum.retentionTime > rtEnd) return;

            // Find peaks within m/z tolerance
            let totalIntensity = 0;
            if (spectrum.peaks) {
              spectrum.peaks.forEach((peak: any) => {
                const mzDiff = Math.abs(peak.mz - mzTarget);
                if (mzDiff <= tolerance) {
                  totalIntensity += peak.intensity;
                }
              });
            }

            if (totalIntensity > 0) {
              chromatogramData.push({
                retentionTime: spectrum.retentionTime,
                intensity: totalIntensity,
                sample: sample.fileName || `Sample ${sampleIndex + 1}`,
                sampleIndex
              });
            }
          });
        }
      });

      // Sort by retention time
      chromatogramData.sort((a, b) => a.retentionTime - b.retentionTime);
      
      setExtractedData(chromatogramData);
      
      toast({
        title: "Extraction complete",
        description: `Found ${chromatogramData.length} data points for m/z ${mzTarget}`
      });
    } catch (error) {
      console.error('Chromatogram extraction failed:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract chromatogram. Please check your parameters.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExportChromatogram = () => {
    if (extractedData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please extract a chromatogram first",
        variant: "destructive"
      });
      return;
    }

    try {
      let csvContent = 'Retention Time (min),Intensity,Sample\n';
      extractedData.forEach(point => {
        csvContent += `${point.retentionTime},${point.intensity},${point.sample}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chromatogram_mz${extractionParams.mzValue}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Chromatogram data exported to CSV"
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export chromatogram data",
        variant: "destructive"
      });
    }
  };

  const uniqueSamples = [...new Set(extractedData.map(d => d.sample))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Extract Ion Chromatogram</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mzValue">m/z Value</Label>
              <Input
                id="mzValue"
                type="number"
                step="0.001"
                placeholder="e.g., 100.0758"
                value={extractionParams.mzValue}
                onChange={(e) => setExtractionParams(prev => ({ ...prev, mzValue: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="mzTolerance">m/z Tolerance</Label>
              <Input
                id="mzTolerance"
                type="number"
                step="0.001"
                placeholder="0.01"
                value={extractionParams.mzTolerance}
                onChange={(e) => setExtractionParams(prev => ({ ...prev, mzTolerance: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rtStart">RT Start (min)</Label>
              <Input
                id="rtStart"
                type="number"
                step="0.1"
                placeholder="Optional"
                value={extractionParams.rtStart}
                onChange={(e) => setExtractionParams(prev => ({ ...prev, rtStart: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rtEnd">RT End (min)</Label>
              <Input
                id="rtEnd"
                type="number"
                step="0.1"
                placeholder="Optional"
                value={extractionParams.rtEnd}
                onChange={(e) => setExtractionParams(prev => ({ ...prev, rtEnd: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleExtractChromatogram}
              disabled={isExtracting || !extractionParams.mzValue}
            >
              {isExtracting ? 'Extracting...' : 'Extract Chromatogram'}
            </Button>
            
            {extractedData.length > 0 && (
              <Button variant="outline" onClick={handleExportChromatogram}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {extractedData.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Samples found:</span>
              {uniqueSamples.map(sample => (
                <Badge key={sample} variant="secondary">{sample}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Ion Chromatogram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={extractedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="retentionTime" 
                    label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Intensity']}
                    labelFormatter={(label) => `RT: ${label} min`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChromatogramExtraction;
