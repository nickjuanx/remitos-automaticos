
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SignOutButton = () => {
  const { signOut } = useAuth();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={signOut} 
      className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
    >
      <LogOut size={16} />
      <span>Salir</span>
    </Button>
  );
};

export default SignOutButton;
