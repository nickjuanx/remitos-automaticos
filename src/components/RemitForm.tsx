
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SignaturePad from "./SignaturePad";
import { toast } from "sonner";

interface FormData {
  domicilio: string;
  localidad: string;
  solicitante: string;
  tecnicos: string;
  telefono: string;
  tareasRealizadas: string;
  horasEmpleadas: string;
  trabajoRealizado: string;
  receptorNombre: string;
  receptorDni: string;
  firma: string;
  aclaraciones: string;
}

const RemitForm = () => {
  const [formData, setFormData] = useState<FormData>({
    domicilio: "",
    localidad: "",
    solicitante: "",
    tecnicos: "",
    telefono: "",
    tareasRealizadas: "",
    horasEmpleadas: "",
    trabajoRealizado: "",
    receptorNombre: "",
    receptorDni: "",
    firma: "",
    aclaraciones: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignatureSave = (signatureData: string) => {
    setFormData((prev) => ({ ...prev, firma: signatureData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://n8nwebhook.botec.tech/webhook/2a4fe561-dd0a-4a0c-95c9-df684e13d8b9",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Error al enviar el remito");
      
      toast.success("Remito enviado correctamente");
      // Limpiar el formulario
      setFormData({
        domicilio: "",
        localidad: "",
        solicitante: "",
        tecnicos: "",
        telefono: "",
        tareasRealizadas: "",
        horasEmpleadas: "",
        trabajoRealizado: "",
        receptorNombre: "",
        receptorDni: "",
        firma: "",
        aclaraciones: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar el remito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="domicilio">Domicilio</Label>
          <Input
            id="domicilio"
            name="domicilio"
            value={formData.domicilio}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="localidad">Localidad</Label>
          <Input
            id="localidad"
            name="localidad"
            value={formData.localidad}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="solicitante">Solicitante del pedido</Label>
          <Input
            id="solicitante"
            name="solicitante"
            value={formData.solicitante}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tecnicos">Técnico/s interviniente/s</Label>
          <Input
            id="tecnicos"
            name="tecnicos"
            value={formData.tecnicos}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tareasRealizadas">Tareas realizadas</Label>
          <Textarea
            id="tareasRealizadas"
            name="tareasRealizadas"
            value={formData.tareasRealizadas}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="horasEmpleadas">Cantidad de horas empleadas</Label>
          <Input
            id="horasEmpleadas"
            name="horasEmpleadas"
            type="number"
            value={formData.horasEmpleadas}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="trabajoRealizado">Trabajo realizado</Label>
          <Textarea
            id="trabajoRealizado"
            name="trabajoRealizado"
            value={formData.trabajoRealizado}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="receptorNombre">Nombre de quien recepcionó el trabajo</Label>
          <Input
            id="receptorNombre"
            name="receptorNombre"
            value={formData.receptorNombre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="receptorDni">DNI de quien recepcionó el trabajo</Label>
          <Input
            id="receptorDni"
            name="receptorDni"
            value={formData.receptorDni}
            onChange={handleInputChange}
            required
            maxLength={8}
            pattern="\d{8}"
          />
        </div>

        <div className="grid gap-2">
          <Label>Firma de quien recepcionó el trabajo</Label>
          <SignaturePad onSave={handleSignatureSave} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="aclaraciones">Aclaraciones</Label>
          <Textarea
            id="aclaraciones"
            name="aclaraciones"
            value={formData.aclaraciones}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar Remito"}
      </Button>
    </form>
  );
};

export default RemitForm;
