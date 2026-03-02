import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TripData {
  name: string;
  departureCity: string;
  destinations: string[];
  departureDate?: string;
  returnDate?: string;
  gradeLevel?: string;
  studentCount: number;
  chaperones: string[];
  transport: string;
  educationalFocus?: string;
  specialNeeds?: string;
  plansData: any;
  selectedPlanId?: number;
  isPublic?: boolean;
}

interface SavedTrip extends TripData {
  id: string;
  shareId: string;
  createdAt: string;
  updatedAt: string;
}

export const useTripStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveTrip = async (tripData: TripData): Promise<SavedTrip | null> => {
    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      const { data, error } = await (supabase
        .from("trips" as any)
        .insert({
          user_id: userId,
          name: tripData.name || `Trip ${new Date().toLocaleDateString()}`,
          departure_city: tripData.departureCity,
          destinations: tripData.destinations,
          departure_date: tripData.departureDate,
          return_date: tripData.returnDate,
          grade_level: tripData.gradeLevel,
          student_count: tripData.studentCount,
          chaperones: tripData.chaperones,
          transport: tripData.transport,
          educational_focus: tripData.educationalFocus,
          special_needs: tripData.specialNeeds,
          plans_data: tripData.plansData,
          selected_plan_id: tripData.selectedPlanId || 1,
          is_public: tripData.isPublic || false,
        })
        .select()
        .single() as any);

      if (error) throw error;

      toast({
        title: "Plan spremljen!",
        description: "Vaš plan putovanja je uspješno spremljen.",
      });

      return {
        id: data.id,
        shareId: data.share_id,
        name: data.name,
        departureCity: data.departure_city,
        destinations: data.destinations,
        departureDate: data.departure_date,
        returnDate: data.return_date,
        gradeLevel: data.grade_level,
        studentCount: data.student_count,
        chaperones: data.chaperones,
        transport: data.transport,
        educationalFocus: data.educational_focus,
        specialNeeds: data.special_needs,
        plansData: data.plans_data,
        selectedPlanId: data.selected_plan_id,
        isPublic: data.is_public,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće spremiti plan putovanja.",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTrip = async (tripId: string, updates: Partial<TripData>): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.departureCity) updateData.departure_city = updates.departureCity;
      if (updates.destinations) updateData.destinations = updates.destinations;
      if (updates.departureDate) updateData.departure_date = updates.departureDate;
      if (updates.returnDate) updateData.return_date = updates.returnDate;
      if (updates.gradeLevel) updateData.grade_level = updates.gradeLevel;
      if (updates.studentCount) updateData.student_count = updates.studentCount;
      if (updates.chaperones) updateData.chaperones = updates.chaperones;
      if (updates.transport) updateData.transport = updates.transport;
      if (updates.educationalFocus) updateData.educational_focus = updates.educationalFocus;
      if (updates.specialNeeds) updateData.special_needs = updates.specialNeeds;
      if (updates.plansData) updateData.plans_data = updates.plansData;
      if (updates.selectedPlanId) updateData.selected_plan_id = updates.selectedPlanId;
      if (typeof updates.isPublic === "boolean") updateData.is_public = updates.isPublic;

      const { error } = await (supabase
        .from("trips" as any)
        .update(updateData)
        .eq("id", tripId) as any);

      if (error) throw error;

      toast({
        title: "Plan ažuriran!",
        description: "Promjene su uspješno spremljene.",
      });

      return true;
    } catch (error) {
      console.error("Error updating trip:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće ažurirati plan putovanja.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const loadTripByShareId = async (shareId: string): Promise<SavedTrip | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from("trips" as any)
        .select("*")
        .eq("share_id", shareId)
        .maybeSingle() as any);

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        shareId: data.share_id,
        name: data.name,
        departureCity: data.departure_city,
        destinations: data.destinations,
        departureDate: data.departure_date,
        returnDate: data.return_date,
        gradeLevel: data.grade_level,
        studentCount: data.student_count,
        chaperones: data.chaperones || [],
        transport: data.transport,
        educationalFocus: data.educational_focus,
        specialNeeds: data.special_needs,
        plansData: data.plans_data,
        selectedPlanId: data.selected_plan_id,
        isPublic: data.is_public,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Error loading trip:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const makePublic = async (tripId: string): Promise<string | null> => {
    try {
      const { data, error } = await (supabase
        .from("trips" as any)
        .update({ is_public: true })
        .eq("id", tripId)
        .select("share_id")
        .single() as any);

      if (error) throw error;

      return data.share_id;
    } catch (error) {
      console.error("Error making trip public:", error);
      return null;
    }
  };

  const getShareUrl = (shareId: string): string => {
    return `${window.location.origin}/trip/${shareId}`;
  };

  return {
    saveTrip,
    updateTrip,
    loadTripByShareId,
    makePublic,
    getShareUrl,
    isSaving,
    isLoading,
  };
};
