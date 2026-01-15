export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';
          expiry_date: string | null;
          reminder_date: string | null;
          cost_monthly: number | null;
          renewal_status: string;
          ocr_raw_text: string | null;
          is_scanned: boolean;
          vehicle_reg: string | null;
          vehicle_make: string | null;
          is_main_dealer: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';
          expiry_date?: string | null;
          reminder_date?: string | null;
          cost_monthly?: number | null;
          renewal_status?: string;
          ocr_raw_text?: string | null;
          is_scanned?: boolean;
          vehicle_reg?: string | null;
          vehicle_make?: string | null;
          is_main_dealer?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';
          expiry_date?: string | null;
          reminder_date?: string | null;
          cost_monthly?: number | null;
          renewal_status?: string;
          ocr_raw_text?: string | null;
          is_scanned?: boolean;
          vehicle_reg?: string | null;
          vehicle_make?: string | null;
          is_main_dealer?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
