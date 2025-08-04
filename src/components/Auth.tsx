import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { supabase } from "../lib/supabase";

export const Auth = () => {
  // Toggle between sign up and sign in modes
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form input state for email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // User feedback state for displaying messages
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  
  // Loading state to disable form during authentication requests
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission for both sign up and sign in
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Set loading state and clear previous messages
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    // Handle sign up flow
    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://webform-ivory.vercel.app/?verified=true'
        }
      });
      // Handle sign up errors
      if (signUpError) {
        console.error("Error signing up:", signUpError.message);
        setMessage(`Error: ${signUpError.message}`);
        setMessageType("error");
        setIsLoading(false);
        return;
      }
      // Show email confirmation message for new users
      if (data.user && !data.user.email_confirmed_at) {
        setMessage(
          "Please, check your inbox. You will receive a confirmation email shortly."
        );
        setMessageType("success");
      }
    } else {
      // Handle sign in flow
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // Handle sign in errors
      if (signInError) {
        console.error("Error signing up:", signInError.message);
        setMessage(`Error: ${signInError.message}`);
        setMessageType("error");
        setIsLoading(false);
        return;
      }
    }
    // Reset loading state after authentication process
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem" }}>
      {/* Dynamic title based on current mode */}
      <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
      {/* Authentication form */}
      <form onSubmit={handleSubmit}>
        {/* Email input field */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          disabled={isLoading}
          style={{
            width: "100%",
            marginBottom: "0.5rem",
            padding: "0.5rem",
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        {/* Password input field */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          disabled={isLoading}
          style={{
            width: "100%",
            marginBottom: "0.5rem",
            padding: "0.5rem",
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        {/* Conditional message display with dynamic styling */}
        {message && (
          <div
            style={{
              width: "99%",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              borderRadius: "4px",
              fontSize: "14px",
              textAlign: "center",
              backgroundColor:
                messageType === "success" ? "#f0f9ff" : "#fef2f2",
              color: messageType === "success" ? "#0369a1" : "#dc2626",
              border: `1px solid ${
                messageType === "success" ? "#bae6fd" : "#fecaca"
              }`,
            }}
          >
            {message}
          </div>
        )}
        {/* Submit button with dynamic text and loading state */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "0.5rem",
            backgroundColor: isLoading ? "#6366f1" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading
            ? isSignUp
              ? "Creating Account..."
              : "Signing In..."
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>
      {/* Toggle button to switch between sign up and sign in modes */}
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
        }}
        style={{ padding: "0.5rem 1rem", marginTop: "0.5rem" }}
      >
        {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
      </button>
    </div>
  );
};
