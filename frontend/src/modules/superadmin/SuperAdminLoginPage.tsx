import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminLoginPage() {
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
      const res = await fetch("/api/admin/login/step1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        toast.success("OTP sent to your admin email!");
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
      const res = await fetch("/api/admin/login/step2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        const role: string = data.user?.role ?? "";
        if (role !== "superadmin") {
          toast.error("Access denied: not a super admin account");
          return;
        }
        if (data.user) {
          login(data.user);
        }
        toast.success("Welcome, Super Admin!");
        navigate("/seller/dashboard"); // shared dashboard for admin roles
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
        <div className="w-full max-w-md rounded-3xl border-2 border-rose-500/20 bg-card p-8 shadow-soft">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Super Admin Portal
          </div>

          <h1 className="font-display text-3xl">Super Admin Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Restricted access. Authorised personnel only.
          </p>

          {step === "credentials" ? (
            <form onSubmit={handleStep1} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sa-email">Email address</Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-password">Password</Label>
                <Input
                  id="sa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                disabled={loading}
              >
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
              <Button
                type="submit"
                size="lg"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                disabled={loading}
              >
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
            <Link to="/auth" className="text-muted-foreground underline underline-offset-4">
              ← Back to portal selection
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
