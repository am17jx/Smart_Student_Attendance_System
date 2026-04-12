import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";

export default function VerifyEmail() {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage("رمز التحقق مفقود");
            return;
        }

        const verify = async () => {
            try {
                await authApi.verifyEmail(token);
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || "فشل التحقق من البريد الإلكتروني. ربما انتهت صلاحية الرابط.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
            <Card className="w-full max-w-md shadow-elegant text-center p-8">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <LoadingSpinner size="lg" className="mx-auto" />
                        <CardTitle>جاري التحقق...</CardTitle>
                        <CardDescription>يرجى الانتظار بينما نتحقق من بريدك الإلكتروني</CardDescription>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">تم التحقق بنجاح!</CardTitle>
                        <CardDescription>
                            شكراً لك. تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن استخدام حسابك بالكامل.
                        </CardDescription>
                        <div className="pt-4">
                            <Button asChild className="w-full gradient-primary">
                                <Link to="/login">تسجيل الدخول</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">فشل التحقق</CardTitle>
                        <CardDescription className="text-destructive font-medium">
                            {message}
                        </CardDescription>
                        <div className="pt-4">
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/login">العودة لتسجيل الدخول</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
