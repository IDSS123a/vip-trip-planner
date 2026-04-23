import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IDSS_SCHOOL } from "@/lib/idssRegulations";

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
  schoolName: IDSS_SCHOOL.shortName,
  address: IDSS_SCHOOL.fullAddress,
  phone: IDSS_SCHOOL.phone,
  email: IDSS_SCHOOL.email,
  website: IDSS_SCHOOL.websiteUrl,
  logoUrl: "https://idss.edu.ba/wp-content/uploads/2023/09/IDSS-Logo.png",
  headmasterName: IDSS_SCHOOL.director,
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
