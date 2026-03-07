import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-validation";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    const { error } = await resetPassword(data.email);
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEmail(data.email);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle={`We sent a password reset link to ${email}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link in your email to reset your password. The link expires in 1 hour.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="rounded-full" onClick={() => setSent(false)}>
              Try a different email
            </Button>
            <p className="text-xs text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-full text-base font-semibold"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Send Reset Link
        </Button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"
      >
        <ArrowLeft size={14} />
        Back to login
      </Link>
    </AuthLayout>
  );
};

export default ForgotPassword;
