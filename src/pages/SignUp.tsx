import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { signUpSchema, type SignUpValues } from "@/lib/auth-validation";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const SignUp = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { marketing: false, terms: undefined },
  });

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  const onSubmit = async (data: SignUpValues) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setLoading(false);

    if (error) {
      if (error.message?.includes("already registered")) {
        toast({
          title: "Account exists",
          description: "An account with this email exists. Sign in instead?",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({
      title: "Check your email",
      description: "We've sent you a verification link to confirm your account.",
    });
    navigate("/login");
  };


  return (
    <AuthLayout title="Create your account" subtitle="Start organizing your life in seconds" step={{ current: 1, total: 3 }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Jane Doe"
            className="h-11 rounded-xl mt-1.5"
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            className="h-11 rounded-xl mt-1.5"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="h-11 rounded-xl pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-2">
            <PasswordStrengthBar password={password} />
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              className="h-11 rounded-xl pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword && password === confirmPassword && (
            <p className="text-xs text-success mt-1">Passwords match ✓</p>
          )}
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => setValue("terms", checked === true ? true : (false as any))}
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug">
              I agree to the{" "}
              <button type="button" className="text-primary hover:underline">Terms of Service</button>{" "}
              and{" "}
              <button type="button" className="text-primary hover:underline">Privacy Policy</button>
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

          <div className="flex items-start gap-2">
            <Checkbox
              id="marketing"
              onCheckedChange={(checked) => setValue("marketing", checked === true)}
            />
            <Label htmlFor="marketing" className="text-sm font-normal leading-snug text-muted-foreground">
              Send me product updates and tips (optional)
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-full text-base font-semibold mt-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Get Started Free
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignUp;
