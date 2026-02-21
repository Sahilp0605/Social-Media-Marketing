import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Megaphone,
  Calendar as CalendarIcon,
  Trash2,
  Instagram,
  Facebook,
  Linkedin,
  DollarSign
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-orange-400" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-600 to-blue-500" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "from-blue-700 to-blue-600" },
];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    platforms: [],
    budget: ""
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${API}/campaigns`, { withCredentials: true });
      setCampaigns(res.data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.start_date || !form.end_date) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      await axios.post(`${API}/campaigns`, {
        name: form.name,
        description: form.description || null,
        start_date: format(form.start_date, "yyyy-MM-dd"),
        end_date: format(form.end_date, "yyyy-MM-dd"),
        platforms: form.platforms,
        budget: form.budget ? parseFloat(form.budget) : null
      }, { withCredentials: true });
      toast.success("Campaign created!");
      setDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create campaign");
    }
  };

  const deleteCampaign = async (campaignId) => {
    try {
      await axios.delete(`${API}/campaigns/${campaignId}`, { withCredentials: true });
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (err) {
      toast.error("Failed to delete campaign");
    }
  };

  const togglePlatform = (platformId) => {
    const current = form.platforms;
    if (current.includes(platformId)) {
      setForm({ ...form, platforms: current.filter(p => p !== platformId) });
    } else {
      setForm({ ...form, platforms: [...current, platformId] });
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      start_date: null,
      end_date: null,
      platforms: [],
      budget: ""
    });
  };

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    
    if (now < start) return { label: "Scheduled", color: "status-scheduled" };
    if (now > end) return { label: "Completed", color: "status-draft" };
    return { label: "Active", color: "status-published" };
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
      <div className="space-y-6" data-testid="campaigns-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Campaigns</h2>
            <p className="text-slate-500 mt-1">Plan and track your marketing campaigns</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="create-campaign-btn">
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Campaign</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Sale 2024"
                    className="mt-1.5"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    data-testid="campaign-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Campaign details..."
                    className="mt-1.5"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    data-testid="campaign-description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1.5 justify-start text-left font-normal" data-testid="campaign-start-date">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {form.start_date ? format(form.start_date, "MMM dd, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.start_date}
                          onSelect={(date) => setForm({ ...form, start_date: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1.5 justify-start text-left font-normal" data-testid="campaign-end-date">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {form.end_date ? format(form.end_date, "MMM dd, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.end_date}
                          onSelect={(date) => setForm({ ...form, end_date: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Platforms</Label>
                  <div className="flex gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          form.platforms.includes(platform.id)
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`campaign-platform-${platform.id}`}
                      >
                        <div className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                          <platform.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget">Budget (optional)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder="1000"
                      className="pl-9"
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      data-testid="campaign-budget-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="save-campaign-btn"
                >
                  Create Campaign
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <Card className="border-slate-100 shadow-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-heading">No campaigns yet</h3>
              <p className="text-slate-500 mt-1">Create your first marketing campaign</p>
              <Button 
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const status = getCampaignStatus(campaign);
              return (
                <Card key={campaign.campaign_id} className="border-slate-100 shadow-card hover:shadow-card-hover transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 font-heading">{campaign.name}</h3>
                      <span className={`status-badge ${status.color}`}>{status.label}</span>
                    </div>
                    
                    {campaign.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{campaign.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {campaign.budget && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <DollarSign className="w-4 h-4" />
                          <span>${campaign.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex gap-1">
                        {campaign.platforms?.map((p) => {
                          const platform = platforms.find(pl => pl.id === p);
                          if (!platform) return null;
                          return (
                            <div 
                              key={p} 
                              className={`w-6 h-6 rounded bg-gradient-to-r ${platform.color} flex items-center justify-center`}
                            >
                              <platform.icon className="w-3 h-3 text-white" />
                            </div>
                          );
                        })}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteCampaign(campaign.campaign_id)}
                        data-testid={`delete-campaign-${campaign.campaign_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Campaigns;
