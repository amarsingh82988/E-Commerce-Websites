import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function SellerRegisterPage() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
        toast.success("OTP sent to your email for verification!");
      } else {
        toast.error(data.message ?? "Registration failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Email verified! Your seller account is ready. Please sign in.");
        navigate("/seller/login");
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
          <h1 className="font-display text-3xl">Become a Seller</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your seller account to list products.
          </p>

          {step === "details" ? (
            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">Full Name</Label>
                <Input
                  id="s-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email address</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-phone">Phone Number</Label>
                <Input
                  id="s-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-password">Password</Label>
                <Input
                  id="s-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Create Seller Account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-8 space-y-5">
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit verification code to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Enter it below to activate your account.
              </p>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email & Activate"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("details")}
                className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
              >
                Go back and edit details
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already a seller?{" "}
            <Link to="/seller/login" className="text-accent underline underline-offset-4">
              Sign in here
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
