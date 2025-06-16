
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
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

  // Prepare data for mass spectrum visualization - create stem plot data
  const spectrumData = currentSpectrum.peaks
    .filter(peak => peak.intensity > 0)
    .sort((a, b) => a.mz - b.mz)
    .flatMap(peak => [
      { mz: peak.mz, intensity: 0, isBaseline: true },
      { mz: peak.mz, intensity: peak.intensity, isBaseline: false },
      { mz: peak.mz, intensity: 0, isBaseline: true }
    ]);

  // Custom dot component for stem plot
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isBaseline) {
      return null; // Don't render dots at baseline
    }
    return <circle cx={cx} cy={cy} r={2} fill="#3B82F6" />;
  };

  // Custom tooltip for better peak information
  const CustomTooltip = ({ active, payload, label }: any) => {
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
              <LineChart data={spectrumData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  dataKey="intensity" 
                  stroke="#3B82F6"
                  strokeWidth={1}
                  dot={<CustomDot />}
                  connectNulls={false}
                />
                {/* Add baseline reference */}
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MassSpectrumViewer;
