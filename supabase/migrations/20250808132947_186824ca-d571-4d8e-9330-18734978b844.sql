-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin', 'accountant')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create stock items table
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Create policies for stock items
CREATE POLICY "Staff can view stock items" 
ON public.stock_items 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can manage stock items" 
ON public.stock_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  )
);

-- Create stock replenishment requests table
CREATE TABLE public.stock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity_requested INTEGER NOT NULL,
  reason TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for stock requests
CREATE POLICY "Users can view their own requests" 
ON public.stock_requests 
FOR SELECT 
USING (requested_by = auth.uid());

CREATE POLICY "Managers can view all requests" 
ON public.stock_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  )
);

CREATE POLICY "Staff can create requests" 
ON public.stock_requests 
FOR INSERT 
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Managers can update requests" 
ON public.stock_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  )
);

-- Create chart of accounts table
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for chart of accounts
CREATE POLICY "Accountants can manage chart of accounts" 
ON public.chart_of_accounts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('accountant', 'admin')
  )
);

-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for journal entries
CREATE POLICY "Accountants can manage journal entries" 
ON public.journal_entries 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('accountant', 'admin')
  )
);

-- Create journal entry lines table
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  description TEXT,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Create policies for journal entry lines
CREATE POLICY "Accountants can manage journal entry lines" 
ON public.journal_entry_lines 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('accountant', 'admin')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_requests_updated_at
  BEFORE UPDATE ON public.stock_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default chart of accounts
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Current Assets', 'asset', 'Short-term assets'),
('1100', 'Cash and Cash Equivalents', 'asset', 'Cash on hand and in banks'),
('1200', 'Accounts Receivable', 'asset', 'Money owed by customers'),
('1300', 'Inventory', 'asset', 'Stock and supplies'),
('1400', 'Prepaid Expenses', 'asset', 'Expenses paid in advance'),
('1500', 'Fixed Assets', 'asset', 'Long-term tangible assets'),
('1510', 'Equipment', 'asset', 'Hotel equipment and machinery'),
('1520', 'Furniture and Fixtures', 'asset', 'Hotel furniture and fixtures'),
('1530', 'Building', 'asset', 'Hotel building and structures'),
('2000', 'Current Liabilities', 'liability', 'Short-term debts'),
('2100', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
('2200', 'Accrued Expenses', 'liability', 'Expenses incurred but not yet paid'),
('2300', 'Taxes Payable', 'liability', 'Tax obligations'),
('2400', 'Long-term Liabilities', 'liability', 'Long-term debts'),
('3000', 'Owner Equity', 'equity', 'Owner investment and retained earnings'),
('4000', 'Revenue', 'revenue', 'Income from operations'),
('4100', 'Room Revenue', 'revenue', 'Income from room bookings'),
('4200', 'Food and Beverage Revenue', 'revenue', 'Income from dining services'),
('4300', 'Other Revenue', 'revenue', 'Miscellaneous income'),
('5000', 'Cost of Goods Sold', 'expense', 'Direct costs of services'),
('5100', 'Food and Beverage Costs', 'expense', 'Cost of food and drinks sold'),
('6000', 'Operating Expenses', 'expense', 'Day-to-day operational costs'),
('6100', 'Salaries and Wages', 'expense', 'Employee compensation'),
('6200', 'Utilities', 'expense', 'Electricity, water, gas'),
('6300', 'Maintenance and Repairs', 'expense', 'Property maintenance costs'),
('6400', 'Marketing and Advertising', 'expense', 'Promotional expenses'),
('6500', 'Insurance', 'expense', 'Insurance premiums'),
('6600', 'Office Supplies', 'expense', 'Administrative supplies'),
('7000', 'Administrative Expenses', 'expense', 'Management and administrative costs');