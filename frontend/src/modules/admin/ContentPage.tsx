import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { loadContent, saveContent, type SiteContent } from "@/store/content";
import { getSiteContent, updateSiteContent } from "@/api/content";
import { uploadImage } from "@/api/upload";
import { Plus, Trash, Loader2, X } from "lucide-react";

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) {
        setContent(data);
        saveContent(data);
      } else {
        setContent(loadContent());
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const updated = await updateSiteContent(content);
      setContent(updated);
      saveContent(updated);
      toast.success("Site content saved to backend successfully ♡");
    } catch (err: any) {
      toast.error(err.message || "Failed to save site content");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    setUploadingHero(true);
    try {
      const url = await uploadImage(file);
      setContent({ ...content, hero: { ...content.hero, imageUrl: url } });
      toast.success("Hero image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload hero image");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    setUploadingAbout(true);
    try {
      const url = await uploadImage(file);
      setContent({ ...content, about: { ...content.about, imageUrl: url } });
      toast.success("About image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload about image");
    } finally {
      setUploadingAbout(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading content from backend...
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full border rounded-md p-4 bg-card">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="hero">Hero Banner</TabsTrigger>
          <TabsTrigger value="about">About/Story</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Homepage Hero Section</h2>
            <div className="space-y-2">
              <Label htmlFor="hero-title">Title</Label>
              <Input
                id="hero-title"
                value={content.hero.title}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, title: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Subtitle</Label>
              <Textarea
                id="hero-subtitle"
                value={content.hero.subtitle}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-image">Hero Banner Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleHeroImageUpload}
                  disabled={uploadingHero}
                />
                {uploadingHero && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
              <Input
                id="hero-image"
                value={content.hero.imageUrl}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, imageUrl: e.target.value } })
                }
                placeholder="Or enter Image URL"
                className="mt-2"
              />
              {content.hero.imageUrl && (
                <div className="relative w-48 h-32 border rounded-md overflow-hidden mt-2 group">
                  <img src={content.hero.imageUrl} alt="Hero preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => setContent({ ...content, hero: { ...content.hero, imageUrl: "" } })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-btn-text">Button Text</Label>
                <Input
                  id="hero-btn-text"
                  value={content.hero.buttonText}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, buttonText: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-btn-link">Button Link</Label>
                <Input
                  id="hero-btn-link"
                  value={content.hero.buttonLink}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, buttonLink: e.target.value } })
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About / Our Story</h2>
            <div className="space-y-2">
              <Label htmlFor="about-title">Title</Label>
              <Input
                id="about-title"
                value={content.about.title}
                onChange={(e) =>
                  setContent({ ...content, about: { ...content.about, title: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-content">Content</Label>
              <Textarea
                id="about-content"
                rows={8}
                value={content.about.content}
                onChange={(e) =>
                  setContent({ ...content, about: { ...content.about, content: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-image">About / Story Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleAboutImageUpload}
                  disabled={uploadingAbout}
                />
                {uploadingAbout && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
              <Input
                id="about-image"
                value={content.about.imageUrl}
                onChange={(e) =>
                  setContent({ ...content, about: { ...content.about, imageUrl: e.target.value } })
                }
                placeholder="Or enter Image URL"
                className="mt-2"
              />
              {content.about.imageUrl && (
                <div className="relative w-48 h-32 border rounded-md overflow-hidden mt-2 group">
                  <img src={content.about.imageUrl} alt="About preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => setContent({ ...content, about: { ...content.about, imageUrl: "" } })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent({
                    ...content,
                    faqs: [...content.faqs, { id: Date.now().toString(), question: "", answer: "" }],
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Add FAQ
              </Button>
            </div>
            
            <div className="space-y-4">
              {content.faqs.map((faq, index) => (
                <div key={faq.id} className="border p-4 rounded-md space-y-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() =>
                      setContent({
                        ...content,
                        faqs: content.faqs.filter((f) => f.id !== faq.id),
                      })
                    }
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2 pr-10">
                    <Label>Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...content.faqs];
                        newFaqs[index].question = e.target.value;
                        setContent({ ...content, faqs: newFaqs });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...content.faqs];
                        newFaqs[index].answer = e.target.value;
                        setContent({ ...content, faqs: newFaqs });
                      }}
                    />
                  </div>
                </div>
              ))}
              {content.faqs.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No FAQs added yet.</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Policy Pages</h2>
            
            <div className="space-y-2">
              <Label htmlFor="policy-shipping">Shipping Policy</Label>
              <Textarea
                id="policy-shipping"
                rows={4}
                value={content.policies.shipping}
                onChange={(e) =>
                  setContent({ ...content, policies: { ...content.policies, shipping: e.target.value } })
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="policy-return">Return Policy</Label>
              <Textarea
                id="policy-return"
                rows={4}
                value={content.policies.returnPolicy}
                onChange={(e) =>
                  setContent({ ...content, policies: { ...content.policies, returnPolicy: e.target.value } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy-privacy">Privacy Policy</Label>
              <Textarea
                id="policy-privacy"
                rows={4}
                value={content.policies.privacy}
                onChange={(e) =>
                  setContent({ ...content, policies: { ...content.policies, privacy: e.target.value } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy-terms">Terms & Conditions</Label>
              <Textarea
                id="policy-terms"
                rows={4}
                value={content.policies.terms}
                onChange={(e) =>
                  setContent({ ...content, policies: { ...content.policies, terms: e.target.value } })
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
