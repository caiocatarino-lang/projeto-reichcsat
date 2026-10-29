export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_provider_configs: {
        Row: {
          id: string
          org_id: string
          provider: string
          api_key_ciphertext: string
          api_key_iv: string
          api_key_tag: string
          analysis_model: string
          transcription_model: string
          last_validated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          provider: string
          api_key_ciphertext: string
          api_key_iv: string
          api_key_tag: string
          analysis_model: string
          transcription_model: string
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          provider?: string
          api_key_ciphertext?: string
          api_key_iv?: string
          api_key_tag?: string
          analysis_model?: string
          transcription_model?: string
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          ai_briefing: Json | null
          ai_generated_at: string | null
          ai_model: string | null
          assignee: string | null
          created_at: string
          id: string
          notes: string | null
          org_id: string
          response_id: string
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
        }
        Insert: {
          ai_briefing?: Json | null
          ai_generated_at?: string | null
          ai_model?: string | null
          assignee?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          response_id: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Update: {
          ai_briefing?: Json | null
          ai_generated_at?: string | null
          ai_model?: string | null
          assignee?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          response_id?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: true
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_secrets: {
        Row: {
          integration_id: string
          webhook_url: string
        }
        Insert: {
          integration_id: string
          webhook_url: string
        }
        Update: {
          integration_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_secrets_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          create_tasks: boolean
          id: string
          last_error: string | null
          last_sync_at: string | null
          org_id: string
          portal: string | null
          post_timeline: boolean
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          create_tasks?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          org_id: string
          portal?: string | null
          post_timeline?: boolean
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          create_tasks?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          org_id?: string
          portal?: string | null
          post_timeline?: boolean
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          email: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          bitrix_entity_id: string | null
          bitrix_entity_type: string | null
          bitrix_synced: boolean
          channel: string
          comment: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          is_negative: boolean
          org_id: string
          responsible: string | null
          score: number
          service_type: string | null
          survey_id: string
          survey_type: Database["public"]["Enums"]["survey_type"]
        }
        Insert: {
          bitrix_entity_id?: string | null
          bitrix_entity_type?: string | null
          bitrix_synced?: boolean
          channel?: string
          comment?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          is_negative?: boolean
          org_id: string
          responsible?: string | null
          score: number
          service_type?: string | null
          survey_id: string
          survey_type: Database["public"]["Enums"]["survey_type"]
        }
        Update: {
          bitrix_entity_id?: string | null
          bitrix_entity_type?: string | null
          bitrix_synced?: boolean
          channel?: string
          comment?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          is_negative?: boolean
          org_id?: string
          responsible?: string | null
          score?: number
          service_type?: string | null
          survey_id?: string
          survey_type?: Database["public"]["Enums"]["survey_type"]
        }
        Relationships: [
          {
            foreignKeyName: "responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          comment_prompt: string
          created_at: string
          created_by: string | null
          delivery_channels: Json
          csat_scale: number
          csat_threshold: number
          id: string
          name: string
          org_id: string
          public_id: string
          public_token: string
          question: string
          service_type: string | null
          status: Database["public"]["Enums"]["survey_status"]
          thank_you: string
          type: Database["public"]["Enums"]["survey_type"]
          updated_at: string
        }
        Insert: {
          comment_prompt?: string
          created_at?: string
          created_by?: string | null
          delivery_channels?: Json
          csat_scale?: number
          csat_threshold?: number
          id?: string
          name: string
          org_id: string
          public_id?: string
          public_token?: string
          question: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          thank_you?: string
          type: Database["public"]["Enums"]["survey_type"]
          updated_at?: string
        }
        Update: {
          comment_prompt?: string
          created_at?: string
          created_by?: string | null
          delivery_channels?: Json
          csat_scale?: number
          csat_threshold?: number
          id?: string
          name?: string
          org_id?: string
          public_id?: string
          public_token?: string
          question?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["survey_status"]
          thank_you?: string
          type?: Database["public"]["Enums"]["survey_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          ok: boolean
          org_id: string
          provider: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          ok: boolean
          org_id: string
          provider: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          ok?: boolean
          org_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_org_role: {
        Args: { _org: string; _role: Database["public"]["Enums"]["org_role"] }
        Returns: boolean
      }
      is_member: { Args: { _org: string }; Returns: boolean }
    }
    Enums: {
      case_status: "open" | "in_progress" | "resolved"
      org_role: "admin" | "manager" | "agent"
      survey_status: "draft" | "active" | "archived"
      survey_type: "nps" | "csat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: ["open", "in_progress", "resolved"],
      org_role: ["admin", "manager", "agent"],
      survey_status: ["draft", "active", "archived"],
      survey_type: ["nps", "csat"],
    },
  },
} as const
