"use client";

import { Metadata } from "next";
import { useState, useEffect, useMemo } from "react";
import FadeIn from "@/components/FadeIn";
import { SITE } from "@/lib/constants";
import { 
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BoltIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BellIcon,
  SparklesIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin: string;
  avatar: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "Analytics" | "Communications" | "Integrations" | "Security";
  icon: React.ComponentType<{ className?: string }>;
}

interface Project {
  id: number;
  name: string;
  client: string;
  status: "active" | "completed" | "pending";
  progress: number;
  value: string;
  dueDate: string;
}

type UserRole = "admin" | "manager" | "customer";
type DemoMode = "landing" | "auth" | "dashboard";

// Mock Data
const mockUsers: User[] = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah@techcorp.com",
    role: "admin",
    status: "active",
    lastLogin: "2 minutes ago",
    avatar: "SC"
  },
  {
    id: 2,
    name: "Marcus Johnson",
    email: "marcus@designstudio.com", 
    role: "manager",
    status: "active",
    lastLogin: "1 hour ago",
    avatar: "MJ"
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    email: "lisa@startup.io",
    role: "customer",
    status: "active", 
    lastLogin: "3 hours ago",
    avatar: "LR"
  },
  {
    id: 4,
    name: "David Kim",
    email: "david@enterprise.com",
    role: "customer",
    status: "inactive",
    lastLogin: "2 days ago", 
    avatar: "DK"
  }
];

const mockProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign",
    client: "TechCorp Inc",
    status: "active",
    progress: 75,
    value: "$15,000",
    dueDate: "2026-03-20"
  },
  {
    id: 2,
    name: "Mobile App Development",
    client: "Design Studio",
    status: "pending", 
    progress: 25,
    value: "$28,000",
    dueDate: "2026-04-15"
  },
  {
    id: 3,
    name: "Brand Identity Package",
    client: "Startup.io",
    status: "completed",
    progress: 100, 
    value: "$8,500",
    dueDate: "2026-02-28"
  }
];

const mockPlugins: Plugin[] = [
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Comprehensive user and project analytics with custom reports",
    enabled: true,
    category: "Analytics",
    icon: ChartBarIcon
  },
  {
    id: "notifications",
    name: "Smart Notifications", 
    description: "Email, SMS, and push notifications with automation rules",
    enabled: true,
    category: "Communications",
    icon: BellIcon
  },
  {
    id: "integrations",
    name: "API Integrations",
    description: "Connect with Slack, Stripe, Mailchimp, and 100+ services",
    enabled: false,
    category: "Integrations", 
    icon: CloudArrowUpIcon
  },
  {
    id: "security",
    name: "Enhanced Security",
    description: "Two-factor authentication, audit logs, and access controls",
    enabled: true,
    category: "Security",
    icon: LockClosedIcon
  }
];

export default function PortalProDemo() {
  const [demoMode, setDemoMode] = useState<DemoMode>("landing");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [plugins, setPlugins] = useState(mockPlugins);
  const [showPassword, setShowPassword] = useState(false);

  const togglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(plugin => 
      plugin.id === pluginId 
        ? { ...plugin, enabled: !plugin.enabled }
        : plugin
    ));
  };

  const loginAs = (role: UserRole) => {
    const user = mockUsers.find(u => u.role === role);
    setCurrentUser(user || null);
    setDemoMode("dashboard");
  };

  const logout = () => {
    setCurrentUser(null);
    setDemoMode("landing");
  };

  const getDashboardForRole = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case "admin":
        return <AdminDashboard plugins={plugins} onTogglePlugin={togglePlugin} />;
      case "manager":  
        return <ManagerDashboard projects={mockProjects} />;
      case "customer":
        return <CustomerDashboard user={currentUser} />;
      default:
        return null;
    }
  };

  if (demoMode === "auth") {
    return (
      <AuthScreen 
        onLogin={loginAs} 
        onBack={() => setDemoMode("landing")}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />
    );
  }

  if (demoMode === "dashboard" && currentUser) {
    return (
      <DashboardLayout user={currentUser} onLogout={logout}>
        {getDashboardForRole()}
      </DashboardLayout>
    );
  }

  return (
    <LandingPage onEnterDemo={() => setDemoMode("auth")} />
  );
}

