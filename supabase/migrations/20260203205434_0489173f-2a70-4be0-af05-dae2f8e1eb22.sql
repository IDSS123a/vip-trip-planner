-- Fix Security Issues: school_info public access, notifications INSERT, trip_versions protection

-- 1. Fix school_info: Remove public SELECT and add authenticated-only access
DROP POLICY IF EXISTS "School info is viewable by everyone" ON public.school_info;
CREATE POLICY "Authenticated users can view school info" 
ON public.school_info 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Add INSERT policy for notifications (system only - using service role or authenticated user for their own notifications)
CREATE POLICY "Users can create notifications for themselves" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Add DELETE policy for notifications (users can delete their own)
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 4. Add UPDATE and DELETE deny policies for trip_versions to protect audit trail
CREATE POLICY "Trip versions cannot be updated" 
ON public.trip_versions 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Trip versions cannot be deleted" 
ON public.trip_versions 
FOR DELETE 
TO authenticated
USING (false);