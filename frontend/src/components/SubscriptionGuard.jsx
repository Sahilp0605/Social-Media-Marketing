import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Clock, Zap } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

const SubscriptionGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const res = await axios.get(`${API}/subscription`);
      setSubscription(res.data);
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if subscription is expired
  const isExpired = subscription?.subscription_status?.is_expired;
  const daysRemaining = subscription?.subscription_status?.days_remaining;
  const planName = subscription?.plan?.name || "Free Trial";

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Subscription Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-slate-600">
              Your {planName} subscription has expired. Please upgrade to continue using all features of the platform.
            </p>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-2">What you're missing:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Create and schedule posts</li>
                <li>• Use AI content generation</li>
                <li>• Capture leads</li>
                <li>• Team collaboration</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => navigate("/subscription")}
                data-testid="upgrade-btn"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
              <p className="text-xs text-slate-400">
                Choose from Starter ($29/mo), Professional ($79/mo), or Enterprise ($199/mo)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show warning if trial ending soon (less than 3 days)
  if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0) {
    return (
      <>
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
          <Clock className="w-4 h-4 inline mr-2" />
          Your {planName} expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
          <Button 
            variant="link" 
            className="text-white underline ml-2 p-0 h-auto"
            onClick={() => navigate("/subscription")}
          >
            Upgrade now
          </Button>
        </div>
        {children}
      </>
    );
  }

  return children;
};

export default SubscriptionGuard;
