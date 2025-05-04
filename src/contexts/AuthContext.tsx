
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface CustomUser {
  id: string;
  dni: string;
  role: string;
}

interface CustomSession {
  user: CustomUser;
  access_token: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | CustomUser | null;
  session: Session | CustomSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setCustomSession: (session: CustomSession) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Load session from localStorage on startup
const getStoredSession = (): CustomSession | null => {
  const storedSession = localStorage.getItem('customSession');
  if (!storedSession) return null;
  
  try {
    const session = JSON.parse(storedSession);
    // Check if session is expired
    if (session.expires_at < Date.now()) {
      localStorage.removeItem('customSession');
      return null;
    }
    return session;
  } catch (error) {
    localStorage.removeItem('customSession');
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | CustomUser | null>(null);
  const [session, setSession] = useState<Session | CustomSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to set a custom session
  const setCustomSession = (customSession: CustomSession) => {
    localStorage.setItem('customSession', JSON.stringify(customSession));
    setSession(customSession);
    setUser(customSession.user);
    setLoading(false);
  };

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    // First check for custom session
    const customSession = getStoredSession();
    if (customSession) {
      console.log("Found custom session:", customSession);
      setSession(customSession);
      setUser(customSession.user);
      setLoading(false);
      return;
    }
    
    // If no custom session, fallback to Supabase sessions (for backward compatibility)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "session exists" : "no session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear custom session if it exists
      localStorage.removeItem('customSession');
      
      // Also clear any Supabase session that might exist
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      navigate("/");
      toast.success("Has cerrado sesión correctamente");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  console.log("Auth state:", { 
    user: user ? "exists" : "null", 
    loading, 
    sessionExists: session ? true : false,
    sessionType: session ? (session.access_token ? "custom" : "supabase") : "none"
  });

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, setCustomSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
