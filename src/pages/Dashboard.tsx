
import { useState } from "react";
import RemitForm from "@/components/RemitForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Remito</CardTitle>
        </CardHeader>
        <CardContent>
          <RemitForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
