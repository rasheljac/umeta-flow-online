
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

    if (!uploadedData || uploadedData.length === 0) {
      toast({
        title: "No data available",
        description: "Please upload data files first",
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

      console.log(`Extracting chromatogram for m/z ${mzTarget} ± ${tolerance}`);
      console.log('Input data structure:', uploadedData.map(d => ({ 
        fileName: d.fileName, 
        spectra: d.spectra?.length || 0,
        hasSpectra: !!d.spectra 
      })));

      // Extract chromatogram from uploaded data
      const chromatogramData: any[] = [];
      let totalSpectraProcessed = 0;
      let totalPeaksFound = 0;

      uploadedData.forEach((sample, sampleIndex) => {
        console.log(`Processing sample ${sampleIndex}: ${sample.fileName || 'Unknown'}`);
        
        // Handle different data structures
        const spectraArray = sample.spectra || sample.data || [];
        
        if (!Array.isArray(spectraArray)) {
          console.warn(`Sample ${sample.fileName} has invalid spectra format:`, typeof spectraArray);
          return;
        }
        
        if (spectraArray.length === 0) {
          console.warn(`Sample ${sample.fileName} has no spectra`);
          return;
        }

        console.log(`Sample ${sample.fileName}: processing ${spectraArray.length} spectra`);

        spectraArray.forEach((spectrum: any, spectrumIndex: number) => {
          totalSpectraProcessed++;
          
          // Validate spectrum structure
          if (!spectrum || typeof spectrum !== 'object') {
            console.warn(`Invalid spectrum at index ${spectrumIndex} in ${sample.fileName}`);
            return;
          }

          // Handle different retention time field names
          const retentionTime = spectrum.retentionTime || spectrum.retention_time || spectrum.rt || spectrum.time || 0;
          
          if (typeof retentionTime !== 'number') {
            console.warn(`Invalid retention time in spectrum ${spectrumIndex}: ${retentionTime}`);
            return;
          }

          // Check retention time filter
          if (rtStart !== undefined && retentionTime < rtStart) return;
          if (rtEnd !== undefined && retentionTime > rtEnd) return;

          // Handle different peaks field names and structures
          const peaks = spectrum.peaks || spectrum.data || spectrum.mzIntensityPairs || [];
          
          if (!Array.isArray(peaks)) {
            console.warn(`Invalid peaks format in spectrum ${spectrumIndex}: ${typeof peaks}`);
            return;
          }

          // Find peaks within m/z tolerance with enhanced matching
          let totalIntensity = 0;
          let peaksInRange = 0;
          let bestPeakIntensity = 0;
          
          peaks.forEach((peak: any) => {
            // Handle different peak structures
            let peakMz: number;
            let peakIntensity: number;
            
            if (typeof peak === 'object' && peak !== null) {
              // Object format: {mz: number, intensity: number}
              peakMz = peak.mz || peak.mass || peak.m || 0;
              peakIntensity = peak.intensity || peak.i || peak.abundance || 0;
            } else if (Array.isArray(peak) && peak.length >= 2) {
              // Array format: [mz, intensity]
              peakMz = peak[0] || 0;
              peakIntensity = peak[1] || 0;
            } else {
              return; // Skip invalid peak format
            }
            
            if (typeof peakMz !== 'number' || typeof peakIntensity !== 'number') {
              return; // Skip invalid peak data
            }
            
            // Enhanced m/z matching with both absolute and ppm tolerance
            const mzDiffAbs = Math.abs(peakMz - mzTarget);
            const mzDiffPpm = (mzDiffAbs / mzTarget) * 1000000;
            
            // Use absolute tolerance if < 1, otherwise treat as ppm
            const toleranceMatches = tolerance < 1 
              ? mzDiffAbs <= tolerance 
              : mzDiffPpm <= tolerance;
            
            if (toleranceMatches) {
              totalIntensity += peakIntensity;
              peaksInRange++;
              bestPeakIntensity = Math.max(bestPeakIntensity, peakIntensity);
              totalPeaksFound++;
            }
          });

          // Only add data points with significant intensity
          if (totalIntensity > 0) {
            chromatogramData.push({
              retentionTime: retentionTime,
              intensity: totalIntensity,
              sample: sample.fileName || `Sample ${sampleIndex + 1}`,
              sampleIndex,
              peaksInRange,
              bestPeakIntensity,
              spectrumIndex
            });
          }
        });
      });

      // Sort by retention time
      chromatogramData.sort((a, b) => a.retentionTime - b.retentionTime);
      
      console.log(`Extraction complete: ${chromatogramData.length} data points found from ${totalSpectraProcessed} spectra`);
      console.log(`Total peaks found in range: ${totalPeaksFound}`);
      console.log('Sample data points:', chromatogramData.slice(0, 5));
      
      setExtractedData(chromatogramData);
      
      if (chromatogramData.length === 0) {
        const toleranceType = tolerance < 1 ? 'Da' : 'ppm';
        toast({
          title: "No data found",
          description: `No peaks found for m/z ${mzTarget} within tolerance ${tolerance} ${toleranceType}. Processed ${totalSpectraProcessed} spectra. Try increasing the tolerance or checking your m/z value.`,
          variant: "destructive"
        });
      } else {
        const toleranceType = tolerance < 1 ? 'Da' : 'ppm';
        toast({
          title: "Extraction complete",
          description: `Found ${chromatogramData.length} data points for m/z ${mzTarget} ± ${tolerance} ${toleranceType} (from ${totalPeaksFound} matching peaks across ${totalSpectraProcessed} spectra)`
        });
      }
    } catch (error) {
      console.error('Chromatogram extraction failed:', error);
      toast({
        title: "Extraction failed",
        description: `Failed to extract chromatogram: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      let csvContent = 'Retention Time (min),Intensity,Sample,Peaks in Range\n';
      extractedData.forEach(point => {
        csvContent += `${point.retentionTime},${point.intensity},${point.sample},${point.peaksInRange}\n`;
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
  const hasData = uploadedData && uploadedData.length > 0;
  const dataInfo = hasData ? `${uploadedData.length} samples loaded` : 'No data loaded';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Extract Ion Chromatogram</span>
          </CardTitle>
          <div className="text-sm text-slate-600">
            {dataInfo} | Status: {hasData ? 'Ready for extraction' : 'Upload data files first'}
          </div>
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
                disabled={!hasData}
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
                disabled={!hasData}
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
                disabled={!hasData}
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
                disabled={!hasData}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleExtractChromatogram}
              disabled={isExtracting || !extractionParams.mzValue || !hasData}
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
              <Badge variant="outline">{extractedData.length} data points</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Ion Chromatogram</CardTitle>
            <div className="text-sm text-slate-600">
              m/z {extractionParams.mzValue} ± {extractionParams.mzTolerance} Da | 
              {extractedData.length} data points across {uniqueSamples.length} samples
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={extractedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="retentionTime" 
                    label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : value, 
                      'Intensity'
                    ]}
                    labelFormatter={(label) => `RT: ${typeof label === 'number' ? label.toFixed(2) : label} min`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
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
