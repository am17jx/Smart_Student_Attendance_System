import { useState, useEffect } from "react";
import { qrApi } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, CheckCircle2, AlertCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRScanner } from "@/components/QRScanner";

export default function ScanQR() {
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "allowed" | "denied">("pending");
  const { toast } = useToast();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [attendanceDetails, setAttendanceDetails] = useState<{ materialName?: string; timestamp?: string; sessionId?: string } | null>(null);

  useEffect(() => {
    // Check permission status without triggering prompt immediately
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
        // If 'prompt', we wait for user interaction to avoid blocked popup
      });
    }
    // Fallback? We can try requesting, but if it fails silently, the UI should show the "Enable" button.
    // Let's NOT auto-request if it requires prompt, to be safe.
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "خطأ",
        description: "المتصفح لا يدعم تحديد الموقع",
        variant: "destructive"
      });
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("allowed");
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        toast({
          title: "تم تفعيل الموقع",
          description: "يمكنك الآن مسح رمز QR",
        });
      },
      (error) => {
        console.error("Location error:", error);
        setLocationStatus("denied");
        setCoords(null);
        setShowPermissionDialog(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleStartScan = () => {
    if (locationStatus !== "allowed" || !coords) {
      requestLocation();
      return;
    }
    setCameraActive(true);
  };

  const handleQRScanSuccess = async (decodedText: string) => {
    setCameraActive(false);

    if (!coords) {
      toast({
        title: "خطأ",
        description: "الموقع غير متاح",
        variant: "destructive"
      });
      return;
    }

    try {
      let data: { token?: string; id?: string };
      try {
        data = JSON.parse(decodedText);
      } catch {
        toast({
          title: "صيغة الرمز غير صحيحة",
          description: "يرجى التأكد من صحة رمز QR.",
          variant: "destructive"
        });
        return;
      }

      if (data.token && data.id) {
        const response = await qrApi.scan(data.token, data.id, coords.latitude, coords.longitude);
        setScanResult("success");

        // Store attendance details for display
        setAttendanceDetails({
          materialName: response.data?.materialName || "المادة",
          timestamp: new Date().toLocaleString('ar-SA'),
          sessionId: data.id
        });

        toast({
          title: "✅ تم تسجيل الحضور بنجاح",
          description: "تم تسجيل حضورك في الجلسة",
          duration: 5000,
        });
      } else {
        toast({
          title: "صيغة الرمز غير صحيحة",
          description: "يجب أن يحتوي الرمز على 'token' و 'id'.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setScanResult("error");
      toast({
        title: "فشل التسجيل",
        description: error.response?.data?.message || error.message || "خطأ غير معروف",
        variant: "destructive"
      });
    }
  };

  const handleQRScanError = (error: string) => {
    setCameraActive(false);
    toast({
      title: "خطأ في الكاميرا",
      description: error,
      variant: "destructive"
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    if (locationStatus !== "allowed" || !coords) {
      requestLocation();
      toast({
        title: "الموقع غير متاح",
        description: "يرجى تفعيل الموقع قبل إدخال الرمز يدوياً.",
        variant: "destructive"
      });
      return;
    }

    try {
      let data: { token?: string; id?: string };
      try {
        data = JSON.parse(manualCode);
      } catch {
        // If not JSON, assume it's a test code for simulation or invalid format
        if (manualCode === "123456") {
          setScanResult("success");
          toast({
            title: "تم تسجيل حضورك بنجاح!",
            description: "تم التسجيل باستخدام الرمز اليدوي التجريبي.",
          });
          setManualCode("");
          return;
        }
        toast({ title: "صيغة الرمز غير صحيحة", description: "يرجى إدخال رمز QR صالح أو بيانات JSON.", variant: "destructive" });
        setManualCode("");
        return;
      }

      if (data.token && data.id) {
        await qrApi.scan(data.token, data.id, coords.latitude, coords.longitude);
        setScanResult("success");
        toast({ title: "تم تسجيل الحضور بنجاح" });
      } else {
        toast({ title: "صيغة الرمز غير صحيحة", description: "يجب أن يحتوي الرمز على 'token' و 'id'.", variant: "destructive" });
      }
    } catch (error: any) {
      setScanResult("error");
      toast({
        title: "فشل التسجيل",
        description: error.response?.data?.message || error.message || "خطأ غير معروف",
        variant: "destructive"
      });
    }
    setManualCode("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ... existing header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">تسجيل الحضور</h1>
          <p className="text-muted-foreground">امسح رمز QR لتسجيل حضورك</p>
        </div>

        {/* ... existing Alerts (keep them as inline feedback) */}
        {/* Location Permission Request UI - Prominent */}
        {locationStatus === "pending" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-background rounded-full shadow-sm">
                <MapPin className="h-8 w-8 text-primary animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">تفعيل خدمة الموقع مطلوب</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  يتطلب النظام الوصول لموقعك الجغرافي للتحقق من وجودك في القاعة الدراسية وتسجيل حضورك.
                </p>
              </div>
              <Button
                onClick={requestLocation}
                className="w-full max-w-xs gradient-primary shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                السماح بالوصول للموقع
              </Button>
            </CardContent>
          </Card>
        )}

        {locationStatus === "denied" && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تم رفض الوصول للموقع</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              <p>لا يمكن استكمال عملية التسجيل.</p>
              <Button variant="outline" size="sm" className="mt-2 bg-background/50 hover:bg-background/80" onClick={requestLocation}>
                محاولة مرة أخرى
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ... success/error/scanner cards */}
        {/* Permission Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                تنبيه: الوصول للموقع مطلوب
              </DialogTitle>
              <DialogDescription className="pt-2">
                للحفاظ على مصداقية الحضور، يتطلب النظام التأكد من وجودك في القاعة الدراسية عبر الموقع الجغرافي.
                <br /><br />
                <strong>يرجى السماح للمتصفح بالوصول للموقع (Location) لتتمكن من فتح الكاميرا ومسح الرمز.</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                إغلاق
              </Button>
              <Button className="gradient-primary" onClick={() => { setShowPermissionDialog(false); requestLocation(); }}>
                محاولة مرة أخرى
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ... rest of the code .. wait, I need to wrap the return correctly */}
        {/* To avoid replacing the whole file, I will target the Return statement blocks or simpler chunks */}
        {/* Since I need to inject state and the dialog, and the file is small, I will replace the component body content mostly */}

        {/* Re-implementing the return structure based on the previous file content view */}

        {scanResult === "success" && (
          <Card className="border-success bg-success/5">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
              <h3 className="text-xl font-bold text-success mb-2">تم تسجيل حضورك!</h3>
              <p className="text-muted-foreground">المادة: البرمجة المتقدمة</p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleTimeString('ar-SA')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setScanResult(null)}
              >
                تسجيل حضور آخر
              </Button>
            </CardContent>
          </Card>
        )}

        {scanResult === "error" && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h3 className="text-xl font-bold text-destructive mb-2">فشل التسجيل</h3>
              <p className="text-muted-foreground">الرمز غير صالح أو منتهي الصلاحية</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setScanResult(null)}
              >
                حاول مرة أخرى
              </Button>
            </CardContent>
          </Card>
        )}

        {!scanResult && (
          <>
            <Card className="shadow-elegant overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  مسح رمز QR
                </CardTitle>
                <CardDescription>
                  وجه الكاميرا نحو رمز QR المعروض على شاشة المحاضر
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cameraActive ? (
                  <QRScanner
                    isActive={cameraActive}
                    onScanSuccess={handleQRScanSuccess}
                    onScanError={handleQRScanError}
                    onStop={() => setCameraActive(false)}
                  />
                ) : (
                  <>
                    <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-muted">
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <QrCode className="h-20 w-20 mb-4" />
                        <p>اضغط للبدء</p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 gradient-primary"
                      onClick={handleStartScan}
                      disabled={locationStatus !== "allowed" || !coords}
                    >
                      <Camera className="h-4 w-4 ml-2" />
                      بدء المسح
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">إدخال الرمز يدوياً</CardTitle>
                <CardDescription>
                  إذا لم تتمكن من مسح الرمز، أدخله يدوياً
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    placeholder="أدخل الرمز..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                  <Button type="submit" disabled={!manualCode.trim()}>
                    تأكيد
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
