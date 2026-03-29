"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE } from "@/lib/constants";
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  BoltIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Simulated real-time data
const generateMetricsData = () => ({
  users: {
    current: Math.floor(Math.random() * 500) + 2800,
    change: (Math.random() - 0.5) * 20,
    trend: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      value: Math.floor(Math.random() * 300) + 100 + Math.sin(i / 4) * 50,
    })),
  },
  revenue: {
    current: Math.floor(Math.random() * 10000) + 15000,
    change: (Math.random() - 0.3) * 15,
    trend: Array.from({ length: 7 }, (_, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      value: Math.floor(Math.random() * 5000) + 2000,
    })),
  },
  performance: {
    cpu: Math.floor(Math.random() * 30) + 45,
    memory: Math.floor(Math.random() * 25) + 60,
    latency: Math.floor(Math.random() * 50) + 120,
    uptime: 99.97,
  },
  alerts: [
    { id: 1, type: "warning", message: "High memory usage on server-3", time: "2 min ago", resolved: false },
    { id: 2, type: "error", message: "Payment gateway timeout", time: "15 min ago", resolved: true },
    { id: 3, type: "info", message: "Scheduled maintenance completed", time: "1 hour ago", resolved: true },
    { id: 4, type: "warning", message: "Unusual traffic spike detected", time: "3 hours ago", resolved: false },
  ],
});

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <Icon className="h-8 w-8 text-blue-400" />
      <span className={`flex items-center text-sm font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {change >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    </div>
    <h3 className="text-lg font-medium text-slate-300 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-blue-500/10 blur-xl" />
  </motion.div>
);

interface MiniChartProps {
  data: Array<{ hour?: number; day?: string; value: number }>;
  type: "line" | "bar";
  color: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, type, color }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  if (type === "line") {
    const pathData = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / range) * 100;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <div className="h-20 w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" className={`text-${color}-400`} stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" className={`text-${color}-400`} stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={pathData + ` L 100 100 L 0 100 Z`}
            fill={`url(#gradient-${color})`}
          />
          <path
            d={pathData}
            fill="none"
            className={`stroke-${color}-400`}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-20 items-end space-x-1">
      {data.map((d, i) => {
        const height = ((d.value - minValue) / range) * 100;
        return (
          <div
            key={i}
            className={`flex-1 bg-gradient-to-t from-${color}-500 to-${color}-400 rounded-t opacity-80`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AlertItem: React.FC<{ alert: any; onResolve: (id: number) => void }> = ({ alert, onResolve }) => {
  const iconMap = {
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: CheckCircleIcon,
  };
  const Icon = iconMap[alert.type as keyof typeof iconMap];
  const colorMap = {
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-center justify-between p-3 rounded-lg border ${
        alert.resolved ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-600/50 bg-slate-800/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`h-5 w-5 ${colorMap[alert.type as keyof typeof colorMap]} ${alert.resolved ? 'opacity-50' : ''}`} />
        <div>
          <p className={`text-sm ${alert.resolved ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
            {alert.message}
          </p>
          <p className="text-xs text-slate-500">{alert.time}</p>
        </div>
      </div>
      {!alert.resolved && (
        <button
          onClick={() => onResolve(alert.id)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <CheckCircleIcon className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
};

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState(() => generateMetricsData());
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedAlerts, setResolvedAlerts] = useState<number[]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMetricsData());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateMetricsData());
    setIsRefreshing(false);
  };

  const resolveAlert = (id: number) => {
    setResolvedAlerts(prev => [...prev, id]);
  };

  const visibleAlerts = useMemo(() => 
    data.alerts.map(alert => ({
      ...alert,
      resolved: alert.resolved || resolvedAlerts.includes(alert.id)
    }))
  , [data.alerts, resolvedAlerts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Demo Banner */}
      <div className="relative border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-300">
                  LIVE DEMO — built by{" "}
                  <Link href="/portfolio" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                    {SITE.name}
                  </Link>
                </span>
              </div>
            </div>
            <Link
              href="/portfolio"
              className="flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Close Demo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">DataViz Pro Analytics</h1>
            <p className="text-slate-400">Real-time performance monitoring dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Users"
            value={data.users.current}
            change={data.users.change}
            icon={UserGroupIcon}
            delay={0.1}
          />
          <MetricCard
            title="Revenue Today"
            value={`$${data.revenue.current.toLocaleString()}`}
            change={data.revenue.change}
            icon={CurrencyDollarIcon}
            delay={0.2}
          />
          <MetricCard
            title="Server Response"
            value={`${data.performance.latency}ms`}
            change={-2.3}
            icon={BoltIcon}
            delay={0.3}
          />
          <MetricCard
            title="Uptime"
            value={`${data.performance.uptime}%`}
            change={0.1}
            icon={ServerIcon}
            delay={0.4}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Charts Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* User Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">User Activity (24h)</h3>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-blue-400" />
                  <span className="text-sm text-slate-400">Active Sessions</span>
                </div>
              </div>
              <MiniChart data={data.users.trend} type="line" color="blue" />
            </motion.div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Weekly Revenue</h3>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="text-sm text-slate-400">Revenue ($)</span>
                </div>
              </div>
              <MiniChart data={data.revenue.trend} type="bar" color="emerald" />
            </motion.div>

            {/* System Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-white mb-6">System Performance</h3>
              <div className="space-y-4">
                {[
                  { label: "CPU Usage", value: data.performance.cpu, max: 100, color: "blue" },
                  { label: "Memory Usage", value: data.performance.memory, max: 100, color: "yellow" },
                  { label: "Network I/O", value: 45, max: 100, color: "emerald" },
                ].map((metric, i) => (
                  <div key={metric.label}>
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium text-slate-300">{metric.label}</span>
                      <span className="text-sm text-slate-400">{metric.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                        className={`h-2 rounded-full bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Alerts & Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">System Alerts</h3>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs text-slate-400">
                  {visibleAlerts.filter(a => !a.resolved).length} Active
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {visibleAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onResolve={resolveAlert}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Demo Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="border-t border-slate-800/50 bg-slate-950/90 px-6 py-8 text-center"
      >
        <div className="mx-auto max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-2">Enterprise Dashboard Capabilities</h3>
          <p className="text-slate-400 mb-4">
            This demo showcases real-time data visualization, interactive animations, advanced UI patterns, 
            and performance monitoring — all built with modern web technologies.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              "React 19 + Next.js",
              "Framer Motion",
              "Real-time Updates",
              "TypeScript",
              "Tailwind CSS",
              "Responsive Design",
              "Advanced Animations",
              "Data Visualization"
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-slate-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}