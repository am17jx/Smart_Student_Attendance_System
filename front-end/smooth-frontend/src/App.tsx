import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";

// Lazy-load every page — each loads only when first visited (code splitting)
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Teachers = lazy(() => import("./pages/Teachers"));
const Students = lazy(() => import("./pages/Students"));
const Materials = lazy(() => import("./pages/Materials"));
const Departments = lazy(() => import("./pages/Departments"));
const Stages = lazy(() => import("./pages/Stages"));
const Sessions = lazy(() => import("./pages/Sessions"));
const SessionDetails = lazy(() => import("./pages/SessionDetails"));
const MyMaterials = lazy(() => import("./pages/MyMaterials"));
const MySessions = lazy(() => import("./pages/MySessions"));
const Geofences = lazy(() => import("./pages/Geofences"));
const Attendance = lazy(() => import("./pages/Attendance"));
const ScanQR = lazy(() => import("./pages/ScanQR"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ChangePassword = lazy(() => import("./pages/auth/ChangePassword"));
const AttendanceStats = lazy(() => import("./pages/AttendanceStats"));
const TeacherAttendanceStats = lazy(() => import("./pages/TeacherAttendanceStats"));
const StudentPromotion = lazy(() => import("./pages/StudentPromotion"));
const PromotionConfig = lazy(() => import("./pages/PromotionConfig"));
const StudentEnrollments = lazy(() => import("./pages/StudentEnrollments"));
const MyStudents = lazy(() => import("./pages/MyStudents"));
const SessionAttendance = lazy(() => import("./pages/SessionAttendance"));
const FailedAttempts = lazy(() => import("./pages/FailedAttempts"));



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // data stays fresh 30s — no loading spinner on revisit
      gcTime: 5 * 60 * 1000,       // keep cache in memory for 5 minutes
      refetchOnWindowFocus: false, // don't refetch when user switches tabs
      retry: 1,                    // retry failed requests once (not 3 times)
    },
  },
});


const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
