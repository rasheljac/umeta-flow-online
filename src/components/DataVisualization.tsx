
import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Target, Zap, Clock, Filter } from "lucide-react";
import MassSpectrumViewer from "./MassSpectrumViewer";
import ChromatogramViewer from "./ChromatogramViewer";
import { ParsedMzData } from "@/utils/mzParser";

interface DataVisualizationProps {
  results: any;
  workflowSteps?: any[];
  sampleType?: "Serum" | "Tissue";
  sampleOrder?: { fileName: string; order: number }[];
  uploadedDataOverride?: ParsedMzData[];
}

interface ChromatogramFilters {
  polarity: "positive" | "negative" | "all";
  scanRangeMin: number;
  scanRangeMax: number;
  mzTarget: number | null;
  mzTolerance: number;
}

const generateMockData = () => {
  const compounds = ['Glucose', 'Lactate', 'Pyruvate', 'Citrate', 'Succinate', 'Fumarate', 'Malate', 'Alanine', 'Glycine', 'Serine'];
  
  const intensityData = compounds.map(compound => ({
    compound,
    Control: Math.random() * 10000 + 5000,
    Treatment: Math.random() * 10000 + 5000,
  }));

  const pcaData = Array.from({ length: 20 }, (_, i) => ({
    sample: `Sample_${i + 1}`,
    PC1: (Math.random() - 0.5) * 20,
    PC2: (Math.random() - 0.5) * 15,
    group: i < 10 ? 'Control' : 'Treatment'
  }));

  const pathwayData = [
    { pathway: 'Glycolysis', compounds: 12, pValue: 0.003 },
    { pathway: 'TCA Cycle', compounds: 8, pValue: 0.012 },
    { pathway: 'Amino Acid Metabolism', compounds: 15, pValue: 0.045 },
    { pathway: 'Fatty Acid Oxidation', compounds: 6, pValue: 0.089 },
    { pathway: 'Pentose Phosphate', compounds: 7, pValue: 0.156 }
  ];

  const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
    time: i,
    glucose: 100 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    lactate: 50 + Math.cos(i * 0.3) * 15 + Math.random() * 8,
    pyruvate: 30 + Math.sin(i * 0.8) * 10 + Math.random() * 5
  }));

  return { intensityData, pcaData, pathwayData, timeSeriesData };
};

