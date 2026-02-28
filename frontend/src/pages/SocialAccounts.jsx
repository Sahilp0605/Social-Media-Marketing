import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter,
  Trash2,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Send,
  Users,
  TrendingUp,
  Loader2,
  ExternalLink,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-orange-400", description: "Business Account", supportsOAuth: true },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-600 to-blue-500", description: "Page", supportsOAuth: true },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "from-blue-700 to-blue-600", description: "Company Page", supportsOAuth: false },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "from-slate-800 to-slate-700", description: "Account", supportsOAuth: false },
];

const SocialAccounts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageSelectDialogOpen, setPageSelectDialogOpen] = useState(false);
  const [metaPages, setMetaPages] = useState([]);
  const [loadingMetaPages, setLoadingMetaPages] = useState(false);
  const [syncing, setSyncing] = useState({});
  const [testingPost, setTestingPost] = useState({});
  const [connectingPage, setConnectingPage] = useState(null);
  const [form, setForm] = useState({
    platform: "",
    account_name: ""
  });

  useEffect(() => {
    fetchAccounts();
    
    // Check if returning from Meta OAuth
    if (searchParams.get("meta_connected") === "true") {
      setPageSelectDialogOpen(true);
      fetchMetaPages();
      // Clear the query param
      searchParams.delete("meta_connected");
      setSearchParams(searchParams);
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API}/social-accounts`);
      setAccounts(res.data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaPages = async () => {
    setLoadingMetaPages(true);
    try {
      const res = await axios.get(`${API}/oauth/meta/pages`);
      setMetaPages(res.data.pages || []);
    } catch (err) {
      console.error("Failed to fetch Meta pages:", err);
      toast.error("Failed to fetch connected pages");
    } finally {
      setLoadingMetaPages(false);
    }
  };

  const connectMetaOAuth = async () => {
    try {
      const res = await axios.get(`${API}/oauth/meta/url`);
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Meta OAuth not configured");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start OAuth");
    }
  };

  const connectMetaPage = async (page) => {
    setConnectingPage(page.page_id);
    try {
      await axios.post(`${API}/oauth/meta/connect-page`, {
        page_id: page.page_id,
        page_name: page.page_name,
        access_token: page.access_token,
        instagram_business_id: page.instagram_business_id
      });
      toast.success(`Connected ${page.page_name}!`);
      setPageSelectDialogOpen(false);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to connect page");
    } finally {
      setConnectingPage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/social-accounts`, form);
      toast.success("Account connected successfully!");
      setDialogOpen(false);
      setForm({ platform: "", account_name: "" });
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to connect account");
    }
  };

  const disconnectAccount = async (accountId) => {
    try {
      await axios.delete(`${API}/social-accounts/${accountId}`);
      toast.success("Account disconnected");
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to disconnect account");
    }
  };

  const syncAccount = async (accountId) => {
    setSyncing({ ...syncing, [accountId]: true });
    try {
      const res = await axios.post(`${API}/social-accounts/${accountId}/sync`);
      toast.success(`Account synced! ${res.data.stats.followers_count.toLocaleString()} followers`);
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to sync account");
    } finally {
      setSyncing({ ...syncing, [accountId]: false });
    }
  };

  const testPost = async (accountId) => {
    setTestingPost({ ...testingPost, [accountId]: true });
    try {
      const res = await axios.post(`${API}/social-accounts/${accountId}/test-post`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Test post failed");
    } finally {
      setTestingPost({ ...testingPost, [accountId]: false });
    }
  };

  const getPlatformInfo = (platformId) => {
    return platforms.find(p => p.id === platformId) || platforms[0];
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="social-accounts-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Social Accounts</h2>
            <p className="text-slate-500 mt-1">Connect and manage your social media accounts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="connect-account-btn">
                <Plus className="w-5 h-5 mr-2" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Connect Social Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                    <SelectTrigger className="mt-1.5" data-testid="platform-select">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                              <platform.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span>{platform.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="account_name">Account Name / Username</Label>
                  <Input
                    id="account_name"
                    placeholder="@yourusername"
                    className="mt-1.5"
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    required
                    data-testid="account-name-input"
                  />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Demo Mode</p>
                      <p className="text-xs text-amber-700 mt-1">
                        This is a simulated connection for testing. In production, you would connect via OAuth with the actual platform APIs.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!form.platform || !form.account_name}
                  data-testid="save-account-btn"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platforms.map((platform) => {
            const connectedCount = accounts.filter(a => a.platform === platform.id).length;
            const totalFollowers = accounts
              .filter(a => a.platform === platform.id)
              .reduce((sum, a) => sum + (a.followers_count || 0), 0);
            return (
              <Card key={platform.id} className="border-slate-100 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                      <platform.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{platform.name}</p>
                      <p className="text-xs text-slate-500">{connectedCount} connected</p>
                    </div>
                  </div>
                  {connectedCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>{formatNumber(totalFollowers)} followers</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connected Accounts */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 font-heading">No accounts connected</h3>
                <p className="text-slate-500 mt-1">Connect your social media accounts to start posting</p>
                <Button 
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Connect Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => {
                  const platform = getPlatformInfo(account.platform);
                  const isSyncing = syncing[account.account_id];
                  const isTesting = testingPost[account.account_id];
                  
                  return (
                    <div 
                      key={account.account_id}
                      className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                      data-testid={`account-${account.account_id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                            <platform.icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{account.account_name}</p>
                              {account.is_connected ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Connected
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  Disconnected
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">{platform.name} • {platform.description}</p>
                            
                            {/* Stats */}
                            {account.followers_count > 0 && (
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Users className="w-4 h-4" />
                                  {formatNumber(account.followers_count)} followers
                                </span>
                                {account.engagement_rate > 0 && (
                                  <span className="flex items-center gap-1 text-slate-600">
                                    <TrendingUp className="w-4 h-4" />
                                    {account.engagement_rate}% engagement
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Sync Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => syncAccount(account.account_id)}
                            disabled={isSyncing}
                            data-testid={`sync-${account.account_id}`}
                          >
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            <span className="ml-1.5">Sync</span>
                          </Button>
                          
                          {/* Test Post Button */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testPost(account.account_id)}
                            disabled={isTesting}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            data-testid={`test-post-${account.account_id}`}
                          >
                            {isTesting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            <span className="ml-1.5">Test</span>
                          </Button>
                          
                          {/* Disconnect Button */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => disconnectAccount(account.account_id)}
                            data-testid={`disconnect-${account.account_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Last Synced */}
                      {account.last_synced_at && (
                        <p className="text-xs text-slate-400 mt-3">
                          Last synced: {new Date(account.last_synced_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real API Connection Card */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-indigo-800">Connect Real Accounts</p>
                  <p className="text-sm text-indigo-700 mt-1">
                    Connect your Facebook Pages and Instagram Business accounts using Meta's official API for real posting.
                  </p>
                </div>
              </div>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={connectMetaOAuth}
                data-testid="connect-meta-oauth-btn"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect with Meta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Page Selection Dialog (after OAuth) */}
        <Dialog open={pageSelectDialogOpen} onOpenChange={setPageSelectDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Select Pages to Connect</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {loadingMetaPages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : metaPages.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No pages found. Make sure you have admin access to Facebook Pages.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metaPages.map((page) => (
                    <div key={page.page_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{page.page_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">Facebook Page</span>
                            {page.instagram_business_id && (
                              <span className="flex items-center gap-1 text-xs text-pink-600">
                                <Instagram className="w-3 h-3" />
                                Instagram linked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => connectMetaPage(page)}
                        disabled={connectingPage === page.page_id}
                      >
                        {connectingPage === page.page_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Demo Notice */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Demo Mode Active</p>
                <p className="text-sm text-amber-700 mt-1">
                  Mock connections are for testing. Sync and test post features return simulated data. 
                  Use "Connect with Meta" above to connect real Facebook/Instagram accounts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SocialAccounts;
