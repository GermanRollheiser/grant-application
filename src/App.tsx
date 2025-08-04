import { useEffect, useState } from "react";
import "./App.css";
import { Auth } from "./components/Auth";
import { supabase } from "./lib/supabase";
import GrantApplicationForm from "./components/GrantApplicationForm";
import type { Session } from "@supabase/supabase-js";

function App() {
  // Session state to track user authentication status
  const [session, setSession] = useState<Session | null>(null);
  
  // Error state for displaying authentication or session-related errors
  const [error, setError] = useState<string>("");
  
  // Flag to track if user just verified their email from redirect
  const [justVerified, setJustVerified] = useState(false);

  // Function to retrieve current session from Supabase
  const fetchSession = async () => {
    try {
      const currentSession = await supabase.auth.getSession();
      setSession(currentSession.data.session);
    } catch (err) {
      setError("Failed to fetch session");
      console.error("Session fetch error:", err);
    }
  };

  // Effect hook to handle initial authentication state and email verification
  useEffect(() => {
    // Check if user was redirected after email verification
  const urlParams = new URLSearchParams(window.location.search);
  const isVerifiedRedirect = urlParams.get("verified") === "true";

    // Handle email verification redirect
    if (isVerifiedRedirect) {
      setJustVerified(true);
      fetchSession();
      // Clean up URL by removing verification parameters
      window.history.replaceState({}, document.title, "/");
    }

    // Set up authentication state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup function to unsubscribe from auth listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to handle user logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      setError("Failed to log out");
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="app-container">
      {/* Display error messages with accessibility attributes */}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* Display email verification success message */}
      {justVerified && (
        <div className="info-message" role="status">
          Your email has been verified! You can now submit your application.
        </div>
      )}

      {/* Conditional rendering based on authentication status */}
      {session ? (
        <>
          {/* Navigation header for authenticated users */}
          <nav className="nav-header">
            <button
              onClick={logout}
              className="logout-button"
              aria-label="Log out"
            >
              Log Out
            </button>
          </nav>
          {/* Main application form for authenticated users */}
          <GrantApplicationForm />
        </>
      ) : (
        // Authentication component for non-authenticated users
        <Auth />
      )}
    </div>
  );
}

export default App;
