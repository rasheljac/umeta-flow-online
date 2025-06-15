
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ParsedMzData } from "@/utils/mzParser";
import { TrendingUp, Clock, Zap } from "lucide-react";

interface ChromatogramViewerProps {
  data: ParsedMzData[];
}

const ChromatogramViewer = ({ data }: ChromatogramViewerProps) => {
  const [selectedFile, setSelectedFile] = useState(0);
  const [selectedChromatogram, setSelectedChromatogram] = useState(0);
  const [selectedSpectrum, setSelectedSpectrum] = useState<any>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No chromatogram data available</p>
      </div>
    );
  }

  const currentFile = data[selectedFile];
  const currentChromatogram = currentFile.chromatograms[selectedChromatogram];

  if (!currentChromatogram) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No chromatogram available</p>
      </div>
    );
  }

  // Prepare data for visualization
  const chromatogramData = currentChromatogram.timeArray.map((time, index) => ({
    time,
    intensity: currentChromatogram.intensityArray[index] || 0
  }));

  // Find closest spectrum to clicked time point
  const handleChromatogramClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedTime = data.activePayload[0].payload.time;
      
      // Find the spectrum closest to the clicked time
      const closestSpectrum = currentFile.spectra.reduce((closest, spectrum) => {
        const currentDiff = Math.abs(spectrum.retentionTime - clickedTime);
        const closestDiff = Math.abs(closest.retentionTime - clickedTime);
        return currentDiff < closestDiff ? spectrum : closest;
      });
      
      setSelectedSpectrum(closestSpectrum);
    }
  };

  // Prepare spectrum data for visualization
  const spectrumData = selectedSpectrum ? selectedSpectrum.peaks.map((peak: any) => ({
    mz: peak.mz,
    intensity: peak.intensity
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48">
          <Select value={selectedFile.toString()} onValueChange={(value) => setSelectedFile(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.map((file, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {file.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {currentFile.chromatograms.length > 1 && (
          <div className="flex-1 min-w-48">
            <Select value={selectedChromatogram.toString()} onValueChange={(value) => setSelectedChromatogram(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentFile.chromatograms.map((chrom, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {chrom.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2">
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {currentChromatogram.timeArray.length} points
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Chromatogram - {currentChromatogram.id}</span>
          </CardTitle>
          <div className="text-sm text-slate-600">
            Duration: {Math.max(...currentChromatogram.timeArray).toFixed(2)} min | 
            Max Intensity: {Math.max(...currentChromatogram.intensityArray).toLocaleString()}
            {selectedSpectrum && (
              <span className="ml-4 text-blue-600">
                • Click on chromatogram to view mass spectrum
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chromatogramData} onClick={handleChromatogramClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value, 
                    name === 'intensity' ? 'Intensity' : name
                  ]}
                  labelFormatter={(label) => `Time: ${typeof label === 'number' ? label.toFixed(2) : label} min (Click to view spectrum)`}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {selectedSpectrum && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Mass Spectrum - Scan {selectedSpectrum.scanNumber}</span>
            </CardTitle>
            <div className="text-sm text-slate-600">
              RT: {selectedSpectrum.retentionTime.toFixed(2)} min | 
              Base Peak: {selectedSpectrum.basePeakMz.toFixed(4)} m/z | 
              TIC: {selectedSpectrum.totalIonCurrent.toLocaleString()} |
              MS{selectedSpectrum.msLevel} | {selectedSpectrum.peaks.length} peaks
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spectrumData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mz" 
                    type="number"
                    scale="linear"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'm/z', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : value, 
                      name === 'intensity' ? 'Intensity' : name
                    ]}
                    labelFormatter={(label) => `m/z: ${typeof label === 'number' ? label.toFixed(4) : label}`}
                  />
                  <Bar 
                    dataKey="intensity" 
                    fill="#3B82F6" 
                    stroke="#3B82F6"
                    strokeWidth={0.5}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChromatogramViewer;
