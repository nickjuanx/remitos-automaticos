
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  
  useEffect(() => {
    console.log("ProtectedRoute rendering with:", { 
      userExists: !!user, 
      sessionExists: !!session,
      loading 
    });
  }, [user, session, loading]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!session || !user) {
    console.log("No session or user found, redirecting to login");
    toast.error("Debes iniciar sesión para acceder a esta página");
    return <Navigate to="/" />;
  }

  console.log("Authentication validated, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
