import { LoadingSpinner } from "./ui/loading-spinner";

interface ReportLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function ReportLoadingOverlay({ isVisible, message = "جاري إنشاء التقرير... يرجى الانتظار" }: ReportLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
        <LoadingSpinner size="lg" className="border-t-primary" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">{message}</h3>
          <p className="text-sm text-slate-500">سيكون الملف جاهزاً للتحميل خلال ثوانٍ معدودة</p>
        </div>
      </div>
    </div>
  );
}
