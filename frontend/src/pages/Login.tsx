import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserCircle, Briefcase, GraduationCap, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [multiRoles, setMultiRoles] = useState<{ role: string; name: string; label: string }[]>([]);

  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const handleLoginResponse = (response: any) => {
    if (response?.status === 'multi_role') {
      setMultiRoles(response.data.roles);
      return;
    }

    if (response?.status === 'must_change_password') {
      sessionStorage.setItem('must_change_password', 'true');
      window.location.replace('/change-password');
      return;
    }

    // Hard navigation so the page reloads fresh with the new user's data
    window.location.replace('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(email, password);
      handleLoginResponse(response);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (role: string) => {
    setError("");
    setIsLoading(true);
    try {
      const response = await login(email, password, role);
      handleLoginResponse(response);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "حدث خطأ في اختيار الوظيفة");
      setIsLoading(false);
    }
  };





  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl mb-4 shadow-elegant overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-foreground"><span>نظام تسجيل حضور الطلاب الذكي</span></h1>
            <p className="text-muted-foreground mt-2"><span>قم بتسجيل الدخول للمتابعة</span></p>
          </div>

          <Card className="border-0 shadow-elegant overflow-hidden">
            <CardHeader className="space-y-1 pb-4 bg-muted/30">
              <CardTitle className="text-xl flex items-center gap-2">
                {multiRoles.length > 0 ? (
                  <>
                    <button
                      onClick={() => setMultiRoles([])}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span>اختر الوظيفة للمتابعة</span>
                  </>
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </CardTitle>
              <CardDescription>
                {multiRoles.length > 0
                  ? <span>تم العثور على أكثر من وظيفة مرتبطة بهذا الحساب</span>
                  : <span>أدخل بياناتك للوصول إلى حسابك</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {multiRoles.length > 0 ? (
                <div className="space-y-3 animate-slide-up">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription><span>{error}</span></AlertDescription>
                    </Alert>
                  )}
                  {multiRoles.map((roleObj) => (
                    <Button
                      key={roleObj.role}
                      variant="outline"
                      className="w-full h-16 justify-between px-6 hover:border-primary hover:bg-primary/5 transition-all group"
                      onClick={() => handleSelectRole(roleObj.role)}
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          {roleObj.role === 'admin' && <Briefcase className="h-5 w-5" />}
                          {roleObj.role === 'teacher' && <UserCircle className="h-5 w-5" />}
                          {roleObj.role === 'student' && <GraduationCap className="h-5 w-5" />}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold"><span>{roleObj.label}</span></p>
                          <p className="text-xs text-muted-foreground"><span>{roleObj.name}</span></p>
                        </div>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-[-4px] transition-all" />
                    </Button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="animate-scale-in">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription><span>{error}</span></AlertDescription>
                    </Alert>
                  )}

                  {isExpired && !error && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800 animate-scale-in">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription><span>انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.</span></AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email"><span>البريد الإلكتروني</span></Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password"><span>كلمة المرور</span></Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-10 pe-10"
                        required
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      <span>نسيت كلمة المرور؟</span>
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="ml-2 border-primary-foreground border-t-transparent" />
                        <span>جاري تسجيل الدخول...</span>
                      </>
                    ) : (
                      <span>تسجيل الدخول</span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}

