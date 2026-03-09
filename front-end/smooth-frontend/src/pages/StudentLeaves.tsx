import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Plus, Trash2, HeartPulse, Briefcase, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesApi, studentsApi, sessionsApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function StudentLeaves() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Form state
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [leaveType, setLeaveType] = useState<"HEALTH" | "OFFICIAL">("HEALTH");
    const [reason, setReason] = useState("");

    // Data queries
    const { data: leavesData, isLoading } = useQuery({
        queryKey: ["student-leaves"],
        queryFn: async () => {
            const res = await leavesApi.getLeaves();
            return res.data?.records || [];
        },
    });

    const { data: studentsData } = useQuery({
        queryKey: ["students-all"],
        queryFn: async () => {
            const res = await studentsApi.getAll(1, 200, "");
            return res.data?.students || [];
        },
    });

    const { data: sessionsData } = useQuery({
        queryKey: ["sessions-all"],
        queryFn: async () => {
            const res = await sessionsApi.getAll(1, 200, "");
            return res.data?.sessions || [];
        },
    });

    // Grant leave
    const grantMutation = useMutation({
        mutationFn: () =>
            leavesApi.grantLeave({
                studentId: selectedStudent,
                sessionId: selectedSession,
                leaveType,
                reason: reason.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student-leaves"] });
            toast({ title: "تم منح الإجازة بنجاح" });
            setIsDialogOpen(false);
            setSelectedStudent("");
            setSelectedSession("");
            setLeaveType("HEALTH");
            setReason("");
        },
        onError: (error: Error) => {
            toast({
                title: "فشل منح الإجازة",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Revoke leave
    const revokeMutation = useMutation({
        mutationFn: (recordId: string) => leavesApi.revokeLeave(recordId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["student-leaves"] });
            toast({ title: "تم إلغاء الإجازة بنجاح", variant: "destructive" });
        },
        onError: (error: Error) => {
            toast({
                title: "فشل إلغاء الإجازة",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleGrant = () => {
        if (!selectedStudent || !selectedSession) {
            toast({
                title: "يرجى اختيار الطالب والجلسة",
                variant: "destructive",
            });
            return;
        }
        grantMutation.mutate();
    };

    const handleRevoke = (recordId: string) => {
        if (confirm("هل أنت متأكد من إلغاء هذه الإجازة؟")) {
            revokeMutation.mutate(recordId);
        }
    };

    const leaves = leavesData || [];

    const filteredLeaves = leaves.filter((leave: any) => {
        const q = searchQuery.toLowerCase();
        return (
            leave.student?.name?.toLowerCase().includes(q) ||
            leave.student?.student_id?.toLowerCase().includes(q) ||
            leave.session?.material?.name?.toLowerCase().includes(q)
        );
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileCheck className="h-6 w-6 text-primary" />
                            إجازات الطلاب
                        </h1>
                        <p className="text-muted-foreground">
                            منح وإدارة الإجازات الصحية والرسمية للطلاب
                        </p>
                    </div>

                    {/* Grant Leave Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary">
                                <Plus className="h-4 w-4 ms-2" />
                                منح إجازة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>منح إجازة لطالب</DialogTitle>
                                <DialogDescription>
                                    اختر الطالب والجلسة ونوع الإجازة لتسجيلها في النظام
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                {/* Student */}
                                <div className="space-y-2">
                                    <Label>الطالب</Label>
                                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الطالب" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {studentsData?.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name} — {s.student_id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Session */}
                                <div className="space-y-2">
                                    <Label>الجلسة</Label>
                                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الجلسة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sessionsData?.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.material?.name || "مادة غير معروفة"} —{" "}
                                                    {s.created_at
                                                        ? format(new Date(s.created_at), "yyyy/MM/dd", { locale: ar })
                                                        : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Leave Type */}
                                <div className="space-y-2">
                                    <Label>نوع الإجازة</Label>
                                    <Select
                                        value={leaveType}
                                        onValueChange={(v) => setLeaveType(v as "HEALTH" | "OFFICIAL")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HEALTH">
                                                🏥 إجازة صحية
                                            </SelectItem>
                                            <SelectItem value="OFFICIAL">
                                                📋 إجازة رسمية
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label>السبب (اختياري)</Label>
                                    <Textarea
                                        placeholder="أدخل سبب الإجازة..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handleGrant}
                                    className="gradient-primary"
                                    disabled={grantMutation.isPending}
                                >
                                    {grantMutation.isPending ? "جاري المنح..." : "منح الإجازة"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي الإجازات</CardTitle>
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leaves.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجازات صحية</CardTitle>
                            <HeartPulse className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {leaves.filter((l: any) => l.leaveType === "HEALTH").length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجازات رسمية</CardTitle>
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {leaves.filter((l: any) => l.leaveType === "OFFICIAL").length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث بالاسم أو الرقم الجامعي أو المادة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-10"
                    />
                </div>

                {/* Leaves Table */}
                <Card>
                    <CardContent className="pt-6">
                        {filteredLeaves.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">لا توجد إجازات مسجلة</p>
                                <p className="text-sm mt-1">استخدم زر "منح إجازة" لإضافة إجازة جديدة</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm" dir="rtl">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">الطالب</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">الرقم الجامعي</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">المادة</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">نوع الإجازة</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">السبب</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">التاريخ</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeaves.map((leave: any) => (
                                            <tr
                                                key={leave.id}
                                                className="border-b hover:bg-muted/40 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium">
                                                    {leave.student?.name || "—"}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {leave.student?.student_id || "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {leave.session?.material?.name || "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {leave.leaveType === "HEALTH" ? (
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                                                            <HeartPulse className="h-3 w-3" />
                                                            صحية
                                                        </Badge>
                                                    ) : leave.leaveType === "OFFICIAL" ? (
                                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                                                            <Briefcase className="h-3 w-3" />
                                                            رسمية
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">{leave.leaveType}</Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate">
                                                    {leave.reason || "—"}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">
                                                    {leave.marked_at
                                                        ? format(new Date(leave.marked_at), "yyyy/MM/dd", { locale: ar })
                                                        : "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRevoke(leave.id)}
                                                        disabled={revokeMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
