
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("password")
        .eq("dni", dni)
        .single();

      if (!usuario) {
        toast.error("DNI no encontrado");
        return;
      }

      if (!usuario.password) {
        setIsFirstLogin(true);
        if (!password) return;

        const { error: updateError } = await supabase
          .from("usuarios")
          .update({ password })
          .eq("dni", dni);

        if (updateError) throw updateError;
        toast.success("Contraseña establecida correctamente");
        navigate("/dashboard");
      } else {
        if (usuario.password !== password) {
          toast.error("Contraseña incorrecta");
          return;
        }
        toast.success("Login exitoso");
        navigate("/dashboard");
      }

    } catch (error) {
      toast.error("Error en el proceso de login");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="Nombre del cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

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
