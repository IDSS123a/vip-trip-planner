-- SECURITY FIX: Remove duplicate/conflicting public access policy on school_info
-- The previous migration added "Authenticated users can view school info" 
-- But the old "School info is publicly readable" policy still exists creating a conflict

-- Drop the public policy that was incorrectly left in place
DROP POLICY IF EXISTS "School info is publicly readable" ON public.school_info;

-- Ensure the authenticated-only policy exists (from previous migration)
-- This is idempotent - won't fail if it already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'school_info' 
        AND policyname = 'Authenticated users can view school info'
    ) THEN
        CREATE POLICY "Authenticated users can view school info" 
        ON public.school_info 
        FOR SELECT 
        TO authenticated
        USING (true);
    END IF;
END
$$;