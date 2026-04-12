import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { promotionApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    GraduationCap, Search, CheckCircle2, XCircle, AlertCircle,
    Users, ArrowUpCircle, RotateCcw, ArrowRight
} from "lucide-react";

// توليد خيارات السنوات الدراسية
function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = -2; i <= 3; i++) {
        years.push(`${currentYear + i}-${currentYear + i + 1}`);
    }
    return years;
}

interface EligibleStudent {
    studentId: string;
    studentName: string;
    studentNumber: string;
    currentStage: string | null;
    currentStageId: string | null;
    decision: string;
    failedCount: number;
    carriedCount: number;
    failedSubjects: Array<{ id: string; name: string }>;
    carriedSubjects: Array<{ id: string; name: string }>;
    nextStage: string | null;
    nextStageId: string | null;
    departmentName: string | null;
    departmentId: string | null;
}

export default function StudentPromotion() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // الحالة
    const [step, setStep] = useState(1);
    const [fromYear, setFromYear] = useState("");

    // السنة القادمة تُحسب تلقائياً
    const toYear = useMemo(() => {
        if (!fromYear) return "";
        const parts = fromYear.split("-");
        if (parts.length === 2) return `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
        return "";
    }, [fromYear]);
    const [students, setStudents] = useState<EligibleStudent[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [promoteMode, setPromoteMode] = useState<"selected" | "all">("selected");

    const yearOptions = useMemo(() => generateYearOptions(), []);

    // إحصائيات
    const stats = useMemo(() => {
        const total = students.length;
        const passed = students.filter(s => s.decision === "PROMOTED").length;
        const carry = students.filter(s => s.decision === "PROMOTED_WITH_CARRY").length;
        const failed = students.filter(s => s.decision === "REPEAT_YEAR").length;
        return { total, passed, carry, failed };
    }, [students]);

    // جلب الطلاب المؤهلين
    const fetchEligible = useMutation({
        mutationFn: () => promotionApi.getEligible(fromYear),
        onSuccess: (response: any) => {
            const data: EligibleStudent[] = response?.data || response || [];
            setStudents(data);

            // تحديد الناجحين تلقائياً
            const autoSelected = new Set<string>();
            data.forEach(s => {
                if (s.decision === "PROMOTED" || s.decision === "PROMOTED_WITH_CARRY") {
                    autoSelected.add(s.studentId);
                }
            });
            setSelectedIds(autoSelected);
            setStep(2);
        },
        onError: (error: Error) => {
            toast({ title: "فشل جلب البيانات", description: error.message, variant: "destructive" });
        }
    });

    // تنفيذ الترحيل
    const executePromotion = useMutation({
        mutationFn: (ids: string[]) => promotionApi.executeSelected({
            student_ids: ids,
            from_year: fromYear,
            to_year: toYear,
        }),
        onSuccess: (response) => {
            setShowConfirmModal(false);
            setStep(3);
            toast({ title: "تم الترحيل بنجاح!", description: response.message || "تم نقل الطلاب" });
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
        onError: (error: Error) => {
            setShowConfirmModal(false);
            toast({ title: "فشل الترحيل", description: error.message, variant: "destructive" });
        }
    });

    // التعامل مع التحديد
    const toggleStudent = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.studentId)));
        }
    };

    const handlePromoteSelected = () => {
        if (selectedIds.size === 0) {
            toast({ title: "لم يتم تحديد أي طالب", variant: "destructive" });
            return;
        }
        setPromoteMode("selected");
        setShowConfirmModal(true);
    };

    const handlePromoteAll = () => {
        setPromoteMode("all");
        setShowConfirmModal(true);
    };

    const confirmPromotion = () => {
        const ids = promoteMode === "all"
            ? students.map(s => s.studentId)
            : Array.from(selectedIds);
        executePromotion.mutate(ids);
    };

    const getStatusBadge = (decision: string) => {
        switch (decision) {
            case "PROMOTED":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"><CheckCircle2 className="h-3 w-3" />ناجح</Badge>;
            case "PROMOTED_WITH_CARRY":
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1"><AlertCircle className="h-3 w-3" />ناجح بتحميل</Badge>;
            case "REPEAT_YEAR":
                return <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1"><XCircle className="h-3 w-3" />راسب</Badge>;
            default:
                return <Badge variant="secondary">{decision}</Badge>;
        }
    };

    const handleStart = () => {
        if (!fromYear) {
            toast({ title: "يرجى اختيار السنة الدراسية", variant: "destructive" });
            return;
        }
        fetchEligible.mutate();
    };

    const resetAll = () => {
        setStep(1);
        setFromYear("");
        setStudents([]);
        setSelectedIds(new Set());
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <GraduationCap className="h-7 w-7 text-primary" />
                            </div>
                            ترحيل الطلاب
                        </h1>
                        <p className="text-muted-foreground mt-1">نقل الطلاب إلى المرحلة التالية بناءً على نتائجهم</p>
                    </div>

                    {/* مؤشر الخطوات */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                    ${step >= s ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"}`}>
                                    {s}
                                </div>
                                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== الخطوة 1: اختيار السنة ===== */}
                {step === 1 && (
                    <Card className="shadow-lg border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl">اختيار السنة الدراسية</CardTitle>
                            <CardDescription>حدد السنة الدراسية الحالية وسيتم تحديد القادمة تلقائياً</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="max-w-md mx-auto space-y-2">
                                <label className="text-sm font-medium">السنة الدراسية الحالية</label>
                                <Select value={fromYear} onValueChange={setFromYear}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {toYear && (
                                    <p className="text-sm text-muted-foreground text-center mt-2">
                                        السنة القادمة: <span className="font-semibold text-primary">{toYear}</span>
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleStart}
                                disabled={fetchEligible.isPending}
                                className="w-full h-14 text-lg font-semibold gradient-primary shadow-lg"
                                size="lg"
                            >
                                {fetchEligible.isPending ? (
                                    <><LoadingSpinner className="h-5 w-5 ml-2" /> جاري البحث...</>
                                ) : (
                                    <><Search className="h-5 w-5 ml-2" /> عرض الطلبة المؤهلين للترحيل</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ===== الخطوة 2: عرض الطلاب ===== */}
                {step === 2 && (
                    <>
                        {/* بطاقات الإحصائيات */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">ناجح</p>
                                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.passed}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <AlertCircle className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">ناجح بتحميل</p>
                                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.carry}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">راسب</p>
                                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failed}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* السنة المحددة */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>الترحيل من</span>
                            <Badge variant="outline" className="font-mono">{fromYear}</Badge>
                            <ArrowRight className="h-4 w-4" />
                            <Badge variant="outline" className="font-mono">{toYear}</Badge>
                            <span className="mr-auto" />
                            <span className="text-primary font-medium">{selectedIds.size} محدد</span>
                        </div>

                        {/* جدول الطلاب */}
                        <Card className="shadow-lg border-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                {students.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-muted-foreground">لا يوجد طلاب مؤهلون للترحيل</p>
                                        <p className="text-sm text-muted-foreground/60 mt-1">تأكد من أن الطلاب لديهم تسجيلات في السنة المحددة</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>العودة</Button>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-right w-12">
                                                    <Checkbox
                                                        checked={selectedIds.size === students.length && students.length > 0}
                                                        onCheckedChange={toggleAll}
                                                    />
                                                </th>
                                                <th className="p-3 text-right font-medium">اسم الطالب</th>
                                                <th className="p-3 text-right font-medium">القسم</th>
                                                <th className="p-3 text-right font-medium">المرحلة الحالية</th>
                                                <th className="p-3 text-center font-medium">الحالة</th>
                                                <th className="p-3 text-right font-medium">المرحلة القادمة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr
                                                    key={student.studentId}
                                                    className={`border-b transition-colors hover:bg-muted/30 ${selectedIds.has(student.studentId) ? "bg-primary/5" : ""}`}
                                                >
                                                    <td className="p-3">
                                                        <Checkbox
                                                            checked={selectedIds.has(student.studentId)}
                                                            onCheckedChange={() => toggleStudent(student.studentId)}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-medium">{student.studentName}</div>
                                                        <div className="text-xs text-muted-foreground">{student.studentNumber}</div>
                                                    </td>
                                                    <td className="p-3 text-sm">{student.departmentName || "-"}</td>
                                                    <td className="p-3 text-sm">{student.currentStage || "-"}</td>
                                                    <td className="p-3 text-center">{getStatusBadge(student.decision)}</td>
                                                    <td className="p-3 text-sm">
                                                        {student.decision === "REPEAT_YEAR"
                                                            ? <span className="text-red-500">{student.currentStage} (إعادة)</span>
                                                            : <span className="text-emerald-600">{student.nextStage || "-"}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </Card>

                        {/* أزرار الإجراءات */}
                        {students.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="sm:ml-auto">
                                    <RotateCcw className="h-4 w-4 ml-2" /> العودة
                                </Button>
                                <Button
                                    onClick={handlePromoteSelected}
                                    disabled={selectedIds.size === 0}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    <ArrowUpCircle className="h-4 w-4 ml-2" />
                                    ترحيل المحددين ({selectedIds.size})
                                </Button>
                                <Button
                                    onClick={handlePromoteAll}
                                    className="gradient-primary shadow-md"
                                >
                                    <ArrowUpCircle className="h-4 w-4 ml-2" />
                                    ترحيل الكل ({students.length})
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* ===== الخطوة 3: النجاح ===== */}
                {step === 3 && (
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-12 text-center">
                            <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">تم الترحيل بنجاح!</h2>
                            <p className="text-muted-foreground mb-6">تم نقل الطلاب إلى المرحلة القادمة بنجاح</p>
                            <Button onClick={resetAll} size="lg" className="gradient-primary">
                                بدء عملية ترحيل جديدة
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ===== نافذة التأكيد ===== */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-md mx-4 shadow-2xl border-0">
                            <CardHeader className="text-center pb-2">
                                <div className="inline-flex p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto mb-3">
                                    <AlertCircle className="h-8 w-8 text-amber-600" />
                                </div>
                                <CardTitle className="text-xl">تأكيد الترحيل</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <p className="text-muted-foreground leading-relaxed">
                                    سيتم ترحيل{" "}
                                    <span className="font-bold text-foreground">
                                        {promoteMode === "all" ? students.length : selectedIds.size}
                                    </span>
                                    {" "}طالب إلى السنة الدراسية{" "}
                                    <span className="font-bold text-foreground">{toYear}</span>.
                                    <br />
                                    هل أنت متأكد؟
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowConfirmModal(false)}
                                        disabled={executePromotion.isPending}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        className="flex-1 gradient-primary"
                                        onClick={confirmPromotion}
                                        disabled={executePromotion.isPending}
                                    >
                                        {executePromotion.isPending ? (
                                            <><LoadingSpinner className="h-4 w-4 ml-2" /> جاري الترحيل...</>
                                        ) : "تأكيد الترحيل"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
