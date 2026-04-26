import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Lock, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordValidator } from "@/components/auth/PasswordValidator";

export default function ChangePassword() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isForced = location.state?.forced === true || sessionStorage.getItem('must_change_password') === 'true';

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }

        const validatePassword = (p: string) => {
            const hasUpper = /[A-Z]/.test(p);
            const hasLower = /[a-z]/.test(p);
            const hasNumber = /[0-9]/.test(p);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(p);
            return p.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
        };

        if (!validatePassword(newPassword)) {
            setError("كلمة المرور لا تستوفي المعايير الأمنية المطلوبة (8 أحرف، حرف كبير، حرف صغير، رقم، ورمز خاص)");
            return;
        }

        setIsLoading(true);

        try {
            // Use the new /change-my-password endpoint (JWT-based, no ID needed)
            const body: Record<string, string> = { newPassword };
            // Only send oldPassword if not forced (not a temp password flow)
            if (!isForced && oldPassword) body.oldPassword = oldPassword;

            await authApi.changeMyPassword(body.newPassword, body.oldPassword);
            // Clear the forced-change flag from sessionStorage
            sessionStorage.removeItem('must_change_password');
            // Navigate immediately, refresh profile in background
            navigate("/dashboard");
            refreshUser(); // fire-and-forget — updates user state after navigation
        } catch (err: any) {
            setError(err.message || "فشل تغيير كلمة المرور");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
            <Card className="w-full max-w-md shadow-elegant">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">تغيير كلمة المرور</CardTitle>
                    </div>
                    <CardDescription>
                        {isForced
                            ? "لأسباب أمنية، يجب عليك تغيير كلمة المرور المؤقتة قبل المتابعة."
                            : "تحديث كلمة المرور الخاصة بك لتحسين أمان الحساب."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Only ask for old password if NOT forced (not temp password flow) */}
                        {!isForced && (
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">كلمة المرور الحالية</Label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="ps-10"
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>
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
                            <PasswordValidator password={newPassword} />
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
                            disabled={isLoading}
                        >
                            {isLoading ? <LoadingSpinner className="ml-2" /> : "تأكيد وتغيير كلمة المرور"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
