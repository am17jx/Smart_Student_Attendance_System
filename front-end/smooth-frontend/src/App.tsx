import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Materials from "./pages/Materials";
import Departments from "./pages/Departments";
import Stages from "./pages/Stages";
import Sessions from "./pages/Sessions";
import SessionDetails from "./pages/SessionDetails";
import MyMaterials from "./pages/MyMaterials";
import MySessions from "./pages/MySessions";
import Geofences from "./pages/Geofences";
import Attendance from "./pages/Attendance";
import ScanQR from "./pages/ScanQR";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ChangePassword from "./pages/auth/ChangePassword";
import AttendanceStats from "./pages/AttendanceStats";
import TeacherAttendanceStats from "./pages/TeacherAttendanceStats";
import StudentPromotion from "./pages/StudentPromotion";
import PromotionConfig from "./pages/PromotionConfig";
import StudentEnrollments from "./pages/StudentEnrollments";
import MyStudents from "./pages/MyStudents";
import SessionAttendance from "./pages/SessionAttendance";
import FailedAttempts from "./pages/FailedAttempts";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // Or a spinner
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/student/reset-password" element={<ResetPassword />} />
            <Route path="/teacher/reset-password" element={<ResetPassword />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/admin" element={<Dashboard />} />
            <Route path="/dashboard/teacher" element={<Dashboard />} />
            <Route path="/dashboard/student" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/my-students" element={<MyStudents />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/my-materials" element={<MyMaterials />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/stages" element={<Stages />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:id" element={<SessionDetails />} />
            <Route path="/sessions/:id/report" element={<SessionAttendance />} />
            <Route path="/my-sessions" element={<MySessions />} />
            <Route path="/geofences" element={<Geofences />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/my-attendance" element={<Attendance />} />
            <Route path="/attendance/stats" element={<AttendanceStats />} />
            <Route path="/teacher/attendance-stats" element={<TeacherAttendanceStats />} />
            <Route path="/scan-qr" element={<ScanQR />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/promotion" element={<StudentPromotion />} />
            <Route path="/promotion-config" element={<PromotionConfig />} />
            <Route path="/enrollments" element={<StudentEnrollments />} />
            <Route path="/failed-attempts" element={<FailedAttempts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
