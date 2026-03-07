import { useMemo } from "react";
import { getPasswordStrength } from "@/lib/auth-validation";

const PasswordStrengthBar = ({ password }: { password: string }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{strength.label}</span>
      </p>
    </div>
  );
};

export default PasswordStrengthBar;
