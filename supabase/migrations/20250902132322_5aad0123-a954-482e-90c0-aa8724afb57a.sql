-- Create logs table for webhook attempts
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_data JSONB NOT NULL,
  webhook_url TEXT NOT NULL,
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  user_dni TEXT,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create backup table for form submissions
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL,
  client_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  user_dni TEXT,
  webhook_sent BOOLEAN DEFAULT false,
  webhook_success BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is internal logging)
CREATE POLICY "Allow all operations on webhook_logs" 
ON public.webhook_logs 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on form_submissions" 
ON public.form_submissions 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_success ON public.webhook_logs(success);
CREATE INDEX idx_form_submissions_webhook_success ON public.form_submissions(webhook_success);
CREATE INDEX idx_form_submissions_created_at ON public.form_submissions(created_at DESC);

-- Create trigger for automatic timestamp updates on form_submissions
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();