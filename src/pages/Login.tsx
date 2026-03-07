import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginValues } from "@/lib/auth-validation";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginValues) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue where you left off">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground">
            Remember me for 30 days
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-full text-base font-semibold"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary hover:underline font-medium">
          Sign up free
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
