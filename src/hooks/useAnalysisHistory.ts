
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalysisRun {
  id: string;
  user_id: string;
  workflow_name: string;
  status: string;
  results: any;
  summary: any;
  created_at: string;
  updated_at: string;
}

export const useAnalysisHistory = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_runs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error loading analysis history",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (analysisData: {
    workflow_name: string;
    status: string;
    results?: any;
    summary?: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('analysis_runs')
        .insert({
          user_id: user.id,
          ...analysisData
        })
        .select()
        .single();

      if (error) throw error;

      setAnalyses(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Save failed",
        description: "Failed to save analysis to history",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_runs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalyses(prev => prev.filter(analysis => analysis.id !== id));
      toast({
        title: "Analysis deleted",
        description: "Analysis has been removed from your history"
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  return {
    analyses,
    loading,
    saveAnalysis,
    deleteAnalysis,
    refetch: fetchAnalyses
  };
};
