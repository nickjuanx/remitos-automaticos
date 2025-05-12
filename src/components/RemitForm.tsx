import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SignaturePad from "./SignaturePad";
import { toast } from "sonner";
import { Asterisk } from "lucide-react";

interface FormData {
  formType: "orden" | "remito";
  clientName: string;
  domicilio: string;
  localidad: string;
  telefono: string;
  solicitante: string;
  tecnicos: string;
  horasEmpleadas: string;
  tareasRealizadas: string;
  trabajoRealizado: string;
  receptorNombre: string;
  receptorDni: string;
  firma: string;
  aclaraciones: string;
}

const RemitForm = () => {
  const [formData, setFormData] = useState<FormData>({
    formType: "orden",
    clientName: "",
    domicilio: "",
    localidad: "",
    telefono: "",
    solicitante: "",
    tecnicos: "",
    horasEmpleadas: "",
    tareasRealizadas: "",
    trabajoRealizado: "",
    receptorNombre: "",
    receptorDni: "",
    firma: "",
    aclaraciones: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [firmaGuardada, setFirmaGuardada] = useState(false);
  const signaturePadRef = useRef<{ clear: () => void } | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRadioChange = (value: "orden" | "remito") => {
    setFormData(prev => ({
      ...prev,
      formType: value
    }));
  };
  
  const handleSignatureSave = (signatureData: string) => {
    setFormData(prev => ({
      ...prev,
      firma: signatureData
    }));
    setFirmaGuardada(true);
  };
  
  const resetForm = () => {
    setFormData({
      formType: "orden",
      clientName: "",
      domicilio: "",
      localidad: "",
      telefono: "",
      solicitante: "",
      tecnicos: "",
      horasEmpleadas: "",
      tareasRealizadas: "",
      trabajoRealizado: "",
      receptorNombre: "",
      receptorDni: "",
      firma: "",
      aclaraciones: ""
    });
    
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setFirmaGuardada(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firmaGuardada) {
      toast.error("Debe guardar la firma antes de enviar el formulario");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("https://n8nwebhook.botec.tech/webhook/2a4fe561-dd0a-4a0c-95c9-df684e13d8b9", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error("Error al enviar el formulario");
      toast.success(`${formData.formType === "remito" ? "Remito" : "Orden de trabajo"} enviado correctamente`);
      
      resetForm();
      
    } catch (error) {
      console.error(error);
      toast.error(`Error al enviar el ${formData.formType === "remito" ? "remito" : "orden de trabajo"}`);
    } finally {
      setLoading(false);
    }
  };
  
  const RequiredMark = () => <Asterisk className="inline-block ml-1 text-red-500" size={8} />;
  
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2 my-0">
          <Label htmlFor="formType">Tipo de formulario <RequiredMark /></Label>
          <RadioGroup value={formData.formType} onValueChange={handleRadioChange as (value: string) => void} className="flex gap-4 my-[5px]">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="orden" id="orden" />
              <Label htmlFor="orden">Orden de trabajo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remito" id="remito" />
              <Label htmlFor="remito">Remito</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="clientName">Nombre del cliente <RequiredMark /></Label>
          <Input id="clientName" name="clientName" value={formData.clientName} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="domicilio">Domicilio <RequiredMark /></Label>
          <Input id="domicilio" name="domicilio" value={formData.domicilio} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="localidad">Localidad <RequiredMark /></Label>
          <Input id="localidad" name="localidad" value={formData.localidad} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="solicitante">Solicitante del pedido <RequiredMark /></Label>
          <Input id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tecnicos">Técnico/s interviniente/s <RequiredMark /></Label>
          <Input id="tecnicos" name="tecnicos" value={formData.tecnicos} onChange={handleInputChange} required />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="horasEmpleadas">Cantidad de horas empleadas <RequiredMark /></Label>
          <Input id="horasEmpleadas" name="horasEmpleadas" type="number" value={formData.horasEmpleadas} onChange={handleInputChange} required />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="tareasRealizadas">Tareas Realizadas Explicadas A <RequiredMark /></Label>
          <Textarea id="tareasRealizadas" name="tareasRealizadas" value={formData.tareasRealizadas} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="trabajoRealizado">Detalle de instalación / servicio / materiales <RequiredMark /></Label>
          <Textarea id="trabajoRealizado" name="trabajoRealizado" value={formData.trabajoRealizado} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="receptorNombre">Nombre de quien recepcionó el trabajo <RequiredMark /></Label>
          <Input id="receptorNombre" name="receptorNombre" value={formData.receptorNombre} onChange={handleInputChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="receptorDni">DNI de quien recepcionó el trabajo <RequiredMark /></Label>
          <Input id="receptorDni" name="receptorDni" value={formData.receptorDni} onChange={handleInputChange} required maxLength={8} pattern="\d{8}" />
        </div>

        <div className="grid gap-2">
          <Label>Firma de quien recepcionó el trabajo <RequiredMark /></Label>
          <SignaturePad onSave={handleSignatureSave} ref={signaturePadRef} />
          {!firmaGuardada && (
            <p className="text-sm text-red-500 mt-1">
              Debe guardar la firma antes de enviar el formulario
            </p>
          )}
          {firmaGuardada && (
            <p className="text-sm text-green-600 mt-1">
              Firma guardada correctamente
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="aclaraciones">Observaciones</Label>
          <Textarea id="aclaraciones" name="aclaraciones" value={formData.aclaraciones} onChange={handleInputChange} />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !firmaGuardada}>
        {loading ? "Enviando..." : `Enviar ${formData.formType === "remito" ? "Remito" : "Orden de trabajo"}`}
      </Button>
    </form>;
};

export default RemitForm;
