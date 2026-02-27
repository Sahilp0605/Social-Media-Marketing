import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Check, 
  Zap,
  FileEdit,
  Image,
  Globe,
  Sparkles,
  Users,
  ArrowRight,
  AlertCircle,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API, useAuth } from "@/App";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Subscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState("mock");
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, plansRes, modeRes] = await Promise.all([
        axios.get(`${API}/subscription`),
        axios.get(`${API}/plans`),
        axios.get(`${API}/admin/payment-mode`)
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data.plans);
      setPaymentMode(modeRes.data.mode);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setProcessingPlan(planId);
    try {
      const res = await axios.post(`${API}/subscription/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });
      
      // Redirect to checkout
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start checkout");
      setProcessingPlan(null);
    }
  };

  const togglePaymentMode = async () => {
    const newMode = paymentMode === "mock" ? "stripe" : "mock";
    try {
      await axios.post(`${API}/admin/payment-mode?mode=${newMode}`);
      setPaymentMode(newMode);
      toast.success(`Payment mode changed to ${newMode}`);
    } catch (err) {
      toast.error("Failed to change payment mode");
    }
  };

  const getUsagePercent = (used, limit) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (value) => {
    if (value === -1) return "Unlimited";
    return value.toLocaleString();
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "starter": return <Zap className="w-6 h-6" />;
      case "professional": return <Crown className="w-6 h-6" />;
      case "enterprise": return <Sparkles className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanFeatures = (plan) => {
    const features = [];
    const limits = plan.limits || {};
    
    features.push(`${formatLimit(limits.social_accounts)} Social Accounts`);
    features.push(`${formatLimit(limits.posts_per_month)} Posts/month`);
    features.push(`${formatLimit(limits.templates)} Templates`);
    features.push(`${formatLimit(limits.landing_pages)} Landing Pages`);
    
    if (limits.ai_content) {
      features.push(`${formatLimit(limits.ai_generations_per_month)} AI Generations/month`);
    }
    if (limits.lead_capture) {
      features.push("Lead Capture Pages");
    }
    if (limits.white_label) {
      features.push("White Label");
    }
    if (limits.api_access) {
      features.push("API Access");
    }
    
    features.push(`${limits.support === "dedicated" ? "Dedicated" : limits.support === "priority" ? "Priority" : "Email"} Support`);
    
    return features;
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

  const currentPlan = subscription?.plan;
  const usage = subscription?.usage || {};

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="subscription-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Subscription</h2>
            <p className="text-slate-500 mt-1">Manage your plan and usage</p>
          </div>
          
          {/* Payment Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
            <Settings className="w-4 h-4 text-slate-500" />
            <Label htmlFor="payment-mode" className="text-sm text-slate-600">Payment Mode:</Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${paymentMode === 'mock' ? 'text-amber-600' : 'text-slate-400'}`}>Mock</span>
              <Switch 
                id="payment-mode"
                checked={paymentMode === "stripe"}
                onCheckedChange={togglePaymentMode}
                data-testid="payment-mode-toggle"
              />
              <span className={`text-xs font-medium ${paymentMode === 'stripe' ? 'text-emerald-600' : 'text-slate-400'}`}>Stripe</span>
            </div>
          </div>
        </div>

        {/* Current Plan Card */}
        <Card className="border-slate-100 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  currentPlan?.plan_id === 'enterprise' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' :
                  currentPlan?.plan_id === 'professional' ? 'bg-gradient-to-br from-indigo-500 to-violet-500' :
                  'bg-gradient-to-br from-slate-400 to-slate-500'
                } text-white`}>
                  {getPlanIcon(currentPlan?.plan_id)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-heading">{currentPlan?.name || "Free Trial"}</h3>
                  <p className="text-slate-500">
                    {subscription?.expires_at ? (
                      <>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</>
                    ) : (
                      "Active subscription"
                    )}
                  </p>
                </div>
              </div>
              {currentPlan?.plan_id === 'free' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Trial Period</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Posts This Month</p>
                  <p className="text-lg font-bold text-slate-900">
                    {usage.posts_this_month} / {formatLimit(usage.posts_limit)}
                  </p>
                </div>
              </div>
              <Progress value={getUsagePercent(usage.posts_this_month, usage.posts_limit)} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Image className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Templates</p>
                  <p className="text-lg font-bold text-slate-900">
                    {usage.templates_count} / {formatLimit(usage.templates_limit)}
                  </p>
                </div>
              </div>
              <Progress value={getUsagePercent(usage.templates_count, usage.templates_limit)} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Landing Pages</p>
                  <p className="text-lg font-bold text-slate-900">
                    {usage.landing_pages_count} / {formatLimit(usage.landing_pages_limit)}
                  </p>
                </div>
              </div>
              <Progress value={getUsagePercent(usage.landing_pages_count, usage.landing_pages_limit)} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">AI Generations</p>
                  <p className="text-lg font-bold text-slate-900">
                    {usage.ai_generations_this_month} / {formatLimit(usage.ai_generations_limit)}
                  </p>
                </div>
              </div>
              <Progress value={getUsagePercent(usage.ai_generations_this_month, usage.ai_generations_limit)} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Social Accounts</p>
                  <p className="text-lg font-bold text-slate-900">
                    {usage.social_accounts_count} / {formatLimit(usage.social_accounts_limit)}
                  </p>
                </div>
              </div>
              <Progress value={getUsagePercent(usage.social_accounts_count, usage.social_accounts_limit)} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Plans */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-heading mb-6">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.plan_id === plan.id;
              const isPopular = plan.id === "professional";
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    isPopular 
                      ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-100' 
                      : 'border-slate-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.id === 'enterprise' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' :
                      plan.id === 'professional' ? 'bg-gradient-to-br from-indigo-500 to-violet-500' :
                      'bg-gradient-to-br from-slate-400 to-slate-500'
                    } text-white`}>
                      {getPlanIcon(plan.id)}
                    </div>
                    
                    <h4 className="text-xl font-bold text-slate-900 font-heading">{plan.name}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-500">/month</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {getPlanFeatures(plan).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full mt-6 ${
                        isCurrentPlan 
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed' 
                          : isPopular 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      disabled={isCurrentPlan || processingPlan === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
                      data-testid={`upgrade-${plan.id}-btn`}
                    >
                      {processingPlan === plan.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : (
                        <>
                          Upgrade
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
