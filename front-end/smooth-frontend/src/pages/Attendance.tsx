import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, AttendanceRecord as AttendanceRecordType } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherAttendanceStatsContent, COLORS } from "./TeacherAttendanceStats";

// Demo data removed

const materials = ["الكل", "البرمجة المتقدمة", "قواعد البيانات", "الشبكات"]; // Placeholder or should fetch
const statuses = ["الكل", "حاضر", "غائب", "متأخر"];

export default function Attendance() {
  const [selectedMaterial, setSelectedMaterial] = useState("الكل");
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const { user } = useAuth();

  // Query for student attendance
  const { data: attendance, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const response = await attendanceApi.getMyAttendance();
      return response.data?.records || [];
    },
    enabled: user?.role === 'student',
  });

  // Query for teacher stats
  const { data: teacherStats, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['teacher-attendance-stats'],
    queryFn: async () => {
      const response = await attendanceApi.getTeacherStats();
      return response.data;
    },
    enabled: user?.role === 'teacher',
  });

  const isLoading = user?.role === 'student' ? isLoadingStudent :
    user?.role === 'teacher' ? isLoadingTeacher : false;

  const getStatusFilter = (status: string) => {
    switch (status) {
      case "حاضر": return "present";
      case "غائب": return "absent";
      case "متأخر": return "late";
      default: return null;
    }
  };

  // Transform data for table to allow searching by student name
  const formattedAttendance = attendance?.map(record => ({
    id: record.id,
    studentName: record.student?.name || "غير معروف",
    studentEmail: record.student?.email || "-",
    materialName: record.session?.material?.name || "غير معروف",
    sessionDate: record.session?.created_at || "",
    sessionTime: record.session?.created_at || "",
    status: "present", // Hardcoded as API doesn't return status yet
    markedAt: record.marked_at,
    original: record
  })) || [];

  const filteredAttendance = formattedAttendance.filter(record => {
    const materialMatch = selectedMaterial === "الكل" || record.materialName === selectedMaterial;
    // const statusMatch = !selectedStatus || selectedStatus === "الكل" || ... 
    return materialMatch;
  });

  const stats = {
    total: attendance?.length || 0,
    present: attendance?.length || 0,
    absent: 0,
    late: 0,
  };



  const getStatusBadge = (status: string) => {
    return <Badge className="bg-success text-success-foreground">حاضر</Badge>;
  };

  console.log("Attendance Data:", attendance);

  const formatDate = (dateValue: string | null | undefined) => {
    if (!dateValue || isNaN(new Date(dateValue).getTime())) return '-';
    return new Date(dateValue).toLocaleDateString('ar-SA');
  };

  const formatTime = (dateValue: string | null | undefined) => {
    if (!dateValue || isNaN(new Date(dateValue).getTime())) return '-';
    return new Date(dateValue).toLocaleTimeString('ar-SA');
  };

  const columns = [
    { key: "materialName", header: "المادة" },
    {
      key: "sessionDate",
      header: "التاريخ",
      render: (record: typeof formattedAttendance[0]) => (
        <span>{formatDate(record.sessionDate)}</span>
      )
    },
    {
      key: "sessionTime",
      header: "وقت الجلسة",
      render: (record: typeof formattedAttendance[0]) => (
        <span>{formatTime(record.sessionTime)}</span>
      )
    },
    {
      key: "status",
      header: "الحالة",
      render: (record: typeof formattedAttendance[0]) => getStatusBadge(record.status)
    },
    {
      key: "markedAt",
      header: "وقت التسجيل",
      render: (record: typeof formattedAttendance[0]) => (
        <span>{formatTime(record.markedAt)}</span>
      )
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  // For teachers, show the TeacherAttendanceStats page content
  if (user?.role === 'teacher' && teacherStats) {
    const pieData = teacherStats.byMaterial.map((item, index) => ({
      name: item.materialName,
      value: item.totalAttendees,
      color: COLORS[index % COLORS.length]
    }));
    return <TeacherAttendanceStatsContent stats={teacherStats} pieData={pieData} />;
  }

  // For admin users, show a message
  if (user?.role === 'admin') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              سجل الحضور
            </h1>
            <p className="text-muted-foreground">عرض سجلات الحضور</p>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">صفحة الحضور للطلاب</h3>
              <p className="text-muted-foreground mb-6">
                هذه الصفحة مخصصة لعرض سجلات حضور الطلاب
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            سجل الحضور
          </h1>
          <p className="text-muted-foreground">عرض سجلات حضورك</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي السجلات
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الحضور
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.present}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                الغياب
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                التأخر
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.late}</div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Rate */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium">نسبة الحضور الإجمالية</span>
              </div>
              <span className="text-2xl font-bold text-success">
                {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-success transition-all"
                style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب المادة" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          data={filteredAttendance}
          columns={columns}
          searchKey="materialName"
          searchPlaceholder="بحث عن مادة..."
        />
      </div>
    </DashboardLayout>
  );
}
