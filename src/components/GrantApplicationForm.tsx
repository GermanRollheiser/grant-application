import React, { useState } from "react";
import {
  Upload,
  FileText,
  Building,
  Mail,
  Phone,
  DollarSign,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  GrantApplication,
  FileUploadState,
  UploadProgress,
} from "../types";
import "./GrantApplicationForm.css";

const GrantApplicationForm: React.FC = () => {
  // Form state management with TypeScript interfaces
  const [formData, setFormData] = useState<GrantApplication>({
    company_name: "",
    contact_email: "",
    contact_phone: "",
    contact_person: "",
    grant_amount: 1000,
    project_description: "",
  });

  // File upload state tracking
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState>({});

  // UI state for loading and submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // Handle form input changes with proper TypeScript typing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Update form data based on input type, converting numbers appropriately
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  // File upload handler with UUID-based naming and RLS consideration
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setSubmitMessage("File size must be less than 10MB");
      return;
    }

    // Set upload progress indicator for specific file type
    setUploadProgress((prev) => ({ ...prev, [fileType]: true }));

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // Check if user is authenticated before allowing file upload
      if (userError || !user) {
        setSubmitMessage("Please log in to upload files");
        return;
      }

      // Generate UUID-based file path for security and uniqueness
      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `${user.id}/${uniqueFileName}`;

      // Upload to Supabase Storage with RLS policies applied
      // RLS will ensure only the authenticated user can access their files
      const { data, error } = await supabase.storage
        .from("grant-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      // Handle upload errors
        if (error) {
        console.error("Upload error:", error);
        setSubmitMessage(
          `Error uploading ${fileType.replace("_", " ")}: ${error.message}`
        );
        return;
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from("grant-documents")
        .getPublicUrl(data.path);

      // Update form data with uploaded file URL
      setFormData((prev) => ({
        ...prev,
        [`${fileType}_url`]: urlData.publicUrl,
      }));

      // Track uploaded files for UI feedback
      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));

      console.log(`File uploaded successfully: ${data.path}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setSubmitMessage("Upload failed. Please try again.");
    } finally {
      setUploadProgress((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  // Form submission with UUID generation and RLS compliance
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Validate required fields
      if (
        !formData.company_name ||
        !formData.contact_email ||
        !formData.contact_person ||
        !formData.contact_phone ||
        !formData.project_description ||
        formData.grant_amount <= 0
      ) {
        setSubmitMessage("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        setSubmitMessage("Please enter a valid email address");
        setIsSubmitting(false);
        return;
      }

      // Validate grant amount
      if (formData.grant_amount < 1000 || formData.grant_amount > 1000000) {
        setSubmitMessage("Grant amount must be between $1,000 and $1,000,000");
        setIsSubmitting(false);
        return;
      }

      // Ensure all required documents have been uploaded
      if (
        !uploadedFiles.business_plan ||
        !uploadedFiles.financial_statements ||
        !uploadedFiles.supporting_documents
      ) {
        setSubmitMessage(
          "Please upload all required documents: Business Plan, Financial Statements, and Supporting Documents."
        );
        setIsSubmitting(false);
        return;
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmitMessage("Please log in to submit your application");
        setIsSubmitting(false);
        return;
      }

      // Prepare data for database insertion
      // RLS policies will ensure data isolation per user/company
      const applicationData: GrantApplication = {
        ...formData,
        user_id: user.id,
        status: "pending",
      };

      // Insert into grant_applications table with RLS protection
      const { data, error } = await supabase
        .from("grant_applications")
        .insert(applicationData)
        .select()
        .single();

      // Handle database insertion errors
        if (error) {
        console.error("Database error:", error);
        setSubmitMessage(`Error submitting application: ${error.message}`);
        return;
      }

      // Success feedback
      setSubmitMessage(
        `Application submitted successfully! Application ID: ${data.id}.`
      );

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          company_name: "",
          contact_email: "",
          contact_phone: "",
          contact_person: "",
          grant_amount: 0,
          project_description: "",
        });
        setUploadedFiles({});
        setSubmitMessage("");
      }, 5000);
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitMessage(
        "Submission failed. Please check your connection and try again."
      );
    } finally {
      // Reset submission state regardless of outcome
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grant-container">
      <div className="grant-form">
        {/* Header section with application title and description */}
        <div className="header">
          <h1 className="header-title">Business Grant Application</h1>
          <p className="header-description">
            Apply for funding to grow your business. Complete the form below and
            upload required documents. All information is securely stored and
            protected by our privacy policies.
          </p>
        </div>

        <div className="form-container">
          {/* Company Information Section */}
          <div className="form-section">
            <h2 className="section-title">
              <Building className="icon-blue" />
              Company Information
            </h2>

            <div className="input-grid">
               {/* Company name input field */}
              <div className="input-group">
                <label className="input-label">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Contact person input field with icon */}
              <div className="input-group">
                <label className="input-label">Contact Person *</label>
                <div className="icon-input">
                  <User />
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="Full name of contact person"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <h2 className="section-title">
              <Mail className="icon-input" />
              Contact Details
            </h2>

            <div className="input-grid">
              {/* Email input field with mail icon */}
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <div className="icon-input">
                  <Mail />
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="company@email.com"
                  />
                </div>
              </div>

              {/* Phone number input field with phone icon */}
              <div className="input-group">
                <label className="input-label">Phone Number *</label>
                <div className="icon-input">
                  <Phone />
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    placeholder="+1 (111) 111-1111"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grant Request Section */}
          <div className="form-section">
            <h2 className="section-title">
              <DollarSign className="icon-green" />
              Grant Request
            </h2>

            <div className="input-grid">
              {/* Grant amount input with validation constraints */}
              <div className="input-group">
                <label className="input-label">
                  Requested Grant Amount (USD) *
                </label>
                <input
                  type="number"
                  name="grant_amount"
                  value={formData.grant_amount}
                  onChange={handleInputChange}
                  required
                  min={1000}
                  max={1000000}
                  className="input-field"
                  placeholder="50000"
                />
                <p className="input-help">
                  Enter amount between $1,000 and $1,000,000
                </p>
              </div>

              {/* Project description textarea */}
              <div className="input-group">
                <label className="input-label">Project Description *</label>
                <textarea
                  name="project_description"
                  value={formData.project_description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="input-field resize-vertical"
                  placeholder="Describe your project, its goals, expected outcomes, and how the grant will be used..."
                />
              </div>
            </div>
          </div>

          {/* File Upload Section - Critical for document management with UUID naming */}
          <div className="form-section">
            <h2 className="section-title">
              <FileText className="icon-purple" />
              Required Documents
            </h2>

            <div className="file-upload-grid">
              {/* Business Plan Upload */}
              <div className="file-upload-group">
                <Upload className="file-upload-icon" />
                <h3 className="file-upload-title">Business Plan *</h3>
                <p className="file-upload-description">
                  PDF, DOC, or DOCX (Max 10MB)
                </p>

                {/* Hidden file input for business plan upload */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "business_plan")}
                  required
                  className="hidden"
                  id="business_plan"
                  disabled={uploadProgress.business_plan}
                />
                {/* Custom styled label acting as upload button */}
                <label
                  htmlFor="business_plan"
                  className={`file-upload-label ${
                    uploadProgress.business_plan ? "uploading" : ""
                  }`}
                >
                  {uploadProgress.business_plan
                    ? "Uploading..."
                    : "Choose File"}
                </label>

                {/* Success indicator showing uploaded file name */}
                {uploadedFiles.business_plan && (
                  <p className="file-upload-success">
                    ✓ {uploadedFiles.business_plan.name}
                  </p>
                )}
              </div>

              {/* Financial Statements Upload */}
              <div className="file-upload-group">
                <Upload className="file-upload-icon" />
                <h3 className="file-upload-title">Financial Statements *</h3>
                <p className="file-upload-description">
                  PDF, XLS, or XLSX (Max 10MB)
                </p>

                {/* Hidden file input for financial statements upload */}
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx"
                  onChange={(e) => handleFileUpload(e, "financial_statements")}
                  required
                  className="hidden"
                  id="financial_statements"
                  disabled={uploadProgress.financial_statements}
                />
                {/* Custom styled label acting as upload button */}
                <label
                  htmlFor="financial_statements"
                  className={`file-upload-label ${
                    uploadProgress.financial_statements ? "uploading" : ""
                  }`}
                >
                  {uploadProgress.financial_statements
                    ? "Uploading..."
                    : "Choose File"}
                </label>

                {/* Success indicator showing uploaded file name */}
                {uploadedFiles.financial_statements && (
                  <p className="file-upload-success">
                    ✓ {uploadedFiles.financial_statements.name}
                  </p>
                )}
              </div>

              {/* Supporting Documents Upload */}
              <div className="file-upload-group">
                <Upload className="file-upload-icon" />
                <h3 className="file-upload-title">Supporting Documents *</h3>
                <p className="file-upload-description">Any format (Max 10MB)</p>

                {/* Hidden file input for supporting documents upload */}
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, "supporting_documents")}
                  className="hidden"
                  id="supporting_documents"
                  disabled={uploadProgress.supporting_documents}
                />
                {/* Custom styled label acting as upload button */}
                <label
                  htmlFor="supporting_documents"
                  className={`file-upload-label ${
                    uploadProgress.supporting_documents ? "uploading" : ""
                  }`}
                >
                  {uploadProgress.supporting_documents
                    ? "Uploading..."
                    : "Choose File"}
                </label>

                {/* Success indicator showing uploaded file name */}
                {uploadedFiles.supporting_documents && (
                  <p className="file-upload-success">
                    ✓ {uploadedFiles.supporting_documents.name}
                  </p>
                )}
              </div>
            </div>

            {/* Security information for user reassurance */}
            <div className="security-note">
              <p>
                <strong>Security Note:</strong> All uploaded files are encrypted
                and stored securely. Only authorized personnel can access your
                documents during the review process.
              </p>
            </div>
          </div>

          {/* Submission Section */}
          <div className="form-section">
            {/* Dynamic message display for success/error feedback */}
            {submitMessage && (
              <div
                className={`submit-message ${
                  submitMessage.includes("successfully") ||
                  submitMessage.includes("Application ID")
                    ? "success"
                    : "error"
                }`}
              >
                {submitMessage}
              </div>
            )}

            {/* Information about required fields and application ID */}
            <div className="submit-info">
              <p>* Required fields</p>
              <p>
                Application ID will be generated automatically upon submission
              </p>
            </div>

            {/* Submit button with loading state */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                <span className="loading">
                  <div className="spinner"></div>
                  Submitting Application...
                </span>
              ) : (
                "Submit Grant Application"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <div className="footer">
        <p>
          Questions? Contact our support team at grants@company.com or call
          (999) 999-9999
        </p>
      </div>
    </div>
  );
};

export default GrantApplicationForm;
