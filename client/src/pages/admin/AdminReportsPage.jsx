import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Ticket, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  UserCheck,
  Building2,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as reportService from '@/services/reportService';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Select from '@/components/common/Select';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import { useUIStore } from '@/store/uiStore';
import { formatDate } from '@/utils/helpers';

const AdminReportsPage = () => {
  const { addToast } = useUIStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [ticketSummary, setTicketSummary] = useState(null);
  const [ticketsByStatus, setTicketsByStatus] = useState([]);
  const [ticketsByPriority, setTicketsByPriority] = useState([]);
  const [ticketsByAgent, setTicketsByAgent] = useState([]);
  const [ticketsByDepartment, setTicketsByDepartment] = useState([]);
  const [slaCompliance, setSlaCompliance] = useState(null);
  const [resolutionTime, setResolutionTime] = useState(null);
  const [volumeData, setVolumeData] = useState([]);
  const [agentPerformance, setAgentPerformance] = useState([]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = { days: parseInt(dateRange) };
      
      const [
        summaryRes,
        statusRes,
        priorityRes,
        agentRes,
        deptRes,
        slaRes,
        resolutionRes,
        volumeRes,
        perfRes
      ] = await Promise.all([
        reportService.getTicketSummary(params),
        reportService.getTicketsByStatus(params),
        reportService.getTicketsByPriority(params),
        reportService.getTicketsByAgent(params),
        reportService.getTicketsByDepartment(params),
        reportService.getSLACompliance(params),
        reportService.getResolutionTime(params),
        reportService.getTicketVolume(params),
        reportService.getAgentPerformance(params)
      ]);

      setTicketSummary(summaryRes.data || summaryRes);
      setTicketsByStatus(statusRes.data || statusRes || []);
      setTicketsByPriority(priorityRes.data || priorityRes || []);
      setTicketsByAgent(agentRes.data || agentRes || []);
      setTicketsByDepartment(deptRes.data || deptRes || []);
      setSlaCompliance(slaRes.data || slaRes);
      setResolutionTime(resolutionRes.data || resolutionRes);
      setVolumeData(volumeRes.data || volumeRes || []);
      setAgentPerformance(perfRes.data || perfRes || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      addToast('Failed to load reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleRefresh = () => {
    addToast('Refreshing reports...', 'info');
    fetchReports();
  };

  const handleExportCSV = () => {
    try {
      const csvData = [];
      
      // Summary header
      csvData.push(['HelpDesk Pro - Analytics Report']);
      csvData.push([`Generated: ${formatDate(new Date())}`]);
      csvData.push([`Period: Last ${dateRange} days`]);
      csvData.push([]);
      
      // Summary stats
      csvData.push(['Summary Statistics']);
      csvData.push(['Metric', 'Value']);
      if (ticketSummary) {
        csvData.push(['Total Tickets', ticketSummary.total || 0]);
        csvData.push(['Open Tickets', ticketSummary.open || 0]);
        csvData.push(['Resolved Tickets', ticketSummary.resolved || 0]);
        csvData.push(['Avg Response Time', ticketSummary.avgResponseTime || 'N/A']);
        csvData.push(['Avg Resolution Time', ticketSummary.avgResolutionTime || 'N/A']);
      }
      csvData.push([]);
      
      // Status breakdown
      csvData.push(['Tickets by Status']);
      csvData.push(['Status', 'Count', 'Percentage']);
      ticketsByStatus.forEach(item => {
        csvData.push([item.status, item.count, `${item.percentage}%`]);
      });
      csvData.push([]);
      
      // Priority breakdown
      csvData.push(['Tickets by Priority']);
      csvData.push(['Priority', 'Count', 'Percentage']);
      ticketsByPriority.forEach(item => {
        csvData.push([item.priority, item.count, `${item.percentage}%`]);
      });
      csvData.push([]);
      
      // Agent performance
      if (agentPerformance.length > 0) {
        csvData.push(['Agent Performance']);
        csvData.push(['Agent', 'Resolved', 'Avg Time', 'Satisfaction']);
        agentPerformance.forEach(agent => {
          csvData.push([
            agent.name,
            agent.resolved || 0,
            agent.avgTime || 'N/A',
            agent.satisfaction ? `${agent.satisfaction}%` : 'N/A'
          ]);
        });
        csvData.push([]);
      }
      
      // Department breakdown
      if (ticketsByDepartment.length > 0) {
        csvData.push(['Tickets by Department']);
        csvData.push(['Department', 'Total Tickets', 'Resolved']);
        ticketsByDepartment.forEach(dept => {
          csvData.push([dept.name, dept.tickets, dept.resolved]);
        });
      }
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `helpdesk-report-${dateRange}days-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Failed to export report', 'error');
    }
  };

  const COLORS = {
    OPEN: '#10b981',
    IN_PROGRESS: '#3b82f6',
    WAITING_CUSTOMER: '#f59e0b',
    RESOLVED: '#8b5cf6',
    CLOSED: '#64748b',
    LOW: '#64748b',
    MEDIUM: '#3b82f6',
    HIGH: '#f97316',
    URGENT: '#ef4444'
  };

  const STATUS_CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];
  const PRIORITY_CHART_COLORS = ['#64748b', '#3b82f6', '#f97316', '#ef4444'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            System-wide performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' },
            ]}
            className="w-40"
          />
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Tickets</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {ticketSummary?.total || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30">
              <Ticket size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-slate-400">Last {dateRange} days</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Open Tickets</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {ticketSummary?.open || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-slate-400">Currently active</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Resolved</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {ticketSummary?.resolved || 0}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-slate-400">Successfully closed</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Resolution Time</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {ticketSummary?.avgResolutionTime || 'N/A'}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-slate-400">Response: {ticketSummary?.avgResponseTime || 'N/A'}</span>
          </div>
        </Card>
      </div>

      {/* SLA Compliance Card */}
      {slaCompliance && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={20} className="text-primary-600" />
              SLA Compliance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Overall Compliance</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {slaCompliance.overallCompliance || 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Breaches</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {slaCompliance.breaches || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Within SLA</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {slaCompliance.withinSLA || 0}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Tickets by Status
          </h2>
          {ticketsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {ticketsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="No ticket data for the selected period"
            />
          )}
        </Card>

        {/* Priority Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Tickets by Priority
          </h2>
          {ticketsByPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketsByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {ticketsByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_CHART_COLORS[index % PRIORITY_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="No priority data for the selected period"
            />
          )}
        </Card>
      </div>

      {/* Volume Trend */}
      {volumeData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Ticket Volume Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Agent Performance Table */}
      {agentPerformance.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCheck size={20} className="text-primary-600" />
            Agent Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Resolved
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Avg Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Satisfaction
                  </th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {agent.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {agent.resolved || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                      {agent.avgTime || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {agent.satisfaction ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-emerald-500 h-2 rounded-full"
                              style={{ width: `${agent.satisfaction}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-900 dark:text-white">
                            {agent.satisfaction}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Department Performance */}
      {ticketsByDepartment.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-primary-600" />
            Department Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Total Tickets
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Resolved
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    Resolution Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {ticketsByDepartment.map((dept, index) => {
                  const rate = dept.tickets > 0 ? Math.round((dept.resolved / dept.tickets) * 100) : 0;
                  return (
                    <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                        {dept.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                        {dept.tickets}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                        {dept.resolved}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-900 dark:text-white">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminReportsPage;
