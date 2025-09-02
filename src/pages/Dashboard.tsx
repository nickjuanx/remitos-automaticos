
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RemitForm from "@/components/RemitForm";
import SignOutButton from "@/components/SignOutButton";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <img
          src="/lovable-uploads/b492149c-565d-4e6a-aaef-0b15d0f5bcd7.png"
          alt="Logo"
          className="h-12 w-auto"
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/logs')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Logs
          </Button>
          <SignOutButton />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Formulario de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <RemitForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
