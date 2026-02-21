import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Globe,
  Eye,
  TrendingUp,
  Trash2,
  Copy,
  ExternalLink,
  QrCode
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

const LandingPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    headline: "",
    description: "",
    cta_text: "Get Started",
    background_color: "#4F46E5",
    text_color: "#FFFFFF"
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await axios.get(`${API}/landing-pages`, { withCredentials: true });
      setPages(res.data);
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/landing-pages`, form, { withCredentials: true });
      toast.success("Landing page created!");
      setDialogOpen(false);
      resetForm();
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create page");
    }
  };

  const deletePage = async (pageId) => {
    try {
      await axios.delete(`${API}/landing-pages/${pageId}`, { withCredentials: true });
      toast.success("Page deleted");
      fetchPages();
    } catch (err) {
      toast.error("Failed to delete page");
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const resetForm = () => {
    setForm({
      name: "",
      headline: "",
      description: "",
      cta_text: "Get Started",
      background_color: "#4F46E5",
      text_color: "#FFFFFF"
    });
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
      <div className="space-y-6" data-testid="landing-pages-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Landing Pages</h2>
            <p className="text-slate-500 mt-1">Create lead capture pages for your campaigns</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="create-page-btn">
                <Plus className="w-5 h-5 mr-2" />
                Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Landing Page</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div>
                  <Label htmlFor="name">Page Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Sale Campaign"
                    className="mt-1.5"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    data-testid="page-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    placeholder="Get 50% Off This Summer!"
                    className="mt-1.5"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    required
                    data-testid="page-headline-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Limited time offer. Sign up now to claim your discount!"
                    className="mt-1.5"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    data-testid="page-description-input"
                  />
                </div>

                <div>
                  <Label htmlFor="cta_text">CTA Button Text</Label>
                  <Input
                    id="cta_text"
                    placeholder="Get Started"
                    className="mt-1.5"
                    value={form.cta_text}
                    onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                    data-testid="page-cta-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="background_color"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={form.background_color}
                        onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                      />
                      <Input
                        value={form.background_color}
                        onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                        className="flex-1"
                        data-testid="page-bg-color-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="text_color"
                        type="color"
                        className="w-12 h-10 p-1"
                        value={form.text_color}
                        onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                      />
                      <Input
                        value={form.text_color}
                        onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                        className="flex-1"
                        data-testid="page-text-color-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <Label className="mb-2 block">Preview</Label>
                  <div 
                    className="rounded-xl p-8 text-center"
                    style={{ backgroundColor: form.background_color, color: form.text_color }}
                  >
                    <h3 className="text-2xl font-bold font-heading">{form.headline || "Your Headline"}</h3>
                    <p className="mt-2 opacity-90">{form.description || "Your description here"}</p>
                    <button 
                      className="mt-4 px-6 py-2 rounded-lg font-medium"
                      style={{ backgroundColor: form.text_color, color: form.background_color }}
                    >
                      {form.cta_text || "Get Started"}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="save-page-btn"
                >
                  Create Landing Page
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pages Grid */}
        {pages.length === 0 ? (
          <Card className="border-slate-100 shadow-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-heading">No landing pages yet</h3>
              <p className="text-slate-500 mt-1">Create your first lead capture page</p>
              <Button 
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Card key={page.page_id} className="border-slate-100 shadow-card hover:shadow-card-hover transition-all overflow-hidden">
                {/* Preview Header */}
                <div 
                  className="h-32 p-4 flex items-center justify-center"
                  style={{ backgroundColor: page.background_color }}
                >
                  <h3 
                    className="text-lg font-bold font-heading text-center line-clamp-2"
                    style={{ color: page.text_color }}
                  >
                    {page.headline}
                  </h3>
                </div>
                
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{page.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">/p/{page.slug}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Eye className="w-4 h-4" />
                      <span>{page.views}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>{page.conversions}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => copyLink(page.slug)}
                      data-testid={`copy-link-${page.page_id}`}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/p/${page.slug}`, '_blank')}
                      data-testid={`view-page-${page.page_id}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deletePage(page.page_id)}
                      data-testid={`delete-page-${page.page_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LandingPages;
