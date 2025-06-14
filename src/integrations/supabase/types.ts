export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chromatograms: {
        Row: {
          chromatogram_id: string
          created_at: string
          id: string
          intensity_array: number[]
          precursor_mz: number | null
          sample_id: string
          time_array: number[]
        }
        Insert: {
          chromatogram_id: string
          created_at?: string
          id?: string
          intensity_array: number[]
          precursor_mz?: number | null
          sample_id: string
          time_array: number[]
        }
        Update: {
          chromatogram_id?: string
          created_at?: string
          id?: string
          intensity_array?: number[]
          precursor_mz?: number | null
          sample_id?: string
          time_array?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "chromatograms_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      compound_libraries: {
        Row: {
          compound_count: number | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          compound_count?: number | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          compound_count?: number | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compound_libraries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compounds: {
        Row: {
          created_at: string
          database_id: string | null
          exact_mass: number
          formula: string | null
          id: string
          inchi: string | null
          library_id: string
          metadata: Json | null
          ms2_spectrum: Json | null
          name: string
          smiles: string | null
        }
        Insert: {
          created_at?: string
          database_id?: string | null
          exact_mass: number
          formula?: string | null
          id?: string
          inchi?: string | null
          library_id: string
          metadata?: Json | null
          ms2_spectrum?: Json | null
          name: string
          smiles?: string | null
        }
        Update: {
          created_at?: string
          database_id?: string | null
          exact_mass?: number
          formula?: string | null
          id?: string
          inchi?: string | null
          library_id?: string
          metadata?: Json | null
          ms2_spectrum?: Json | null
          name?: string
          smiles?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compounds_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "compound_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      identifications: {
        Row: {
          compound_id: string | null
          confidence: Database["public"]["Enums"]["identification_confidence"]
          created_at: string
          execution_id: string
          id: string
          mass_error_ppm: number | null
          match_metadata: Json | null
          rt_error: number | null
          score: number
          spectrum_id: string | null
        }
        Insert: {
          compound_id?: string | null
          confidence: Database["public"]["Enums"]["identification_confidence"]
          created_at?: string
          execution_id: string
          id?: string
          mass_error_ppm?: number | null
          match_metadata?: Json | null
          rt_error?: number | null
          score: number
          spectrum_id?: string | null
        }
        Update: {
          compound_id?: string | null
          confidence?: Database["public"]["Enums"]["identification_confidence"]
          created_at?: string
          execution_id?: string
          id?: string
          mass_error_ppm?: number | null
          match_metadata?: Json | null
          rt_error?: number | null
          score?: number
          spectrum_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identifications_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identifications_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identifications_spectrum_id_fkey"
            columns: ["spectrum_id"]
            isOneToOne: false
            referencedRelation: "spectra"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          institution: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          institution?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      samples: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          instrument_model: string | null
          metadata: Json | null
          ms_levels: number[] | null
          rt_range_max: number | null
          rt_range_min: number | null
          status: Database["public"]["Enums"]["sample_status"] | null
          total_spectra: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          instrument_model?: string | null
          metadata?: Json | null
          ms_levels?: number[] | null
          rt_range_max?: number | null
          rt_range_min?: number | null
          status?: Database["public"]["Enums"]["sample_status"] | null
          total_spectra?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          instrument_model?: string | null
          metadata?: Json | null
          ms_levels?: number[] | null
          rt_range_max?: number | null
          rt_range_min?: number | null
          status?: Database["public"]["Enums"]["sample_status"] | null
          total_spectra?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spectra: {
        Row: {
          base_peak_intensity: number | null
          base_peak_mz: number | null
          created_at: string
          id: string
          ms_level: number
          peaks: Json
          retention_time: number
          sample_id: string
          scan_number: number
          total_ion_current: number | null
        }
        Insert: {
          base_peak_intensity?: number | null
          base_peak_mz?: number | null
          created_at?: string
          id?: string
          ms_level?: number
          peaks?: Json
          retention_time: number
          sample_id: string
          scan_number: number
          total_ion_current?: number | null
        }
        Update: {
          base_peak_intensity?: number | null
          base_peak_mz?: number | null
          created_at?: string
          id?: string
          ms_level?: number
          peaks?: Json
          retention_time?: number
          sample_id?: string
          scan_number?: number
          total_ion_current?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spectra_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          progress: number | null
          results: Json | null
          sample_ids: string[]
          started_at: string
          status: Database["public"]["Enums"]["workflow_status"] | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          results?: Json | null
          sample_ids: string[]
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"] | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          progress?: number | null
          results?: Json | null
          sample_ids?: string[]
          started_at?: string
          status?: Database["public"]["Enums"]["workflow_status"] | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["workflow_status"] | null
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["workflow_status"] | null
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["workflow_status"] | null
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      identification_confidence: "high" | "medium" | "low"
      sample_status: "uploading" | "processing" | "completed" | "failed"
      workflow_status: "draft" | "running" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      identification_confidence: ["high", "medium", "low"],
      sample_status: ["uploading", "processing", "completed", "failed"],
      workflow_status: ["draft", "running", "completed", "failed"],
    },
  },
} as const
