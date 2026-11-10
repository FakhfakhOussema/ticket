// Types de la base, au format de `supabase gen types typescript`.
// Écrits à la main d'après supabase/migrations/. Pour les régénérer depuis votre projet Supabase :
//   npx supabase login
//   npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          icon: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          icon?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          icon?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["project_role"];
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["project_role"];
          created_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["project_role"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          role: Database["public"]["Enums"]["project_role"];
          token: string;
          status: Database["public"]["Enums"]["invitation_status"];
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          role?: Database["public"]["Enums"]["project_role"];
          token?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string;
          role?: Database["public"]["Enums"]["project_role"];
          token?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["ticket_status"];
          priority: Database["public"]["Enums"]["ticket_priority"];
          assignee_id: string | null;
          created_by: string | null;
          due_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          assignee_id?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          assignee_id?: string | null;
          created_by?: string | null;
          due_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id?: string | null;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string | null;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_notes: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          body: string;
          color: string;
          pinned: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          body?: string;
          color?: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          body?: string;
          color?: string;
          pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          project_id: string | null;
          due_date: string | null;
          done: boolean;
          done_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          project_id?: string | null;
          due_date?: string | null;
          done?: boolean;
          done_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          project_id?: string | null;
          due_date?: string | null;
          done?: boolean;
          done_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_todos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_todos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
      decline_invitation: {
        Args: { p_token: string };
        Returns: undefined;
      };
      get_invitation_by_token: {
        Args: { p_token: string };
        Returns: {
          id: string;
          project_id: string;
          project_name: string;
          role: Database["public"]["Enums"]["project_role"];
          email: string;
          status: Database["public"]["Enums"]["invitation_status"];
          expires_at: string;
          invited_by_name: string | null;
        }[];
      };
      get_project_dashboard: {
        Args: { p_project_id: string };
        Returns: Json;
      };
      has_project_role: {
        Args: { p_project_id: string; p_roles: Database["public"]["Enums"]["project_role"][] };
        Returns: boolean;
      };
      is_project_admin: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_project_member: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_project_owner: {
        Args: { p_project_id: string };
        Returns: boolean;
      };
      is_ticket_admin: {
        Args: { p_ticket_id: string };
        Returns: boolean;
      };
      is_ticket_member: {
        Args: { p_ticket_id: string };
        Returns: boolean;
      };
      my_pending_invitations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          token: string;
          project_id: string;
          project_name: string;
          role: Database["public"]["Enums"]["project_role"];
          invited_by_name: string | null;
          expires_at: string;
        }[];
      };
      shares_project_with: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      invitation_status: "pending" | "accepted" | "declined" | "revoked" | "expired";
      project_role: "owner" | "admin" | "member";
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_status: "todo" | "in_progress" | "in_review" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
