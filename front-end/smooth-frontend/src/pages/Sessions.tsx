import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Play,
  Square,
  Search,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, Session as SessionType, materialsApi, geofencesApi, qrApi } from "@/lib/api";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { useAuth } from "@/contexts/AuthContext";

// Demo data removed

const SessionTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeLeft("انتهت الجلسة");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer(); // Initial call
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [expiresAt]);

  return (
    <div className="text-center">
      <div className="text-2xl font-mono font-bold text-primary mb-1">
        {timeLeft}
      </div>
      <p className="text-sm text-muted-foreground">
        الوقت المتبقي للتسجيل
      </p>
    </div>
  );
};

export default function Sessions() {

  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Queries
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', page, searchQuery], // Include page and search in key
    queryFn: async () => {
      const response = await sessionsApi.getAll(page, 10, searchQuery); // Pass params
      if (response.data?.meta) {
        setTotalPages(response.data.meta.pages);
      }
      return response.data?.sessions || [];
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
  });

  const sessions = sessionsData || [];

  const { data: materials } = useQuery({
    queryKey: ['materials', user?.role],
    queryFn: async () => {
      if (user?.role === 'teacher') {
        const response = await materialsApi.getMyMaterials();
        return response.data?.materials || [];
      }
      const response = await materialsApi.getAll();
      return response.data?.materials || [];
    },
    enabled: !!user // Only run if user is loaded
  });

  const { data: geofences } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const response = await geofencesApi.getAll();
      return response.data?.geofences || [];
    }
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (data: { materialId: string; geofenceId: string; teacherId: string }) => sessionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({ title: "تم إنشاء الجلسة", description: "تم إنشاء جلسة جديدة بنجاح" });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "فشل إنشاء الجلسة", description: error.message, variant: "destructive" });
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: (id: string) => sessionsApi.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({ title: "تم إنهاء الجلسة" });
    },
    onError: (error: Error) => {
      toast({ title: "فشل إنهاء الجلسة", description: error.message, variant: "destructive" });
    }
  });

  const generateQrMutation = useMutation({
    mutationFn: (id: string) => qrApi.generate(id),
    onSuccess: (data) => {
      setQrCodeData(data.data?.qrCode || "");
    },
    onError: (error: Error) => {
      toast({ title: "فشل إنشاء رمز QR", description: error.message, variant: "destructive" });
    }
  });

  // Client-side filtering removed as we do it on server now
  const filteredSessions = sessions;

  const handleCreateSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materialId = formData.get("material") as string;
    const geofenceId = formData.get("geofence") as string;

    // Assuming current user is the teacher or admin selecting a teacher?
    // For now hardcode a teacher ID or get from AuthContext if I had it accessable here.
    // But this page might be Admin view. Admin should probably select teacher?
    // Or if Teacher view, use their ID.
    // The previous code had "Dr. Ahmed" hardcoded.
    // I will use a placeholder teacher ID or user's ID if I can import useAuth.
    // Let's assume for now we just pass a string or if the API handles it from Token.
    // API `create` takes `teacherId`.
    // I'll assume the logged in user is the teacher if role is teacher, or admin selects.
    // Since UI doesn't have Teacher Select, I'll assume logged-in user OR hardcode for now to satisfy type.
    // "1" is a safe bet for dev.
    // Use logged-in user's ID if they are a teacher.
    // If admin, we ideally need a teacher selector, but for now we'll use a placeholder or handle it later.
    // The immediate fix is for the Teacher role.
    const teacherId = user?.role === 'teacher' ? user.id : (user?.id || "1");

    createMutation.mutate({
      materialId,
      geofenceId,
      teacherId
    });
  };

  const handleEndSession = (id: string) => {
    endSessionMutation.mutate(id);
  };


  const handleShowQr = (id: string) => {
    setShowQR(id);
    generateQrMutation.mutate(id);
  };

  // Auto-refresh QR code every 30 seconds when QR dialog is open
  useEffect(() => {
    if (!showQR) return;

    const interval = setInterval(() => {
      generateQrMutation.mutate(showQR);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount or when showQR changes
  }, [showQR]);


  const formatTime = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '-';
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (sessionsLoading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">الجلسات</h1>
            <p className="text-muted-foreground">إدارة جلسات الحضور</p>
          </div>

          {isTeacher && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 ml-2" />
                  جلسة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء جلسة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات الجلسة الجديدة
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSession}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>المادة</Label>
                      <Select name="material" required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials?.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الموقع</Label>
                      <Select name="geofence" required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الموقع" />
                        </SelectTrigger>
                        <SelectContent>
                          {geofences?.map((geofence) => (
                            <SelectItem key={geofence.id} value={geofence.id}>
                              {geofence.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" className="gradient-primary" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الجلسة"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن جلسة..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="ps-10"
          />
        </div>

        {/* Sessions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {session.material?.name || "مادة غير معروفة"}
                    </CardTitle>
                    <CardDescription>{session.teacher?.name || "معلم غير معروف"}</CardDescription>
                  </div>
                  <Badge variant={session.is_active ? "default" : "secondary"}>
                    {session.is_active ? "نشطة" : "منتهية"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {session.geofence?.name || "موقع غير معروف"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(session.created_at)} - {formatTime(session.expires_at)}</span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.attendees} / {session.totalStudents} طالب</span>
                  </div> */}
                </div>

                {/* Progress bar and attendees count removed as Session type in API doesn't have them yet. 
                    If API returned them, I would use them. */ }

                <div className="flex gap-2 pt-2">
                  {session.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShowQr(session.id)}
                    >
                      <QrCode className="h-4 w-4 ml-1" />
                      رمز QR
                    </Button>
                  )}
                  {session.is_active && isTeacher && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEndSession(session.id)}
                      disabled={endSessionMutation.isPending}
                    >
                      <Square className="h-4 w-4 ml-1" />
                      إنهاء
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد جلسات</h3>
            <p className="text-muted-foreground">لم يتم العثور على جلسات مطابقة للبحث</p>
          </Card>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            التالي
          </Button>
        </div>

        {/* QR Dialog */}
        <Dialog open={!!showQR} onOpenChange={() => { setShowQR(null); setQrCodeData(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>رمز QR للحضور</DialogTitle>
              <DialogDescription>
                اعرض هذا الرمز للطلاب لتسجيل حضورهم
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-8">
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {generateQrMutation.isPending ? (
                  <LoadingSpinner />
                ) : qrCodeData ? (
                  <img src={qrCodeData} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 mt-4">
              {(() => {
                const session = sessions.find(s => s.id === showQR);
                if (!session) return null;
                return <SessionTimer expiresAt={session.expires_at} />;
              })()}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              يتم تحديث الرمز تلقائياً كل 30 ثانية لمنع المشاركة
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
