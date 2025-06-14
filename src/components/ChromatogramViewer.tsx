
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ParsedMzData } from "@/utils/mzParser";
import { TrendingUp, Clock } from "lucide-react";

interface ChromatogramViewerProps {
  data: ParsedMzData[];
}

const ChromatogramViewer = ({ data }: ChromatogramViewerProps) => {
  const [selectedFile, setSelectedFile] = useState(0);
  const [selectedChromatogram, setSelectedChromatogram] = useState(0);

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
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chromatogramData}>
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
                  labelFormatter={(label) => `Time: ${typeof label === 'number' ? label.toFixed(2) : label} min`}
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
    </div>
  );
};

export default ChromatogramViewer;
