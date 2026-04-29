import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  UserPlus,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Student {
  id: string;
  name: string;
  gender: "M" | "F";
  parentName: string;
  parentPhone: string;
  medicalNotes: string;
  // Hibridni model saglasnosti — Pravilnik IDSS, Prilog 1
  consentStatus?: "submitted" | "pending";
  consentSignedBy?: string; // Ime roditelja koji je potpisao
  consentSignedDate?: string; // ISO date kada je potpisana
  consentDocumentUrl?: string; // Opcioni link na uploadovan dokument
}

interface StudentListInputProps {
  students: Student[];
  onStudentsChange: (students: Student[]) => void;
  expectedCount?: number;
  gradeLevel?: string;
}

const StudentListInput = ({ 
  students, 
  onStudentsChange, 
  expectedCount = 20,
  gradeLevel 
}: StudentListInputProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    gender: "M",
    parentName: "",
    parentPhone: "",
    medicalNotes: ""
  });
  const { toast } = useToast();

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addStudent = () => {
    if (!newStudent.name.trim()) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Unesite ime i prezime učenika.",
      });
      return;
    }

    onStudentsChange([
      ...students,
      { 
        ...newStudent, 
        id: generateId(), 
        name: newStudent.name.trim(),
        consentStatus: "pending",
      }
    ]);

    setNewStudent({
      name: "",
      gender: "M",
      parentName: "",
      parentPhone: "",
      medicalNotes: ""
    });

    toast({
      title: "Učenik dodan",
      description: newStudent.name + " je dodan/a na listu.",
    });
  };

  const removeStudent = (id: string) => {
    onStudentsChange(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: string, field: keyof Student, value: string) => {
    onStudentsChange(
      students.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const toggleConsent = (id: string) => {
    onStudentsChange(
      students.map(s => {
        if (s.id !== id) return s;
        const next = s.consentStatus === "submitted" ? "pending" : "submitted";
        return {
          ...s,
          consentStatus: next,
          consentSignedDate: next === "submitted" ? new Date().toISOString().slice(0, 10) : undefined,
        };
      })
    );
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Unesite imena učenika.",
      });
      return;
    }

    const lines = bulkInput.split("\n").filter(line => line.trim());
    const newStudents: Student[] = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      const genderInput = parts[1]?.toUpperCase();
      const gender: "M" | "F" = (genderInput === "F" || genderInput === "Ž") ? "F" : "M";
      return {
        id: generateId(),
        name: parts[0] || "",
        gender,
        parentName: parts[2] || "",
        parentPhone: parts[3] || "",
        medicalNotes: parts[4] || ""
      };
    }).filter(s => s.name);

    onStudentsChange([...students, ...newStudents]);
    setBulkInput("");
    setIsDialogOpen(false);

    toast({
      title: "Učenici uvezeni",
      description: "Dodano " + newStudents.length + " učenika na listu.",
    });
  };

  const exportToCSV = () => {
    const headers = "Ime i prezime,Spol,Ime roditelja,Telefon roditelja,Medicinske napomene\n";
    const rows = students.map(s => 
      [s.name, s.gender, s.parentName, s.parentPhone, s.medicalNotes].join(",")
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lista-ucenika.csv";
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exportiran",
      description: "Lista učenika je preuzeta.",
    });
  };

  const maleCount = students.filter(s => s.gender === "M").length;
  const femaleCount = students.filter(s => s.gender === "F").length;
  const hasSpecialNeeds = students.filter(s => s.medicalNotes).length;
  const consentSubmittedCount = students.filter(s => s.consentStatus === "submitted").length;
  const consentPendingCount = students.length - consentSubmittedCount;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista Učenika
            {gradeLevel && <Badge variant="outline">{gradeLevel}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={students.length >= expectedCount ? "default" : "secondary"}>
              {students.length} / {expectedCount}
            </Badge>
            {students.length >= expectedCount ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {students.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">Dječaci: {maleCount}</Badge>
            <Badge variant="outline">Djevojčice: {femaleCount}</Badge>
            {hasSpecialNeeds > 0 && (
              <Badge variant="outline" className="text-amber-600">
                Posebne potrebe: {hasSpecialNeeds}
              </Badge>
            )}
            <Badge variant={consentPendingCount === 0 ? "default" : "secondary"} className="gap-1">
              {consentPendingCount === 0 ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              Saglasnosti: {consentSubmittedCount}/{students.length}
            </Badge>
          </div>
        )}

        {/* Consent gate alert */}
        {students.length > 0 && consentPendingCount > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="font-medium text-foreground">
                  Plan se ne može finalizovati — nedostaje {consentPendingCount} {consentPendingCount === 1 ? "saglasnost" : "saglasnosti"} roditelja
                </div>
                <div className="text-muted-foreground text-xs">
                  Za svakog učenika označite "Predato" tek kad imate potpisanu saglasnost
                  (Pravilnik IDSS, Prilog 1). Dokument možete opciono uploadovati na svakoj stavci.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Single Student Form */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="md:col-span-2">
            <Input
              placeholder="Ime i prezime učenika"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addStudent()}
            />
          </div>
          <div>
            <Select
              value={newStudent.gender}
              onValueChange={(value: "M" | "F") => setNewStudent({ ...newStudent, gender: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">Ž</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Ime roditelja"
              value={newStudent.parentName}
              onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
            />
          </div>
          <div>
            <Input
              placeholder="Telefon"
              value={newStudent.parentPhone}
              onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
            />
          </div>
          <div>
            <Button onClick={addStudent} className="w-full gap-2">
              <UserPlus className="h-4 w-4" />
              Dodaj
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Bulk Unos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Masovni Unos Učenika</DialogTitle>
                <DialogDescription>
                  Unesite podatke o učenicima, jedan učenik po liniji. Format: Ime i prezime, Spol (M/Ž), Ime roditelja, Telefon, Napomene
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder={"Marko Marković, M, Ana Marković, 061234567, \nPetra Petrović, Ž, Ivan Petrović, 062345678, Alergija na orašaste plodove\nAhmed Ahmedović, M, Amra Ahmedović, 063456789,"}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Savjet: Možete kopirati podatke iz Excel tabele (odvojene zarezima ili tabom).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Otkaži
                </Button>
                <Button onClick={handleBulkImport} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Uvezi Učenike
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {students.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}

          {students.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                onStudentsChange([]);
                toast({ title: "Lista obrisana", description: "Svi učenici su uklonjeni sa liste." });
              }}
            >
              <Trash2 className="h-4 w-4" />
              Obriši Sve
            </Button>
          )}
        </div>

        {/* Student List */}
        {students.length > 0 && (
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {students.map((student, index) => (
                <div 
                  key={student.id}
                  className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-muted/50 group border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-2">
                  <span className="w-8 text-sm text-muted-foreground font-mono">
                    {index + 1}.
                  </span>
                  <Badge variant={student.gender === "M" ? "secondary" : "outline"} className="w-6">
                    {student.gender === "M" ? "M" : "Ž"}
                  </Badge>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      value={student.name}
                      onChange={(e) => updateStudent(student.id, "name", e.target.value)}
                      className="h-8 text-sm font-medium"
                    />
                    <Input
                      value={student.parentName}
                      onChange={(e) => updateStudent(student.id, "parentName", e.target.value)}
                      placeholder="Roditelj"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={student.parentPhone}
                      onChange={(e) => updateStudent(student.id, "parentPhone", e.target.value)}
                      placeholder="Telefon"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={student.medicalNotes}
                      onChange={(e) => updateStudent(student.id, "medicalNotes", e.target.value)}
                      placeholder="Napomene"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => removeStudent(student.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                  {/* Consent row */}
                  <div className="flex flex-wrap items-center gap-2 pl-10 text-xs">
                    <Button
                      type="button"
                      variant={student.consentStatus === "submitted" ? "default" : "outline"}
                      size="sm"
                      className="h-7 gap-1.5"
                      onClick={() => toggleConsent(student.id)}
                    >
                      {student.consentStatus === "submitted" ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          Saglasnost predata
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3" />
                          Označi kao predato
                        </>
                      )}
                    </Button>
                    <Input
                      value={student.consentSignedBy ?? ""}
                      onChange={(e) => updateStudent(student.id, "consentSignedBy", e.target.value)}
                      placeholder="Ime roditelja koji potpisuje"
                      className="h-7 text-xs flex-1 min-w-[160px]"
                    />
                    <Input
                      type="date"
                      value={student.consentSignedDate ?? ""}
                      onChange={(e) => updateStudent(student.id, "consentSignedDate", e.target.value)}
                      className="h-7 text-xs w-[140px]"
                    />
                    <Input
                      value={student.consentDocumentUrl ?? ""}
                      onChange={(e) => updateStudent(student.id, "consentDocumentUrl", e.target.value)}
                      placeholder="Link na dokument (opciono)"
                      className="h-7 text-xs flex-1 min-w-[160px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {students.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nema unesenih učenika</p>
            <p className="text-sm">Dodajte učenike pojedinačno ili koristite bulk unos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentListInput;
