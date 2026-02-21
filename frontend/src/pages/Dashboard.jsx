import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileEdit, 
  Globe, 
  Users, 
  TrendingUp,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Sparkles
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/analytics/overview`, { withCredentials: true });
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = analytics ? [
    {
      label: "Total Posts",
      value: analytics.posts.total,
      icon: FileEdit,
      change: "+12%",
      changeType: "positive",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      label: "Landing Pages",
      value: analytics.landing_pages.total,
      icon: Globe,
      change: "+8%",
      changeType: "positive",
      color: "bg-violet-50 text-violet-600"
    },
    {
      label: "Total Leads",
      value: analytics.leads.total,
      icon: Users,
      change: "+24%",
      changeType: "positive",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      label: "Active Campaigns",
      value: analytics.campaigns.active,
      icon: Megaphone,
      change: analytics.campaigns.total > 0 ? "Active" : "None",
      changeType: "neutral",
      color: "bg-amber-50 text-amber-600"
    }
  ] : [];

  const engagementStats = analytics ? [
    { label: "Post Views", value: analytics.posts.views, icon: Eye },
    { label: "Post Clicks", value: analytics.posts.clicks, icon: MousePointerClick },
    { label: "Page Views", value: analytics.landing_pages.views, icon: Eye },
    { label: "Conversions", value: analytics.landing_pages.conversions, icon: TrendingUp },
  ] : [];

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
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 lg:p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold font-heading">Welcome to SocialFlow AI</h2>
              <p className="mt-2 text-white/80 max-w-lg">
                Your AI-powered social media command center. Create, schedule, and analyze your content all in one place.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI Powered</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-slate-100 shadow-card hover:shadow-card-hover transition-all" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.changeType !== "neutral" && (
                    <span className={`flex items-center text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900 font-heading">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Engagement Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {engagementStats.map((stat, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <stat.icon className="w-4 h-4" />
                      <span className="text-sm">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 font-heading">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-32 h-32 mx-auto relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E2E8F0"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(analytics?.landing_pages?.conversion_rate || 0) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 font-heading">
                      {analytics?.landing_pages?.conversion_rate || 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-slate-500">
                  {analytics?.landing_pages?.conversions || 0} conversions from {analytics?.landing_pages?.views || 0} page views
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/posts" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group" data-testid="quick-create-post">
                <FileEdit className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-900">Create Post</p>
                <p className="text-sm text-slate-500">With AI assistance</p>
              </a>
              <a href="/templates" className="p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors group" data-testid="quick-templates">
                <Sparkles className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-900">AI Templates</p>
                <p className="text-sm text-slate-500">Generate images</p>
              </a>
              <a href="/landing-pages" className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors group" data-testid="quick-landing-page">
                <Globe className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-900">Landing Page</p>
                <p className="text-sm text-slate-500">Capture leads</p>
              </a>
              <a href="/leads" className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group" data-testid="quick-leads">
                <Users className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-slate-900">View Leads</p>
                <p className="text-sm text-slate-500">{analytics?.leads?.new || 0} new leads</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
