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
      acc_business: {
        Row: {
          address: string | null
          business_name: string | null
          email: string | null
          gstin: string | null
          invoice_prefix: string | null
          logo_url: string | null
          next_invoice_no: number | null
          pan: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          email?: string | null
          gstin?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          next_invoice_no?: number | null
          pan?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          email?: string | null
          gstin?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          next_invoice_no?: number | null
          pan?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      acc_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          expense_date: string
          gst: number
          id: string
          mode: string
          notes: string | null
          party_id: string | null
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          expense_date?: string
          gst?: number
          id?: string
          mode?: string
          notes?: string | null
          party_id?: string | null
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          expense_date?: string
          gst?: number
          id?: string
          mode?: string
          notes?: string | null
          party_id?: string | null
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_expenses_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "acc_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_invoice_items: {
        Row: {
          amount: number
          description: string
          gst_rate: number
          hsn: string | null
          id: string
          invoice_id: string
          item_id: string | null
          qty: number
          rate: number
          user_id: string
        }
        Insert: {
          amount?: number
          description: string
          gst_rate?: number
          hsn?: string | null
          id?: string
          invoice_id: string
          item_id?: string | null
          qty?: number
          rate?: number
          user_id: string
        }
        Update: {
          amount?: number
          description?: string
          gst_rate?: number
          hsn?: string | null
          id?: string
          invoice_id?: string
          item_id?: string | null
          qty?: number
          rate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_invoice_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "acc_items"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_invoices: {
        Row: {
          created_at: string
          discount: number
          doc_type: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_no: string
          notes: string | null
          paid: number
          party_id: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          discount?: number
          doc_type?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_no: string
          notes?: string | null
          paid?: number
          party_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          discount?: number
          doc_type?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          paid?: number
          party_id?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_invoices_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "acc_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_items: {
        Row: {
          created_at: string
          gst_rate: number
          hsn: string | null
          id: string
          name: string
          purchase_price: number
          sale_price: number
          sku: string | null
          stock_qty: number
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gst_rate?: number
          hsn?: string | null
          id?: string
          name: string
          purchase_price?: number
          sale_price?: number
          sku?: string | null
          stock_qty?: number
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gst_rate?: number
          hsn?: string | null
          id?: string
          name?: string
          purchase_price?: number
          sale_price?: number
          sku?: string | null
          stock_qty?: number
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      acc_parties: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          opening_balance: number
          party_type: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          opening_balance?: number
          party_type?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          opening_balance?: number
          party_type?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      acc_payments: {
        Row: {
          amount: number
          created_at: string
          direction: string
          id: string
          invoice_id: string | null
          mode: string
          notes: string | null
          party_id: string | null
          pay_date: string
          reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          direction?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          party_id?: string | null
          pay_date?: string
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          direction?: string
          id?: string
          invoice_id?: string | null
          mode?: string
          notes?: string | null
          party_id?: string | null
          pay_date?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "acc_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          mobile: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      tracker_subscriptions: {
        Row: {
          created_at: string
          id: string
          last_payment_amount: number | null
          last_payment_id: string | null
          paid_until: string | null
          trial_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_payment_amount?: number | null
          last_payment_id?: string | null
          paid_until?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_payment_amount?: number | null
          last_payment_id?: string | null
          paid_until?: string | null
          trial_started_at?: string
          updated_at?: string
          user_id?: string
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
    }
    Enums: {
      app_role: "customer" | "partner" | "admin"
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
      app_role: ["customer", "partner", "admin"],
    },
  },
} as const
