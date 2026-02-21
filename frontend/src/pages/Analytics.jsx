import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  Globe,
  FileEdit,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Analytics = () => {
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

  // Sample chart data (in real app, this would come from API)
  const weeklyData = [
    { name: "Mon", views: 120, clicks: 45, leads: 12 },
    { name: "Tue", views: 180, clicks: 62, leads: 18 },
    { name: "Wed", views: 150, clicks: 55, leads: 15 },
    { name: "Thu", views: 220, clicks: 85, leads: 24 },
    { name: "Fri", views: 280, clicks: 110, leads: 32 },
    { name: "Sat", views: 190, clicks: 70, leads: 20 },
    { name: "Sun", views: 140, clicks: 48, leads: 14 },
  ];

  const platformData = [
    { name: "Instagram", value: 45, color: "#E1306C" },
    { name: "Facebook", value: 35, color: "#1877F2" },
    { name: "LinkedIn", value: 20, color: "#0A66C2" },
  ];

  const COLORS = ["#E1306C", "#1877F2", "#0A66C2"];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const kpis = analytics ? [
    {
      label: "Total Post Views",
      value: analytics.posts.views,
      icon: Eye,
      change: "+18%",
      changeType: "positive",
      color: "bg-indigo-50 text-indigo-600"
    },
    {
      label: "Total Clicks",
      value: analytics.posts.clicks,
      icon: MousePointerClick,
      change: "+24%",
      changeType: "positive",
      color: "bg-violet-50 text-violet-600"
    },
    {
      label: "Page Views",
      value: analytics.landing_pages.views,
      icon: Globe,
      change: "+12%",
      changeType: "positive",
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      label: "Conversion Rate",
      value: `${analytics.landing_pages.conversion_rate}%`,
      icon: TrendingUp,
      change: "+5%",
      changeType: "positive",
      color: "bg-amber-50 text-amber-600"
    }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">Analytics</h2>
          <p className="text-slate-500 mt-1">Track your marketing performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="border-slate-100 shadow-card hover:shadow-card-hover transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <span className={`flex items-center text-sm font-medium ${
                    kpi.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {kpi.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                    )}
                    {kpi.change}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900 font-heading">{kpi.value}</p>
                <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Performance */}
          <Card className="border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#4F46E5" 
                      strokeWidth={2}
                      dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <span className="text-sm text-slate-600">Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-sm text-slate-600">Clicks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card className="border-slate-100 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {platformData.map((platform, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                    <span className="text-sm text-slate-600">{platform.name} ({platform.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Conversions */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Lead Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="leads" fill="url(#leadGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FileEdit className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Posts</p>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{analytics?.posts?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Globe className="w-7 h-7 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Landing Pages</p>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{analytics?.landing_pages?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">New Leads</p>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{analytics?.leads?.new || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
