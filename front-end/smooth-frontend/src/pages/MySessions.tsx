import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, StopCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, Session, attendanceApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function MySessions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['my-sessions', page, searchQuery],
        queryFn: async () => {
            const response = await sessionsApi.getMySessions(page, 10, searchQuery);
            if (response.data?.meta) {
                setTotalPages(response.data.meta.pages);
            }
            return response.data?.sessions || [];
        }
    });

    const endSessionMutation = useMutation({
        mutationFn: (id: string) => sessionsApi.end(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
            toast({ title: "تم إنهاء الجلسة بنجاح" });
        },
        onError: (error: Error) => {
            toast({ title: "فشل إنهاء الجلسة", description: error.message, variant: "destructive" });
        }
    });

    const handleEndSession = (id: string) => {
        if (confirm("هل أنت متأكد من إنهاء هذه الجلسة؟")) {
            endSessionMutation.mutate(id);
        }
    };





    const columns = [
        {
            key: "material",
            header: "المادة",
            render: (s: Session) => s.material?.name || "Unknown"
        },
        {
            key: "geofence",
            header: "الموقع الجغرافي",
            render: (s: Session) => (
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {s.geofence?.name || "Unknown"}
                </div>
            )
        },
        {
            key: "status",
            header: "الحالة",
            render: (s: Session) => (
                <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "نشطة" : "منتهية"}
                </Badge>
            )
        },
        {
            key: "created_at",
            header: "تاريخ الإنشاء",
            render: (s: Session) => format(new Date(s.created_at), "PPP p", { locale: ar })
        },
        {
            key: "actions",
            header: "الإجراءات",
            render: (s: Session) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={`/sessions/${s.id}`}>
                            <Eye className="h-4 w-4 ms-2" />
                            التفاصيل
                        </Link>
                    </Button>

                    {s.is_active && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEndSession(s.id)}
                            disabled={endSessionMutation.isPending}
                        >
                            <StopCircle className="h-4 w-4 ms-2" />
                            إنهاء
                        </Button>
                    )}
                </div>
            )
        }
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-primary" />
                            جلساتي
                        </h1>
                        <p className="text-muted-foreground">عرض وإدارة الجلسات التي قمت بإنشائها</p>
                    </div>

                    <Button asChild className="gradient-primary">
                        <Link to="/sessions">
                            <Clock className="h-4 w-4 ms-2" />
                            إدارة الجلسات العامة
                        </Link>
                    </Button>
                </div>

                <DataTable
                    data={sessionsData || []}
                    columns={columns}
                    searchKey="material"
                />


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
            </div>
        </DashboardLayout>
    );
}
