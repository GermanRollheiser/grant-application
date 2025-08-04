import { createClient } from '@supabase/supabase-js'

// Load Supabase configuration from environment variables
// These should be set in .env file for local development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that required environment variables are present
// Prevents runtime errors if configuration is missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create and export the Supabase client instance
// This client handles authentication, database operations, and file storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schemas for reference
// These type definitions ensure type safety when working with Supabase
export type Database = {
  public: {
    Tables: {
      // Grant applications table structure
      grant_applications: {
        // Row type represents the complete database record structure
        // Used when fetching/reading data from the database
        Row: {
          id: string
          company_name: string
          contact_email: string
          contact_phone: string
          contact_person: string
          grant_amount: number
          project_description: string
          business_plan_url: string | null
          financial_statements_url: string | null
          supporting_documents_url: string | null
          status: string
          user_id: string
          created_at: string
        }
        // Insert type defines required and optional fields for new records
        // Used when creating new grant applications
        Insert: {
          id?: string // Auto-generated if not provided
          company_name: string
          contact_email: string
          contact_phone: string
          contact_person: string
          grant_amount: number
          project_description: string
          business_plan_url?: string | null
          financial_statements_url?: string | null
          supporting_documents_url?: string | null
          status?: string // Defaults to 'pending' if not specified
          user_id: string // Required foreign key to auth.users
          created_at?: string // Auto-generated timestamp if not provided
        }
        // Update type defines which fields can be modified in existing records
        // All fields are optional since updates can be partial
        Update: {
          id?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          contact_person?: string
          grant_amount?: number
          project_description?: string
          business_plan_url?: string | null
          financial_statements_url?: string | null
          supporting_documents_url?: string | null
          status?: string // Can be updated by admin users
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}