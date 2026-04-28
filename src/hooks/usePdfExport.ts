import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  createIdssPdf,
  paginate,
  ensureSpace,
  drawSectionTitle,
  drawDivider,
  writeWrapped,
  writeKeyValue,
  setFill,
  setText,
  setDraw,
  PDF_THEME,
} from "@/lib/pdfTheme";

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
      const doc = createIdssPdf();
      const ML = PDF_THEME.margin.left;
      const MR = PDF_THEME.margin.right;
      const PW = PDF_THEME.page.width;
      const contentWidth = PW - ML - MR;
      // Reserve top space for header that paginate() will draw later
      let y = PDF_THEME.margin.top + 10;

      // ── COVER TITLE ──
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(20);
      setText(doc, PDF_THEME.color.text);
      const titleLines = doc.splitTextToSize(data.tripName || "Plan Ekskurzije", contentWidth) as string[];
      titleLines.forEach((ln) => { doc.text(ln, PW / 2, y, { align: "center" }); y += 8; });
      y += 1;

      // Plan badge
      const badge = `${data.plan.type}  ·  ${data.plan.cost_per_student} EUR / učenik`;
      doc.setFontSize(10);
      doc.setFont("DejaVu", "bold");
      const bw = doc.getTextWidth(badge) + 10;
      const bx = (PW - bw) / 2;
      setFill(doc, PDF_THEME.color.primary);
      doc.roundedRect(bx, y - 4, bw, 7, 1.5, 1.5, "F");
      setText(doc, PDF_THEME.color.white);
      doc.text(badge, PW / 2, y + 1, { align: "center" });
      setText(doc, PDF_THEME.color.text);
      y += 10;

      y = drawDivider(doc, y) + 4;

      // ── TRIP DETAILS (two-column key/value layout) ──
      y = drawSectionTitle(doc, "Detalji putovanja", y);

      const detailPairs: Array<[string, string]> = [
        ["Ruta", data.plan.route],
        ["Polazište", data.departureCity],
        ["Destinacije", data.destinations.join("  →  ")],
        ["Datum polaska", data.departureDate || "—"],
        ["Datum povratka", data.returnDate || "—"],
        ["Razred", data.gradeLevel || "—"],
        ["Broj učenika", String(data.studentCount)],
        ["Trajanje", `${data.plan.days} dana`],
        ["Udaljenost", `${data.plan.distance_km} km`],
        ["Vrijeme putovanja", `${data.plan.travel_hours} h`],
        ["Pouzdanost", `${data.plan.reliability}%`],
      ];
      if (data.chaperones.length > 0) {
        detailPairs.push(["Pratitelji", data.chaperones.join(", ")]);
      }

      // Card background for details
      const cardStartY = y - 1;
      detailPairs.forEach(([k, v]) => { y = writeKeyValue(doc, k, v, y, { labelWidth: 42 }); });
      // Draw card border around what we just wrote (best-effort, single page only)
      setDraw(doc, PDF_THEME.color.rule);
      doc.setLineWidth(0.2);
      doc.roundedRect(ML - 3, cardStartY - 4, contentWidth + 6, y - cardStartY + 2, 1.5, 1.5);
      y += 6;

      // ── COSTS TABLE ──
      y = ensureSpace(doc, y, 70);
      y = drawSectionTitle(doc, "Troškovi po učeniku (EUR)", y);

      const costRows: Array<[string, number, string?]> = [
        ["Transport", data.plan.costs.transport, (data.plan.costs as any).transport_detail],
        ["Smještaj", data.plan.costs.accommodation, (data.plan.costs as any).accommodation_detail],
        ["Obroci", data.plan.costs.meals, (data.plan.costs as any).meals_detail],
        ["Ulaznice", data.plan.costs.entry_fees],
        ["Aktivnosti", data.plan.costs.activity_fees],
        ["Lokalni prijevoz", data.plan.costs.local_transport],
        ["Rezerva (5%)", data.plan.costs.contingency],
      ];

      const colItem = ML + 2;
      const colAmount = ML + 70;
      const colDetail = ML + 100;
      const tableW = contentWidth;

      // Header row
      setFill(doc, PDF_THEME.color.primary);
      doc.rect(ML, y - 4.5, tableW, 7, "F");
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(9);
      setText(doc, PDF_THEME.color.white);
      doc.text("Stavka", colItem, y);
      doc.text("Iznos (EUR)", colAmount, y);
      doc.text("Detalji", colDetail, y);
      setText(doc, PDF_THEME.color.text);
      y += 6;

      doc.setFont("DejaVu", "normal");
      costRows.forEach(([label, value, detail], i) => {
        y = ensureSpace(doc, y, 6.5);
        if (i % 2 === 0) {
          setFill(doc, PDF_THEME.color.rowAlt);
          doc.rect(ML, y - 4, tableW, 5.8, "F");
        }
        doc.setFontSize(9);
        setText(doc, PDF_THEME.color.text);
        doc.text(String(label), colItem, y);
        doc.text(String(value ?? 0), colAmount, y);
        if (detail) {
          doc.setFontSize(7.5);
          setText(doc, PDF_THEME.color.muted);
          const dl = doc.splitTextToSize(detail, tableW - (colDetail - ML) - 2) as string[];
          doc.text(dl[0] || "", colDetail, y);
          setText(doc, PDF_THEME.color.text);
        }
        y += 6;
      });

      // Total row
      y = ensureSpace(doc, y, 9);
      setFill(doc, PDF_THEME.color.primaryDark);
      doc.rect(ML, y - 4.5, tableW, 8, "F");
      doc.setFont("DejaVu", "bold");
      doc.setFontSize(10);
      setText(doc, PDF_THEME.color.white);
      doc.text("UKUPNO", colItem, y + 0.5);
      doc.text(`${data.plan.costs.total} EUR`, colAmount, y + 0.5);
      doc.text(`${data.plan.cost_per_student} EUR / učenik`, colDetail, y + 0.5);
      setText(doc, PDF_THEME.color.text);
      y += 12;

      // Group total
      const groupTotal = data.plan.cost_per_student * data.studentCount;
      doc.setFont("DejaVu", "italic");
      doc.setFontSize(9);
      setText(doc, PDF_THEME.color.muted);
      doc.text(
        `Procijenjeni ukupni iznos za ${data.studentCount} učenika: ${groupTotal.toLocaleString("hr-HR")} EUR`,
        ML,
        y
      );
      setText(doc, PDF_THEME.color.text);
      y += 8;

      // ── ACCOMMODATION ──
      if (data.plan.accommodation_info) {
        y = drawDivider(doc, y) + 2;
        y = drawSectionTitle(doc, "Smještaj", y);
        y = writeWrapped(doc, data.plan.accommodation_info, y);
        y += 4;
      }

      // ── WHY THIS FITS ──
      if (data.plan.why_this_fits) {
        y = drawDivider(doc, y) + 2;
        y = drawSectionTitle(doc, "Zašto ovaj plan odgovara", y);
        y = writeWrapped(doc, data.plan.why_this_fits, y);
        y += 4;
      }

      // ── ITINERARY ──
      y = drawDivider(doc, y) + 2;
      y = drawSectionTitle(doc, "Dnevni itinerar", y, { fontSize: 14 });

      data.plan.itinerary.forEach((day) => {
        y = ensureSpace(doc, y, 24);

        // Day header bar
        setFill(doc, PDF_THEME.color.primary);
        doc.rect(ML, y - 5, contentWidth, 8, "F");
        doc.setFont("DejaVu", "bold");
        doc.setFontSize(11);
        setText(doc, PDF_THEME.color.white);
        doc.text(`Dan ${day.day}: ${day.title}`, ML + 3, y);
        if (day.date) {
          doc.setFontSize(9);
          doc.setFont("DejaVu", "normal");
          doc.text(day.date, PW - MR - 3, y, { align: "right" });
        }
        setText(doc, PDF_THEME.color.text);
        y += 8;

        day.activities.forEach((activity) => {
          y = ensureSpace(doc, y, 11);

          // Time column
          doc.setFontSize(9);
          doc.setFont("DejaVu", "bold");
          setText(doc, PDF_THEME.color.primaryDark);
          doc.text(activity.time, ML + 2, y);
          setText(doc, PDF_THEME.color.text);

          // Description
          doc.setFont("DejaVu", "normal");
          const descX = ML + 22;
          const descW = contentWidth - 24;
          const descLines = doc.splitTextToSize(activity.description, descW) as string[];
          descLines.forEach((line, i) => {
            if (i > 0) { y += 4.2; y = ensureSpace(doc, y, 5); }
            doc.text(line, descX, y);
          });
          y += 4.4;

          if (activity.location) {
            y = ensureSpace(doc, y, 4.5);
            doc.setFontSize(8);
            doc.setFont("DejaVu", "normal");
            setText(doc, PDF_THEME.color.muted);
            const lc = doc.splitTextToSize(`Lokacija: ${activity.location}`, descW) as string[];
            doc.text(lc[0] || "", descX, y);
            setText(doc, PDF_THEME.color.text);
            y += 4;
          }

          if (activity.notes) {
            y = ensureSpace(doc, y, 4.5);
            doc.setFontSize(8);
            setText(doc, PDF_THEME.color.primaryDark);
            const nl = doc.splitTextToSize(`Napomena: ${activity.notes}`, descW) as string[];
            nl.forEach((line) => {
              y = ensureSpace(doc, y, 4);
              doc.text(line, descX, y);
              y += 4;
            });
            setText(doc, PDF_THEME.color.text);
          }

          // Subtle divider between activities
          setDraw(doc, PDF_THEME.color.rule);
          doc.setLineWidth(0.15);
          doc.line(ML + 2, y, PW - MR - 2, y);
          y += 2.5;
        });

        y += 4;
      });

      // ── PACKING LIST ──
      const packingList = (data.plan as any).packing_list;
      if (packingList && Array.isArray(packingList) && packingList.length > 0) {
        y = drawDivider(doc, y) + 2;
        y = drawSectionTitle(doc, "Lista za pakovanje", y);
        doc.setFontSize(9);
        doc.setFont("DejaVu", "normal");
        // Two-column packing list
        const half = Math.ceil(packingList.length / 2);
        const colW = contentWidth / 2;
        const startY = y;
        let ly = y;
        for (let i = 0; i < half; i++) {
          ly = ensureSpace(doc, ly, 5);
          setDraw(doc, PDF_THEME.color.text);
          doc.setLineWidth(0.3);
          doc.rect(ML, ly - 3, 3, 3);
          doc.text(String(packingList[i]), ML + 5, ly);
          ly += 5;
        }
        let ry = startY;
        for (let i = half; i < packingList.length; i++) {
          ry = ensureSpace(doc, ry, 5);
          doc.rect(ML + colW, ry - 3, 3, 3);
          doc.text(String(packingList[i]), ML + colW + 5, ry);
          ry += 5;
        }
        y = Math.max(ly, ry) + 3;
      }

      // ── RULES ──
      const rules = (data.plan as any).rules;
      if (rules && Array.isArray(rules) && rules.length > 0) {
        y = drawDivider(doc, y) + 2;
        y = drawSectionTitle(doc, "Pravila ponašanja na ekskurziji", y);
        rules.forEach((rule: string, i: number) => {
          y = writeWrapped(doc, `${i + 1}. ${rule}`, y, { fontSize: 9 });
          y += 0.5;
        });
        y += 3;
      }

      // ── EMERGENCY CONTACTS ──
      const emergency = (data.plan as any).emergency_contacts;
      if (emergency) {
        y = drawDivider(doc, y) + 2;
        y = drawSectionTitle(doc, "Hitni kontakti", y);
        doc.setFont("DejaVu", "normal");
        doc.setFontSize(9.5);
        const items: Array<[string, string]> = [
          ["Škola", emergency.school],
          ["Hitna pomoć", emergency.local_emergency || "112 (jedinstveni broj)"],
          ["Ambasada", emergency.embassy_info],
          ["Medicinske napomene", emergency.medical_info],
        ].filter(([, v]) => v) as Array<[string, string]>;
        items.forEach(([k, v]) => { y = writeKeyValue(doc, k, v, y, { labelWidth: 50 }); });
      }

      // Apply branded header + footer to every page
      paginate(doc);

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
