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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          severity: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          responded_by: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          last_submission: string | null
          submission_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_blocked?: boolean | null
          last_submission?: string | null
          submission_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          last_submission?: string | null
          submission_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      credits_ledger: {
        Row: {
          balance_after: number
          created_at: string | null
          credits_amount: number
          description: string | null
          id: string
          metadata: Json | null
          related_analysis_id: string | null
          related_payment_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          credits_amount: number
          description?: string | null
          id?: string
          metadata?: Json | null
          related_analysis_id?: string | null
          related_payment_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          credits_amount?: number
          description?: string | null
          id?: string
          metadata?: Json | null
          related_analysis_id?: string | null
          related_payment_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_ledger_related_analysis_id_fkey"
            columns: ["related_analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_ledger_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credits_ledger_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          admin_user_id: string
          contact_message_id: string
          created_at: string
          email_status: string | null
          id: string
          is_email_sent: boolean | null
          reply_content: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          contact_message_id: string
          created_at?: string
          email_status?: string | null
          id?: string
          is_email_sent?: boolean | null
          reply_content: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          contact_message_id?: string
          created_at?: string
          email_status?: string | null
          id?: string
          is_email_sent?: boolean | null
          reply_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_contact_message_id_fkey"
            columns: ["contact_message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_id: string | null
          provider_response: Json | null
          provider_transaction_id: string | null
          status: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_id?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          status?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_id?: string | null
          provider_response?: Json | null
          provider_transaction_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          credits_purchased: number
          expires_at: string | null
          id: string
          payment_data: Json | null
          payment_method: string | null
          payment_provider_id: string | null
          refund_amount: number | null
          refund_reason: string | null
          refund_status: string | null
          refunded_at: string | null
          refunded_by: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits_purchased: number
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_method?: string | null
          payment_provider_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits_purchased?: number
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_method?: string | null
          payment_provider_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          backup_codes: string[] | null
          created_at: string
          credits: number | null
          email: string
          email_verified: boolean | null
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_login: string | null
          locked_until: string | null
          notes: string | null
          password_changed_at: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          security_preferences: Json | null
          status: string | null
          subscription_tier: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          created_at?: string
          credits?: number | null
          email: string
          email_verified?: boolean | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          locked_until?: string | null
          notes?: string | null
          password_changed_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          security_preferences?: Json | null
          status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          backup_codes?: string[] | null
          created_at?: string
          credits?: number | null
          email?: string
          email_verified?: boolean | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          locked_until?: string | null
          notes?: string | null
          password_changed_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          security_preferences?: Json | null
          status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          credits_awarded: boolean | null
          email_referred: string | null
          id: string
          is_payment_completed: boolean | null
          is_signup_completed: boolean | null
          referral_code: string
          referred_id: string | null
          referrer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_awarded?: boolean | null
          email_referred?: string | null
          id?: string
          is_payment_completed?: boolean | null
          is_signup_completed?: boolean | null
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_awarded?: boolean | null
          email_referred?: string | null
          id?: string
          is_payment_completed?: boolean | null
          is_signup_completed?: boolean | null
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_referrals_referred_id"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_referrals_referrer_id"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analyses: {
        Row: {
          analysis_results: Json
          ats_compatibility: number
          company_name: string | null
          created_at: string
          detailed_feedback: Json | null
          experience_relevance: number
          expires_at: string | null
          id: string
          improvement_areas: string[] | null
          job_description: string
          job_title: string | null
          keyword_match: number
          keywords_found: string[] | null
          missing_keywords: string[] | null
          overall_score: number
          resume_text: string
          skills_alignment: number
          suggestions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_results: Json
          ats_compatibility: number
          company_name?: string | null
          created_at?: string
          detailed_feedback?: Json | null
          experience_relevance: number
          expires_at?: string | null
          id?: string
          improvement_areas?: string[] | null
          job_description: string
          job_title?: string | null
          keyword_match: number
          keywords_found?: string[] | null
          missing_keywords?: string[] | null
          overall_score: number
          resume_text: string
          skills_alignment: number
          suggestions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_results?: Json
          ats_compatibility?: number
          company_name?: string | null
          created_at?: string
          detailed_feedback?: Json | null
          experience_relevance?: number
          expires_at?: string | null
          id?: string
          improvement_areas?: string[] | null
          job_description?: string
          job_title?: string | null
          keyword_match?: number
          keywords_found?: string[] | null
          missing_keywords?: string[] | null
          overall_score?: number
          resume_text?: string
          skills_alignment?: number
          suggestions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_auth_secrets: {
        Row: {
          backup_codes_encrypted: string[] | null
          created_at: string | null
          encryption_key_id: string | null
          id: string
          two_factor_secret_encrypted: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes_encrypted?: string[] | null
          created_at?: string | null
          encryption_key_id?: string | null
          id?: string
          two_factor_secret_encrypted?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes_encrypted?: string[] | null
          created_at?: string | null
          encryption_key_id?: string | null
          id?: string
          two_factor_secret_encrypted?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_credits: {
        Args: {
          admin_note?: string
          credits_to_add: number
          target_user_id: string
        }
        Returns: boolean
      }
      admin_delete_user_account: {
        Args: { permanent?: boolean; reason?: string; target_user_id: string }
        Returns: boolean
      }
      admin_get_detailed_user_info: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          credits: number
          email: string
          failed_login_attempts: number
          full_name: string
          is_active: boolean
          language: string
          last_analysis: string
          last_login: string
          notes: string
          phone: string
          referrals_made: number
          signup_date: string
          status: string
          subscription_tier: string
          timezone: string
          total_analyses: number
          total_spent: number
          user_id: string
        }[]
      }
      admin_get_user_activity: {
        Args: { limit_count?: number; target_user_id: string }
        Returns: {
          activity_date: string
          activity_type: string
          description: string
          metadata: Json
        }[]
      }
      admin_get_user_details: {
        Args: { target_user_id: string }
        Returns: {
          credits: number
          email: string
          full_name: string
          last_analysis: string
          referrals_made: number
          signup_date: string
          total_analyses: number
          total_spent: number
          user_id: string
        }[]
      }
      admin_get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_users: number
          pending_messages: number
          total_analyses: number
          total_revenue: number
          total_users: number
        }[]
      }
      admin_suspend_user: {
        Args: { reason?: string; suspend: boolean; target_user_id: string }
        Returns: boolean
      }
      admin_update_user_profile: {
        Args: {
          new_full_name?: string
          new_is_active?: boolean
          new_language?: string
          new_notes?: string
          new_phone?: string
          new_status?: string
          new_subscription_tier?: string
          new_timezone?: string
          target_user_id: string
        }
        Returns: boolean
      }
      check_contact_rate_limit: {
        Args: { client_ip: unknown }
        Returns: boolean
      }
      consume_analysis_credit: {
        Args: { analysis_id: string; target_user_id: string }
        Returns: boolean
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile_safe: {
        Args: { target_user_id?: string }
        Returns: {
          created_at: string
          credits: number
          email: string
          email_verified: boolean
          full_name: string
          id: string
          is_active: boolean
          last_login: string
          phone: string
          status: string
          subscription_tier: string
          two_factor_enabled: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_payment_refund: {
        Args: {
          payment_id: string
          refund_amount: number
          refund_reason: string
        }
        Returns: boolean
      }
      process_referral_credit: {
        Args: { payment_amount: number; referred_user_id: string }
        Returns: boolean
      }
      process_successful_payment: {
        Args: { payment_id: string; provider_transaction_id?: string }
        Returns: boolean
      }
      update_contact_message_status: {
        Args: { admin_notes?: string; message_id: string; new_status: string }
        Returns: boolean
      }
      update_phone_number: {
        Args: { new_phone: string; verification_code: string }
        Returns: boolean
      }
      update_user_credits: {
        Args: {
          credit_change: number
          description?: string
          related_analysis_id?: string
          related_payment_id?: string
          target_user_id: string
          transaction_type: string
        }
        Returns: boolean
      }
      update_user_security_preferences: {
        Args: { new_preferences: Json; verification_token?: string }
        Returns: boolean
      }
      validate_admin_action: {
        Args: {
          action_details?: Json
          action_type: string
          target_user_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
