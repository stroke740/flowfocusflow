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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";

const Login = () => {
  const { signIn, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleMagicLink = async () => {
    if (!magicLinkEmail) return;
    setLoading(true);
    const { error } = await signInWithMagicLink(magicLinkEmail);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setMagicLinkSent(true);
  };

  if (magicLinkSent) {
    return (
      <AuthLayout title="Check your inbox" subtitle={`We sent a sign-in link to ${magicLinkEmail}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">Click the link in your email to sign in. The link expires in 1 hour.</p>
          <Button variant="outline" className="rounded-full" onClick={() => { setMagicLinkSent(false); setMagicLinkMode(false); }}>
            Back to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (magicLinkMode) {
    return (
      <AuthLayout title="Sign in with magic link" subtitle="We'll email you a link to sign in — no password needed">
        <div className="space-y-4">
          <div>
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="jane@example.com"
              className="h-11 rounded-xl mt-1.5"
              value={magicLinkEmail}
              onChange={(e) => setMagicLinkEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleMagicLink}
            disabled={loading || !magicLinkEmail}
            className="w-full h-[52px] rounded-full text-base font-semibold"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Send me a sign-in link
          </Button>
          <button
            onClick={() => setMagicLinkMode(false)}
            className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Back to password login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue where you left off">
      <OAuthButtons onOAuth={handleOAuth} loading={loading} />

      <div className="flex items-center gap-3 my-6">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <Separator className="flex-1" />
      </div>

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

      <button
        onClick={() => setMagicLinkMode(true)}
        className="w-full text-sm text-primary hover:underline text-center mt-4"
      >
        Send me a sign-in link instead
      </button>

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
