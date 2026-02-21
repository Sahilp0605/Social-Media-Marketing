import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Send, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";

const PublicLandingPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      const res = await axios.get(`${API}/p/${slug}`);
      setPage(res.data);
    } catch (err) {
      console.error("Page not found:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(`${API}/leads`, {
        ...form,
        page_id: page.page_id
      });
      setSubmitted(true);
      toast.success("Thank you! We'll be in touch soon.");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Page Not Found</h1>
          <p className="text-slate-500 mt-2">This landing page doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: page.background_color }} data-testid="public-landing-page">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2 opacity-80" style={{ color: page.text_color }}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Powered by SocialFlow AI</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 py-16 text-center" style={{ color: page.text_color }}>
        <h1 className="text-4xl sm:text-5xl font-bold font-heading leading-tight">
          {page.headline}
        </h1>
        <p className="mt-6 text-lg opacity-90">
          {page.description}
        </p>

        {/* Lead Form */}
        <div className="mt-12 bg-white rounded-2xl p-8 text-left shadow-xl">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-heading">Thank You!</h3>
              <p className="text-slate-500 mt-2">We've received your information and will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-700">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="mt-1.5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  data-testid="lead-name-input"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="mt-1.5"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  data-testid="lead-email-input"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-slate-700">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="mt-1.5"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="lead-phone-input"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-slate-700">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your needs..."
                  className="mt-1.5"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="lead-message-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                style={{ backgroundColor: page.background_color, color: page.text_color }}
                disabled={submitting}
                data-testid="lead-submit-btn"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {page.cta_text}
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicLandingPage;
