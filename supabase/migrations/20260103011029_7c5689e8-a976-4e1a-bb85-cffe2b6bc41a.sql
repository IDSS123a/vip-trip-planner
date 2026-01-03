-- Create trips table to store generated trip plans
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  share_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  name TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  destinations TEXT[] NOT NULL DEFAULT '{}',
  departure_date DATE,
  return_date DATE,
  grade_level TEXT,
  student_count INTEGER DEFAULT 14,
  chaperones TEXT[] DEFAULT '{}',
  transport TEXT DEFAULT 'bus',
  educational_focus TEXT,
  special_needs TEXT,
  plans_data JSONB NOT NULL,
  selected_plan_id INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public trips (shared via link)
CREATE POLICY "Public trips are viewable by everyone"
ON public.trips
FOR SELECT
USING (is_public = true);

-- Policy: Authenticated users can view their own trips
CREATE POLICY "Users can view their own trips"
ON public.trips
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own trips
CREATE POLICY "Users can create their own trips"
ON public.trips
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Authenticated users can update their own trips
CREATE POLICY "Users can update their own trips"
ON public.trips
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own trips
CREATE POLICY "Users can delete their own trips"
ON public.trips
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Allow anonymous inserts (for users not logged in)
CREATE POLICY "Anyone can create anonymous trips"
ON public.trips
FOR INSERT
WITH CHECK (user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trips_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_share_id ON public.trips(share_id);
CREATE INDEX idx_trips_created_at ON public.trips(created_at DESC);