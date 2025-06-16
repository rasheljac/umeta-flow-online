
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { Trash2, Calendar, Activity, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MyAnalysis = () => {
  const { analyses, loading, deleteAnalysis } = useAnalysisHistory();
  const { toast } = useToast();

  const handleDelete = async (id: string, workflowName: string) => {
    if (window.confirm(`Are you sure you want to delete the analysis "${workflowName}"? This action cannot be undone.`)) {
      await deleteAnalysis(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <h1 className="text-xl font-bold text-slate-900">My Analysis</h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Analysis History</h2>
          <p className="text-lg text-slate-600">Browse all your workflow runs and results.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Past Workflow Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-500">Loading analysis history...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No workflows run yet.</p>
                        <p className="text-sm">Start by creating and running a workflow.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    analyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">{analysis.workflow_name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(analysis.status)}>
                            {analysis.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(analysis.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {analysis.summary ? (
                            <div className="flex flex-wrap gap-1">
                              {analysis.summary.peaksDetected && (
                                <Badge variant="outline">{analysis.summary.peaksDetected} peaks</Badge>
                              )}
                              {analysis.summary.compoundsIdentified && (
                                <Badge variant="outline">{analysis.summary.compoundsIdentified} compounds</Badge>
                              )}
                              {analysis.summary.processingTime && (
                                <Badge variant="secondary">{analysis.summary.processingTime}s</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">No summary available</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(analysis.id, analysis.workflow_name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyAnalysis;
