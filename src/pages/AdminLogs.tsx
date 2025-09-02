import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Download, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WebhookLog {
  id: string;
  form_data: any;
  webhook_url: string;
  http_status: number | null;
  response_body: string;
  error_message: string | null;
  attempt_number: number;
  user_dni: string | null;
  success: boolean;
  created_at: string;
}

interface FormSubmission {
  id: string;
  form_type: string;
  client_name: string;
  form_data: any;
  user_dni: string | null;
  webhook_sent: boolean;
  webhook_success: boolean;
  retry_count: number;
  last_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

const AdminLogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingSubmission, setRetryingSubmission] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar logs de webhook
      const { data: logsData, error: logsError } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setWebhookLogs(logsData || []);

      // Cargar formularios enviados
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (submissionsError) throw submissionsError;
      setFormSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const retrySubmission = async (submission: FormSubmission) => {
    setRetryingSubmission(submission.id);
    try {
      const response = await fetch("https://n8nwebhook.botec.tech/webhook/serycon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submission.form_data)
      });

      const responseText = await response.text();
      const success = response.ok;

      // Actualizar el registro
      await supabase.from('form_submissions').update({
        webhook_sent: true,
        webhook_success: success,
        retry_count: submission.retry_count + 1,
        last_retry_at: new Date().toISOString()
      }).eq('id', submission.id);

      // Registrar el intento en logs
      await supabase.from('webhook_logs').insert({
        form_data: submission.form_data,
        webhook_url: "https://n8nwebhook.botec.tech/webhook/serycon",
        http_status: response.status,
        response_body: responseText,
        error_message: success ? null : `Manual retry - HTTP ${response.status}: ${response.statusText}`,
        attempt_number: submission.retry_count + 1,
        user_dni: submission.user_dni,
        success: success
      });

      if (success) {
        toast.success('Formulario reenviado exitosamente');
      } else {
        toast.error(`Error al reenviar: HTTP ${response.status}`);
      }

      loadData(); // Recargar datos

    } catch (error) {
      console.error('Error retrying submission:', error);
      toast.error('Error al intentar reenviar el formulario');
    } finally {
      setRetryingSubmission(null);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : String(val)
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadData();
  }, []);

  const failedSubmissions = formSubmissions.filter(s => !s.webhook_success);
  const successfulSubmissions = formSubmissions.filter(s => s.webhook_success);
  const failedLogs = webhookLogs.filter(l => !l.success);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Monitoreo de envíos de formularios y logs del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Formularios</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formSubmissions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados Exitosamente</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successfulSubmissions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallos de Envío</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedSubmissions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores Recientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{failedLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="failed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="failed">Formularios Fallidos</TabsTrigger>
          <TabsTrigger value="submissions">Todos los Formularios</TabsTrigger>
          <TabsTrigger value="logs">Logs de Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formularios con Fallos de Envío</CardTitle>
              <CardDescription>
                Formularios que no pudieron ser enviados al webhook. Puedes reintentarlos manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failedSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ¡Genial! No hay formularios con fallos de envío.
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Reintentos</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.client_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={submission.form_type === 'remito' ? 'default' : 'secondary'}>
                              {submission.form_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{submission.user_dni || 'N/A'}</TableCell>
                          <TableCell>{submission.retry_count}</TableCell>
                          <TableCell>
                            {new Date(submission.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => retrySubmission(submission)}
                              disabled={retryingSubmission === submission.id}
                            >
                              {retryingSubmission === submission.id ? 'Enviando...' : 'Reintentar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Todos los Formularios</CardTitle>
                <CardDescription>Historial completo de formularios enviados</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => exportToCSV(formSubmissions, 'form_submissions.csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Reintentos</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.client_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={submission.form_type === 'remito' ? 'default' : 'secondary'}>
                            {submission.form_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{submission.user_dni || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={submission.webhook_success ? 'default' : 'destructive'}>
                            {submission.webhook_success ? 'Exitoso' : 'Fallido'}
                          </Badge>
                        </TableCell>
                        <TableCell>{submission.retry_count}</TableCell>
                        <TableCell>
                          {new Date(submission.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Logs de Webhook</CardTitle>
                <CardDescription>Registro detallado de todos los intentos de envío</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => exportToCSV(webhookLogs, 'webhook_logs.csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado HTTP</TableHead>
                      <TableHead>Intento #</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.form_data?.clientName || 'N/A'}
                        </TableCell>
                        <TableCell>{log.user_dni || 'N/A'}</TableCell>
                        <TableCell>
                          {log.http_status ? (
                            <Badge variant={log.http_status < 400 ? 'default' : 'destructive'}>
                              {log.http_status}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.attempt_number}</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'Éxito' : 'Error'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.error_message || 'Sin errores'}
                        </TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogs;