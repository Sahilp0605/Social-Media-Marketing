import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Search,
  Filter,
  Download,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusOptions = [
  { value: "new", label: "New", color: "status-new" },
  { value: "contacted", label: "Contacted", color: "status-contacted" },
  { value: "converted", label: "Converted", color: "status-converted" },
];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API}/leads`, { withCredentials: true });
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId, status) => {
    try {
      await axios.put(`${API}/leads/${leadId}/status?status=${status}`, {}, { withCredentials: true });
      toast.success("Status updated");
      fetchLeads();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Message", "Status", "Date"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.message || "",
      lead.status,
      new Date(lead.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    toast.success("Leads exported!");
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    converted: leads.filter(l => l.status === "converted").length,
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
      <div className="space-y-6" data-testid="leads-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Lead Management</h2>
            <p className="text-slate-500 mt-1">Track and manage your captured leads</p>
          </div>
          <Button 
            variant="outline" 
            onClick={exportCSV}
            disabled={filteredLeads.length === 0}
            data-testid="export-leads-btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{stats.new}</p>
                  <p className="text-xs text-slate-500">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{stats.contacted}</p>
                  <p className="text-xs text-slate-500">Contacted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">{stats.converted}</p>
                  <p className="text-xs text-slate-500">Converted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-100 shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search leads..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="search-leads-input"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="filter-status-select">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="border-slate-100 shadow-card">
          {filteredLeads.length === 0 ? (
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 font-heading">No leads found</h3>
              <p className="text-slate-500 mt-1">
                {leads.length === 0 
                  ? "Leads will appear here when visitors submit your forms"
                  : "Try adjusting your search or filters"}
              </p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.lead_id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </a>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-slate-600 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                      {lead.message || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={lead.status} 
                        onValueChange={(value) => updateStatus(lead.lead_id, value)}
                      >
                        <SelectTrigger className="w-[120px] h-8" data-testid={`status-select-${lead.lead_id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className={`status-badge ${opt.color}`}>{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leads;
