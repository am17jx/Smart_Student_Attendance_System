import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";




// Auto-reload on stale chunk errors (e.g. after a new deployment)
const lazyWithReload = (factory: () => Promise<any>) =>
  lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {}); // prevent React from rendering broken state
    })
  );

// Lazy-load every page — each loads only when first visited (code splitting)
const Login = lazyWithReload(() => import("./pages/Login"));
const Dashboard = lazyWithReload(() => import("./pages/Dashboard"));
const Teachers = lazyWithReload(() => import("./pages/Teachers"));
const Students = lazyWithReload(() => import("./pages/Students"));
const Materials = lazyWithReload(() => import("./pages/Materials"));
const Departments = lazyWithReload(() => import("./pages/Departments"));
const Stages = lazyWithReload(() => import("./pages/Stages"));
const Sessions = lazyWithReload(() => import("./pages/Sessions"));
const SessionDetails = lazyWithReload(() => import("./pages/SessionDetails"));
const MyMaterials = lazyWithReload(() => import("./pages/MyMaterials"));
const MySessions = lazyWithReload(() => import("./pages/MySessions"));
const Geofences = lazyWithReload(() => import("./pages/Geofences"));
const Attendance = lazyWithReload(() => import("./pages/Attendance"));
const ScanQR = lazyWithReload(() => import("./pages/ScanQR"));
const Settings = lazyWithReload(() => import("./pages/Settings"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
const ForgotPassword = lazyWithReload(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazyWithReload(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazyWithReload(() => import("./pages/auth/VerifyEmail"));
const ChangePassword = lazyWithReload(() => import("./pages/auth/ChangePassword"));
const AttendanceStats = lazyWithReload(() => import("./pages/AttendanceStats"));
const TeacherAttendanceStats = lazyWithReload(() => import("./pages/TeacherAttendanceStats"));
const StudentPromotion = lazyWithReload(() => import("./pages/StudentPromotion"));
const PromotionConfig = lazyWithReload(() => import("./pages/PromotionConfig"));
const StudentEnrollments = lazyWithReload(() => import("./pages/StudentEnrollments"));
const MyStudents = lazyWithReload(() => import("./pages/MyStudents"));
const SessionAttendance = lazyWithReload(() => import("./pages/SessionAttendance"));
const FailedAttempts = lazyWithReload(() => import("./pages/FailedAttempts"));
const StudentLeaves = lazyWithReload(() => import("./pages/StudentLeaves"));
const Admins = lazyWithReload(() => import("./pages/Admins"));


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
              <Route path="/admins" element={<ProtectedRoute allowedRoles={['admin']} deanOnly><Admins /></ProtectedRoute>} />
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
              <Route path="/student-leaves" element={<ProtectedRoute allowedRoles={['admin']}><StudentLeaves /></ProtectedRoute>} />

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
