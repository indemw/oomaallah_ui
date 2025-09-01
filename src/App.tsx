
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Dining from "./pages/Dining";
import Gallery from "./pages/Gallery";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Stock from "./pages/Stock";
import Accounting from "./pages/Accounting";
import NotFound from "./pages/NotFound";
import AdminSetup from "./pages/AdminSetup";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Reservations from "./pages/Reservations";
import Restaurant from "./pages/Restaurant";
import FoodBeverages from "./pages/FoodBeverages";
import FrontOffice from "./pages/FrontOffice";
import Conference from "./pages/Conference";
import BackOffice from "./pages/BackOffice";
import StaffLayout from "./components/StaffLayout";
import Roles from "./pages/Roles";
import ContentManagement from "./pages/ContentManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/dining" element={<Dining />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/auth" element={<Auth />} />

          {/* Staff routes with left sidebar layout */}
          <Route element={<StaffLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/restaurant" element={<Restaurant />} />
            <Route path="/food-beverages" element={<FoodBeverages />} />
            <Route path="/front-office" element={<FrontOffice />} />
            <Route path="/conference" element={<Conference />} />
            <Route path="/back-office" element={<BackOffice />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/accounting" element={<Accounting />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/content" element={<ContentManagement />} />
        <Route path="/settings" element={<Settings />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
