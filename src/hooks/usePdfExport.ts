import { useState } from "react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface TripPlan {
  id: number;
  type: string;
  route: string;
  reliability: number;
  days: number;
  distance_km: number;
  travel_hours: number;
  cost_per_student: number;
  costs: {
    transport: number;
    accommodation: number;
    meals: number;
    entry_fees: number;
    activity_fees: number;
    local_transport: number;
    contingency: number;
    total: number;
  };
  why_this_fits: string;
  accommodation_info: string;
  itinerary: Array<{
    day: number;
    date?: string;
    title: string;
    activities: Array<{
      time: string;
      description: string;
      type: string;
      location: string;
      notes?: string;
    }>;
  }>;
}

interface ExportData {
  tripName: string;
  departureCity: string;
  destinations: string[];
  departureDate?: string;
  returnDate?: string;
  gradeLevel?: string;
  studentCount: number;
  chaperones: string[];
  plan: TripPlan;
}

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPdf = async (data: ExportData): Promise<void> => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Helper function for new page
      const checkNewPage = (height: number = 20) => {
        if (yPos + height > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("IDSS Field Trip Planner", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(data.tripName || "Plan Putovanja", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Plan type badge
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${data.plan.type} Plan - ${data.plan.cost_per_student} EUR/učenik`, margin, yPos);
      yPos += 10;

      // Route
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Ruta: ${data.plan.route}`, margin, yPos);
      yPos += 8;

      // Key info
      doc.text(`Trajanje: ${data.plan.days} dana | Udaljenost: ${data.plan.distance_km} km | Putovanje: ${data.plan.travel_hours}h`, margin, yPos);
      yPos += 8;

      doc.text(`Pouzdanost: ${data.plan.reliability}%`, margin, yPos);
      yPos += 15;

      // Trip details
      doc.setFont("helvetica", "bold");
      doc.text("Detalji Putovanja:", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Polazište: ${data.departureCity}`, margin, yPos);
      yPos += 5;
      doc.text(`Datumi: ${data.departureDate || "TBD"} - ${data.returnDate || "TBD"}`, margin, yPos);
      yPos += 5;
      doc.text(`Razred: ${data.gradeLevel || "TBD"} | Broj učenika: ${data.studentCount}`, margin, yPos);
      yPos += 5;
      
      if (data.chaperones && data.chaperones.length > 0) {
        doc.text(`Pratitelji: ${data.chaperones.join(", ")}`, margin, yPos);
        yPos += 5;
      }
      yPos += 10;

      // Cost breakdown
      checkNewPage(60);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Troškovi po učeniku:", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const costs = [
        { label: "Transport", value: data.plan.costs.transport },
        { label: "Smještaj", value: data.plan.costs.accommodation },
        { label: "Obroci", value: data.plan.costs.meals },
        { label: "Ulaznice", value: data.plan.costs.entry_fees },
        { label: "Aktivnosti", value: data.plan.costs.activity_fees },
        { label: "Lokalni prijevoz", value: data.plan.costs.local_transport },
        { label: "Rezerva (5%)", value: data.plan.costs.contingency },
      ];

      costs.forEach((cost) => {
        doc.text(`${cost.label}: ${cost.value} EUR`, margin, yPos);
        yPos += 5;
      });

      doc.setFont("helvetica", "bold");
      doc.text(`UKUPNO: ${data.plan.costs.total} EUR`, margin, yPos);
      yPos += 15;

      // Accommodation info
      checkNewPage(20);
      doc.setFontSize(11);
      doc.text("Smještaj:", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(data.plan.accommodation_info || "TBD", margin, yPos);
      yPos += 10;

      // Why this fits
      if (data.plan.why_this_fits) {
        checkNewPage(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Zašto ovaj plan:", margin, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const splitWhy = doc.splitTextToSize(data.plan.why_this_fits, pageWidth - 2 * margin);
        doc.text(splitWhy, margin, yPos);
        yPos += splitWhy.length * 5 + 10;
      }

      // Itinerary
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Dnevni Itinerar:", margin, yPos);
      yPos += 10;

      data.plan.itinerary.forEach((day) => {
        checkNewPage(40);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Dan ${day.day}: ${day.title}`, margin, yPos);
        yPos += 7;

        if (day.date) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(day.date, margin, yPos);
          yPos += 5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        day.activities.forEach((activity) => {
          checkNewPage(15);
          
          const activityText = `${activity.time} - ${activity.description}`;
          const splitActivity = doc.splitTextToSize(activityText, pageWidth - 2 * margin - 10);
          doc.text(splitActivity, margin + 5, yPos);
          yPos += splitActivity.length * 4;

          if (activity.location) {
            doc.setFont("helvetica", "italic");
            doc.text(`📍 ${activity.location}`, margin + 10, yPos);
            yPos += 4;
            doc.setFont("helvetica", "normal");
          }

          if (activity.notes) {
            doc.setTextColor(200, 100, 0);
            const splitNotes = doc.splitTextToSize(`⚠️ ${activity.notes}`, pageWidth - 2 * margin - 15);
            doc.text(splitNotes, margin + 10, yPos);
            yPos += splitNotes.length * 4;
            doc.setTextColor(0, 0, 0);
          }

          yPos += 2;
        });

        yPos += 5;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `IDSS Field Trip Planner - Stranica ${i} od ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          `Generirano: ${new Date().toLocaleString("hr-HR")}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `${data.tripName || "trip-plan"}-${data.plan.type.toLowerCase()}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Exportiran!",
        description: `${fileName} je uspješno preuzet.`,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće exportirati PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPdf,
    isExporting,
  };
};
