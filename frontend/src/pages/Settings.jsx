import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Bell, 
  Shield,
  Save,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/App";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [notifications, setNotifications] = useState({
    email_leads: true,
    email_campaigns: true,
    push_leads: false,
    push_campaigns: false,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Profile updated successfully!");
      setSaving(false);
    }, 1000);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8" data-testid="settings-page">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">Settings</h2>
          <p className="text-slate-500 mt-1">Manage your account preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5"
                    data-testid="settings-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5"
                    disabled
                    data-testid="settings-email-input"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-4">Email Notifications</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">New Leads</p>
                    <p className="text-xs text-slate-500">Get notified when a new lead is captured</p>
                  </div>
                  <Switch 
                    checked={notifications.email_leads}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_leads: checked })}
                    data-testid="notify-email-leads"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Campaign Updates</p>
                    <p className="text-xs text-slate-500">Weekly summary of campaign performance</p>
                  </div>
                  <Switch 
                    checked={notifications.email_campaigns}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_campaigns: checked })}
                    data-testid="notify-email-campaigns"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-slate-900 mb-4">Push Notifications</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">New Leads</p>
                    <p className="text-xs text-slate-500">Browser notifications for new leads</p>
                  </div>
                  <Switch 
                    checked={notifications.push_leads}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_leads: checked })}
                    data-testid="notify-push-leads"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Campaign Alerts</p>
                    <p className="text-xs text-slate-500">Important campaign alerts</p>
                  </div>
                  <Switch 
                    checked={notifications.push_campaigns}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_campaigns: checked })}
                    data-testid="notify-push-campaigns"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Account Secure</p>
                  <p className="text-sm text-slate-500">Your account is protected</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl">
                <p className="font-medium text-slate-900">Password</p>
                <p className="text-sm text-slate-500 mt-1">Last changed 30 days ago</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Change Password
                </Button>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl">
                <p className="font-medium text-slate-900">Two-Factor Auth</p>
                <p className="text-sm text-slate-500 mt-1">Add an extra layer of security</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100 shadow-card">
          <CardHeader>
            <CardTitle className="text-red-600 font-heading">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">Delete Account</p>
                <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
