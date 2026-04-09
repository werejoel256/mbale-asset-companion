import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import Departments from "@/pages/Departments";
import Maintenance from "@/pages/Maintenance";
import FaultReports from "@/pages/FaultReports";
import Assignments from "@/pages/Assignments";
import Movements from "@/pages/Movements";
import Disposals from "@/pages/Disposals";
import Suppliers from "@/pages/Suppliers";
import UsersPage from "@/pages/UsersPage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/faults" element={<FaultReports />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/disposals" element={<Disposals />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
