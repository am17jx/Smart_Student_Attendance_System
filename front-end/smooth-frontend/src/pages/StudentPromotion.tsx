import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, stagesApi, promotionApi, PromotionPreview } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GraduationCap, ArrowRight, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

export default function StudentPromotion() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);

    // Form state
    const [departmentId, setDepartmentId] = useState("");
    const [stageId, setStageId] = useState("");
    const [fromYear, setFromYear] = useState("");
    const [toYear, setToYear] = useState("");

    // Fetch departments
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await departmentsApi.getAll();
            return response.data?.departments || [];
        }
    });

    // Fetch stages
    const { data: stages } = useQuery({
        queryKey: ['stages'],
        queryFn: async () => {
            const response = await stagesApi.getAll();
            return response.data?.stages || [];
        }
    });

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: () => promotionApi.getPreview(departmentId, stageId, fromYear),
        onSuccess: () => {
            setStep(2);
        },
        onError: (error: Error) => {
            toast({ title: "فشل جلب المعاينة", description: error.message, variant: "destructive" });
        }
    });

    // Execute mutation
    const executeMutation = useMutation({
        mutationFn: () => promotionApi.execute({
            department_id: departmentId,
            stage_id: stageId,
            from_year: fromYear,
            to_year: toYear,
        }),
        onSuccess: (data) => {
            toast({ title: "تم الترحيل بنجاح!", description: data.message });
            setStep(3);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
        onError: (error: Error) => {
            toast({ title: "فشل الترحيل", description: error.message, variant: "destructive" });
        }
    });

    const handleNext = () => {
        if (!departmentId || !stageId || !fromYear || !toYear) {
            toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" });
            return;
        }
        previewMutation.mutate();
    };

    const handleExecute = () => {
        if (confirm("هل أنت متأكد من تنفيذ عملية الترحيل؟ لا يمكن التراجع عن هذه العملية!")) {
            executeMutation.mutate();
        }
    };

    const getDecisionBadge = (decision: string) => {
        switch (decision) {
            case 'PROMOTED':
                return <Badge className="bg-success"><CheckCircle2 className="h-3 w-3 ml-1 inline" />ترقية كاملة</Badge>;
            case 'PROMOTED_WITH_CARRY':
                return <Badge className="bg-warning"><AlertCircle className="h-3 w-3 ml-1 inline" />ترقية مع تحميل</Badge>;
            case 'REPEAT_YEAR':
                return <Badge variant="destructive"><RotateCcw className="h-3 w-3 ml-1 inline" />إعادة</Badge>;
            default:
                return <Badge>{decision}</Badge>;
        }
    };

    const previewColumns = [
        { key: "studentName", header: "اسم الطالب" },
        { key: "studentNumber", header: "الرقم الجامعي" },
        { key: "currentStage", header: "المرحلة الحالية" },
        {
            key: "decision",
            header: "القرار",
            render: (row: PromotionPreview) => getDecisionBadge(row.decision)
        },
        { key: "failedCount", header: "عدد المواد الراسبة" },
        {
            key: "failedSubjects",
            header: "المواد الراسبة",
            render: (row: PromotionPreview) => (
                <span className="text-sm text-muted-foreground">
                    {row.failedSubjects.map(s => s.name).join(", ") || "-"}
                </span>
            )
        },
        {
            key: "nextStage",
            header: "المرحلة القادمة",
            render: (row: PromotionPreview) => row.nextStage || row.currentStage || "-"
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        ترحيل الطلاب
                    </h1>
                    <p className="text-muted-foreground">نقل الطلاب من مرحلة إلى أخرى بناءً على نتائجهم</p>
                </div>

                {/* Step 1: Selection */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>الخطوة 1: اختيار المعايير</CardTitle>
                            <CardDescription>حدد القسم والمرحلة والسنة الدراسية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>القسم</Label>
                                    <Select value={departmentId} onValueChange={setDepartmentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر القسم" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments?.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>المرحلة</Label>
                                    <Select value={stageId} onValueChange={setStageId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المرحلة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages?.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>السنة الدراسية الحالية</Label>
                                    <Input
                                        placeholder="مثال: 2024-2025"
                                        value={fromYear}
                                        onChange={(e) => setFromYear(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>السنة الدراسية القادمة</Label>
                                    <Input
                                        placeholder="مثال: 2025-2026"
                                        value={toYear}
                                        onChange={(e) => setToYear(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleNext}
                                    disabled={previewMutation.isPending}
                                    className="gradient-primary"
                                >
                                    {previewMutation.isPending ? "جاري التحميل..." : "معاينة النتائج"}
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Preview */}
                {step === 2 && previewMutation.data && (
                    <Card>
                        <CardHeader>
                            <CardTitle>الخطوة 2: معاينة نتائج الترحيل</CardTitle>
                            <CardDescription>راجع القرارات قبل التنفيذ النهائي</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="p-4 bg-success/10 rounded-lg">
                                    <div className="text-sm text-muted-foreground">ترقية كاملة</div>
                                    <div className="text-2xl font-bold text-success">
                                        {previewMutation.data.data?.filter((s: PromotionPreview) => s.decision === 'PROMOTED').length || 0}
                                    </div>
                                </div>
                                <div className="p-4 bg-warning/10 rounded-lg">
                                    <div className="text-sm text-muted-foreground">ترقية مع تحميل</div>
                                    <div className="text-2xl font-bold text-warning">
                                        {previewMutation.data.data?.filter((s: PromotionPreview) => s.decision === 'PROMOTED_WITH_CARRY').length || 0}
                                    </div>
                                </div>
                                <div className="p-4 bg-destructive/10 rounded-lg">
                                    <div className="text-sm text-muted-foreground">إعادة</div>
                                    <div className="text-2xl font-bold text-destructive">
                                        {previewMutation.data.data?.filter((s: PromotionPreview) => s.decision === 'REPEAT_YEAR').length || 0}
                                    </div>
                                </div>
                            </div>

                            <DataTable
                                data={previewMutation.data.data || []}
                                columns={previewColumns}
                                pageSize={100}
                            />

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    العودة
                                </Button>
                                <Button
                                    onClick={handleExecute}
                                    disabled={executeMutation.isPending}
                                    className="bg-primary"
                                >
                                    {executeMutation.isPending ? "جاري التنفيذ..." : "تأكيد وتنفيذ الترحيل"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-success">
                                <CheckCircle2 className="h-6 w-6" />
                                تم الترحيل بنجاح!
                            </CardTitle>
                            <CardDescription>تم نقل الطلاب إلى المرحلة القادمة</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => { setStep(1); setDepartmentId(""); setStageId(""); setFromYear(""); setToYear(""); }}>
                                بدء عملية ترحيل جديدة
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