const DataVisualization = ({
  results,
  workflowSteps = [],
  sampleType = "Serum",
  sampleOrder = [],
  uploadedDataOverride = undefined,
}: DataVisualizationProps) => {
  const [selectedChart, setSelectedChart] = useState("chromatograms");
  const [uploadedData, setUploadedData] = useState<ParsedMzData[]>([]);
  const [filters, setFilters] = useState<ChromatogramFilters>({
    polarity: "all",
    scanRangeMin: 0,
    scanRangeMax: 1000,
    mzTarget: null,
    mzTolerance: 0.01
  });
  const mockData = generateMockData();

  useEffect(() => {
    if (uploadedDataOverride) {
      setUploadedData(uploadedDataOverride);
      return;
    }
    const storedData = localStorage.getItem('uploadedMzData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setUploadedData(parsed);
        console.log('Loaded uploaded data for visualization:', parsed.length, 'files');
      } catch (error) {
        console.error('Failed to load uploaded data:', error);
      }
    }
  }, [uploadedDataOverride]);

  // Update scan range when data changes
  useEffect(() => {
    if (uploadedData.length > 0) {
      const allSpectra = uploadedData.flatMap(file => file.spectra);
      if (allSpectra.length > 0) {
        const minScan = Math.min(...allSpectra.map(s => s.scanNumber));
        const maxScan = Math.max(...allSpectra.map(s => s.scanNumber));
        setFilters(prev => ({
          ...prev,
          scanRangeMin: minScan,
          scanRangeMax: maxScan
        }));
      }
    }
  }, [uploadedData]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const statisticsStepSucceeded = useMemo(() => {
    if (!results?.results) return false;
    const statsStep = results.results.find((s: any) => s.stepName === "Statistical Analysis" && s.success);
    return !!statsStep;
  }, [results]);

  const showTimeSeries = sampleType === "Serum";

  const enabledTabs = {
    spectra: true,
    chromatograms: true,
    intensity: statisticsStepSucceeded,
    pca: statisticsStepSucceeded,
    pathway: statisticsStepSucceeded,
    timeseries: showTimeSeries,
  };

  const extractMzChromatogram = (mzTarget: number, tolerance: number) => {
    if (!uploadedData.length || !mzTarget) return null;

    const extractedData: { time: number; intensity: number }[] = [];
    
    uploadedData.forEach(file => {
      file.spectra.forEach(spectrum => {
        const matchingPeaks = spectrum.peaks.filter(peak => 
          Math.abs(peak.mz - mzTarget) <= tolerance
        );
        
        if (matchingPeaks.length > 0) {
          const totalIntensity = matchingPeaks.reduce((sum, peak) => sum + peak.intensity, 0);
          extractedData.push({
            time: spectrum.retentionTime,
            intensity: totalIntensity
          });
        }
      });
    });

    return extractedData.sort((a, b) => a.time - b.time);
  };

  const filteredData = useMemo(() => {
    if (!uploadedData.length) return uploadedData;

    return uploadedData.map(file => ({
      ...file,
      spectra: file.spectra.filter(spectrum => 
        spectrum.scanNumber >= filters.scanRangeMin && 
        spectrum.scanNumber <= filters.scanRangeMax
      )
    }));
  }, [uploadedData, filters.scanRangeMin, filters.scanRangeMax]);

  const mzChromatogramData = useMemo(() => {
    if (filters.mzTarget) {
      return extractMzChromatogram(filters.mzTarget, filters.mzTolerance);
    }
    return null;
  }, [uploadedData, filters.mzTarget, filters.mzTolerance]);

  // Show message if no data is available
  if (!uploadedData.length && !results?.processed) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No data available for visualization.</p>
        <p className="text-sm">Please upload files first to see chromatograms and spectra.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Data Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="polarity">Polarity</Label>
              <Select value={filters.polarity} onValueChange={(value: any) => setFilters(prev => ({ ...prev, polarity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="scanMin">Scan Range Min</Label>
              <Input
                id="scanMin"
                type="number"
                value={filters.scanRangeMin}
                onChange={(e) => setFilters(prev => ({ ...prev, scanRangeMin: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="scanMax">Scan Range Max</Label>
              <Input
                id="scanMax"
                type="number"
                value={filters.scanRangeMax}
                onChange={(e) => setFilters(prev => ({ ...prev, scanRangeMax: parseInt(e.target.value) || 1000 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="mzTarget">Target m/z</Label>
              <Input
                id="mzTarget"
                type="number"
                step="0.0001"
                placeholder="e.g., 200.1234"
                value={filters.mzTarget || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, mzTarget: parseFloat(e.target.value) || null }))}
              />
            </div>
            
            <div>
              <Label htmlFor="mzTolerance">m/z Tolerance</Label>
              <Input
                id="mzTolerance"
                type="number"
                step="0.0001"
                value={filters.mzTolerance}
                onChange={(e) => setFilters(prev => ({ ...prev, mzTolerance: parseFloat(e.target.value) || 0.01 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Data Visualizations</h3>
        <Select value={selectedChart} onValueChange={setSelectedChart}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spectra">Mass Spectra</SelectItem>
            <SelectItem value="chromatograms">Chromatograms</SelectItem>
            <SelectItem value="intensity" disabled={!enabledTabs.intensity}>Compound Intensities</SelectItem>
            <SelectItem value="pca" disabled={!enabledTabs.pca}>PCA Analysis</SelectItem>
            <SelectItem value="pathway" disabled={!enabledTabs.pathway}>Pathway Enrichment</SelectItem>
            <SelectItem value="timeseries" disabled={!enabledTabs.timeseries}>Time Series</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedChart} onValueChange={setSelectedChart}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="spectra">
            <Zap className="w-4 h-4 mr-2" />
            Mass Spectra
          </TabsTrigger>
          <TabsTrigger value="chromatograms">
            <Clock className="w-4 h-4 mr-2" />
            Chromatograms
          </TabsTrigger>
          <TabsTrigger value="intensity" disabled={!enabledTabs.intensity}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Intensities
          </TabsTrigger>
          <TabsTrigger value="pca" disabled={!enabledTabs.pca}>
            <Target className="w-4 h-4 mr-2" />
            PCA
          </TabsTrigger>
          <TabsTrigger value="pathway" disabled={!enabledTabs.pathway}>
            <PieChartIcon className="w-4 h-4 mr-2" />
            Pathways
          </TabsTrigger>
          <TabsTrigger value="timeseries" disabled={!enabledTabs.timeseries}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Time Series
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spectra">
          <Card>
            <CardHeader>
              <CardTitle>Mass Spectrum Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <MassSpectrumViewer data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chromatograms">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chromatogram Viewer</CardTitle>
              </CardHeader>
              <CardContent>
                <ChromatogramViewer data={filteredData} />
              </CardContent>
            </Card>

            {/* Extracted Ion Chromatogram */}
            {mzChromatogramData && (
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Ion Chromatogram (m/z {filters.mzTarget})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mzChromatogramData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, 'Intensity']}
                          labelFormatter={(label) => `RT: ${typeof label === 'number' ? label.toFixed(2) : label} min`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="intensity" 
                          stroke="#3B82F6" 
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
        </TabsContent>

        <TabsContent value="intensity">
          <Card>
            <CardHeader>
              <CardTitle>Compound Intensity Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData.intensityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="compound" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Control" fill="#3B82F6" name="Control Group" />
                    <Bar dataKey="Treatment" fill="#10B981" name="Treatment Group" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pca">
          <Card>
            <CardHeader>
              <CardTitle>Principal Component Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={mockData.pcaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="PC1" name="PC1" />
                    <YAxis dataKey="PC2" name="PC2" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="Control" 
                      data={mockData.pcaData.filter(d => d.group === 'Control')}
                      fill="#3B82F6" 
                    />
                    <Scatter 
                      name="Treatment" 
                      data={mockData.pcaData.filter(d => d.group === 'Treatment')}
                      fill="#10B981" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pathway">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pathway Enrichment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockData.pathwayData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="compounds"
                        nameKey="pathway"
                      >
                        {mockData.pathwayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pathway Significance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.pathwayData.map((pathway, index) => (
                    <div key={pathway.pathway} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium text-slate-900">{pathway.pathway}</p>
                          <p className="text-sm text-slate-600">{pathway.compounds} compounds</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-slate-700">
                          p = {pathway.pValue.toFixed(3)}
                        </p>
                        <p className={`text-xs ${pathway.pValue < 0.05 ? 'text-red-600' : 'text-slate-500'}`}>
                          {pathway.pValue < 0.05 ? 'Significant' : 'Not significant'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeseries">
          <Card>
            <CardHeader>
              <CardTitle>Metabolite Time Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="glucose" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Glucose"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lactate" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Lactate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pyruvate" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Pyruvate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
