import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await authApi.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || "فشل إرسال البريد الإلكتروني");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
                <Card className="w-full max-w-md shadow-elegant text-center p-6">
                    <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl mb-2">تم الإرسال بنجاح</CardTitle>
                    <CardDescription className="mb-6">
                        تم إرسال تعليمات إعادة تعيين كلمة المرور إلى {email}. يرجى التحقق من بريدك الوارد.
                    </CardDescription>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/login">العودة لتسجيل الدخول</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/40">
            <Card className="w-full max-w-md shadow-elegant">
                <CardHeader>
                    <CardTitle className="text-xl">نسيت كلمة المرور؟</CardTitle>
                    <CardDescription>
                        أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <div className="relative">
                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                            {isLoading ? <LoadingSpinner className="ml-2" /> : "إرسال رابط إعادة التعيين"}
                        </Button>

                        <div className="text-center text-sm">
                            <Link to="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
