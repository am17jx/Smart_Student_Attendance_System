// API Configuration - Uses Vite proxy in development, can be overridden with VITE_API_URL env variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Types based on backend controllers
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

export interface Department {
  id: string;
  name: string;
}

export interface Stage {
  id: string;
  name: string;
  level: number;
}

export interface Material {
  id: string;
  name: string;
  department_id: string;
  stage_id: string;
  department?: Department;
  stage?: Stage;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department_id?: string;
  department?: Department | { name: string }; // Handle both full object or simplified
  materials?: { id: string; name: string }[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  student_id?: string; // University ID (optional on read if legacy, or required)
  stage_id?: string;
  department_id?: string;
  department?: Department;
  stage?: Stage;
  attendanceRate?: number; // Optional based on usage
}

export interface Session {
  id: string;
  material_id: string;
  teacher_id: string;
  geofence_id: string;
  qr_secret: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  material?: Material;
  teacher?: Teacher;
  geofence?: Geofence;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  marked_at: string;
  marked_by: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  student?: Student;
  session?: Session;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface DashboardStats {
  students?: number;
  teachers?: number;
  departments?: number;
  materials?: number;
  sessions?: number;
  attendanceRate?: number;
  sessionsThisMonth?: number;
  todayAttendance?: number;
  totalStudentsAttended?: number;
  // Student-specific stats
  totalSessions?: number;
  attended?: number;
  late?: number;
  absent?: number;
  excused?: number;
  percentage?: string;
  status?: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface StudentInfo {
  name: string;
  email: string;
  student_id: string;
  department: string;
  stage: string;
}

export interface MaterialStats {
  materialId: string;
  materialName: string;
  attended: number;
  late: number;
  absent: number;
  totalSessions: number;
  attendanceRate: string;
}

export interface RecentAttendanceRecord {
  id: string;
  materialName: string;
  teacherName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  marked_at: string;
  location: string;
}

export interface StudentDashboardData {
  studentInfo: StudentInfo;
  stats: DashboardStats;
  byMaterial: MaterialStats[];
  recentAttendance: RecentAttendanceRecord[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  results?: number;
}

export interface SessionAttendanceReport {
  session: Session;
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  presentStudents: (Student & { status: 'present'; marked_at: string })[];
  absentStudents: (Student & { status: 'absent' })[];
}

export interface FailedAttempt {
  id: string;
  error_type: string;
  error_message?: string;
  ip_address?: string;
  device_info?: string;
  attempted_at: string;
  student?: {
    name: string;
    student_id: string;
  };
  session?: {
    material: {
      name: string;
    };
    session_date: string;
    teacher?: {
      name: string;
    };
  };
}

// Auth token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => authToken;

// API request helper
// Custom options interface extending RequestInit
interface ApiRequestOptions extends RequestInit {
  responseType?: 'json' | 'blob' | 'text';
}

// Specialized Blob request handler for file downloads
async function apiBlobRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const headers: HeadersInit = {
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });



    if (!response.ok) {
      // Try to get error message from response
      const errorText = await response.text();
      console.error('❌ [API] Blob request failed:', errorText);
      throw new Error(errorText || 'فشل تحميل الملف');
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf')) {
      console.error('⚠️ [API] Unexpected content type:', contentType);
      throw new Error('الملف المُستلم ليس PDF صحيح');
    }

    const blob = await response.blob();


    if (blob.size === 0) {
      throw new Error('الملف المُحمل فارغ');
    }

    return blob;
  } catch (error) {
    console.error('❌ [API] Blob Request Failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('حدث خطأ غير متوقع أثناء تحميل الملف');
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response has content
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error(`خطأ في الخادم: استجابة غير صالحة (${response.status})`);
      }
    } else {
      // Handle non-JSON response (e.g. 404 HTML page or empty body)
      const text = await response.text();
      console.error("Received non-JSON response:", text);

      if (response.status === 404) {
        throw new Error("الرابط غير موجود");
      }
      if (response.status >= 500) {
        throw new Error("خطأ في الخادم الداخلي");
      }
      throw new Error(`خطأ غير متوقع (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ في الطلب');
    }

    return data;
  } catch (error) {
    console.error("API Request Failed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('حدث خطأ غير متوقع');
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string, fingerprint?: string) =>
    apiRequest<{ token: string; user: User; status?: string; studentId?: string; redirect?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, fingerprint }),
    }),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  getProfile: () => apiRequest<{ user: User }>('/auth/profile'),

  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  verifyEmail: (token: string) =>
    apiRequest(`/auth/verify-email/${token}`),

  resendVerification: (email: string) =>
    apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  changePassword: (studentId: string, oldPassword: string, newPassword: string) =>
    apiRequest(`/auth/student/change-password/${studentId}`, { // Adjusted path based on typical REST patterns or backend request
      method: 'POST', // Backend often uses POST or PUT. Detailed controller showed `change_student_password` with params.
      // Controller: router.post('/student/change-password/:studentId', ...) 
      // I need to verify the route path from the user's provided backend snippet or assume standard.
      // The user snippet showed `change_student_password` but didn't explicitly show the router path.
      // However, usually it's /auth/change-password or similar.
      // Let's assume a path based on function name or context.
      // User snippet: `export const change_student_password = ...`
      // I will assume the route is `/auth/student/change-password/:studentId` for now.
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Admin/Teacher change password might be different, but for now implementing what was asked for student flow mainly.
  // Adding generic or student specific.
  changeStudentPassword: (studentId: string, oldPassword: string, newPassword: string) =>
    apiRequest(`/auth/student/change-password/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// Admin API
export const adminApi = {
  registerStudent: (data: { name: string; email: string; studentId: string; stageId: string; departmentId: string }) =>
    apiRequest<{ user: User; tempPassword?: string; message: string }>('/auth/admin/signin/student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Dashboard API
export const dashboardApi = {
  getAdminDashboard: () =>
    apiRequest<{ stats: DashboardStats; recentActivity: AttendanceRecord[]; failedAttempts: FailedAttempt[] }>('/dashboard/admin'),

  getTeacherDashboard: () =>
    apiRequest<{ stats: DashboardStats; recentSessions: Session[]; recentAttendance: AttendanceRecord[]; failedAttempts: FailedAttempt[] }>('/dashboard/teacher'),

  getStudentDashboard: () =>
    apiRequest<StudentDashboardData>('/dashboard/student'),
};

// Sessions API
export const sessionsApi = {
  getAll: (page = 1, limit = 10, search = "") => apiRequest<{ sessions: Session[]; meta?: PaginationMeta }>(`/sessions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getMySessions: (page = 1, limit = 10, search = "") => apiRequest<{ sessions: Session[]; meta?: PaginationMeta }>(`/sessions/my-sessions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getById: (id: string) => apiRequest<{ session: Session }>(`/sessions/${id}`),
  create: (data: { materialId: string; teacherId: string; geofenceId: string }) =>
    apiRequest<{ session: Session }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  end: (id: string) =>
    apiRequest<{ session: Session }>(`/sessions/${id}/end`, { method: 'POST' }),
};

// Attendance API
export const attendanceApi = {
  // For students - get their own attendance
  getMyAttendance: () => apiRequest<{ records: AttendanceRecord[] }>('/attendance/my-attendance'),

  // For students - get attendance statistics
  getMyStats: () => apiRequest<{
    totalSessions: number;
    attendedSessions: number;
    missedSessions: number;
    attendanceRate: number;
    status: string;
    byMaterial: any[];
    recentAttendance: any[];
    monthlyStats: any[];
  }>('/attendance/my-stats'),

  // For general use - will be role-dependent
  getAll: () => apiRequest<{ records: AttendanceRecord[] }>('/attendance/my-attendance'),

  getBySession: (sessionId: string) =>
    apiRequest<{ records: AttendanceRecord[] }>(`/attendance/session/${sessionId}`),

  getSessionReport: (sessionId: string) =>
    apiRequest<SessionAttendanceReport>(`/attendance/session/${sessionId}/report`),

  getReport: (sessionId: string) =>
    apiBlobRequest(`/attendance/report/${sessionId}`),

  // For teachers - get attendance statistics
  getTeacherStats: () => apiRequest<{
    totalSessions: number;
    totalAttendees: number;
    avgAttendancePerSession: number;
    uniqueStudents: number;
    byMaterial: {
      materialId: string;
      materialName: string;
      totalSessions: number;
      totalAttendees: number;
      avgPerSession: number;
    }[];
    monthlyStats: {
      month: string;
      sessions: number;
      attendees: number;
      avgPerSession: number;
    }[];
    recentSessions: {
      id: string;
      materialName: string;
      location: string;
      date: string;
      attendeeCount: number;
      isActive: boolean;
    }[];
    weeklyTrend: {
      week: string;
      sessions: number;
      attendees: number;
    }[];
  }>('/attendance/teacher-stats'),

  getByStudent: (studentId: string) =>
    apiRequest<{ records: AttendanceRecord[] }>(`/attendance/student/${studentId}`),
  update: (id: string, data: { marked_by: string }) =>
    apiRequest<{ record: AttendanceRecord }>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// QR Code API
export const qrApi = {
  generate: (sessionId: string) =>
    apiRequest<{ qrCode: string }>(`/qrcodes/generate/${sessionId}`, {
      method: "POST"
    }),
  scan: (token: string, id: string, latitude: number, longitude: number) =>
    apiRequest<{ message: string }>('/qrcodes/validate', {
      method: 'POST',
      body: JSON.stringify({ token, id, latitude, longitude }),
    }),
};

// Departments API
export const departmentsApi = {
  getAll: () => apiRequest<{ departments: Department[] }>('/departments'),
  create: (name: string) =>
    apiRequest<{ department: Department }>('/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    apiRequest<{ department: Department }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) =>
    apiRequest(`/departments/${id}`, { method: 'DELETE' }),
};

// Stages API
export const stagesApi = {
  getAll: () => apiRequest<{ stages: Stage[] }>('/stages'),
  create: (data: { name: string; level: number }) =>
    apiRequest<{ stage: Stage }>('/stages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; level: number }) =>
    apiRequest<{ stage: Stage }>(`/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/stages/${id}`, { method: 'DELETE' }),
};

export interface Material {
  id: string;
  name: string;
  department_id: string;
  stage_id: string;
  semester?: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
  department?: Department;
  stage?: Stage;
}

// Materials API
export const materialsApi = {
  getAll: () => apiRequest<{ materials: Material[] }>('/materials'),
  getMyMaterials: () => apiRequest<{ materials: Material[] }>('/materials/my-materials'),
  create: (data: { name: string; departmentId: string; stageId: string; semester: string }) =>
    apiRequest<{ material: Material }>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; departmentId: string; stageId: string; semester: string }) =>
    apiRequest<{ material: Material }>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/materials/${id}`, { method: 'DELETE' }),
};

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type PaginatedResponse<T> = ApiResponse<T> & {
  data: {
    meta?: PaginationMeta;
  } & NonNullable<ApiResponse<T>['data']>;
};

// Teachers API
export const teachersApi = {
  getAll: () => apiRequest<{ teachers: Teacher[] }>('/teachers'),
  create: (data: { name: string; email: string; password: string; departmentId?: string }) =>
    apiRequest<{ teacher: Teacher }>('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; email: string; departmentId?: string }) =>
    apiRequest<{ teacher: Teacher }>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/teachers/${id}`, { method: 'DELETE' }),
  getMyStudents: () => apiRequest<{ students: Student[]; materials: Material[] }>('/teachers/my-students'),
};

// Students API
export const studentsApi = {
  getAll: (page = 1, limit = 10, search = "") => apiRequest<{ students: Student[]; meta?: PaginationMeta }>(`/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  create: (data: { name: string; email: string; stageId?: string; departmentId?: string }) =>
    apiRequest<{ student: Student }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; email: string; stageId?: string; departmentId?: string }) =>
    apiRequest<{ student: Student }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
  resetFingerprint: (id: string) => apiRequest(`/students/${id}/reset-fingerprint`, { method: 'PUT' }),
};

// Geofences API
export const geofencesApi = {
  getAll: () => apiRequest<{ geofences: Geofence[] }>('/geofences'),
  create: (data: { name: string; latitude: number; longitude: number; radius_meters: number }) =>
    apiRequest<{ geofence: Geofence }>('/geofences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name: string; latitude: number; longitude: number; radius_meters: number }) =>
    apiRequest<{ geofence: Geofence }>(`/geofences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiRequest(`/geofences/${id}`, { method: 'DELETE' }),
};

// Promotion System Types
export interface PromotionPreview {
  studentId: string;
  studentName: string;
  studentNumber: string;
  currentStage: string | null;
  currentStageId: string | null;
  decision: 'PROMOTED' | 'PROMOTED_WITH_CARRY' | 'REPEAT_YEAR';
  failedCount: number;
  carriedCount: number;
  failedSubjects: Array<{ id: string; name: string }>;
  carriedSubjects: Array<{ id: string; name: string }>;
  nextStage: string | null;
  nextStageId: string | null;
}

export interface PromotionConfig {
  maxCarrySubjects: number;
  failThresholdForRepeat: number;
  disableCarryForFinalYear: boolean;
  blockCarryForCore: boolean;
  repeatMode: 'repeat_failed_only' | 'repeat_full_year';
}

export interface PromotionRecord {
  id: string;
  academic_year_from: string;
  academic_year_to: string;
  decision: 'PROMOTED' | 'PROMOTED_WITH_CARRY' | 'REPEAT_YEAR';
  failed_count: number;
  carried_count: number;
  notes?: string;
  processed_at: string;
  processed_by?: string;
  stage_from?: Stage;
  stage_to?: Stage;
}

export interface Enrollment {
  id: string;
  student_id: string;
  material_id: string;
  academic_year: string;
  result_status: 'PASSED' | 'FAILED' | 'BLOCKED_BY_ABSENCE' | 'IN_PROGRESS';
  is_carried: boolean;
  material?: Material;
  student?: Student;
}

// Promotion API
export const promotionApi = {
  getPreview: (departmentId: string, stageId: string, academicYear: string) =>
    apiRequest<{ data: PromotionPreview[] }>(`/promotion/preview?department_id=${departmentId}&stage_id=${stageId}&academic_year=${encodeURIComponent(academicYear)}`),

  getEligible: (academicYear: string) =>
    apiRequest<{ data: any[]; total: number }>(`/promotion/eligible?academic_year=${encodeURIComponent(academicYear)}`),

  execute: (data: { department_id: string; stage_id: string; from_year: string; to_year: string }) =>
    apiRequest<{ message: string; data: any[] }>('/promotion/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  executeSelected: (data: { student_ids: string[]; from_year: string; to_year: string }) =>
    apiRequest<{ message: string; data: any[] }>('/promotion/execute-selected', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStudentHistory: (studentId: string) =>
    apiRequest<{ data: PromotionRecord[] }>(`/promotion/history/${studentId}`),

  getConfig: (departmentId: string) =>
    apiRequest<{ data: PromotionConfig }>(`/promotion/config/${departmentId}`),

  updateConfig: (departmentId: string, config: Partial<PromotionConfig>) =>
    apiRequest<{ message: string; data: PromotionConfig }>(`/promotion/config/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

// Enrollment API
export const enrollmentApi = {
  create: (data: { student_id: string; material_id: string; academic_year: string; result_status?: string; is_carried?: boolean }) =>
    apiRequest<{ message: string; data: Enrollment }>('/enrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreate: (data: { student_id: string; material_ids: string[]; academic_year: string }) =>
    apiRequest<{ message: string; data: any[] }>('/enrollment/bulk-create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: 'PASSED' | 'FAILED' | 'BLOCKED_BY_ABSENCE' | 'IN_PROGRESS') =>
    apiRequest<{ message: string; data: Enrollment }>(`/enrollment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ result_status: status }),
    }),

  bulkUpdateStatus: (updates: Array<{ id: string; result_status: string }>) =>
    apiRequest<{ message: string; data: any[] }>('/enrollment/bulk-update-status', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    }),

  getStudentEnrollments: (studentId: string, academicYear?: string) => {
    const query = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : '';
    return apiRequest<{ data: Enrollment[] }>(`/enrollment/student/${studentId}${query}`);
  },

  delete: (id: string) =>
    apiRequest(`/enrollment/${id}`, { method: 'DELETE' }),
};
