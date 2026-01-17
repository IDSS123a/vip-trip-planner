import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlanTrip from "./pages/PlanTrip";
import MyTrips from "./pages/MyTrips";
import Destinations from "./pages/Destinations";
import Contact from "./pages/Contact";
import SharedTrip from "./pages/SharedTrip";
import Auth from "./pages/Auth";
import UpdatePassword from "./pages/UpdatePassword";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import FAQ from "./pages/FAQ";
import TeacherGuide from "./pages/TeacherGuide";
import ParentPortal from "./pages/ParentPortal";
import EmergencyProcedures from "./pages/EmergencyProcedures";
import Accessibility from "./pages/Accessibility";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/install" element={<Install />} />
          <Route path="/plan-trip" element={<PlanTrip />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/trip/:shareId" element={<SharedTrip />} />
          <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/teacher-guide" element={<TeacherGuide />} />
          <Route path="/parent-portal" element={<ParentPortal />} />
          <Route path="/emergency-procedures" element={<EmergencyProcedures />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
