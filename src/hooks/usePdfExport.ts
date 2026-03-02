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

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 25;
const MARGIN_BOTTOM = 25;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 8;

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPdf = async (data: ExportData): Promise<void> => {
    setIsExporting(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
      let y = MARGIN_TOP;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - MARGIN_BOTTOM) {
          doc.addPage();
          y = MARGIN_TOP;
        }
      };

      const drawLine = (yPos: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT, yPos, pageWidth - MARGIN_RIGHT, yPos);
      };

      const writeWrapped = (text: string, x: number, maxWidth: number, fontSize: number, style: string = "normal"): number => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          ensureSpace(fontSize * 0.4 + 2);
          doc.text(line, x, y);
          y += fontSize * 0.4 + 1.5;
        });
        return lines.length;
      };

      // ── HEADER ──
      doc.setFillColor(230, 126, 34);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("IDSS Field Trip Planner", pageWidth / 2, 12, { align: "center" });

      y = 28;
      doc.setTextColor(0, 0, 0);

      // Trip name
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(data.tripName || "Plan Putovanja", pageWidth / 2, y, { align: "center" });
      y += 10;

      // Plan type badge line
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(230, 126, 34);
      doc.text(`${data.plan.type} Plan`, MARGIN_LEFT, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(` — ${data.plan.cost_per_student} EUR / učenik`, MARGIN_LEFT + doc.getTextWidth(`${data.plan.type} Plan`), y);
      y += 7;

      drawLine(y);
      y += SECTION_GAP;

      // ── TRIP DETAILS ──
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalji Putovanja", MARGIN_LEFT, y);
      y += 7;

      const detailPairs = [
        ["Ruta", data.plan.route],
        ["Polazište", data.departureCity],
        ["Destinacije", data.destinations.join(" → ")],
        ["Datumi", `${data.departureDate || "TBD"} — ${data.returnDate || "TBD"}`],
        ["Razred", data.gradeLevel || "TBD"],
        ["Broj učenika", String(data.studentCount)],
        ["Trajanje", `${data.plan.days} dana`],
        ["Udaljenost", `${data.plan.distance_km} km`],
        ["Putovanje", `${data.plan.travel_hours} h`],
        ["Pouzdanost", `${data.plan.reliability}%`],
      ];

      if (data.chaperones.length > 0) {
        detailPairs.push(["Pratitelji", data.chaperones.join(", ")]);
      }

      doc.setFontSize(9.5);
      detailPairs.forEach(([label, value]) => {
        ensureSpace(LINE_HEIGHT + 2);
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, MARGIN_LEFT, y);
        doc.setFont("helvetica", "normal");
        const labelWidth = doc.getTextWidth(`${label}: `);
        const valLines = doc.splitTextToSize(value, contentWidth - labelWidth - 5);
        valLines.forEach((line: string, i: number) => {
          if (i === 0) {
            doc.text(line, MARGIN_LEFT + labelWidth, y);
          } else {
            y += LINE_HEIGHT;
            ensureSpace(LINE_HEIGHT);
            doc.text(line, MARGIN_LEFT + labelWidth, y);
          }
        });
        y += LINE_HEIGHT;
      });

      y += SECTION_GAP;
      drawLine(y);
      y += SECTION_GAP;

      // ── COSTS TABLE ──
      ensureSpace(60);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Troškovi po učeniku (EUR)", MARGIN_LEFT, y);
      y += 8;

      const costRows = [
        ["Transport", data.plan.costs.transport],
        ["Smještaj", data.plan.costs.accommodation],
        ["Obroci", data.plan.costs.meals],
        ["Ulaznice", data.plan.costs.entry_fees],
        ["Aktivnosti", data.plan.costs.activity_fees],
        ["Lokalni prijevoz", data.plan.costs.local_transport],
        ["Rezerva (5%)", data.plan.costs.contingency],
      ] as const;

      const colLabelWidth = 70;
      const colValueX = MARGIN_LEFT + colLabelWidth;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(MARGIN_LEFT, y - 4, contentWidth, 7, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Stavka", MARGIN_LEFT + 2, y);
      doc.text("Iznos (EUR)", colValueX, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      costRows.forEach(([label, value], i) => {
        ensureSpace(7);
        if (i % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(MARGIN_LEFT, y - 4, contentWidth, 6, "F");
        }
        doc.text(String(label), MARGIN_LEFT + 2, y);
        doc.text(String(value), colValueX, y);
        y += 6;
      });

      // Total row
      ensureSpace(10);
      doc.setFillColor(230, 126, 34);
      doc.rect(MARGIN_LEFT, y - 4, contentWidth, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("UKUPNO", MARGIN_LEFT + 2, y);
      doc.text(`${data.plan.costs.total} EUR`, colValueX, y);
      doc.setTextColor(0, 0, 0);
      y += 12;

      // ── ACCOMMODATION ──
      if (data.plan.accommodation_info) {
        ensureSpace(20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Smještaj", MARGIN_LEFT, y);
        y += 6;
        writeWrapped(data.plan.accommodation_info, MARGIN_LEFT, contentWidth, 9.5);
        y += SECTION_GAP;
      }

      // ── WHY THIS FITS ──
      if (data.plan.why_this_fits) {
        drawLine(y);
        y += SECTION_GAP;
        ensureSpace(20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Zašto ovaj plan", MARGIN_LEFT, y);
        y += 6;
        writeWrapped(data.plan.why_this_fits, MARGIN_LEFT, contentWidth, 9.5);
        y += SECTION_GAP;
      }

      // ── ITINERARY ──
      drawLine(y);
      y += SECTION_GAP;
      ensureSpace(15);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Dnevni Itinerar", MARGIN_LEFT, y);
      y += 10;

      data.plan.itinerary.forEach((day) => {
        ensureSpace(25);

        // Day header with colored bar
        doc.setFillColor(230, 126, 34);
        doc.rect(MARGIN_LEFT, y - 4.5, contentWidth, 8, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(`Dan ${day.day}: ${day.title}`, MARGIN_LEFT + 3, y);
        doc.setTextColor(0, 0, 0);
        y += 8;

        if (day.date) {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "italic");
          doc.text(day.date, MARGIN_LEFT + 3, y);
          y += 5;
        }

        day.activities.forEach((activity) => {
          ensureSpace(14);

          // Time column
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.text(activity.time, MARGIN_LEFT + 3, y);

          // Description
          doc.setFont("helvetica", "normal");
          const descLines = doc.splitTextToSize(activity.description, contentWidth - 35);
          descLines.forEach((line: string, i: number) => {
            if (i > 0) {
              y += 4;
              ensureSpace(6);
            }
            doc.text(line, MARGIN_LEFT + 28, y);
          });
          y += 4;

          if (activity.location) {
            ensureSpace(5);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text(`Lokacija: ${activity.location}`, MARGIN_LEFT + 28, y);
            doc.setTextColor(0, 0, 0);
            y += 4;
          }

          if (activity.notes) {
            ensureSpace(5);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(200, 100, 0);
            const noteLines = doc.splitTextToSize(`Napomena: ${activity.notes}`, contentWidth - 35);
            noteLines.forEach((line: string) => {
              doc.text(line, MARGIN_LEFT + 28, y);
              y += 4;
            });
            doc.setTextColor(0, 0, 0);
          }

          y += 1;
        });

        y += 4;
      });

      // ── FOOTER on all pages ──
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT, pageHeight - 15, pageWidth - MARGIN_RIGHT, pageHeight - 15);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(130, 130, 130);
        doc.text(
          `IDSS Field Trip Planner — Stranica ${i} od ${pageCount}`,
          MARGIN_LEFT,
          pageHeight - 10
        );
        doc.text(
          `Generirano: ${new Date().toLocaleString("hr-HR")}`,
          pageWidth - MARGIN_RIGHT,
          pageHeight - 10,
          { align: "right" }
        );
        doc.setTextColor(0, 0, 0);
      }

      // Save
      const fileName = `${(data.tripName || "trip-plan").replace(/\s+/g, "-")}-${data.plan.type.toLowerCase()}.pdf`;
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
