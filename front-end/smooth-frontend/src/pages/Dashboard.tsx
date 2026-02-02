import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Building2
} from "lucide-react";

// Demo data removed - using Real API

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default"
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
  variant?: "default" | "success" | "warning" | "primary";
}) {
  const variants = {
    default: "bg-card",
    success: "bg-success/10 border-success/20",
    warning: "bg-warning/10 border-warning/20",
    primary: "bg-primary/10 border-primary/20",
  };

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    primary: "bg-primary/20 text-primary",
  };

  return (
    <Card className={`${variants[variant]} shadow-card transition-all hover:shadow-elegant`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend !== undefined && (
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconVariants[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getAdminDashboard();
      return response.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  if (error || !data) {
    return <div className="text-destructive p-4">فشل تحميل البيانات</div>;
  }

  const { stats, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على النظام</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.students || 0}
          icon={GraduationCap}
          trend={5}
          variant="primary"
        />
        <StatCard
          title="إجمالي المعلمين"
          value={stats?.teachers || 0}
          icon={Users}
          trend={2}
        />
        <StatCard
          title="الأقسام"
          value={stats?.departments || 0}
          icon={Building2}
        />
        <StatCard
          title="المواد الدراسية"
          value={stats?.materials || 0}
          icon={BookOpen}
          trend={8}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="نسبة الحضور اليوم"
          value={`${stats?.attendanceRate || 0}%`}
          icon={TrendingUp}
          description="مقارنة بـ 85% أمس"
          variant="success"
        />
        <StatCard
          title="الجلسات النشطة"
          value={stats?.sessions || 0}
          icon={Calendar}
          description="جلسة قيد التنفيذ الآن"
          variant="primary"
        />
        <StatCard
          title="آخر تحديث"
          value="الآن"
          icon={Clock}
          description="يتم التحديث تلقائياً"
        />
      </div>


      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            آخر النشاطات
          </CardTitle>
          <CardDescription>آخر عمليات تسجيل الحضور</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity?.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">{activity.student?.name || 'طالب'}</p>
                    <p className="text-sm text-muted-foreground">{activity.session?.material?.name || 'مادة'}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{new Date(activity.marked_at).toLocaleTimeString('ar-EG')}</span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-center text-muted-foreground py-4">لا توجد نشاطات حديثة</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Failed Attempts Section */}
      <Card className="shadow-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            محاولات تسجيل فاشلة
          </CardTitle>
          <CardDescription>محاولات الدخول غير المصرح بها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.failedAttempts && data.failedAttempts.length > 0 ? (
              data.failedAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{attempt.student?.name || 'طالب غير معروف'}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.student?.student_id ? `الرقم الجامعي: ${attempt.student.student_id}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        المادة: {attempt.session?.material?.name || 'غير محدد'}
                        {attempt.session?.teacher?.name && ` • الأستاذ: ${attempt.session.teacher.name}`}
                      </p>
                      <p className="text-xs text-destructive mt-1">
                        {attempt.error_type}: {attempt.error_message || 'محاولة غير مصرح بها'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(attempt.attempted_at).toLocaleString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">لا توجد محاولات فاشلة</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacherDashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getTeacherDashboard();
      return response.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  if (error || !data) {
    return <div className="text-destructive p-4">فشل تحميل البيانات</div>;
  }

  const { stats, recentSessions, recentAttendance } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مرحباً بك</h1>
        <p className="text-muted-foreground">لوحة تحكم المعلم</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="المواد المسندة"
          value={stats?.materials || 0}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="إجمالي الجلسات"
          value={stats?.sessions || 0}
          icon={Calendar}
        />
        <StatCard
          title="جلسات هذا الشهر"
          value={stats?.sessionsThisMonth || 0}
          icon={Calendar}
        />
        <StatCard
          title="طلاب اليوم"
          value={stats?.todayAttendance || 0}
          icon={GraduationCap}
          variant="success"
        />
        <StatCard
          title="نسبة الحضور"
          value={`${stats?.attendanceRate || 0}%`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="إجمالي الطلاب المسجلين"
          value={stats?.totalStudentsAttended || 0}
          icon={Users}
          variant="primary"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* آخر الجلسات */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              آخر الجلسات
            </CardTitle>
            <CardDescription>آخر الجلسات التي أنشأتها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions?.map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{session.material?.name || 'مادة'}</p>
                      <p className="text-xs text-muted-foreground">
                        {session._count?.attendance_records || 0} طالب حضر
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              ))}
              {(!recentSessions || recentSessions.length === 0) && (
                <p className="text-center text-muted-foreground py-4">لا توجد جلسات حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* آخر تسجيلات الحضور */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success" />
              آخر تسجيلات الحضور
            </CardTitle>
            <CardDescription>آخر الطلاب الذين سجلوا حضورهم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAttendance?.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <div>
                      <p className="font-medium text-sm">{record.student?.name || 'طالب'}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.session?.material?.name || 'مادة'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.marked_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {(!recentAttendance || recentAttendance.length === 0) && (
                <p className="text-center text-muted-foreground py-4">لا توجد تسجيلات حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Attempts Section */}
      <Card className="shadow-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            محاولات تسجيل فاشلة
          </CardTitle>
          <CardDescription>محاولات الدخول غير المصرح بها لجلساتك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.failedAttempts && data.failedAttempts.length > 0 ? (
              data.failedAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{attempt.student?.name || 'طالب غير معروف'}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.student?.student_id ? `الرقم الجامعي: ${attempt.student.student_id}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        المادة: {attempt.session?.material?.name || 'غير محدد'}
                      </p>
                      <p className="text-xs text-destructive mt-1">
                        {attempt.error_type}: {attempt.error_message || 'محاولة غير مصرح بها'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(attempt.attempted_at).toLocaleString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">لا توجد محاولات فاشلة</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getStudentDashboard();
      return response.data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  if (error || !data) {
    return <div className="text-destructive p-4">فشل تحميل البيانات</div>;
  }

  const { studentInfo, stats, byMaterial, recentAttendance } = data;

  // Determine status variant
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'warning': return 'warning';
      case 'danger': return 'default';
      default: return 'default';
    }
  };

  const getStatusMessage = (status?: string) => {
    switch (status) {
      case 'excellent': return { title: 'حضورك ممتاز!', message: 'استمر في الحفاظ على نسبة حضورك المرتفعة', icon: CheckCircle2, color: 'text-success' };
      case 'good': return { title: 'حضورك جيد', message: 'حافظ على هذا المستوى', icon: CheckCircle2, color: 'text-primary' };
      case 'warning': return { title: 'تحذير', message: 'نسبة حضورك تحتاج إلى تحسين', icon: Clock, color: 'text-warning' };
      case 'danger': return { title: 'تنبيه', message: 'نسبة حضورك منخفضة جداً، يرجى الانتباه', icon: XCircle, color: 'text-destructive' };
      default: return { title: 'مرحباً', message: 'تابع حضورك بانتظام', icon: CheckCircle2, color: 'text-muted-foreground' };
    }
  };

  const statusInfo = getStatusMessage(stats.status);
  const StatusIcon = statusInfo.icon;

  const getStatusBadge = (status: string) => {
    const badges = {
      'PRESENT': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">حاضر</span>,
      'LATE': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">متأخر</span>,
      'ABSENT': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">غائب</span>,
      'EXCUSED': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">معذور</span>
    };
    return badges[status as keyof typeof badges] || status;
  };

  return (
    <div className="space-y-6">
      {/* Student Info Card */}
      <Card className="shadow-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">مرحباً، {studentInfo.name}</h1>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>الرقم الجامعي: <span className="font-medium text-foreground">{studentInfo.student_id}</span></p>
                <p>القسم: <span className="font-medium text-foreground">{studentInfo.department}</span></p>
                <p>المرحلة: <span className="font-medium text-foreground">{studentInfo.stage}</span></p>
                <p>البريد الإلكتروني: <span className="font-medium text-foreground">{studentInfo.email}</span></p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/20">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المحاضرات"
          value={stats.totalSessions || 0}
          icon={BookOpen}
        />
        <StatCard
          title="عدد الحضور"
          value={stats.attended || 0}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="عدد الغياب"
          value={stats.absent || 0}
          icon={XCircle}
          variant="default"
        />
        <StatCard
          title="نسبة الحضور"
          value={`${stats.percentage || 0}%`}
          icon={TrendingUp}
          variant={getStatusVariant(stats.status)}
        />
      </div>

      {/* Status Message */}
      <Card className={`shadow-card ${stats.status === 'excellent' ? 'gradient-success text-success-foreground' : stats.status === 'danger' ? 'bg-destructive/10 border-destructive/20' : ''}`}>
        <CardContent className="p-6 text-center">
          <StatusIcon className={`h-12 w-12 mx-auto mb-4 ${stats.status === 'excellent' ? 'opacity-90' : statusInfo.color}`} />
          <h3 className="text-xl font-bold mb-2">{statusInfo.title}</h3>
          <p className={stats.status === 'excellent' ? 'opacity-90' : 'text-muted-foreground'}>{statusInfo.message}</p>
        </CardContent>
      </Card>

      {/* Attendance by Material */}
      {byMaterial && byMaterial.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              الحضور حسب المادة
            </CardTitle>
            <CardDescription>نسبة حضورك في كل مادة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byMaterial.map((material) => (
                <div
                  key={material.materialId}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{material.materialName}</p>
                    <span className="text-sm font-bold text-primary">{material.attendanceRate}%</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>إجمالي: {material.totalSessions}</span>
                    <span className="text-success">حاضر: {material.attended}</span>
                    <span className="text-warning">متأخر: {material.late}</span>
                    <span className="text-destructive">غائب: {material.absent}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${material.attendanceRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            آخر سجلات الحضور
          </CardTitle>
          <CardDescription>آخر 5 محاضرات حضرتها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance && recentAttendance.length > 0 ? (
              recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{record.materialName}</p>
                      <p className="text-xs text-muted-foreground">
                        الأستاذ: {record.teacherName} • {record.location}
                      </p>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                  <span className="text-xs text-muted-foreground mr-3">
                    {new Date(record.marked_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">لا توجد سجلات حضور</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
}
