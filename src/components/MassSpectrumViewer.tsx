
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spectrum, ParsedMzData } from "@/utils/mzParser";
import { BarChart3, Zap } from "lucide-react";
import StemPlot from "./StemPlot";

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

  // Prepare peaks for stem plot - filter and sort
  const plotPeaks = currentSpectrum.peaks
    .filter(peak => peak.intensity > 0 && peak.mz > 0)
    .sort((a, b) => a.mz - b.mz)
    .map(peak => ({
      mz: peak.mz,
      intensity: peak.intensity
    }));

  console.log(`📊 Rendering spectrum with ${plotPeaks.length} peaks for ${currentFile.fileName}`);
  if (plotPeaks.length > 0) {
    console.log(`📈 m/z range: ${plotPeaks[0].mz.toFixed(4)} - ${plotPeaks[plotPeaks.length - 1].mz.toFixed(4)}`);
    console.log(`📈 Intensity range: ${Math.min(...plotPeaks.map(p => p.intensity)).toFixed(0)} - ${Math.max(...plotPeaks.map(p => p.intensity)).toFixed(0)}`);
  }

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
            {plotPeaks.length} peaks
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
          <div className="w-full">
            <StemPlot 
              peaks={plotPeaks}
              width={800}
              height={400}
              className="mx-auto"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MassSpectrumViewer;
