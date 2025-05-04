
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LoginForm = () => {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, setCustomSession } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if this user exists in our usuarios table
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("password, dni")
        .eq("dni", dni)
        .single();

      if (userError || !usuario) {
        toast.error("DNI no encontrado");
        setLoading(false);
        return;
      }

      if (!usuario.password) {
        // First login case - set password
        setIsFirstLogin(true);
        if (!password) {
          setLoading(false);
          return;
        }

        // Update password in usuarios table
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ password })
          .eq("dni", dni);

        if (updateError) {
          toast.error("Error al actualizar la contraseña");
          console.error(updateError);
          setLoading(false);
          return;
        }
      } else if (usuario.password !== password) {
        toast.error("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Create a custom session using the DNI
      const customSession = {
        user: {
          id: dni,
          dni: dni,
          role: 'authenticated',
        },
        access_token: 'custom-auth-token',
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      };

      // Set the custom session in AuthContext
      setCustomSession(customSession);
      
      console.log("Authentication successful with DNI");
      toast.success(isFirstLogin ? "Contraseña establecida correctamente" : "Login exitoso");
      navigate("/dashboard");
      
    } catch (error) {
      toast.error("Error en el proceso de login");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null;
  }

  return (
    <Card className="w-[350px]">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/lovable-uploads/b492149c-565d-4e6a-aaef-0b15d0f5bcd7.png"
            alt="Logo"
            className="h-12 w-auto"
          />
        </div>
        <CardTitle>Acceso al Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              maxLength={8}
              pattern="\d{8}"
              title="Por favor ingrese un DNI válido de 8 dígitos"
            />
          </div>

          {(isFirstLogin || dni) && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={isFirstLogin ? "Establezca su contraseña" : "Contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isFirstLogin}
              />
            </div>
          )}
          <Button type="submit" className="w-full bg-[#5CB874]" disabled={loading}>
            {loading ? "Procesando..." : isFirstLogin ? "Establecer Contraseña" : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
