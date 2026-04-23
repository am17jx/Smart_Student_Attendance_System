import React from "react";
import { Check, X, Info } from "lucide-react";

interface PasswordValidatorProps {
  password: string;
}

export const PasswordValidator: React.FC<PasswordValidatorProps> = ({ password }) => {
  const requirements = [
    { label: "8 أحرف على الأقل", test: (p: string) => p.length >= 8 },
    { label: "حرف كبير واحد على الأقل (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
    { label: "حرف صغير واحد على الأقل (a-z)", test: (p: string) => /[a-z]/.test(p) },
    { label: "رقم واحد على الأقل (0-9)", test: (p: string) => /[0-9]/.test(p) },
    { label: "رمز خاص واحد على الأقل (!@#$%^&*)", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
        <Info className="h-3 w-3" />
        <span>معايير كلمة المرور القوية:</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-[11px] transition-colors duration-200">
              <div className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                isMet ? "bg-success/20 text-success" : "bg-muted text-muted-foreground/50"
              }`}>
                {isMet ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              </div>
              <span className={isMet ? "text-success/90 font-medium" : "text-muted-foreground"}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
