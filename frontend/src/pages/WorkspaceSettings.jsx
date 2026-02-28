import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Users,
  UserPlus,
  Crown,
  Shield,
  Pencil,
  Eye,
  Trash2,
  Mail,
  Loader2,
  Check,
  X,
  MessageSquare,
  Bell,
  Plus
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye
};

const roleColors = {
  owner: "text-amber-600 bg-amber-50",
  admin: "text-blue-600 bg-blue-50",
  editor: "text-emerald-600 bg-emerald-50",
  viewer: "text-slate-600 bg-slate-50"
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer"
};

const WorkspaceSettings = () => {
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "viewer" });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchWorkspace();
    fetchWhatsappStatus();
    fetchSubscription();
  }, []);

  const fetchWorkspace = async () => {
    try {
      const res = await axios.get(`${API}/workspace`);
      setWorkspace(res.data.company);
      setMembers(res.data.members || []);
      setUserRole(res.data.role);
      
      // Fetch invites if user has permission
      if (res.data.role === "owner" || res.data.role === "admin") {
        const invitesRes = await axios.get(`${API}/workspace/invites`);
        setInvites(invitesRes.data.invites || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await axios.get(`${API}/whatsapp/status`);
      setWhatsappStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${API}/subscription`);
      setSubscription(res.data);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await axios.post(`${API}/workspace/invite`, inviteForm);
      toast.success("Invitation sent!");
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "viewer" });
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (memberId, newRole) => {
    try {
      await axios.put(`${API}/workspace/members/${memberId}/role?role=${newRole}`);
      toast.success("Role updated!");
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const removeMember = async (memberId) => {
    try {
      await axios.delete(`${API}/workspace/members/${memberId}`);
      toast.success("Member removed");
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const updateWhatsappSettings = async (settings) => {
    try {
      await axios.put(`${API}/whatsapp/settings`, settings);
      toast.success("WhatsApp settings updated!");
      fetchWhatsappStatus();
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const createDefaultWorkspace = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/workspace`, {
        name: "My Workspace",
        industry: null
      });
      toast.success("Workspace created!");
      fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create workspace");
      setLoading(false);
    }
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

  if (!workspace) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No Workspace</h3>
          <p className="text-slate-500 mt-1 mb-6">Create a workspace to get started with team collaboration</p>
          <Button 
            onClick={createDefaultWorkspace}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            data-testid="create-workspace-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const canManageMembers = userRole === "owner" || userRole === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="workspace-settings-page">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">Workspace Settings</h2>
          <p className="text-slate-500 mt-1">Manage your team and workspace configuration</p>
        </div>

        {/* Workspace Info */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {workspace.name}
            </CardTitle>
            <CardDescription>
              {workspace.industry || "No industry set"} • Created {new Date(workspace.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{members.length}</p>
                <p className="text-sm text-slate-500">Team Members</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 capitalize">{workspace.plan}</p>
                <p className="text-sm text-slate-500">Current Plan</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 capitalize">{userRole}</p>
                <p className="text-sm text-slate-500">Your Role</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
                {subscription && (
                  <span className="text-sm font-normal text-slate-500">
                    ({subscription.usage?.team_members_count || members.length} / {subscription.usage?.team_members_limit === -1 ? '∞' : subscription.usage?.team_members_limit || 3})
                  </span>
                )}
              </CardTitle>
              <CardDescription>Manage your workspace team and their permissions</CardDescription>
            </div>
            {canManageMembers && (
              <>
                {subscription && subscription.usage?.team_members_limit !== -1 && 
                 (subscription.usage?.team_members_count || members.length) >= (subscription.usage?.team_members_limit || 3) ? (
                  <Button 
                    className="bg-slate-300 text-slate-600 cursor-not-allowed" 
                    disabled
                    data-testid="invite-member-btn-disabled"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Limit Reached
                  </Button>
                ) : (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="invite-member-btn">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Invite Team Member</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleInvite} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="colleague@company.com"
                            className="mt-1.5"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            required
                            data-testid="invite-email-input"
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                            <SelectTrigger className="mt-1.5" data-testid="invite-role-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin - Manage campaigns & leads</SelectItem>
                              <SelectItem value="editor">Editor - Create posts & templates</SelectItem>
                              <SelectItem value="viewer">Viewer - Read-only analytics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={inviting}>
                          {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                          Send Invitation
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </CardHeader>
          <CardContent>
            {/* Team Limit Warning */}
            {subscription && subscription.usage?.team_members_limit !== -1 && 
             (subscription.usage?.team_members_count || members.length) >= (subscription.usage?.team_members_limit || 3) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Team member limit reached. <a href="/subscription" className="underline font-medium">Upgrade your plan</a> to invite more members.
                </p>
              </div>
            )}
            <div className="space-y-3">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role] || Eye;
                const isCurrentUser = member.email === workspace.owner_id; // Simplified check
                
                return (
                  <div 
                    key={member.member_id}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                    data-testid={`member-${member.member_id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium">
                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${roleColors[member.role]}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleLabels[member.role]}
                      </span>
                      
                      {canManageMembers && member.role !== "owner" && (
                        <>
                          <Select 
                            value={member.role} 
                            onValueChange={(v) => updateMemberRole(member.member_id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name} from this workspace? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => removeMember(member.member_id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-slate-900 mb-3">Pending Invitations</h4>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div key={invite.invite_id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-800">{invite.email}</span>
                        <span className="text-xs text-amber-600 capitalize">({invite.role})</span>
                      </div>
                      <span className="text-xs text-amber-600">Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Notifications */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp Notifications
            </CardTitle>
            <CardDescription>Configure WhatsApp Business API notifications for your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!whatsappStatus?.configured ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">WhatsApp Not Configured</p>
                    <p className="text-sm text-amber-700 mt-1">
                      To enable WhatsApp notifications, configure WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in your environment variables.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Enable WhatsApp Notifications</p>
                    <p className="text-sm text-slate-500">Send notifications via WhatsApp Business API</p>
                  </div>
                  <Switch
                    checked={whatsappStatus?.settings?.enabled || false}
                    onCheckedChange={(checked) => updateWhatsappSettings({
                      ...whatsappStatus?.settings,
                      enabled: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">New Lead Notification</p>
                    <p className="text-sm text-slate-500">Get notified when a new lead is captured</p>
                  </div>
                  <Switch
                    checked={whatsappStatus?.settings?.on_new_lead || false}
                    onCheckedChange={(checked) => updateWhatsappSettings({
                      ...whatsappStatus?.settings,
                      on_new_lead: checked
                    })}
                    disabled={!whatsappStatus?.settings?.enabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Post Published Notification</p>
                    <p className="text-sm text-slate-500">Get notified when a post is published</p>
                  </div>
                  <Switch
                    checked={whatsappStatus?.settings?.on_post_published || false}
                    onCheckedChange={(checked) => updateWhatsappSettings({
                      ...whatsappStatus?.settings,
                      on_post_published: checked
                    })}
                    disabled={!whatsappStatus?.settings?.enabled}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions Reference */}
        <Card className="border-slate-100 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Role Permissions</CardTitle>
            <CardDescription>What each role can do in this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-slate-900">Owner</span>
                </div>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• Full access</li>
                  <li>• Manage billing</li>
                  <li>• Transfer ownership</li>
                  <li>• Delete workspace</li>
                </ul>
              </div>
              <div className="p-4 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-900">Admin</span>
                </div>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• Manage campaigns</li>
                  <li>• Manage leads</li>
                  <li>• Invite members</li>
                  <li>• View analytics</li>
                </ul>
              </div>
              <div className="p-4 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-900">Editor</span>
                </div>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• Create posts</li>
                  <li>• Create templates</li>
                  <li>• Schedule content</li>
                  <li>• View analytics</li>
                </ul>
              </div>
              <div className="p-4 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-900">Viewer</span>
                </div>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• View content</li>
                  <li>• View analytics</li>
                  <li>• Read-only access</li>
                  <li>• No editing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkspaceSettings;
