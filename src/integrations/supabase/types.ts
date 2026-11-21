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
      analyses: {
        Row: {
          created_at: string
          id: string
          owner: string
          result: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner?: string
          result: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          owner?: string
          result?: string
          title?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          owner: string
          title: string
          urgent: boolean
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          owner?: string
          title: string
          urgent?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          owner?: string
          title?: string
          urgent?: boolean
        }
        Relationships: []
      }
      campus_engagement_audit: {
        Row: {
          accessed_at: string
          actor: string
          id: number
          report: string
        }
        Insert: {
          accessed_at?: string
          actor: string
          id?: never
          report: string
        }
        Update: {
          accessed_at?: string
          actor?: string
          id?: never
          report?: string
        }
        Relationships: []
      }
      campus_staff_universities: {
        Row: {
          university: string
          user_id: string
        }
        Insert: {
          university: string
          user_id: string
        }
        Update: {
          university?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_student_plans: {
        Row: {
          plan: Json
          user_id: string
        }
        Insert: {
          plan?: Json
          user_id?: string
        }
        Update: {
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          anonymous: boolean
          category: string
          created_at: string
          department: string
          description: string
          id: string
          location: string
          owner: string
          photo: string
          priority: string
          resolution: string
          status: string
        }
        Insert: {
          anonymous?: boolean
          category: string
          created_at?: string
          department: string
          description: string
          id?: string
          location: string
          owner?: string
          photo?: string
          priority: string
          resolution?: string
          status?: string
        }
        Update: {
          anonymous?: boolean
          category?: string
          created_at?: string
          department?: string
          description?: string
          id?: string
          location?: string
          owner?: string
          photo?: string
          priority?: string
          resolution?: string
          status?: string
        }
        Relationships: []
      }
      event_activity: {
        Row: {
          created_at: string
          event_id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          kind: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          category: string
          city: string
          created_at: string
          critical: boolean
          deadline: string
          description: string
          eligibility: string
          host_university: string
          id: string
          outcomes: string
          owner: string
          paid: boolean
          poster: string
          registration_url: string
          starts_at: string
          title: string
          venue: string
          visibility: string
        }
        Insert: {
          capacity?: number | null
          category: string
          city?: string
          created_at?: string
          critical?: boolean
          deadline: string
          description: string
          eligibility: string
          host_university?: string
          id?: string
          outcomes?: string
          owner?: string
          paid?: boolean
          poster?: string
          registration_url?: string
          starts_at: string
          title: string
          venue: string
          visibility?: string
        }
        Update: {
          capacity?: number | null
          category?: string
          city?: string
          created_at?: string
          critical?: boolean
          deadline?: string
          description?: string
          eligibility?: string
          host_university?: string
          id?: string
          outcomes?: string
          owner?: string
          paid?: boolean
          poster?: string
          registration_url?: string
          starts_at?: string
          title?: string
          venue?: string
          visibility?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_date: string
          kind: string
          location: string
          owner: string
          photo: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_date: string
          kind: string
          location: string
          owner?: string
          photo?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_date?: string
          kind?: string
          location?: string
          owner?: string
          photo?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          item_id: string
          recipient: string
          sender: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          item_id: string
          recipient: string
          sender?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          recipient?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_year: string
          avatar: string
          bio: string
          degree: string
          goals: string
          id: string
          interests: string
          name: string
          portfolio: string
          preferences: Json
          skills: string
          specialization: string
          university: string
        }
        Insert: {
          academic_year?: string
          avatar?: string
          bio?: string
          degree?: string
          goals?: string
          id: string
          interests?: string
          name?: string
          portfolio?: string
          preferences?: Json
          skills?: string
          specialization?: string
          university?: string
        }
        Update: {
          academic_year?: string
          avatar?: string
          bio?: string
          degree?: string
          goals?: string
          id?: string
          interests?: string
          name?: string
          portfolio?: string
          preferences?: Json
          skills?: string
          specialization?: string
          university?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          department: string
          user_id: string
        }
        Insert: {
          department: string
          user_id: string
        }
        Update: {
          department?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      campus_advance_ticket: {
        Args: { note: string; ticket: string }
        Returns: string
      }
      campus_critical_rsvps: {
        Args: never
        Returns: {
          id: string
          rsvps: number
          starts_at: string
          title: string
        }[]
      }
      campus_has_conversation: {
        Args: { item: string; other: string }
        Returns: boolean
      }
      campus_insights: { Args: never; Returns: Json }
      campus_role: { Args: { r: string }; Returns: boolean }
      campus_same_university: { Args: { other: string }; Returns: boolean }
      campus_service_queue: {
        Args: never
        Returns: {
          category: string
          created_at: string
          department: string
          description: string
          id: string
          location: string
          photo: string
          priority: string
          reporter: string
          resolution: string
          status: string
        }[]
      }
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
