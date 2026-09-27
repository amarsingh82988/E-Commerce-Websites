import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, X, Lock, Clock, Image as ImageIcon } from "lucide-react";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import hero from "@/assets/hero-crochet.jpg";
import { uploadImage } from "@/api/upload";
import { useAuth } from "@/context/AuthContext";
import { createCustomOrder, getMyCustomOrders, type CustomOrder } from "@/api/customOrders";

const steps = [
  { n: "01", t: "Share your idea", d: "Fill the brief with colours, size, budget and the date you need it by." },
  { n: "02", t: "Sketch & quote", d: "Within 48 hours we send a reference sketch, yarn palette and a final price." },
  { n: "03", t: "We crochet it", d: "Once you approve and pay 50% advance, your piece goes on the hook." },
  { n: "04", t: "Photos & dispatch", d: "You see photos before it ships. Pay the balance and it is on its way." },
];

export default function CustomOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [myOrders, setMyOrders] = useState<CustomOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    budget: "",
    deadline: "",
    colors: "",
    size: "",
    details: "",
    referenceImage: "",
  });
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Autofill form with user details when logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Fetch user's custom orders from backend if logged in
  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await getMyCustomOrders();
      setMyOrders(data || []);
    } catch {
      // quiet fallback
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Handle single JPG reference image upload (Strict 10MB JPG limit check)
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Image format validation
    const isValidMime = file.type.startsWith("image/");
    const isValidExt = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    if (!isValidMime && !isValidExt) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    // 2. Strict 10MB size validation
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      toast.error("File size exceeds maximum allowed limit of 10 MB.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, referenceImage: url }));
      toast.success("Reference image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload reference image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit a custom order request.");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!form.type) {
      toast.error("Please choose what you'd like made");
      return;
    }
    if (form.details.trim().length < 10) {
      toast.error("Please describe your idea in a little more detail (at least 10 characters)");
      return;
    }

    setSending(true);
    try {
      await createCustomOrder({
        name: form.name,
        email: form.email,
        phone: form.phone,
        type: form.type,
        budget: form.budget,
        deadline: form.deadline,
        colors: form.colors,
        size: form.size,
        details: form.details,
        referenceImage: form.referenceImage,
      });

      toast.success("Request received — we'll send a sketch and quote within 48 hours ♡");
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        type: "",
        budget: "",
        deadline: "",
        colors: "",
        size: "",
        details: "",
        referenceImage: "",
      });
      fetchMyOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit custom order request.");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Requested</Badge>;
      case "in_review":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Review</Badge>;
      case "quoted":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Quote Ready</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Accepted</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Made just for you"
        title="Custom crochet orders"
        intro="If you can picture it, we can probably crochet it — in your colours, your size, for your occasion."
      />

      <section className="container-page grid items-center gap-12 py-16 md:grid-cols-2">
        <img
          src={hero}
          alt="Custom crochet flower bouquet in warm neutral yarn tones"
          className="rounded-3xl object-cover shadow-soft"
          loading="lazy"
        />
        <div>
          <h2 className="font-display text-3xl md:text-4xl">How it works</h2>
          <ol className="mt-8 space-y-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="font-display text-2xl text-accent">{s.n}</span>
                <div>
                  <p className="font-medium">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16 md:py-24">
        <div className="container-page max-w-3xl">
          <p className="eyebrow text-center">The brief</p>
          <h2 className="mt-3 text-center font-display text-3xl md:text-4xl">Tell us what you'd love</h2>

          {authLoading ? (
            <div className="mt-10 flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50/70 p-8 text-center shadow-soft dark:border-amber-900 dark:bg-amber-950/30">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Lock className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="mt-4 font-display text-2xl">Authentication Required</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Custom orders are reserved for registered users so we can send you sketches, quotes, and progress updates.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/login">Log in to your account</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-10 rounded-3xl border border-border bg-card p-7 shadow-soft md:p-9">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cname">Your name *</Label>
                  <Input id="cname" value={form.name} onChange={set("name")} placeholder="Aditi Sharma" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cemail">Email *</Label>
                  <Input id="cemail" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cphone">Phone / WhatsApp</Label>
                  <Input id="cphone" value={form.phone} onChange={set("phone")} placeholder="+91 …" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctype">What would you like made? *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger id="ctype">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Bridal / event bouquet",
                        "Amigurumi toy or pet replica",
                        "Bag or tote",
                        "Home decor",
                        "Baby gift set",
                        "Bulk / corporate gifting",
                        "Something else",
                      ].map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cbudget">Budget (₹)</Label>
                  <Input id="cbudget" value={form.budget} onChange={set("budget")} placeholder="2000 – 4000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cdeadline">Needed by</Label>
                  <Input id="cdeadline" type="date" value={form.deadline} onChange={set("deadline")} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ccolors">Colour palette</Label>
                  <Input id="ccolors" value={form.colors} onChange={set("colors")} placeholder="Ivory, dusty rose, sage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csize">Size</Label>
                  <Input id="csize" value={form.size} onChange={set("size")} placeholder="e.g. Medium, 12 inches" />
                </div>
              </div>

              {/* Single JPG Reference Image Upload (Max 10MB) */}
              <div className="mt-6 rounded-2xl border border-dashed border-border p-5 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-accent" /> Reference Image (1 image per order, JPG only, max 10MB)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload a sketch or inspiration photo (JPG format up to 10MB)
                    </p>
                  </div>
                </div>

                {form.referenceImage ? (
                  <div className="relative w-40 h-40 border rounded-xl overflow-hidden group bg-card shadow-sm">
                    <img src={form.referenceImage} alt="Reference preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                      onClick={() => setForm((f) => ({ ...f, referenceImage: "" }))}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,image/jpeg"
                        onChange={handleReferenceImageUpload}
                        disabled={uploadingImage}
                        className="cursor-pointer"
                      />
                      {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Or paste an image URL:</span>
                      <Input
                        id="creference"
                        value={form.referenceImage}
                        onChange={set("referenceImage")}
                        placeholder="https://..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="cdetails">Describe your idea *</Label>
                <Textarea
                  id="cdetails"
                  rows={5}
                  value={form.details}
                  onChange={set("details")}
                  placeholder="Quantity, occasion, yarn preference, or any specific details you have in mind…"
                  required
                />
              </div>

              <Button type="submit" size="lg" className="mt-6 w-full" disabled={sending || uploadingImage}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request…
                  </>
                ) : (
                  "Request a quote"
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No payment now. We'll send a reference sketch and final quote to your email before starting.
              </p>
            </form>
          )}

          {/* User's Submitted Custom Orders List */}
          {user && (
            <div className="mt-16 border-t border-border pt-12">
              <h3 className="font-display text-2xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" /> My Submitted Custom Orders
              </h3>

              {loadingOrders ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myOrders.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground bg-card border rounded-2xl p-6 text-center">
                  You haven't submitted any custom order requests yet.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {myOrders.map((ord) => (
                    <div key={ord._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <p className="font-semibold text-base">{ord.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted on {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        {getStatusBadge(ord.status)}
                      </div>

                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ord.details}</p>

                      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 gap-2">
                        {ord.budget && <span>Budget: ₹{ord.budget}</span>}
                        {ord.deadline && <span>Needed by: {ord.deadline}</span>}
                        {ord.quoteAmount ? <span className="font-semibold text-foreground">Quote: ₹{ord.quoteAmount}</span> : null}
                      </div>

                      {ord.referenceImage && (
                        <div className="pt-2">
                          <a href={ord.referenceImage} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" /> View Reference Image
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
