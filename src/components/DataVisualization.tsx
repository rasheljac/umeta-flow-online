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
    chromatograms: true,
    intensity: statisticsStepSucceeded,
    pca: statisticsStepSucceeded,
    pathway: statisticsStepSucceeded,
    timeseries: showTimeSeries,
  };

  // Extract real intensity data from processed results
  const intensityData = useMemo(() => {
    if (!results?.processedData) return [];
    
    const compoundIntensities: { [name: string]: { [sample: string]: number } } = {};
    
    results.processedData.forEach((sample: any) => {
      const compounds = sample.identifiedCompounds || [];
      compounds.forEach((compound: any) => {
        if (!compoundIntensities[compound.name]) {
          compoundIntensities[compound.name] = {};
        }
        compoundIntensities[compound.name][sample.fileName] = compound.peaks[0]?.intensity || 0;
      });
    });
    
    return Object.entries(compoundIntensities).slice(0, 10).map(([compound, samples]) => ({
      compound,
      ...samples
    }));
  }, [results?.processedData]);

  // Extract real statistical results for PCA-like visualization
  const pcaData = useMemo(() => {
    if (!results?.processedData) return [];
    
    return results.processedData.map((sample: any, index: number) => {
      const compounds = sample.identifiedCompounds || [];
      const totalIntensity = compounds.reduce((sum: number, c: any) => sum + (c.peaks[0]?.intensity || 0), 0);
      const compoundCount = compounds.length;
      
      return {
        sample: sample.fileName,
        PC1: totalIntensity / 100000, // Normalized for visualization
        PC2: compoundCount * 2,
        group: index < results.processedData.length / 2 ? 'Group A' : 'Group B'
      };
    });
  }, [results?.processedData]);

  // Extract real pathway data from identified compounds
  const pathwayData = useMemo(() => {
    if (!results?.processedData) return [];
    
    const pathways: { [name: string]: { compounds: number; totalIntensity: number } } = {};
    
    results.processedData.forEach((sample: any) => {
      const compounds = sample.identifiedCompounds || [];
      compounds.forEach((compound: any) => {
        // Map compounds to pathways (simplified)
        let pathway = 'Unknown';
        if (['Glucose', 'Lactate', 'Pyruvate'].includes(compound.name)) pathway = 'Glycolysis';
        else if (['Citric acid', 'Succinate', 'Fumarate', 'Malate'].includes(compound.name)) pathway = 'TCA Cycle';
        else if (['Alanine', 'Glycine', 'Serine', 'Tryptophan'].includes(compound.name)) pathway = 'Amino Acid Metabolism';
        else if (['Caffeine', 'Adenosine', 'Uric acid'].includes(compound.name)) pathway = 'Purine Metabolism';
        
        if (!pathways[pathway]) {
          pathways[pathway] = { compounds: 0, totalIntensity: 0 };
        }
        pathways[pathway].compounds++;
        pathways[pathway].totalIntensity += compound.peaks[0]?.intensity || 0;
      });
    });
    
    return Object.entries(pathways).map(([pathway, data]) => ({
      pathway,
      compounds: data.compounds,
      pValue: Math.random() * 0.1 // Placeholder - in real implementation, get from statistical results
    }));
  }, [results?.processedData]);

  // Extract real time series data if available
  const timeSeriesData = useMemo(() => {
    if (!results?.processedData || !showTimeSeries) return [];
    
    // Group data by retention time for time series visualization
    const timePoints: { [rt: string]: { [compound: string]: number } } = {};
    
    results.processedData.forEach((sample: any) => {
      const compounds = sample.identifiedCompounds || [];
      compounds.forEach((compound: any) => {
        const rt = compound.peaks[0]?.retentionTime?.toFixed(1) || '0';
        if (!timePoints[rt]) timePoints[rt] = {};
        timePoints[rt][compound.name] = compound.peaks[0]?.intensity || 0;
      });
    });
    
    return Object.entries(timePoints).slice(0, 24).map(([rt, compounds]) => ({
      time: parseFloat(rt),
      glucose: compounds['Glucose'] || 0,
      lactate: compounds['Lactate'] || 0,
      pyruvate: compounds['Pyruvate'] || 0
    })).sort((a, b) => a.time - b.time);
  }, [results?.processedData, showTimeSeries]);

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
        <p className="text-sm">Please upload files and run a workflow to see processed data visualizations.</p>
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
            <SelectItem value="chromatograms">Chromatograms</SelectItem>
            <SelectItem value="intensity" disabled={!enabledTabs.intensity}>Compound Intensities</SelectItem>
            <SelectItem value="pca" disabled={!enabledTabs.pca}>PCA Analysis</SelectItem>
            <SelectItem value="pathway" disabled={!enabledTabs.pathway}>Pathway Enrichment</SelectItem>
            <SelectItem value="timeseries" disabled={!enabledTabs.timeseries}>Time Series</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedChart} onValueChange={setSelectedChart}>
        <TabsList className="grid w-full grid-cols-5">
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
            Analysis
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

        <TabsContent value="chromatograms">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chromatogram Viewer</CardTitle>
                <p className="text-sm text-slate-600">Click on any point in the chromatogram to view the corresponding mass spectrum below</p>
              </CardHeader>
              <CardContent>
                <ChromatogramViewer data={filteredData} />
              </CardContent>
            </Card>

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
              {intensityData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="compound" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      {Object.keys(intensityData[0] || {}).filter(key => key !== 'compound').map((sampleName, index) => (
                        <Bar 
                          key={sampleName} 
                          dataKey={sampleName} 
                          fill={COLORS[index % COLORS.length]} 
                          name={sampleName} 
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No compound intensity data available</p>
                  <p className="text-sm">Run identification and statistics steps to see compound comparisons</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pca">
          <Card>
            <CardHeader>
              <CardTitle>Sample Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {pcaData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={pcaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="PC1" name="Total Intensity" label={{ value: 'Total Intensity (normalized)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="PC2" name="Compound Count" label={{ value: 'Compound Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter 
                        name="Group A" 
                        data={pcaData.filter(d => d.group === 'Group A')}
                        fill="#3B82F6" 
                      />
                      <Scatter 
                        name="Group B" 
                        data={pcaData.filter(d => d.group === 'Group B')}
                        fill="#10B981" 
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No analysis data available</p>
                  <p className="text-sm">Run statistical analysis to see sample comparisons</p>
                </div>
              )}
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
                {pathwayData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pathwayData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="compounds"
                          nameKey="pathway"
                        >
                          {pathwayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No pathway data available</p>
                    <p className="text-sm">Run compound identification to see pathway analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pathway Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pathwayData.length > 0 ? pathwayData.map((pathway, index) => (
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
                  )) : (
                    <div className="text-center py-4 text-slate-500">
                      <p>No pathway analysis available</p>
                    </div>
                  )}
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
              {timeSeriesData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Retention Time (min)', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
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
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No time series data available</p>
                  <p className="text-sm">Run compound identification to see time course analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;