// Landing Page Component
function LandingPage({ onEnterDemo }: { onEnterDemo: () => void }) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Demo Banner */}
      <div className="bg-black py-2 text-center text-xs font-semibold text-gray-300">
        ✦ DEMO SITE — built by{" "}
        <Link href="/portfolio" className="text-blue-400 underline hover:text-blue-300">{SITE.name}</Link>
        {" "}·{" "}
        <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">← Back to Portfolio</Link>
      </div>

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <FadeIn delay={0.1}>
              <div className="flex items-center gap-3 mb-6">
                <CpuChipIcon className="h-10 w-10" />
                <h1 className="text-5xl md:text-6xl font-bold">Portal Pro</h1>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-2xl opacity-90 mb-8 max-w-3xl">
                The modern business portal platform. All the power of Drupal with 2026 performance, 
                security, and user experience.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span className="text-sm">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <BoltIcon className="h-4 w-4" />
                  <span className="text-sm">Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="text-sm">Plugin Architecture</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <button
                onClick={onEnterDemo}
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Try Interactive Demo <ArrowRightIcon className="h-5 w-5" />
              </button>
            </FadeIn>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-6xl px-6 py-16">
          <FadeIn delay={0.5}>
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              Everything Your Business Needs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: UserGroupIcon,
                  title: "User Management", 
                  desc: "Role-based access with granular permissions"
                },
                {
                  icon: ChartBarIcon,
                  title: "Analytics Dashboard",
                  desc: "Real-time insights and custom reports"
                },
                {
                  icon: Cog6ToothIcon,
                  title: "Plugin System",
                  desc: "Extend functionality with modular components"
                },
                {
                  icon: ShieldCheckIcon,
                  title: "Enterprise Security",
                  desc: "2FA, audit logs, and compliance ready"
                }
              ].map((feature, index) => (
                <FadeIn key={feature.title} delay={0.6 + index * 0.1}>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <feature.icon className="h-8 w-8 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}

// Auth Screen Component
function AuthScreen({ 
  onLogin, 
  onBack, 
  showPassword, 
  onTogglePassword 
}: { 
  onLogin: (role: UserRole) => void;
  onBack: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <CpuChipIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Portal Pro Demo</h2>
          <p className="text-gray-600 mt-2">Choose a user type to explore</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value="demo@example.com"
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value="demo123"
                readOnly
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => onLogin("admin")}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Login as Admin
          </button>
          <button
            onClick={() => onLogin("manager")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Login as Manager
          </button>
          <button
            onClick={() => onLogin("customer")}  
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Login as Customer
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Landing
        </button>
      </div>
    </div>
  );
}

// Dashboard Layout Component
function DashboardLayout({ 
  user, 
  onLogout, 
  children 
}: { 
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CpuChipIcon className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold">Portal Pro</span>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.avatar}
                </div>
                <span className="text-gray-700 font-medium">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}

// Admin Dashboard Component  
function AdminDashboard({ 
  plugins, 
  onTogglePlugin 
}: { 
  plugins: Plugin[];
  onTogglePlugin: (pluginId: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, plugins, and system settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: "1,284", change: "+12%", color: "text-green-600" },
          { label: "Active Projects", value: "47", change: "+3%", color: "text-blue-600" },
          { label: "Revenue", value: "$89,240", change: "+18%", color: "text-purple-600" },
          { label: "System Health", value: "99.9%", change: "stable", color: "text-emerald-600" }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              <span className={`text-sm font-semibold ${stat.color}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Plugin Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Plugin Management</h2>
          <p className="text-gray-600 mt-1">Enable or disable system features</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin) => (
              <div key={plugin.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <plugin.icon className="h-6 w-6 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                    <p className="text-sm text-gray-600">{plugin.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => onTogglePlugin(plugin.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    plugin.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      plugin.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Manager Dashboard Component
function ManagerDashboard({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-600">Overview of projects and team performance</p>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Projects</h3>
          <div className="text-2xl font-bold text-blue-600">12</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
          <div className="text-2xl font-bold text-green-600">$156,800</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Team Members</h3>
          <div className="text-2xl font-bold text-purple-600">8</div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{project.progress}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {project.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Customer Dashboard Component
function CustomerDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-gray-600">Here&apos;s an overview of your account and projects</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Projects</h3>
          <div className="text-2xl font-bold text-indigo-600">3</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">  
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Spent</h3>
          <div className="text-2xl font-bold text-green-600">$43,500</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Support Tickets</h3>
          <div className="text-2xl font-bold text-orange-600">1</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { action: "Project milestone completed", time: "2 hours ago", icon: CheckCircleIcon, color: "text-green-600" },
              { action: "Invoice #1234 paid", time: "1 day ago", icon: DocumentTextIcon, color: "text-blue-600" },
              { action: "Support ticket opened", time: "3 days ago", icon: ExclamationTriangleIcon, color: "text-orange-600" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <activity.icon className={`h-5 w-5 ${activity.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Documents & Files</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Project Proposal.pdf", size: "2.4 MB", date: "Mar 1, 2026" },
              { name: "Contract Agreement.pdf", size: "1.8 MB", date: "Feb 28, 2026" },
              { name: "Invoice_March.pdf", size: "256 KB", date: "Mar 8, 2026" },
              { name: "Brand Guidelines.zip", size: "15.2 MB", date: "Feb 15, 2026" }
            ].map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.size} • {doc.date}</div>
                  </div>
                </div>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm">Download</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}