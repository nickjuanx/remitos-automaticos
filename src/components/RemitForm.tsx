import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SignaturePad from "./SignaturePad";
import { toast } from "sonner";
import { Asterisk } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
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
  
  const logWebhookAttempt = async (
    formData: FormData,
    webhookUrl: string,
    httpStatus: number | null,
    responseBody: string,
    errorMessage: string | null,
    attemptNumber: number,
    success: boolean
  ) => {
    try {
      const userDni = user && 'dni' in user ? user.dni as string : null;
      
      await supabase.from('webhook_logs').insert({
        form_data: formData as any,
        webhook_url: webhookUrl,
        http_status: httpStatus,
        response_body: responseBody,
        error_message: errorMessage,
        attempt_number: attemptNumber,
        user_dni: userDni,
        success: success
      });
    } catch (logError) {
      console.error('Error logging webhook attempt:', logError);
    }
  };

  const saveFormBackup = async (formData: FormData) => {
    try {
      const userDni = user && 'dni' in user ? user.dni as string : null;
      
      const { data, error } = await supabase.from('form_submissions').insert({
        form_type: formData.formType,
        client_name: formData.clientName,
        form_data: formData as any,
        user_dni: userDni,
        webhook_sent: false,
        webhook_success: false,
        retry_count: 0
      }).select().single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving form backup:', error);
      throw error;
    }
  };

  const updateFormBackup = async (backupId: string, webhookSent: boolean, webhookSuccess: boolean, retryCount: number) => {
    try {
      await supabase.from('form_submissions').update({
        webhook_sent: webhookSent,
        webhook_success: webhookSuccess,
        retry_count: retryCount,
        last_retry_at: new Date().toISOString()
      }).eq('id', backupId);
    } catch (error) {
      console.error('Error updating form backup:', error);
    }
  };

  const sendToWebhook = async (formData: FormData, attemptNumber: number = 1): Promise<{ success: boolean, response?: Response, error?: Error }> => {
    const webhookUrl = "https://n8nwebhook.botec.tech/webhook/serycon";
    
    try {
      console.log(`Intento ${attemptNumber} - Enviando formulario al webhook:`, {
        url: webhookUrl,
        clientName: formData.clientName,
        formType: formData.formType,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();
      
      console.log(`Intento ${attemptNumber} - Respuesta del webhook:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        timestamp: new Date().toISOString()
      });

      await logWebhookAttempt(
        formData,
        webhookUrl,
        response.status,
        responseText,
        response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        attemptNumber,
        response.ok
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      return { success: true, response };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error(`Intento ${attemptNumber} - Error al enviar al webhook:`, {
        error: errorMessage,
        url: webhookUrl,
        timestamp: new Date().toISOString()
      });

      await logWebhookAttempt(
        formData,
        webhookUrl,
        null,
        '',
        errorMessage,
        attemptNumber,
        false
      );

      return { success: false, error: error as Error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firmaGuardada) {
      toast.error("Debe guardar la firma antes de enviar el formulario");
      return;
    }
    
    setLoading(true);
    let backupId: string | null = null;
    
    try {
      // Paso 1: Guardar respaldo en Supabase
      console.log('Guardando respaldo del formulario en Supabase...');
      backupId = await saveFormBackup(formData);
      console.log('Respaldo guardado con ID:', backupId);
      
      // Paso 2: Intentar enviar al webhook con reintentos automáticos
      const maxRetries = 3;
      let lastError: Error | null = null;
      let success = false;
      
      for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
        if (attempt > 1) {
          console.log(`Esperando antes del reintento ${attempt}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Espera incremental
        }
        
        const result = await sendToWebhook(formData, attempt);
        success = result.success;
        
        if (!success) {
          lastError = result.error || new Error('Error desconocido');
          if (backupId) {
            await updateFormBackup(backupId, true, false, attempt);
          }
          
          if (attempt < maxRetries) {
            console.log(`Intento ${attempt} falló, reintentando...`);
            toast.error(`Intento ${attempt} falló, reintentando en ${2 * attempt} segundos...`);
          }
        } else {
          // Éxito - actualizar respaldo
          if (backupId) {
            await updateFormBackup(backupId, true, true, attempt);
          }
          break;
        }
      }
      
      if (success) {
        console.log('Formulario enviado exitosamente al webhook');
        toast.success(`${formData.formType === "remito" ? "Remito" : "Orden de trabajo"} enviado correctamente`);
        resetForm();
      } else {
        // Todos los intentos fallaron
        const errorMsg = lastError?.message || 'Error desconocido';
        console.error('Todos los intentos de envío fallaron:', errorMsg);
        
        toast.error(
          `Error al enviar el ${formData.formType === "remito" ? "remito" : "orden de trabajo"}. ` +
          `Los datos están guardados como respaldo. Error: ${errorMsg}`
        );
        
        // Mostrar información adicional sobre el respaldo
        toast.info(`Los datos han sido guardados con ID: ${backupId}. Contacte al administrador para recuperar la información.`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error crítico en el proceso de envío:', errorMessage);
      
      toast.error(`Error crítico: ${errorMessage}`);
      
      if (backupId) {
        toast.info(`Los datos han sido guardados como respaldo con ID: ${backupId}`);
      }
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
