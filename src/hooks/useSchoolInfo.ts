import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SchoolInfo {
  id: string;
  schoolName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  headmasterName: string | null;
}

// Default school info (IDSS)
const defaultSchoolInfo: SchoolInfo = {
  id: "default",
  schoolName: "Internacionalna Demokratska Srednja Škola (IDSS)",
  address: "Dolačka 11, 71000 Sarajevo, Bosnia and Herzegovina",
  phone: "+387 33 665 900",
  email: "info@idss.edu.ba",
  website: "https://idss.edu.ba",
  logoUrl: "https://idss.edu.ba/wp-content/uploads/2023/09/IDSS-Logo.png",
  headmasterName: null,
};

export const useSchoolInfo = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(defaultSchoolInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    fetchSchoolInfo();
  }, []);

  const fetchSchoolInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("school_info")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSchoolInfo({
          id: data.id,
          schoolName: data.school_name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          logoUrl: data.logo_url,
          headmasterName: data.headmaster_name,
        });
      }
    } catch (error) {
      console.error("Error fetching school info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeSchoolData = async (url = "https://idss.edu.ba/") => {
    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-school-data", {
        body: { url },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const scraped = data.data;
        setSchoolInfo({
          id: "scraped",
          schoolName: scraped.schoolName,
          address: scraped.address,
          phone: scraped.phone,
          email: scraped.email,
          website: scraped.website,
          logoUrl: scraped.logoUrl,
          headmasterName: scraped.headmasterName,
        });
        return { success: true, data: scraped };
      }

      return { success: false, error: data?.error || "Failed to scrape" };
    } catch (error) {
      console.error("Error scraping school data:", error);
      return { success: false, error: String(error) };
    } finally {
      setIsScraping(false);
    }
  };

  return {
    schoolInfo,
    isLoading,
    isScraping,
    scrapeSchoolData,
    refetch: fetchSchoolInfo,
  };
};
