
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spectrum, ParsedMzData } from "@/utils/mzParser";
import { BarChart3, Zap } from "lucide-react";

interface MassSpectrumViewerProps {
  data: ParsedMzData[];
}

const MassSpectrumViewer = ({ data }: MassSpectrumViewerProps) => {
  const [selectedFile, setSelectedFile] = useState(0);
  const [selectedSpectrum, setSelectedSpectrum] = useState(0);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No mass spectra data available</p>
      </div>
    );
  }

  const currentFile = data[selectedFile];
  const currentSpectrum = currentFile.spectra[selectedSpectrum];

  if (!currentSpectrum) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No spectrum selected</p>
      </div>
    );
  }

  // Prepare data for visualization
  const spectrumData = currentSpectrum.peaks.map(peak => ({
    mz: peak.mz,
    intensity: peak.intensity
  }));

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
        
        <div className="flex-1 min-w-48">
          <Select value={selectedSpectrum.toString()} onValueChange={(value) => setSelectedSpectrum(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentFile.spectra.slice(0, 20).map((spectrum, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Scan {spectrum.scanNumber} (RT: {spectrum.retentionTime.toFixed(2)}min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline">
            MS{currentSpectrum.msLevel}
          </Badge>
          <Badge variant="outline">
            {currentSpectrum.peaks.length} peaks
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Mass Spectrum - Scan {currentSpectrum.scanNumber}</span>
          </CardTitle>
          <div className="text-sm text-slate-600">
            RT: {currentSpectrum.retentionTime.toFixed(2)} min | 
            Base Peak: {currentSpectrum.basePeakMz.toFixed(4)} m/z | 
            TIC: {currentSpectrum.totalIonCurrent.toLocaleString()}
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
    </div>
  );
};

export default MassSpectrumViewer;
