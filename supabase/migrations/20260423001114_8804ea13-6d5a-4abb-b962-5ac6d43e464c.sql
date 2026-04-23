-- Tabela koja pamti realizovane ekskurzije po razrednoj grupi i školskoj godini
-- za automatsku provjeru pravila rotacije iz IDSS Pravilnika
CREATE TABLE public.trip_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  grade_group TEXT NOT NULL, -- npr. '4', '5+6', '7+8', '9'
  school_year TEXT NOT NULL, -- npr. '2025/2026'
  destination TEXT NOT NULL,
  trip_id UUID,
  realized_at DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_history_grade_year ON public.trip_history(grade_group, school_year);
CREATE INDEX idx_trip_history_user ON public.trip_history(user_id);

ALTER TABLE public.trip_history ENABLE ROW LEVEL SECURITY;

-- Svi autentifikovani korisnici mogu čitati historijat (potrebno za provjeru rotacije)
CREATE POLICY "Authenticated users can view trip history"
ON public.trip_history FOR SELECT
TO authenticated
USING (true);

-- Korisnik može unijeti svoj zapis
CREATE POLICY "Users can insert their own trip history"
ON public.trip_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Korisnik može mijenjati svoj zapis
CREATE POLICY "Users can update their own trip history"
ON public.trip_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Samo admin može brisati
CREATE POLICY "Admins can delete trip history"
ON public.trip_history FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_trip_history_updated_at
BEFORE UPDATE ON public.trip_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();