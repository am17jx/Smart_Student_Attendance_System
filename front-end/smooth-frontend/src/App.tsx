import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Admin Routes */}
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/teachers" element={<ProtectedRoute allowedRoles={['admin']}><Teachers /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>} />
            <Route path="/materials" element={<ProtectedRoute allowedRoles={['admin']}><Materials /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={['admin']}><Departments /></ProtectedRoute>} />
            <Route path="/stages" element={<ProtectedRoute allowedRoles={['admin']}><Stages /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute allowedRoles={['admin']}><Sessions /></ProtectedRoute>} />
            <Route path="/sessions/:id" element={<ProtectedRoute allowedRoles={['admin']}><SessionDetails /></ProtectedRoute>} />
            <Route path="/geofences" element={<ProtectedRoute allowedRoles={['admin']}><Geofences /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />
            <Route path="/attendance/stats" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceStats /></ProtectedRoute>} />
            <Route path="/promotion" element={<ProtectedRoute allowedRoles={['admin']}><StudentPromotion /></ProtectedRoute>} />
            <Route path="/promotion-config" element={<ProtectedRoute allowedRoles={['admin']}><PromotionConfig /></ProtectedRoute>} />
            <Route path="/enrollments" element={<ProtectedRoute allowedRoles={['admin']}><StudentEnrollments /></ProtectedRoute>} />
            <Route path="/failed-attempts" element={<ProtectedRoute allowedRoles={['admin']}><FailedAttempts /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><Dashboard /></ProtectedRoute>} />
            <Route path="/my-students" element={<ProtectedRoute allowedRoles={['teacher']}><MyStudents /></ProtectedRoute>} />
            <Route path="/my-sessions" element={<ProtectedRoute allowedRoles={['teacher']}><MySessions /></ProtectedRoute>} />
            <Route path="/sessions/:id/report" element={<ProtectedRoute allowedRoles={['teacher']}><SessionAttendance /></ProtectedRoute>} />
            <Route path="/teacher/attendance-stats" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendanceStats /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
            <Route path="/my-materials" element={<ProtectedRoute allowedRoles={['student']}><MyMaterials /></ProtectedRoute>} />
            <Route path="/my-attendance" element={<ProtectedRoute allowedRoles={['student']}><Attendance /></ProtectedRoute>} />
            <Route path="/scan-qr" element={<ProtectedRoute allowedRoles={['student']}><ScanQR /></ProtectedRoute>} />

            {/* Shared Authenticated Routes */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
