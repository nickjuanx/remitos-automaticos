
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RemitForm from "@/components/RemitForm";
import SignOutButton from "@/components/SignOutButton";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <img
          src="/lovable-uploads/b492149c-565d-4e6a-aaef-0b15d0f5bcd7.png"
          alt="Logo"
          className="h-12 w-auto"
        />
        <SignOutButton />
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
