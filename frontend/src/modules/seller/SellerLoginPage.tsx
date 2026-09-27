import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";

export default function SellerLoginPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/seller/login/step1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        toast.success("OTP sent to your registered email!");
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
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/login/step2", {
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
        toast.success("Welcome back, Seller!");
        navigate("/seller/dashboard");
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
          <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            Seller Portal
          </div>
          <h1 className="font-display text-3xl">Seller Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your seller dashboard.
          </p>

          {step === "credentials" ? (
            <form onSubmit={handleStep1} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seller-email">Email address</Label>
                <Input
                  id="seller-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-password">Password</Label>
                <Input
                  id="seller-password"
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
                Enter the 6-digit OTP sent to{" "}
                <span className="font-medium text-foreground">{email}</span>.
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
                onClick={() => { setStep("credentials"); setOtp(""); }}
                className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New seller?{" "}
            <Link to="/seller/register" className="text-accent underline underline-offset-4">
              Create a seller account
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Shopping as a customer?{" "}
            <Link to="/login" className="text-accent underline underline-offset-4">
              Customer login
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
