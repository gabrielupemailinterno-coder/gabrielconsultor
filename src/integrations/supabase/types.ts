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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homework_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          meeting_id: string | null
          mentee_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          meeting_id?: string | null
          mentee_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          meeting_id?: string | null
          mentee_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tasks_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_templates: {
        Row: {
          description: string | null
          id: string
          meeting_sequence: number
          plan_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          meeting_sequence: number
          plan_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          meeting_sequence?: number
          plan_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_templates_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          answers: Json | null
          company_name: string | null
          created_at: string
          email: string
          form_type: string
          id: string
          main_pain: string | null
          name: string
          phone: string
          revenue: string | null
          source: string | null
        }
        Insert: {
          answers?: Json | null
          company_name?: string | null
          created_at?: string
          email: string
          form_type?: string
          id?: string
          main_pain?: string | null
          name: string
          phone: string
          revenue?: string | null
          source?: string | null
        }
        Update: {
          answers?: Json | null
          company_name?: string | null
          created_at?: string
          email?: string
          form_type?: string
          id?: string
          main_pain?: string | null
          name?: string
          phone?: string
          revenue?: string | null
          source?: string | null
        }
        Relationships: []
      }
      meeting_resources: {
        Row: {
          created_at: string
          id: string
          kind: string
          meeting_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          meeting_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          meeting_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_resources_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_templates: {
        Row: {
          description: string | null
          id: string
          plan_id: string
          sequence: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          plan_id: string
          sequence: number
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          plan_id?: string
          sequence?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_templates_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          google_event_id: string | null
          id: string
          meet_link: string | null
          mentee_id: string
          notes: string | null
          scheduled_at: string | null
          sequence: number
          status: string
          title: string
          unlocks_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          google_event_id?: string | null
          id?: string
          meet_link?: string | null
          mentee_id: string
          notes?: string | null
          scheduled_at?: string | null
          sequence: number
          status?: string
          title: string
          unlocks_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          google_event_id?: string | null
          id?: string
          meet_link?: string | null
          mentee_id?: string
          notes?: string | null
          scheduled_at?: string | null
          sequence?: number
          status?: string
          title?: string
          unlocks_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
      }
      mentee_admin_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          mentee_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          mentee_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentee_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mentees: {
        Row: {
          access_mode: string
          address: string | null
          address_complement: string | null
          address_number: string | null
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          payment_notes: string | null
          payment_status: string
          payment_updated_at: string | null
          phone: string | null
          plan_id: string
          postal_code: string | null
          province: string | null
          started_at: string | null
          state: string | null
          status: string
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_mode?: string
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          payment_notes?: string | null
          payment_status?: string
          payment_updated_at?: string | null
          phone?: string | null
          plan_id: string
          postal_code?: string | null
          province?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_mode?: string
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          payment_notes?: string | null
          payment_status?: string
          payment_updated_at?: string | null
          phone?: string | null
          plan_id?: string
          postal_code?: string | null
          province?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentees_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentorship_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_months: number
          id: string
          installments: number
          name: string
          price_cents: number
          slug: string
          total_meetings: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          installments?: number
          name: string
          price_cents: number
          slug: string
          total_meetings?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          installments?: number
          name?: string
          price_cents?: number
          slug?: string
          total_meetings?: number
        }
        Relationships: []
      }
      metrics_checkpoints: {
        Row: {
          connection_rate: number
          created_at: string
          id: string
          leads_inbound: number
          leads_outbound: number
          meetings_held: number
          meetings_scheduled: number
          mentee_id: string
          notes: string | null
          period_start: string
          revenue_cents: number
          sales_count: number
          updated_at: string
        }
        Insert: {
          connection_rate?: number
          created_at?: string
          id?: string
          leads_inbound?: number
          leads_outbound?: number
          meetings_held?: number
          meetings_scheduled?: number
          mentee_id: string
          notes?: string | null
          period_start: string
          revenue_cents?: number
          sales_count?: number
          updated_at?: string
        }
        Update: {
          connection_rate?: number
          created_at?: string
          id?: string
          leads_inbound?: number
          leads_outbound?: number
          meetings_held?: number
          meetings_scheduled?: number
          mentee_id?: string
          notes?: string | null
          period_start?: string
          revenue_cents?: number
          sales_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_checkpoints_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
      }
      page_clicks: {
        Row: {
          created_at: string
          element_label: string | null
          element_type: string | null
          id: string
          path: string
          session_id: string
        }
        Insert: {
          created_at?: string
          element_label?: string | null
          element_type?: string | null
          id?: string
          path: string
          session_id: string
        }
        Update: {
          created_at?: string
          element_label?: string | null
          element_type?: string | null
          id?: string
          path?: string
          session_id?: string
        }
        Relationships: []
      }
      page_sessions: {
        Row: {
          duration_seconds: number
          last_seen_at: string
          path: string
          referrer: string | null
          session_id: string
          started_at: string
          user_agent: string | null
        }
        Insert: {
          duration_seconds?: number
          last_seen_at?: string
          path: string
          referrer?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          duration_seconds?: number
          last_seen_at?: string
          path?: string
          referrer?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          language: string | null
          path: string
          referrer: string | null
          screen_size: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          path: string
          referrer?: string | null
          screen_size?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          path?: string
          referrer?: string | null
          screen_size?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      provision_mentee: {
        Args: {
          _asaas_customer_id: string
          _asaas_payment_id: string
          _email: string
          _full_name: string
          _phone: string
          _plan_id: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "mentee"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user", "mentee"],
    },
  },
} as const
