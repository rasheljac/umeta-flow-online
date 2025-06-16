
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ParsedMzData } from "@/utils/mzParser";
import { Search, Zap, TrendingUp } from "lucide-react";

interface ChromatogramExtractionProps {
  uploadedData: ParsedMzData[];
}

const ChromatogramExtraction = ({ uploadedData }: ChromatogramExtractionProps) => {
  const [targetMz, setTargetMz] = useState<string>("180.0634");
  const [mzTolerance, setMzTolerance] = useState<string>("0.01");
  const [selectedSpectrum, setSelectedSpectrum] = useState<any>(null);

  // Extract chromatogram for target m/z
  const chromatogramData = useMemo(() => {
    if (!uploadedData || uploadedData.length === 0) return [];
    
    const mz = parseFloat(targetMz);
    const tolerance = parseFloat(mzTolerance);
    
    if (isNaN(mz) || isNaN(tolerance)) return [];

    console.log(`Extracting chromatogram for m/z ${mz} ± ${tolerance}`);

    const points: Array<{
      retentionTime: number;
      intensity: number;
      spectrum: any;
      peakCount: number;
    }> = [];

    uploadedData.forEach(sample => {
      if (!sample.spectra) return;
      
      sample.spectra.forEach(spectrum => {
        if (!spectrum.peaks || spectrum.peaks.length === 0) return;
        
        // Find peaks within tolerance
        const matchingPeaks = spectrum.peaks.filter(peak => 
          Math.abs(peak.mz - mz) <= tolerance
        );
        
        if (matchingPeaks.length > 0) {
          const maxIntensity = Math.max(...matchingPeaks.map(p => p.intensity));
          points.push({
            retentionTime: spectrum.retentionTime,
            intensity: maxIntensity,
            spectrum,
            peakCount: matchingPeaks.length
          });
        } else {
          // Add zero intensity point for continuity
          points.push({
            retentionTime: spectrum.retentionTime,
            intensity: 0,
            spectrum,
            peakCount: 0
          });
        }
      });
    });

    // Sort by retention time
    return points.sort((a, b) => a.retentionTime - b.retentionTime);
  }, [uploadedData, targetMz, mzTolerance]);

  // Prepare mass spectrum data for selected spectrum using stem plot approach
  const massSpectrumData = useMemo(() => {
    if (!selectedSpectrum || !selectedSpectrum.peaks) return [];
    
    console.log(`Preparing mass spectrum for scan ${selectedSpectrum.scanNumber} with ${selectedSpectrum.peaks.length} peaks`);
    
    // Create stem plot data - each peak becomes three points: baseline, peak, baseline
    const stemData: Array<{
      mz: number;
      intensity: number;
      isBaseline: boolean;
      originalPeak?: any;
    }> = [];
    
    // Filter and sort peaks by intensity to show most significant ones
    const significantPeaks = selectedSpectrum.peaks
      .filter((peak: any) => peak && peak.intensity > 0)
      .sort((a: any, b: any) => b.intensity - a.intensity)
      .slice(0, 100); // Limit to top 100 peaks for performance
    
    // Sort back by m/z for proper display
    significantPeaks.sort((a: any, b: any) => a.mz - b.mz);
    
    significantPeaks.forEach((peak: any) => {
      // Add baseline point before peak
      stemData.push({
        mz: peak.mz - 0.001,
        intensity: 0,
        isBaseline: true
      });
      
      // Add the actual peak
      stemData.push({
        mz: peak.mz,
        intensity: peak.intensity,
        isBaseline: false,
        originalPeak: peak
      });
      
      // Add baseline point after peak
      stemData.push({
        mz: peak.mz + 0.001,
        intensity: 0,
        isBaseline: true
      });
    });
    
    console.log(`Generated stem plot data with ${stemData.length} points for ${significantPeaks.length} peaks`);
    return stemData;
  }, [selectedSpectrum]);

  const handleExtractChromatogram = () => {
    console.log(`Extracting chromatogram for m/z ${targetMz} with tolerance ${mzTolerance}`);
    // The chromatogram will be automatically updated due to the useMemo dependency
  };

  const handleSpectrumClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const point = data.activePayload[0].payload;
      if (point.spectrum) {
        console.log(`Selected spectrum: scan ${point.spectrum.scanNumber}, RT ${point.retentionTime.toFixed(2)}, intensity ${point.intensity}`);
        setSelectedSpectrum(point.spectrum);
      }
    }
  };

  // Custom tooltip for chromatogram
  const ChromatogramTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{`RT: ${Number(label).toFixed(2)} min`}</p>
          <p className="text-blue-600">{`Intensity: ${data.intensity.toLocaleString()}`}</p>
          <p className="text-slate-500 text-sm">{`Peaks: ${data.peakCount}`}</p>
          <p className="text-xs text-slate-400">Click to view spectrum</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for mass spectrum
  const MassSpectrumTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.isBaseline) return null;
      
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{`m/z: ${Number(label).toFixed(4)}`}</p>
          <p className="text-blue-600">{`Intensity: ${data.intensity.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for stem plot
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isBaseline) {
      return null; // Don't render dots at baseline
    }
    return <circle cx={cx} cy={cy} r={2} fill="#3B82F6" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Ion Chromatogram Extraction</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="target-mz">Target m/z</Label>
              <Input
                id="target-mz"
                type="number"
                step="0.0001"
                value={targetMz}
                onChange={(e) => setTargetMz(e.target.value)}
                placeholder="e.g., 180.0634"
              />
            </div>
            <div>
              <Label htmlFor="mz-tolerance">m/z Tolerance</Label>
              <Input
                id="mz-tolerance"
                type="number"
                step="0.001"
                value={mzTolerance}
                onChange={(e) => setMzTolerance(e.target.value)}
                placeholder="e.g., 0.01"
              />
            </div>
            <Button onClick={handleExtractChromatogram} className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Extract Chromatogram
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chromatogram Display */}
      {chromatogramData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Extracted Ion Chromatogram</span>
              </span>
              <div className="flex gap-2">
                <Badge variant="outline">
                  m/z: {targetMz} ± {mzTolerance}
                </Badge>
                <Badge variant="outline">
                  {chromatogramData.length} points
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chromatogramData} 
                  onClick={handleSpectrumClick}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="retentionTime" 
                    label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<ChromatogramTooltip />} />
                  <Line 
                    dataKey="intensity" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Click on any point in the chromatogram to view the corresponding mass spectrum
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mass Spectrum Display */}
      {selectedSpectrum && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Mass Spectrum - Scan {selectedSpectrum.scanNumber}</span>
              </span>
              <div className="flex gap-2">
                <Badge variant="outline">
                  RT: {selectedSpectrum.retentionTime.toFixed(2)} min
                </Badge>
                <Badge variant="outline">
                  MS{selectedSpectrum.msLevel}
                </Badge>
                <Badge variant="outline">
                  {massSpectrumData.filter(d => !d.isBaseline).length} peaks
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={massSpectrumData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mz" 
                    type="number"
                    scale="linear"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'm/z', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    domain={[0, 'dataMax']}
                    label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<MassSpectrumTooltip />} />
                  <Line 
                    dataKey="intensity" 
                    stroke="#3B82F6"
                    strokeWidth={1}
                    dot={<CustomDot />}
                    connectNulls={false}
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedData.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No mass spectrometry data available</p>
          <p className="text-sm">Upload mzML or mzXML files to extract chromatograms</p>
        </div>
      )}
    </div>
  );
};

export default ChromatogramExtraction;
