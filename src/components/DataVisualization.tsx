import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Scatter as ScatterIcon } from "lucide-react";

interface DataVisualizationProps {
  results: any;
}

const generateMockData = () => {
  // Generate mock metabolomics data for visualization
  const compounds = ['Glucose', 'Lactate', 'Pyruvate', 'Citrate', 'Succinate', 'Fumarate', 'Malate', 'Alanine', 'Glycine', 'Serine'];
  const groups = ['Control', 'Treatment'];
  
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

const DataVisualization = ({ results }: DataVisualizationProps) => {
  const [selectedChart, setSelectedChart] = useState("intensity");
  const mockData = generateMockData();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (!results || !results.processed) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No analysis results to visualize yet.</p>
        <p className="text-sm">Run your workflow to generate visualizations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Data Visualizations</h3>
        <Select value={selectedChart} onValueChange={setSelectedChart}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="intensity">Compound Intensities</SelectItem>
            <SelectItem value="pca">PCA Analysis</SelectItem>
            <SelectItem value="pathway">Pathway Enrichment</SelectItem>
            <SelectItem value="timeseries">Time Series</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedChart} onValueChange={setSelectedChart}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="intensity">
            <BarChart3 className="w-4 h-4 mr-2" />
            Intensities
          </TabsTrigger>
          <TabsTrigger value="pca">
            <ScatterIcon className="w-4 h-4 mr-2" />
            PCA
          </TabsTrigger>
          <TabsTrigger value="pathway">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Pathways
          </TabsTrigger>
          <TabsTrigger value="timeseries">
            <TrendingUp className="w-4 h-4 mr-2" />
            Time Series
          </TabsTrigger>
        </TabsList>

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
