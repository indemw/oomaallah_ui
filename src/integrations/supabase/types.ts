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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      conference_bookings: {
        Row: {
          attendees_count: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          end_datetime: string
          event_name: string
          id: string
          layout: string
          notes: string | null
          organizer: string
          room_id: string
          source: string
          start_datetime: string
          status: string
          updated_at: string
        }
        Insert: {
          attendees_count?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          end_datetime: string
          event_name: string
          id?: string
          layout?: string
          notes?: string | null
          organizer: string
          room_id: string
          source?: string
          start_datetime: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendees_count?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          end_datetime?: string
          event_name?: string
          id?: string
          layout?: string
          notes?: string | null
          organizer?: string
          room_id?: string
          source?: string
          start_datetime?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "conference_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_rooms: {
        Row: {
          active: boolean
          amenities: string[]
          base_rate: number
          capacity: number
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amenities?: string[]
          base_rate?: number
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amenities?: string[]
          base_rate?: number
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_name: string | null
          discount_amount: number
          id: string
          levy_rate: number
          module: string
          reference_id: string | null
          service_charge: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          tourism_levy: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_name?: string | null
          discount_amount?: number
          id?: string
          levy_rate?: number
          module: string
          reference_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_name?: string | null
          discount_amount?: number
          id?: string
          levy_rate?: number
          module?: string
          reference_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_components: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          quantity_per_unit: number
          stock_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          quantity_per_unit?: number
          stock_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          quantity_per_unit?: number
          stock_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_components_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_components_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          station: string
          tax_rate: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          station?: string
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          station?: string
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      pos_bills: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          levy_rate: number
          order_id: string
          paid_at: string | null
          posted_journal_entry_id: string | null
          service_charge: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          tourism_levy: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          levy_rate?: number
          order_id: string
          paid_at?: string | null
          posted_journal_entry_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          levy_rate?: number
          order_id?: string
          paid_at?: string | null
          posted_journal_entry_id?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_bills_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_order_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          notes: string | null
          order_id: string
          price: number
          quantity: number
          station: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          notes?: string | null
          order_id: string
          price?: number
          quantity?: number
          station: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          notes?: string | null
          order_id?: string
          price?: number
          quantity?: number
          station?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string
          created_by: string
          discount_amount: number
          id: string
          levy_rate: number
          notes: string | null
          service_charge: number
          status: string
          subtotal: number
          table_id: string | null
          tax_amount: number
          total_amount: number
          tourism_levy: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          created_by: string
          discount_amount?: number
          id?: string
          levy_rate?: number
          notes?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          discount_amount?: number
          id?: string
          levy_rate?: number
          notes?: string | null
          service_charge?: number
          status?: string
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          total_amount?: number
          tourism_levy?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "pos_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          id: string
          method: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          id?: string
          method: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          id?: string
          method?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "pos_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_tables: {
        Row: {
          area: string | null
          capacity: number
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          capacity?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_tickets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          items: Json
          order_id: string
          station: string
          status: string
          ticket_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          order_id: string
          station: string
          status?: string
          ticket_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          order_id?: string
          station?: string
          status?: string
          ticket_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          adults: number
          check_in_date: string
          check_out_date: string
          children: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          guest_name: string
          id: string
          notes: string | null
          rate: number
          reservation_number: string
          room_id: string | null
          room_type_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          adults?: number
          check_in_date: string
          check_out_date: string
          children?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          guest_name: string
          id?: string
          notes?: string | null
          rate?: number
          reservation_number?: string
          room_id?: string | null
          room_type_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          adults?: number
          check_in_date?: string
          check_out_date?: string
          children?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          guest_name?: string
          id?: string
          notes?: string | null
          rate?: number
          reservation_number?: string
          room_id?: string | null
          room_type_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_read: boolean
          can_update: boolean
          id: string
          module: string
          role_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          id?: string
          module: string
          role_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          id?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          active: boolean
          amenities: string[]
          base_rate: number
          capacity: number
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amenities?: string[]
          base_rate?: number
          capacity?: number
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amenities?: string[]
          base_rate?: number
          capacity?: number
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          created_at: string
          floor: string | null
          id: string
          notes: string | null
          room_number: string
          room_type_id: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          room_number: string
          room_type_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          room_number?: string
          room_type_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string
          created_at: string
          current_quantity: number
          description: string | null
          id: string
          minimum_quantity: number
          name: string
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          minimum_quantity?: number
          name: string
          supplier?: string | null
          unit: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_quantity?: number
          description?: string | null
          id?: string
          minimum_quantity?: number
          name?: string
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_table: string | null
          stock_item_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_table?: string | null
          stock_item_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_table?: string | null
          stock_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          quantity_requested: number
          reason: string | null
          request_type: string
          requested_by: string
          status: string
          stock_item_id: string
          updated_at: string
          urgency: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          quantity_requested: number
          reason?: string | null
          request_type?: string
          requested_by: string
          status?: string
          stock_item_id: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          quantity_requested?: number
          reason?: string | null
          request_type?: string
          requested_by?: string
          status?: string
          stock_item_id?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_content: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_active: boolean
          key: string
          section: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          section: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          section?: string
          title?: string
          updated_at?: string
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
    Enums: {},
  },
} as const
