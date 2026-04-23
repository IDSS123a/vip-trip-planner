import { useState } from "react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { IDSS_SCHOOL, IDSS_PAYMENT_RULES, IDSS_DAILY_SCHEDULE } from "@/lib/idssRegulations";

export interface Student {
  id?: string;
  name: string;
  gender?: "M" | "F";
  parentName?: string;
  parentPhone?: string;
  medicalNotes?: string;
}

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
    activity_fees?: number;
    local_transport?: number;
    insurance?: number;
    contingency: number;
    total: number;
  };
  why_this_fits: string;
  accommodation_info: string;
  meeting_point?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    time: string;
  };
  itinerary: Array<{
    day: number;
    date?: string;
    title: string;
    summary?: string;
    activities: Array<{
      time: string;
      description: string;
      type: string;
      location: string;
      notes?: string;
    }>;
  }>;
  packing_list?: string[];
  rules?: string[];
}

interface TripDocumentData {
  tripName: string;
  departureCity: string;
  destinations: string[];
  departureDate?: string;
  returnDate?: string;
  gradeLevel?: string;
  studentCount: number;
  chaperones: string[];
  plan: TripPlan;
  students?: Student[];
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
}

export const useTripDocuments = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const schoolInfo = {
    name: IDSS_SCHOOL.shortName,
    legalName: IDSS_SCHOOL.legalName,
    address: IDSS_SCHOOL.fullAddress,
    phone: IDSS_SCHOOL.phone,
    mobile: IDSS_SCHOOL.mobile,
    email: IDSS_SCHOOL.email,
    website: IDSS_SCHOOL.website,
    director: IDSS_SCHOOL.director,
    bank: IDSS_SCHOOL.bank,
    registration: IDSS_SCHOOL.registration,
  };

  // Helper to add page footer
  const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    const line1 = schoolInfo.address + " | tel " + schoolInfo.phone + " - mob " + schoolInfo.mobile;
    const line2 = schoolInfo.bank.name + " - " + schoolInfo.bank.account + " | IBAN: " + schoolInfo.bank.iban + " | SWIFT (BIC): " + schoolInfo.bank.swift;
    const line3 = "ID broj: " + schoolInfo.registration.idNumber + " | REG broj: " + schoolInfo.registration.regNumber;
    const line4 = schoolInfo.website + " | " + schoolInfo.email + "   ·   Stranica " + pageNum + " od " + totalPages;
    doc.text(line1, pageWidth / 2, pageHeight - 18, { align: "center" });
    doc.text(line2, pageWidth / 2, pageHeight - 14, { align: "center" });
    doc.text(line3, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(line4, pageWidth / 2, pageHeight - 6, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  // Helper for new page check
  const checkNewPage = (doc: jsPDF, yPos: number, margin: number, height: number = 25): number => {
    if (yPos + height > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      return margin;
    }
    return yPos;
  };

  // Generate Parent Permission Form (Saglasnost roditelja) — TAČNO prema Prilogu 1 Pravilnika
  const generateParentPermission = async (data: TripDocumentData): Promise<void> => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // === HEADER ===
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(schoolInfo.legalName, pageWidth / 2, yPos, { align: "center" });
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(schoolInfo.address + " · tel " + schoolInfo.phone + " · " + schoolInfo.email, pageWidth / 2, yPos, { align: "center" });
      yPos += 12;

      // === TITLE (bilingual) ===
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("FORMULAR SAGLASNOSTI RODITELJA", pageWidth / 2, yPos, { align: "center" });
      yPos += 6;
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text("Parental Consent Form", pageWidth / 2, yPos, { align: "center" });
      yPos += 12;

      // === STUDENT INFO / Student Information ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Podaci o učeniku / Student Information", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Ime i prezime učenika / Student\u2019s full name:", margin, yPos);
      yPos += 5;
      doc.text("__________________________________________________________________________", margin, yPos);
      yPos += 7;

      doc.text("Razred / Grade: " + (data.gradeLevel || "_____________") + "      Datum rođenja / Date of birth: ____________________", margin, yPos);
      yPos += 9;

      // === EXCURSION INFO / Excursion Information ===
      doc.setFont("helvetica", "bold");
      doc.text("Informacije o ekskurziji / Excursion Information", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.text("Naziv ekskurzije / Excursion title:  " + (data.tripName || data.plan.route), margin, yPos);
      yPos += 6;
      const dest = data.destinations.join(", ") || "_______________";
      doc.text("Destinacija / Destination:  " + dest, margin, yPos);
      yPos += 6;
      const dateRange = (data.departureDate || "____") + "  →  " + (data.returnDate || "____");
      doc.text("Datum održavanja / Date:  " + dateRange, margin, yPos);
      yPos += 6;
      doc.text("Cijena / Price:  " + data.plan.cost_per_student + " EUR  (jednokratno / one-time payment)", margin, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Organizator / Organizer:  " + schoolInfo.legalName, margin, yPos);
      yPos += 9;

      // === PARENT/GUARDIAN STATEMENT ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Izjava roditelja / Parent/Guardian Statement", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const stmtBs = "Ja, _____________________________________ (ime i prezime roditelja/staratelja), kao roditelj/staratelj gore navedenog učenika, dajem svoju punu saglasnost da moje dijete učestvuje na ekskurziji koju organizuje " + schoolInfo.name + ".";
      const stmtEn = "I, _____________________________________ (parent/guardian\u2019s full name), as the parent/guardian of the above-named student, give my full consent for my child to participate in the excursion organized by " + schoolInfo.name + ".";
      const wrapBs = doc.splitTextToSize(stmtBs, pageWidth - 2 * margin);
      doc.text(wrapBs, margin, yPos);
      yPos += wrapBs.length * 4.5 + 2;
      doc.setFont("helvetica", "italic");
      const wrapEn = doc.splitTextToSize(stmtEn, pageWidth - 2 * margin);
      doc.text(wrapEn, margin, yPos);
      yPos += wrapEn.length * 4.5 + 7;

      // === CONFIRMATION CHECKLIST ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Potvrđujem da sam upoznat/a sa / I confirm that I am aware of:", margin, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const items = [
        ["planom i programom ekskurzije", "the excursion plan and program"],
        ["svim pravilima ponašanja i sigurnosnim mjerama", "all behavior rules and safety measures"],
        ["obavezom jednokratnog i kompletnog plaćanja troškova ekskurzije", "the obligation of full one-time payment of the excursion costs"],
        ["zabrani plaćanja u ratama", "the prohibition of installment payments"],
        ["poštivanjem uputa nastavnika i osoblja", "compliance with instructions from teachers and staff"],
        ["procedurama u slučaju zdravstvenih problema ili nezgoda", "procedures in case of health issues or accidents"],
        ["obavezom mog djeteta da poštuje propisana pravila tokom ekskurzije", "my child\u2019s obligation to follow all rules during the excursion"],
        ["obavezom škole da me obavijesti u slučaju incidenta ili potrebe", "the school\u2019s obligation to inform me in case of an incident or need"],
      ];
      for (const [bs, en] of items) {
        doc.rect(margin, yPos - 3, 3, 3);
        const line = "  " + bs + " / " + en;
        const wrapped = doc.splitTextToSize(line, pageWidth - 2 * margin - 6);
        doc.text(wrapped, margin + 5, yPos);
        yPos += wrapped.length * 4 + 2;
      }

      // === FOOTER ON PAGE 1 ===
      addFooter(doc, 1, 2);

      // === PAGE 2 — HEALTH INFO + RESPONSIBILITY + SIGNATURE ===
      doc.addPage();
      yPos = margin;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(schoolInfo.legalName, pageWidth / 2, yPos, { align: "center" });
      yPos += 12;

      doc.setFontSize(13);
      doc.text("Podaci o zdravstvenom stanju učenika", margin, yPos);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Student Health Information", margin, yPos + 5);
      yPos += 13;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      // 1. Allergies
      doc.text("1. Ima li dijete alergije? / Does the child have allergies?", margin, yPos);
      yPos += 6;
      doc.rect(margin + 4, yPos - 3, 3, 3);
      doc.text("Da / Yes (navesti / specify): ____________________________________________", margin + 10, yPos);
      yPos += 6;
      doc.rect(margin + 4, yPos - 3, 3, 3);
      doc.text("Ne / No", margin + 10, yPos);
      yPos += 9;

      // 2. Medication
      doc.text("2. Koristi li dijete redovne lijekove? / Does the child take regular medication?", margin, yPos);
      yPos += 6;
      doc.rect(margin + 4, yPos - 3, 3, 3);
      doc.text("Da / Yes (navesti / specify): ____________________________________________", margin + 10, yPos);
      yPos += 6;
      doc.rect(margin + 4, yPos - 3, 3, 3);
      doc.text("Ne / No", margin + 10, yPos);
      yPos += 9;

      // 3. Special needs
      doc.text("3. Posebne zdravstvene potrebe / Special health considerations:", margin, yPos);
      yPos += 6;
      doc.text("__________________________________________________________________________", margin, yPos);
      yPos += 6;
      doc.text("__________________________________________________________________________", margin, yPos);
      yPos += 9;

      // 4. Emergency contact
      doc.text("4. Kontakt telefon roditelja/staratelja u hitnim slučajevima:", margin, yPos);
      yPos += 5;
      doc.setFont("helvetica", "italic");
      doc.text("    Emergency contact phone number:", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text("__________________________________________________________________________", margin, yPos);
      yPos += 12;

      // === RESPONSIBILITY ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Odgovornost / Responsibility", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const respItems = [
        ["Slažem se da će moje dijete poštovati upute nastavnog osoblja.", "I agree that my child will follow the instructions of the school staff."],
        ["Prihvatam da škola nije odgovorna za lične stvari učenika.", "I accept that the school is not responsible for the student\u2019s personal belongings."],
        ["Slažem se sa pravilima škole i Uputstvom o organizaciji ekskurzija.", "I agree with the school rules and the Excursion Organization Guidelines."],
        ["Razumijem da u slučaju kršenja pravila moje dijete može biti udaljeno s ekskurzije bez povrata novca.", "I understand that if rules are violated, my child may be removed from the excursion without a refund."],
      ];
      for (const [bs, en] of respItems) {
        doc.setFont("helvetica", "normal");
        const wBs = doc.splitTextToSize("• " + bs, pageWidth - 2 * margin);
        doc.text(wBs, margin, yPos);
        yPos += wBs.length * 4 + 1;
        doc.setFont("helvetica", "italic");
        const wEn = doc.splitTextToSize("  " + en, pageWidth - 2 * margin);
        doc.text(wEn, margin, yPos);
        yPos += wEn.length * 4 + 3;
      }

      yPos += 4;
      // === SIGNATURE ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Mjesto i datum / Place and date:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text("_______________________________________", margin + 65, yPos);
      yPos += 12;

      doc.setFont("helvetica", "bold");
      doc.text("Potpis roditelja/staratelja / Parent/Guardian signature:", margin, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 10;
      doc.text("_______________________________________", margin, yPos);
      yPos += 10;

      // === INTERNAL USE ===
      doc.setDrawColor(180, 180, 180);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Za internu upotrebu škole / For school internal use", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Primio/la / Received by: __________________________   Datum / Date: ______________", margin, yPos);
      yPos += 6;
      doc.text("Napomene / Notes: ________________________________________________________", margin, yPos);

      addFooter(doc, 2, 2);

      const fileName = "Saglasnost-roditelja-" + (data.tripName || "ekskurzija").replace(/\s+/g, "-") + ".pdf";
      doc.save(fileName);

      toast({
        title: "Saglasnost generirana!",
        description: fileName + " je uspješno preuzet.",
      });
    } catch (error) {
      console.error("Error generating parent permission:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije moguće generirati dokument.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Student List
  const generateStudentList = async (data: TripDocumentData): Promise<void> => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      const hasStudentData = data.students && data.students.length > 0;

      // Header
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(schoolInfo.name, pageWidth / 2, yPos, { align: "center" });
      yPos += 12;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("LISTA UCENIKA - SKOLSKA EKSKURZIJA", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Trip Info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Destinacija: " + data.destinations.join(", "), margin, yPos);
      yPos += 5;
      doc.text("Datum: " + (data.departureDate || "___") + " - " + (data.returnDate || "___"), margin, yPos);
      doc.text("Razred: " + (data.gradeLevel || "___"), pageWidth / 2, yPos);
      yPos += 5;
      doc.text("Pratitelji: " + (data.chaperones.length > 0 ? data.chaperones.join(", ") : "___"), margin, yPos);
      yPos += 10;

      // Table Header
      const colWidths = hasStudentData ? [10, 50, 12, 40, 35, 33] : [10, 55, 40, 45, 30];
      const headers = hasStudentData 
        ? ["Br.", "Ime i prezime", "Spol", "Roditelj", "Telefon", "Napomene"]
        : ["Br.", "Ime i prezime ucenika", "Kontakt roditelja", "Napomene", "Potpis"];
      
      doc.setFillColor(200, 100, 50);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      
      let xPos = margin + 2;
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // Table Rows
      doc.setFont("helvetica", "normal");
      const rowHeight = 10;
      const totalRows = hasStudentData ? data.students!.length : (data.studentCount || 25);
      
      for (let i = 0; i < totalRows; i++) {
        yPos = checkNewPage(doc, yPos, margin, rowHeight + 5);
        
        // Row background alternating
        if (i % 2 === 1) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, "F");
        }
        
        // Row border
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight);
        
        // Column separators
        xPos = margin;
        colWidths.forEach((width) => {
          doc.line(xPos, yPos, xPos, yPos + rowHeight);
          xPos += width;
        });
        
        // Row content
        doc.setFontSize(8);
        xPos = margin + 2;
        
        // Row number
        doc.text(String(i + 1) + ".", xPos, yPos + 6);
        xPos += colWidths[0];
        
        if (hasStudentData && data.students![i]) {
          const student = data.students![i];
          // Name
          doc.setFont("helvetica", "bold");
          doc.text(student.name.substring(0, 25), xPos, yPos + 6);
          doc.setFont("helvetica", "normal");
          xPos += colWidths[1];
          // Gender
          doc.text(student.gender === "F" ? "Z" : "M", xPos + 3, yPos + 6);
          xPos += colWidths[2];
          // Parent name
          doc.text((student.parentName || "").substring(0, 20), xPos, yPos + 6);
          xPos += colWidths[3];
          // Phone
          doc.text((student.parentPhone || "").substring(0, 15), xPos, yPos + 6);
          xPos += colWidths[4];
          // Notes
          if (student.medicalNotes) {
            doc.setTextColor(200, 100, 50);
            doc.text(student.medicalNotes.substring(0, 18), xPos, yPos + 6);
            doc.setTextColor(0, 0, 0);
          }
        }
        
        yPos += rowHeight;
      }

      // Summary section
      yPos += 10;
      yPos = checkNewPage(doc, yPos, margin, 40);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SUMARNI PODACI:", margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      if (hasStudentData) {
        const maleCount = data.students!.filter(s => s.gender === "M").length;
        const femaleCount = data.students!.filter(s => s.gender === "F").length;
        const specialNeeds = data.students!.filter(s => s.medicalNotes).length;
        
        doc.text("Ukupan broj ucenika: " + data.students!.length, margin, yPos);
        doc.text("Broj djevojcica: " + femaleCount, pageWidth / 2, yPos);
        yPos += 6;
        doc.text("Broj djecaka: " + maleCount, margin, yPos);
        doc.text("Ucenici sa posebnim potrebama: " + specialNeeds, pageWidth / 2, yPos);
      } else {
        doc.text("Ukupan broj ucenika: ___________", margin, yPos);
        doc.text("Broj djevojcica: ___________", pageWidth / 2, yPos);
        yPos += 6;
        doc.text("Broj djecaka: ___________", margin, yPos);
        doc.text("Ucenici sa posebnim potrebama: ___________", pageWidth / 2, yPos);
      }
      yPos += 12;

      // Verification section
      doc.setFont("helvetica", "bold");
      doc.text("VERIFIKACIJA LISTE:", margin, yPos);
      yPos += 8;

      doc.setFont("helvetica", "normal");
      doc.text("Listu pripremio/la: _________________________  Potpis: _________________________", margin, yPos);
      yPos += 8;
      doc.text("Datum: _______________", margin, yPos);
      yPos += 15;

      doc.text("Direktor/ica skole: _________________________  Potpis: _________________________", margin, yPos);
      yPos += 8;
      doc.text("Pecat skole:", margin, yPos);

      // Add footers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(doc, i, pageCount);
      }

      const fileName = "Lista-ucenika-" + (data.tripName || "ekskurzija").replace(/\s+/g, "-") + ".pdf";
      doc.save(fileName);

      toast({
        title: "Lista ucenika generirana!",
        description: fileName + " je uspjesno preuzet.",
      });
    } catch (error) {
      console.error("Error generating student list:", error);
      toast({
        variant: "destructive",
        title: "Greska",
        description: "Nije moguce generirati listu.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Full Trip Documentation Package
  const generateFullDocumentation = async (data: TripDocumentData): Promise<void> => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // ===== PAGE 1: COVER PAGE =====
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(schoolInfo.name, pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(schoolInfo.address, pageWidth / 2, yPos, { align: "center" });
      yPos += 40;

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("DOKUMENTACIJA", pageWidth / 2, yPos, { align: "center" });
      yPos += 12;
      doc.setFontSize(20);
      doc.text("SKOLSKE EKSKURZIJE", pageWidth / 2, yPos, { align: "center" });
      yPos += 25;

      // Trip name box
      doc.setDrawColor(200, 100, 50);
      doc.setLineWidth(2);
      doc.rect(margin + 10, yPos, pageWidth - 2 * margin - 20, 25);
      doc.setFontSize(16);
      doc.text(data.tripName || data.plan.route, pageWidth / 2, yPos + 16, { align: "center" });
      yPos += 40;

      // Trip details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Destinacija: " + data.destinations.join(", "), pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      doc.text("Period: " + (data.departureDate || "___") + " - " + (data.returnDate || "___"), pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      doc.text("Razred: " + (data.gradeLevel || "___") + " | Broj ucenika: " + data.studentCount, pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      doc.text("Tip plana: " + data.plan.type + " (" + data.plan.cost_per_student + " EUR po uceniku)", pageWidth / 2, yPos, { align: "center" });
      yPos += 30;

      // Table of contents
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SADRZAJ DOKUMENTACIJE:", margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const contents = [
        "1. Osnovne informacije o ekskurziji",
        "2. Detaljan plan putovanja (itinerar)",
        "3. Finansijski pregled",
        "4. Pravila ponasanja",
        "5. Lista potrebnih stvari",
        "6. Kontakt informacije"
      ];
      contents.forEach((item) => {
        doc.text(item, margin + 10, yPos);
        yPos += 7;
      });

      // ===== PAGE 2: TRIP DETAILS =====
      doc.addPage();
      yPos = margin;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("1. OSNOVNE INFORMACIJE O EKSKURZIJI", margin, yPos);
      yPos += 12;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const infoItems = [
        ["Naziv ekskurzije:", data.tripName || data.plan.route],
        ["Polaziste:", data.departureCity],
        ["Destinacije:", data.destinations.join(", ")],
        ["Datum polaska:", data.departureDate || "___"],
        ["Datum povratka:", data.returnDate || "___"],
        ["Trajanje:", data.plan.days + " dana"],
        ["Ukupna udaljenost:", data.plan.distance_km + " km"],
        ["Vrijeme putovanja:", data.plan.travel_hours + " sati"],
        ["Razred:", data.gradeLevel || "___"],
        ["Broj ucenika:", String(data.studentCount)],
        ["Pratitelji:", data.chaperones.length > 0 ? data.chaperones.join(", ") : "___"],
        ["Smjestaj:", data.plan.accommodation_info || "___"],
        ["Cijena po uceniku:", data.plan.cost_per_student + " EUR"]
      ];

      infoItems.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 50, yPos);
        yPos += 7;
      });

      // Meeting point if available
      if (data.plan.meeting_point) {
        yPos += 10;
        doc.setFont("helvetica", "bold");
        doc.text("MJESTO OKUPLJANJA:", margin, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.text("Lokacija: " + data.plan.meeting_point.name, margin, yPos);
        yPos += 5;
        doc.text("Adresa: " + data.plan.meeting_point.address, margin, yPos);
        yPos += 5;
        doc.text("Vrijeme: " + data.plan.meeting_point.time, margin, yPos);
      }

      // ===== PAGE 3+: ITINERARY =====
      doc.addPage();
      yPos = margin;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("2. DETALJAN PLAN PUTOVANJA (ITINERAR)", margin, yPos);
      yPos += 15;

      data.plan.itinerary.forEach((day) => {
        yPos = checkNewPage(doc, yPos, margin, 40);
        
        // Day header
        doc.setFillColor(200, 100, 50);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("DAN " + day.day + ": " + day.title, margin + 5, yPos + 7);
        if (day.date) {
          doc.text(day.date, pageWidth - margin - 5, yPos + 7, { align: "right" });
        }
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        if (day.summary) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          const summaryLines = doc.splitTextToSize(day.summary, pageWidth - 2 * margin);
          doc.text(summaryLines, margin, yPos);
          yPos += summaryLines.length * 4 + 5;
        }

        // Activities
        doc.setFont("helvetica", "normal");
        day.activities.forEach((activity) => {
          yPos = checkNewPage(doc, yPos, margin, 20);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(activity.time, margin, yPos);
          doc.setFont("helvetica", "normal");
          
          const activityText = doc.splitTextToSize(activity.description, pageWidth - 2 * margin - 30);
          doc.text(activityText, margin + 30, yPos);
          yPos += activityText.length * 4 + 2;
          
          if (activity.location) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("Lokacija: " + activity.location, margin + 30, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 4;
          }
          
          if (activity.notes) {
            doc.setFontSize(9);
            doc.setTextColor(200, 100, 50);
            doc.text("! " + activity.notes, margin + 30, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 4;
          }
          
          yPos += 3;
        });
        
        yPos += 8;
      });

      // ===== FINANCIAL OVERVIEW =====
      doc.addPage();
      yPos = margin;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("3. FINANSIJSKI PREGLED", margin, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Troskovi po uceniku (" + data.plan.type + " plan):", margin, yPos);
      yPos += 10;

      const costs = [
        ["Transport", data.plan.costs.transport],
        ["Smjestaj", data.plan.costs.accommodation],
        ["Obroci", data.plan.costs.meals],
        ["Ulaznice", data.plan.costs.entry_fees],
        ["Osiguranje", data.plan.costs.insurance || 0],
        ["Rezerva (5%)", data.plan.costs.contingency]
      ];

      doc.setFont("helvetica", "normal");
      costs.forEach(([label, value]) => {
        doc.text(String(label) + ":", margin + 10, yPos);
        doc.text(value + " EUR", margin + 80, yPos);
        yPos += 6;
      });

      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPos, margin + 100, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.text("UKUPNO PO UCENIKU:", margin + 10, yPos);
      doc.text(data.plan.costs.total + " EUR", margin + 80, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text("UKUPNO ZA " + data.studentCount + " UCENIKA: " + (data.plan.costs.total * data.studentCount) + " EUR", margin, yPos);

      // ===== RULES =====
      if (data.plan.rules && data.plan.rules.length > 0) {
        yPos += 20;
        yPos = checkNewPage(doc, yPos, margin, 50);
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("4. PRAVILA PONASANJA", margin, yPos);
        yPos += 12;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        data.plan.rules.forEach((rule, i) => {
          yPos = checkNewPage(doc, yPos, margin, 10);
          const ruleText = doc.splitTextToSize((i + 1) + ". " + rule, pageWidth - 2 * margin);
          doc.text(ruleText, margin, yPos);
          yPos += ruleText.length * 4 + 3;
        });
      }

      // ===== PACKING LIST =====
      if (data.plan.packing_list && data.plan.packing_list.length > 0) {
        yPos += 15;
        yPos = checkNewPage(doc, yPos, margin, 50);
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("5. LISTA POTREBNIH STVARI", margin, yPos);
        yPos += 12;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        const halfLength = Math.ceil(data.plan.packing_list.length / 2);
        const col1 = data.plan.packing_list.slice(0, halfLength);
        const col2 = data.plan.packing_list.slice(halfLength);
        
        const startY = yPos;
        col1.forEach((item) => {
          doc.rect(margin, yPos - 3, 4, 4);
          doc.text("  " + item, margin + 6, yPos);
          yPos += 6;
        });
        
        yPos = startY;
        col2.forEach((item) => {
          doc.rect(pageWidth / 2, yPos - 3, 4, 4);
          doc.text("  " + item, pageWidth / 2 + 6, yPos);
          yPos += 6;
        });
      }

      // ===== CONTACT INFO =====
      doc.addPage();
      yPos = margin;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("6. KONTAKT INFORMACIJE", margin, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SKOLA:", margin, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      doc.text(schoolInfo.name, margin, yPos);
      yPos += 5;
      doc.text("Adresa: " + schoolInfo.address, margin, yPos);
      yPos += 5;
      doc.text("Telefon: " + schoolInfo.phone, margin, yPos);
      yPos += 5;
      doc.text("Email: " + schoolInfo.email, margin, yPos);
      yPos += 15;

      doc.setFont("helvetica", "bold");
      doc.text("PRATITELJI NA EKSKURZIJI:", margin, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      if (data.chaperones.length > 0) {
        data.chaperones.forEach((chaperone, i) => {
          doc.text((i + 1) + ". " + chaperone + " - Telefon: _______________", margin, yPos);
          yPos += 6;
        });
      } else {
        doc.text("1. _________________________ - Telefon: _______________", margin, yPos);
        yPos += 6;
        doc.text("2. _________________________ - Telefon: _______________", margin, yPos);
      }
      yPos += 15;

      doc.setFont("helvetica", "bold");
      doc.text("HITNI KONTAKTI:", margin, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      doc.text("Hitna pomoc: 124", margin, yPos);
      yPos += 5;
      doc.text("Policija: 122", margin, yPos);
      yPos += 5;
      doc.text("Vatrogasci: 123", margin, yPos);

      // Add footers to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addFooter(doc, i, pageCount);
      }

      const fileName = "Dokumentacija-" + (data.tripName || "ekskurzija").replace(/\s+/g, "-") + ".pdf";
      doc.save(fileName);

      toast({
        title: "Dokumentacija generirana!",
        description: fileName + " je uspjesno preuzet.",
      });
    } catch (error) {
      console.error("Error generating documentation:", error);
      toast({
        variant: "destructive",
        title: "Greska",
        description: "Nije moguce generirati dokumentaciju.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateParentPermission,
    generateStudentList,
    generateFullDocumentation,
    isGenerating,
  };
};
