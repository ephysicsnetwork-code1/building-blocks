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
      admin_alerts: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          resolved: boolean
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          resolved?: boolean
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          resolved?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      parent_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          id: string
          parent_name: string
          status: string
          student_name: string
          telegram_handle: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          id?: string
          parent_name: string
          status?: string
          student_name: string
          telegram_handle: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          id?: string
          parent_name?: string
          status?: string
          student_name?: string
          telegram_handle?: string
        }
        Relationships: []
      }
      roster_entries: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          kind: string
          name: string
          section: string | null
          stream: string | null
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          kind: string
          name: string
          section?: string | null
          stream?: string | null
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          kind?: string
          name?: string
          section?: string | null
          stream?: string | null
        }
        Relationships: []
      }
      roster_removals: {
        Row: {
          kind: string
          name_norm: string
          removed_at: string
        }
        Insert: {
          kind: string
          name_norm: string
          removed_at?: string
        }
        Update: {
          kind?: string
          name_norm?: string
          removed_at?: string
        }
        Relationships: []
      }
      student_joins: {
        Row: {
          full_name: string
          grade: string
          joined_at: string
          section: string
          stream: string | null
          telegram_handle: string
        }
        Insert: {
          full_name: string
          grade: string
          joined_at?: string
          section: string
          stream?: string | null
          telegram_handle: string
        }
        Update: {
          full_name?: string
          grade?: string
          joined_at?: string
          section?: string
          stream?: string | null
          telegram_handle?: string
        }
        Relationships: []
      }
      teacher_access: {
        Row: {
          accessed_at: string
          full_name: string
          id: string
          telegram_handle: string
        }
        Insert: {
          accessed_at?: string
          full_name: string
          id?: string
          telegram_handle: string
        }
        Update: {
          accessed_at?: string
          full_name?: string
          id?: string
          telegram_handle?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          chat_id: number
          first_name: string | null
          first_seen: string
          username: string | null
        }
        Insert: {
          chat_id: number
          first_name?: string | null
          first_seen?: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          first_name?: string | null
          first_seen?: string
          username?: string | null
        }
        Relationships: []
      }
      verification_attempts: {
        Row: {
          banned: boolean
          banned_at: string | null
          display_name: string
          failed_count: number
          last_attempt_at: string
          subject: string
        }
        Insert: {
          banned?: boolean
          banned_at?: string | null
          display_name: string
          failed_count?: number
          last_attempt_at?: string
          subject: string
        }
        Update: {
          banned?: boolean
          banned_at?: string | null
          display_name?: string
          failed_count?: number
          last_attempt_at?: string
          subject?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
