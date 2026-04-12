import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { departmentsApi, promotionApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Settings } from "lucide-react";

export default function PromotionConfig() {
    const { toast } = useToast();
    const [departmentId, setDepartmentId] = useState("");

    // Fetch departments
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const response = await departmentsApi.getAll();
            return response.data?.departments || [];
        }
    });

    // Fetch config for selected department
    const { data: config, isLoading, refetch } = useQuery({
        queryKey: ['promotion-config', departmentId],
        queryFn: async () => {
            if (!departmentId) return null;
            const response = await promotionApi.getConfig(departmentId);
            return response.data;
        },
        enabled: !!departmentId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => promotionApi.updateConfig(departmentId, data),
        onSuccess: () => {
            toast({ title: "تم حفظ الإعدادات بنجاح" });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: "فشل حفظ الإعدادات", description: error.message, variant: "destructive" });
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            maxCarrySubjects: parseInt(formData.get("maxCarrySubjects") as string),
            failThresholdForRepeat: parseInt(formData.get("failThresholdForRepeat") as string),
            disableCarryForFinalYear: formData.get("disableCarryForFinalYear") === "on",
            blockCarryForCore: formData.get("blockCarryForCore") === "on",
            repeatMode: formData.get("repeatMode") as string,
        };

        updateMutation.mutate(data);
    };

    if (!departmentId) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Settings className="h-6 w-6 text-primary" />
                            إعدادات الترحيل
                        </h1>
                        <p className="text-muted-foreground">ضبط قواعد ترحيل الطلاب لكل قسم</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>اختر القسم</CardTitle>
                            <CardDescription>حدد القسم لعرض/تعديل إعداداته</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (isLoading) return <LoadingSpinner />;

    const currentConfig = config || {
        maxCarrySubjects: 2,
        failThresholdForRepeat: 3,
        disableCarryForFinalYear: false,
        blockCarryForCore: false,
        repeatMode: 'repeat_failed_only',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Settings className="h-6 w-6 text-primary" />
                            إعدادات الترحيل
                        </h1>
                        <p className="text-muted-foreground">ضبط قواعد ترحيل الطلاب</p>
                    </div>
                    <Button variant="outline" onClick={() => setDepartmentId("")}>
                        تغيير القسم
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>قواعد الترحيل</CardTitle>
                            <CardDescription>تحكم في شروط الترقية والتحميل والإعادة</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>أقصى عدد للمواد المحمّلة</Label>
                                    <Input
                                        name="maxCarrySubjects"
                                        type="number"
                                        min="0"
                                        max="5"
                                        defaultValue={currentConfig.maxCarrySubjects}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        الحد الأقصى لعدد المواد التي يمكن للطالب حملها للمرحلة القادمة
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>حد الرسوب للإعادة</Label>
                                    <Input
                                        name="failThresholdForRepeat"
                                        type="number"
                                        min="1"
                                        max="10"
                                        defaultValue={currentConfig.failThresholdForRepeat}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        إذا رسب الطالب في هذا العدد أو أكثر، يُعيد السنة
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>منع التحميل في السنة الأخيرة</Label>
                                        <p className="text-sm text-muted-foreground">
                                            عدم السماح بتحميل مواد في المرحلة النهائية
                                        </p>
                                    </div>
                                    <Switch
                                        name="disableCarryForFinalYear"
                                        defaultChecked={currentConfig.disableCarryForFinalYear}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>منع تحميل المواد الأساسية</Label>
                                        <p className="text-sm text-muted-foreground">
                                            عدم السماح بتحميل المواد المحددة كأساسية
                                        </p>
                                    </div>
                                    <Switch
                                        name="blockCarryForCore"
                                        defaultChecked={currentConfig.blockCarryForCore}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>نمط الإعادة</Label>
                                    <Select name="repeatMode" defaultValue={currentConfig.repeatMode}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="repeat_failed_only">إعادة المواد الراسبة فقط</SelectItem>
                                            <SelectItem value="repeat_full_year">إعادة السنة كاملة</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        كيف يُعيد الطالب عند رسوبه
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full gradient-primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    );
}
