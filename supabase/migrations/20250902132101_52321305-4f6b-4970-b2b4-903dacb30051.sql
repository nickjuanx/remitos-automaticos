-- Create usuarios table
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dni TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own data
CREATE POLICY "Users can view their own data" 
ON public.usuarios 
FOR SELECT 
USING (true);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data" 
ON public.usuarios 
FOR UPDATE 
USING (true);

-- Insert the user data
INSERT INTO public.usuarios (dni, password, created_at, updated_at) VALUES
('11111111', '1111', '2025-05-05 18:34:09.902182+00', '2025-05-05 18:34:09.902182+00'),
('12522117', 'Sanlu2574', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('13752293', '', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('16546240', 'Ariel4321', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('33069317', 'mpower', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('33620117', 'nico8888', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('35450019', '2990', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('38375972', 'Cirilla13', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('41605102', 'Chorizo_90', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('43557925', 'Asking_123', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('43768589', '18122020Ro', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00'),
('45686109', 'Nico', '2025-04-26 22:58:47.234787+00', '2025-04-26 22:58:47.234787+00');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();