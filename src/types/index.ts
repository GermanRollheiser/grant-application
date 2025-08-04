// Main interface for grant application data structure
// Used for form state management and database operations
export interface GrantApplication {
  // Auto-generated unique identifier from database
  id?: string;
  
   // Required company information fields
  company_name: string;
  contact_email: string;
  contact_phone: string;
  contact_person: string;
  
  // Grant request details
  grant_amount: number;
  project_description: string;
  
  // File URLs stored after successful uploads to Supabase Storage
  business_plan_url?: string;
  financial_statements_url?: string;
  supporting_documents_url?: string;
  
  // Application status tracking (pending, approved, rejected, etc.)
  status?: string;
  
  // Foreign key reference to authenticated user
  user_id?: string;
  
  // Timestamp for application submission
  created_at?: string;
}

// Interface for tracking uploaded files in component state
// Stores File objects for UI feedback and validation
export interface FileUploadState {
  // File object for business plan document
  business_plan?: File;
  
  // File object for financial statements document
  financial_statements?: File;
  
  // File object for supporting documents
  supporting_documents?: File;
}

// Interface for tracking upload progress states
// Used to show loading indicators during file uploads
export interface UploadProgress {
  // Dynamic key-value pairs where key is file type and value is boolean loading state
  [key: string]: boolean;
}