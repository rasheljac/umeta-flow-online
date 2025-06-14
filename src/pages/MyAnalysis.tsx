
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MyAnalysis = () => {
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    const allAnalysesRaw = localStorage.getItem('myAnalyses') ?? "[]";
    setRuns(JSON.parse(allAnalysesRaw));
  }, []);

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
            <CardTitle>Past Workflow Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      No workflows run yet.
                    </TableCell>
                  </TableRow>
                )}
                {runs.map((run, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{run.workflowName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {run.date ? new Date(run.date).toLocaleString() : ""}
                    </TableCell>
                    <TableCell>
                      {run.summary ? (
                        <div className="flex flex-col gap-1">
                          <span><Badge>{run.summary.peaksDetected} peaks</Badge></span>
                          <span><Badge>{run.summary.compoundsIdentified} compounds</Badge></span>
                          <span><Badge variant="outline">{run.summary.processingTime}s</Badge></span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {run.steps?.map((s: any) => s.name)?.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyAnalysis;
