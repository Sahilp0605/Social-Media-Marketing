import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  Zap, 
  LayoutDashboard, 
  FileEdit, 
  Image, 
  Globe, 
  Users, 
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Link as LinkIcon,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/posts", icon: FileEdit, label: "Post Creator" },
  { path: "/templates", icon: Image, label: "Templates" },
  { path: "/landing-pages", icon: Globe, label: "Landing Pages" },
  { path: "/leads", icon: Users, label: "Leads" },
  { path: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { path: "/social-accounts", icon: LinkIcon, label: "Social Accounts" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/subscription", icon: CreditCard, label: "Subscription" },
];

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-20' : 'w-64'} 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-sidebar-bg text-sidebar-text
        flex flex-col
        transition-all duration-300
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-4' : 'px-6'} border-b border-slate-800`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-bold font-heading text-white">SocialFlow</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  sidebar-item
                  ${isActive ? 'sidebar-item-active' : ''}
                  ${collapsed ? 'justify-center px-3' : ''}
                `}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="hidden lg:block px-3 pb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>

        {/* User Section */}
        <div className={`p-4 border-t border-slate-800 ${collapsed ? 'px-3' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors ${collapsed ? 'justify-center' : ''}`}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-indigo-600 text-white text-sm">{initials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="user-settings-btn">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8">
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-slate-900 font-heading">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              Welcome, {user?.name?.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
