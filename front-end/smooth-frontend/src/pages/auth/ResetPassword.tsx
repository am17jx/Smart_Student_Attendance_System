import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }

        if (newPassword.length < 8) {
            setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
            return;
        }

        setIsLoading(true);

        try {
            if (!token) throw new Error("رمز التحقق مفقود");
            await authApi.resetPassword(token, newPassword);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "فشل إعادة تعيين كلمة المرور");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
                <Card className="w-full max-w-md shadow-elegant text-center p-6">
                    <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl mb-2">تم تغيير كلمة المرور</CardTitle>
                    <CardDescription className="mb-6">
                        تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
                    </CardDescription>
                    <Button asChild className="w-full gradient-primary">
                        <Link to="/login">تسجيل الدخول</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
            <Card className="w-full max-w-md shadow-elegant">
                <CardHeader>
                    <CardTitle className="text-xl">تعيين كلمة مرور جديدة</CardTitle>
                    <CardDescription>
                        أدخل كلمة المرور الجديدة لحسابك
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!token && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>رابط غير صالح (الرمز مفقود)</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="ps-10"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="ps-10"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gradient-primary"
                            disabled={isLoading || !token}
                        >
                            {isLoading ? <LoadingSpinner className="ml-2" /> : "حفظ كلمة المرور"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
