-- Create website_content table for content management
CREATE TABLE public.website_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section, key)
);

-- Enable Row Level Security
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Create policies for content management - only super admins can manage
CREATE POLICY "Super admins can manage website content" 
ON public.website_content 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'super_admin'
));

-- Allow public read access to active content
CREATE POLICY "Public can view active content" 
ON public.website_content 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_website_content_updated_at
BEFORE UPDATE ON public.website_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();