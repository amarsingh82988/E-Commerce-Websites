import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export type StoreSettings = {
  storeName: string;
  contactEmail: string;
  phone: string;
  address: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  paymentGateway: {
    provider: "razorpay" | "stripe" | "paypal" | "none";
    publicKey: string;
    privateKey: string;
  };
  shipping: {
    fee: number;
    freeThreshold: number;
  };
};

const defaultSettings: StoreSettings = {
  storeName: "Apne Hath Crafts",
  contactEmail: "hello@apnehathcrochet.in",
  phone: "+91 98765 43210",
  address: "123 Craft Lane, Maker's District, New Delhi, India 110001",
  socialLinks: {
    instagram: "https://instagram.com/apnehathcrochet",
    facebook: "https://facebook.com/apnehathcrochet",
    twitter: "",
  },
  paymentGateway: {
    provider: "razorpay",
    publicKey: "",
    privateKey: "",
  },
  shipping: {
    fee: 79,
    freeThreshold: 1499,
  },
};



export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const data = await fetchApi("/content/settings");
    if (data) return data as StoreSettings;
  } catch (err) {
    console.error("Failed to fetch settings from DB, falling back to default", err);
  }
  return defaultSettings;
}

export async function updateStoreSettings(settings: StoreSettings) {
  return fetchApi("/content/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  });
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    fetchStoreSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (settings) {
      try {
        await updateStoreSettings(settings);
        toast.success("Settings saved successfully");
      } catch (err) {
        toast.error("Failed to save settings to server.");
      }
    }
  };

  if (!settings) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store's configuration and payment gateways.</p>
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="payment">Payment Gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic details about your business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Support Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Support Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Links to your social media profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={settings.socialLinks.instagram}
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  value={settings.socialLinks.facebook}
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X URL</Label>
                <Input
                  id="twitter"
                  value={settings.socialLinks.twitter}
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>Setup how you want to receive payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Active Provider</Label>
                <div className="grid grid-cols-3 gap-4">
                  {["razorpay", "stripe", "paypal"].map((provider) => (
                    <div
                      key={provider}
                      onClick={() => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, provider: provider as any } })}
                      className={`border rounded-md p-4 text-center cursor-pointer transition-colors ${
                        settings.paymentGateway.provider === provider
                          ? "border-accent bg-accent/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="font-medium capitalize">{provider}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium capitalize">{settings.paymentGateway.provider} Credentials</h3>
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public / Key ID</Label>
                  <Input
                    id="publicKey"
                    value={settings.paymentGateway.publicKey}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, publicKey: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    value={settings.paymentGateway.privateKey}
                    onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, privateKey: e.target.value } })}
                  />
                </div>
                
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

