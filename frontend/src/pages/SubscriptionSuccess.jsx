import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API, useAuth } from "@/App";
import { toast } from "sonner";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState("processing");
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus("timeout");
      return;
    }

    try {
      const res = await axios.get(`${API}/subscription/status/${sessionId}`);

      if (res.data.payment_status === "paid") {
        setStatus("success");
        setPlanId(res.data.plan_id);
        // Refresh user data
        await checkAuth();
        toast.success("Subscription activated successfully!");
        return;
      } else if (res.data.status === "expired") {
        setStatus("expired");
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (err) {
      console.error("Error checking payment status:", err);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        setStatus("error");
      }
    }
  };

  const getPlanName = (id) => {
    const names = {
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise"
    };
    return names[id] || id;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center" data-testid="subscription-success-page">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">Processing Payment</h1>
            <p className="text-slate-500 mt-2">Please wait while we confirm your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">Welcome to {getPlanName(planId)}!</h1>
            <p className="text-slate-500 mt-2">Your subscription has been activated successfully.</p>
            <Button
              className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => navigate("/dashboard")}
              data-testid="go-to-dashboard-btn"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">Payment Error</h1>
            <p className="text-slate-500 mt-2">Something went wrong with your payment. Please try again.</p>
            <Button
              className="mt-8"
              variant="outline"
              onClick={() => navigate("/subscription")}
            >
              Back to Plans
            </Button>
          </>
        )}

        {status === "timeout" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">Taking Longer Than Expected</h1>
            <p className="text-slate-500 mt-2">Your payment is still being processed. Please check your subscription status later.</p>
            <Button
              className="mt-8"
              variant="outline"
              onClick={() => navigate("/subscription")}
            >
              Check Subscription
            </Button>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⏱</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">Session Expired</h1>
            <p className="text-slate-500 mt-2">Your payment session has expired. Please try again.</p>
            <Button
              className="mt-8"
              variant="outline"
              onClick={() => navigate("/subscription")}
            >
              Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
