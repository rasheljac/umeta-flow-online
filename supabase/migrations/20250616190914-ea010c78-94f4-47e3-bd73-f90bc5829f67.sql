
-- Update existing profiles table to add avatar_url if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create analysis_runs table for storing analysis history
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  results JSONB,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analysis_runs
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis_runs (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own analysis runs" ON public.analysis_runs;
DROP POLICY IF EXISTS "Users can insert their own analysis runs" ON public.analysis_runs;
DROP POLICY IF EXISTS "Users can update their own analysis runs" ON public.analysis_runs;
DROP POLICY IF EXISTS "Users can delete their own analysis runs" ON public.analysis_runs;

CREATE POLICY "Users can view their own analysis runs" 
  ON public.analysis_runs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis runs" 
  ON public.analysis_runs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis runs" 
  ON public.analysis_runs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis runs" 
  ON public.analysis_runs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars (drop first if they exist)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'avatars');

-- Create updated_at trigger for analysis_runs if it doesn't exist
DROP TRIGGER IF EXISTS handle_updated_at_analysis_runs ON public.analysis_runs;
CREATE TRIGGER handle_updated_at_analysis_runs
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
