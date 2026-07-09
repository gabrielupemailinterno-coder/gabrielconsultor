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
      blocklist: {
        Row: {
          created_at: string
          id: string
          note: string | null
          phone_e164: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          phone_e164: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          phone_e164?: string
          user_id?: string
        }
        Relationships: []
      }
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
      bot_flow_versions: {
        Row: {
          created_at: string
          created_by: string | null
          flow_id: string
          graph: Json
          id: string
          triggers: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          flow_id: string
          graph: Json
          id?: string
          triggers?: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          flow_id?: string
          graph?: Json
          id?: string
          triggers?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bot_flow_versions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "bot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_flows: {
        Row: {
          created_at: string
          description: string | null
          graph: Json
          id: string
          is_active: boolean
          name: string
          priority: number
          triggers: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          graph: Json
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          triggers?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          graph?: Json
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          triggers?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      bot_sessions: {
        Row: {
          current_node_id: string | null
          flow_id: string | null
          id: string
          phone: string
          started_at: string
          updated_at: string
          user_id: string | null
          variables: Json
        }
        Insert: {
          current_node_id?: string | null
          flow_id?: string | null
          id?: string
          phone: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
          variables?: Json
        }
        Update: {
          current_node_id?: string | null
          flow_id?: string | null
          id?: string
          phone?: string
          started_at?: string
          updated_at?: string
          user_id?: string | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bot_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "bot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      botconversa_integration_logs: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          phone: string | null
          response: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          phone?: string | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          phone?: string | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      botconversa_pending_webhooks: {
        Row: {
          created_at: string
          email: string | null
          id: string
          payload: Json
          phone: string | null
          reason: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          payload: Json
          phone?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          payload?: Json
          phone?: string | null
          reason?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      campaign_logs: {
        Row: {
          campaign_id: string
          contact_id: string | null
          created_at: string
          id: string
          message: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_steps: {
        Row: {
          add_optout: boolean
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          scheduled_at: string
          sent_at: string | null
          status: string
          step_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          add_optout?: boolean
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          step_order: number
          updated_at?: string
          user_id: string
        }
        Update: {
          add_optout?: boolean
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          add_optout: boolean
          add_to_agent_context: boolean
          cancelled_count: number
          created_at: string
          destination_type: string | null
          error_count: number
          group_id: string | null
          id: string
          kind: string
          message: string
          name: string
          sent_count: number
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          add_optout?: boolean
          add_to_agent_context?: boolean
          cancelled_count?: number
          created_at?: string
          destination_type?: string | null
          error_count?: number
          group_id?: string | null
          id?: string
          kind?: string
          message: string
          name: string
          sent_count?: number
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          add_optout?: boolean
          add_to_agent_context?: boolean
          cancelled_count?: number
          created_at?: string
          destination_type?: string | null
          error_count?: number
          group_id?: string | null
          id?: string
          kind?: string
          message?: string
          name?: string
          sent_count?: number
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          campaign_id: string
          created_at: string
          empresa: string | null
          error_message: string | null
          id: string
          name: string | null
          phone_e164: string
          phone_raw: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          empresa?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone_e164: string
          phone_raw: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          empresa?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone_e164?: string
          phone_raw?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      integration_deliveries: {
        Row: {
          attempt: number
          created_at: string
          duration_ms: number | null
          error: string | null
          event_key: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          webhook_id: string | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_key: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          webhook_id?: string | null
        }
        Update: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_key?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "integration_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          sample_payload: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          sample_payload?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          sample_payload?: Json
        }
        Relationships: []
      }
      integration_webhooks: {
        Row: {
          backoff_seconds: number
          created_at: string
          enabled: boolean
          event_name: string
          headers: Json
          id: string
          last_delivery_at: string | null
          last_delivery_status: string | null
          max_attempts: number
          name: string
          secret: string | null
          timeout_ms: number
          updated_at: string
          url: string
        }
        Insert: {
          backoff_seconds?: number
          created_at?: string
          enabled?: boolean
          event_name: string
          headers?: Json
          id?: string
          last_delivery_at?: string | null
          last_delivery_status?: string | null
          max_attempts?: number
          name: string
          secret?: string | null
          timeout_ms?: number
          updated_at?: string
          url: string
        }
        Update: {
          backoff_seconds?: number
          created_at?: string
          enabled?: boolean
          event_name?: string
          headers?: Json
          id?: string
          last_delivery_at?: string | null
          last_delivery_status?: string | null
          max_attempts?: number
          name?: string
          secret?: string | null
          timeout_ms?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          answers: Json | null
          company_name: string | null
          converted_mentee_id: string | null
          created_at: string
          email: string
          form_type: string
          id: string
          landing_page: string | null
          main_pain: string | null
          name: string
          partner_code: string | null
          partner_id: string | null
          phone: string
          product_interest: string | null
          revenue: string | null
          source: string | null
          source_path: string | null
          status: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json | null
          company_name?: string | null
          converted_mentee_id?: string | null
          created_at?: string
          email: string
          form_type?: string
          id?: string
          landing_page?: string | null
          main_pain?: string | null
          name: string
          partner_code?: string | null
          partner_id?: string | null
          phone: string
          product_interest?: string | null
          revenue?: string | null
          source?: string | null
          source_path?: string | null
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json | null
          company_name?: string | null
          converted_mentee_id?: string | null
          created_at?: string
          email?: string
          form_type?: string
          id?: string
          landing_page?: string | null
          main_pain?: string | null
          name?: string
          partner_code?: string | null
          partner_id?: string | null
          phone?: string
          product_interest?: string | null
          revenue?: string | null
          source?: string | null
          source_path?: string | null
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_mentee_id_fkey"
            columns: ["converted_mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
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
      mentee_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          last_seen_at: string
          mentee_id: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          last_seen_at?: string
          mentee_id: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          last_seen_at?: string
          mentee_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentee_sessions_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
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
          next_meeting_at: string | null
          next_meeting_link: string | null
          next_meeting_source: string | null
          partner_code: string | null
          partner_id: string | null
          password_changed_at: string | null
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
          next_meeting_at?: string | null
          next_meeting_link?: string | null
          next_meeting_source?: string | null
          partner_code?: string | null
          partner_id?: string | null
          password_changed_at?: string | null
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
          next_meeting_at?: string | null
          next_meeting_link?: string | null
          next_meeting_source?: string | null
          partner_code?: string | null
          partner_id?: string | null
          password_changed_at?: string | null
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
            foreignKeyName: "mentees_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
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
      optouts: {
        Row: {
          created_at: string
          id: string
          phone_e164: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_e164: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_e164?: string
          user_id?: string
        }
        Relationships: []
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
      partner_attributions: {
        Row: {
          created_at: string
          destination: string | null
          id: string
          ip_hash: string | null
          link_id: string | null
          partner_code: string
          partner_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          destination?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          partner_code: string
          partner_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          destination?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          partner_code?: string
          partner_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_attributions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_conversions: {
        Row: {
          amount_cents: number | null
          commission_cents: number
          commission_status: string
          created_at: string
          id: string
          kind: string
          notes: string | null
          partner_code: string
          partner_id: string
          source_id: string
          source_table: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          commission_cents?: number
          commission_status?: string
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          partner_code: string
          partner_id: string
          source_id: string
          source_table: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          commission_cents?: number
          commission_status?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          partner_code?: string
          partner_id?: string
          source_id?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_conversions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          active: boolean
          created_at: string
          destination: string
          id: string
          label: string | null
          partner_id: string
          slug: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination?: string
          id?: string
          label?: string | null
          partner_id: string
          slug: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          destination?: string
          id?: string
          label?: string | null
          partner_id?: string
          slug?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_trials: {
        Row: {
          contact_email: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          partner_id: string
          product_type: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          product_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          product_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_trials_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          commission_rate: number
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          partner_code: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_rate?: number
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          partner_code: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_rate?: number
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          partner_code?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      score_badges: {
        Row: {
          badge_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      score_content_modules: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          material_url: string | null
          published: boolean
          slug: string
          sort_order: number
          titulo: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          material_url?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          titulo: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          material_url?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          titulo?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      score_content_progress: {
        Row: {
          completed_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_content_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "score_content_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      score_content_views: {
        Row: {
          completed_at: string | null
          content_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "score_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      score_contents: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          short_description: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          short_description?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          short_description?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      score_daily_logs: {
        Row: {
          apresentacoes: number
          contatos_efetivos: number
          created_at: string
          date: string
          id: string
          ligacoes: number
          observacoes: string | null
          propostas: number
          prospeccoes: number
          reunioes_agendadas: number
          updated_at: string
          user_id: string
          valor_vendido: number
          vendas: number
          whatsapps: number
        }
        Insert: {
          apresentacoes?: number
          contatos_efetivos?: number
          created_at?: string
          date?: string
          id?: string
          ligacoes?: number
          observacoes?: string | null
          propostas?: number
          prospeccoes?: number
          reunioes_agendadas?: number
          updated_at?: string
          user_id: string
          valor_vendido?: number
          vendas?: number
          whatsapps?: number
        }
        Update: {
          apresentacoes?: number
          contatos_efetivos?: number
          created_at?: string
          date?: string
          id?: string
          ligacoes?: number
          observacoes?: string | null
          propostas?: number
          prospeccoes?: number
          reunioes_agendadas?: number
          updated_at?: string
          user_id?: string
          valor_vendido?: number
          vendas?: number
          whatsapps?: number
        }
        Relationships: []
      }
      score_feedback_interactions: {
        Row: {
          clicked_cta_at: string | null
          created_at: string
          feedback_id: string
          id: string
          mission_applied_at: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          clicked_cta_at?: string | null
          created_at?: string
          feedback_id: string
          id?: string
          mission_applied_at?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          clicked_cta_at?: string | null
          created_at?: string
          feedback_id?: string
          id?: string
          mission_applied_at?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_feedback_interactions_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "score_smart_feedbacks"
            referencedColumns: ["id"]
          },
        ]
      }
      score_goals: {
        Row: {
          apresentacoes_semana: number
          created_at: string
          descricao_venda: string | null
          effective_from: string
          id: string
          ligacoes_dia: number
          meta_mensal_valor: number
          meta_vendas: number
          propostas_semana: number
          segmento: string | null
          ticket_medio: number
          updated_at: string
          user_id: string
          whatsapps_dia: number
        }
        Insert: {
          apresentacoes_semana?: number
          created_at?: string
          descricao_venda?: string | null
          effective_from?: string
          id?: string
          ligacoes_dia?: number
          meta_mensal_valor?: number
          meta_vendas?: number
          propostas_semana?: number
          segmento?: string | null
          ticket_medio?: number
          updated_at?: string
          user_id: string
          whatsapps_dia?: number
        }
        Update: {
          apresentacoes_semana?: number
          created_at?: string
          descricao_venda?: string | null
          effective_from?: string
          id?: string
          ligacoes_dia?: number
          meta_mensal_valor?: number
          meta_vendas?: number
          propostas_semana?: number
          segmento?: string | null
          ticket_medio?: number
          updated_at?: string
          user_id?: string
          whatsapps_dia?: number
        }
        Relationships: []
      }
      score_profiles: {
        Row: {
          accepted_terms_at: string | null
          address: string | null
          address_complement: string | null
          address_number: string | null
          botconversa_subscriber_id: string | null
          city: string | null
          cora_customer_id: string | null
          cora_due_date: string | null
          cora_emv: string | null
          cora_invoice_id: string | null
          cora_paid_amount: number | null
          cora_paid_at: string | null
          cora_qr_code_url: string | null
          cora_status: string | null
          cora_subscription_id: string | null
          cpf: string | null
          created_at: string
          daily_checkin_time: string
          email: string
          experience_level: string | null
          full_name: string
          id: string
          inactivity_penalty_days: number
          is_active: boolean
          last_seen_at: string | null
          lead_origin: string | null
          partner_code: string | null
          partner_id: string | null
          payment_status: string | null
          phone: string | null
          plan: string
          plan_expires_at: string | null
          plan_started_at: string | null
          plan_status: string | null
          postal_code: string | null
          profession: string | null
          province: string | null
          segment: string | null
          state: string | null
          updated_at: string
          user_id: string
          whatsapp_last_checkin_at: string | null
          whatsapp_opt_in: boolean
        }
        Insert: {
          accepted_terms_at?: string | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          botconversa_subscriber_id?: string | null
          city?: string | null
          cora_customer_id?: string | null
          cora_due_date?: string | null
          cora_emv?: string | null
          cora_invoice_id?: string | null
          cora_paid_amount?: number | null
          cora_paid_at?: string | null
          cora_qr_code_url?: string | null
          cora_status?: string | null
          cora_subscription_id?: string | null
          cpf?: string | null
          created_at?: string
          daily_checkin_time?: string
          email?: string
          experience_level?: string | null
          full_name?: string
          id?: string
          inactivity_penalty_days?: number
          is_active?: boolean
          last_seen_at?: string | null
          lead_origin?: string | null
          partner_code?: string | null
          partner_id?: string | null
          payment_status?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string | null
          postal_code?: string | null
          profession?: string | null
          province?: string | null
          segment?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          whatsapp_last_checkin_at?: string | null
          whatsapp_opt_in?: boolean
        }
        Update: {
          accepted_terms_at?: string | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          botconversa_subscriber_id?: string | null
          city?: string | null
          cora_customer_id?: string | null
          cora_due_date?: string | null
          cora_emv?: string | null
          cora_invoice_id?: string | null
          cora_paid_amount?: number | null
          cora_paid_at?: string | null
          cora_qr_code_url?: string | null
          cora_status?: string | null
          cora_subscription_id?: string | null
          cpf?: string | null
          created_at?: string
          daily_checkin_time?: string
          email?: string
          experience_level?: string | null
          full_name?: string
          id?: string
          inactivity_penalty_days?: number
          is_active?: boolean
          last_seen_at?: string | null
          lead_origin?: string | null
          partner_code?: string | null
          partner_id?: string | null
          payment_status?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_status?: string | null
          postal_code?: string | null
          profession?: string | null
          province?: string | null
          segment?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_last_checkin_at?: string | null
          whatsapp_opt_in?: boolean
        }
        Relationships: []
      }
      score_smart_feedbacks: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          mission: string
          priority: number
          short_description: string | null
          title: string
          trigger_key: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          mission?: string
          priority?: number
          short_description?: string | null
          title: string
          trigger_key: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          mission?: string
          priority?: number
          short_description?: string | null
          title?: string
          trigger_key?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      score_upsell_interests: {
        Row: {
          context: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          context?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      score_upsell_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      score_whatsapp_messages: {
        Row: {
          created_at: string
          direction: string
          error: string | null
          id: string
          kind: string
          payload: Json
          phone: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error?: string | null
          id?: string
          kind: string
          payload?: Json
          phone: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          kind?: string
          payload?: Json
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          add_to_agent_context: boolean
          agent_id: string | null
          batch_limit: number
          channel_id: string | null
          created_at: string
          delay_seconds: number
          id: string
          optout_text: string
          updated_at: string
          user_id: string
          webhook_only_mode: boolean
          whatsapp_ritual_enabled: boolean
          whatsapp_templates: Json
        }
        Insert: {
          add_to_agent_context?: boolean
          agent_id?: string | null
          batch_limit?: number
          channel_id?: string | null
          created_at?: string
          delay_seconds?: number
          id?: string
          optout_text?: string
          updated_at?: string
          user_id: string
          webhook_only_mode?: boolean
          whatsapp_ritual_enabled?: boolean
          whatsapp_templates?: Json
        }
        Update: {
          add_to_agent_context?: boolean
          agent_id?: string | null
          batch_limit?: number
          channel_id?: string | null
          created_at?: string
          delay_seconds?: number
          id?: string
          optout_text?: string
          updated_at?: string
          user_id?: string
          webhook_only_mode?: boolean
          whatsapp_ritual_enabled?: boolean
          whatsapp_templates?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "mentee" | "scoreapp_user" | "partner"
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
      app_role: ["admin", "user", "mentee", "scoreapp_user", "partner"],
    },
  },
} as const
