import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw,
  Download,
  Loader2,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const API_BASE_URL = 'https://n8n.vidinsight.com.tr/api/bfa/monitoring/metrics/system';

export default function Monitoring() {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const result = await response.json();
      if (result.success) {
        setSystemMetrics(result.data);
        setLastUpdated(new Date());

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        setMetricsHistory(prev => {
          const clamp = (v) => Math.max(0, Math.min(100, Number(v)));
          const newEntry = {
            time: timeStr,
            cpu: clamp(result.data.system_cpu_percent),
            memory: clamp(result.data.system_memory_percent),
            disk: clamp(result.data.disk_usage_percent),
            timestamp: now.getTime()
          };
          return [...prev, newEntry].slice(-10);
        });

        setLoading(false);
      } else {
        throw new Error('Failed to fetch system metrics');
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const formatUptime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-950 to-black space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-purple-500" />
            Monitoring
          </h1>
          <p className="text-gray-400 mt-1">Real-time system monitoring and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={fetchSystemMetrics}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 flex justify-center items-center animate-pulse"></div>
          ))}
        </div>
      ) : systemMetrics ? (
        <>
          {/* Status Banner */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemMetrics.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className="font-medium text-gray-200">System Status:</span>
                <div className={`px-2 py-0.5 rounded text-white ${getStatusColor(systemMetrics.status)}`}>
                  <Server className="inline h-3 w-3 mr-1" /> {systemMetrics.status.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-gray-400">Uptime: {formatUptime(systemMetrics.monitoring_uptime)}</div>
            </div>
            <div className="text-xs text-gray-500">Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</div>
          </div>

          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: "CPU Usage", value: systemMetrics.system_cpu_percent, icon: Cpu, extra: `${systemMetrics.active_threads} threads`, color: "blue" },
              { label: "Memory Usage", value: systemMetrics.system_memory_percent, icon: MemoryStick, extra: `${systemMetrics.total_processes} processes`, color: "green" },
              { label: "Disk Usage", value: systemMetrics.disk_usage_percent, icon: HardDrive, extra: "Storage utilization", color: "yellow" },
              { label: "Components", value: systemMetrics.registered_components, icon: Zap, extra: "Active components", color: "purple" },
            ].map((card, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-200">{card.label}</span>
                  <card.icon className={`h-5 w-5 text-${card.color}-400`} />
                </div>
                <div className="text-2xl font-bold text-white">{card.value.toFixed?.(1) ?? card.value}{card.label.includes("Usage") ? "%" : ""}</div>
                {card.label.includes("Usage") && (
                  <div className="h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(card.value)}`}
                      style={{ width: `${Math.min(card.value, 100)}%` }}
                    ></div>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">{card.extra}</p>
              </div>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 shadow-lg mt-6">
            <div className="mb-2">
              <h2 className="text-lg font-medium text-gray-200">System Performance</h2>
              <p className="text-sm text-gray-400">Resource usage over last 10 readings (updates every 5s)</p>
            </div>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="time" stroke="#ccc" />
                  <YAxis domain={[0, 100]} stroke="#ccc" />
                  <Tooltip 
                    formatter={(value, name) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} dot={false}/>
                  <Area type="monotone" dataKey="memory" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} dot={false}/>
                  <Area type="monotone" dataKey="disk" stroke="#facc15" fill="#facc15" fillOpacity={0.3} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading performance data...</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 text-center shadow-lg">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-200 mb-2">Unable to Load Metrics</h3>
          <p className="text-gray-400">Failed to connect to monitoring service</p>
        </div>
      )}
    </div>
  );
}
