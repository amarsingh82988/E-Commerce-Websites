import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/step1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        toast.success("OTP sent to your email!");
      } else {
        toast.error(data.message ?? "Login failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/step2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          login(data.user);
        }
        toast.success("Signed in successfully!");
        navigate("/profile");
      } else {
        toast.error(data.message ?? "OTP verification failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="container-page flex justify-center py-20">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
          <h1 className="font-display text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account.
          </p>

          {step === "credentials" ? (
            <form onSubmit={handleStep1} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginemail">Email address</Label>
                <Input
                  id="loginemail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loginpassword">Password</Label>
                </div>
                <Input
                  id="loginpassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="mt-8 space-y-5">
              <p className="text-sm text-muted-foreground">
                Enter the code we sent to <span className="text-foreground">{email}</span>.
              </p>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent underline underline-offset-4">
              Sign up
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Just browsing?{" "}
            <Link to="/shop" className="text-accent underline underline-offset-4">
              Continue shopping
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
