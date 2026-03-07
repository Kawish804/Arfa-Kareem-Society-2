import { Users, Wallet, Receipt, CalendarDays, FileCheck } from 'lucide-react';
import StatCard from '@/components/StatCard.jsx';
import ChartCard from '@/components/ChartCard.jsx';
import { dashboardStats, chartData } from '@/data/mockData.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#EF4444', '#22C55E'];

const Dashboard = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back! Here's your society overview.</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Total Members" value={dashboardStats.totalMembers} icon={Users} />
        <StatCard title="Total Funds" value={`Rs ${dashboardStats.totalFunds.toLocaleString()}`} icon={Wallet} />
        <StatCard title="Total Expenses" value={`Rs ${dashboardStats.totalExpenses.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Active Events" value={dashboardStats.activeEvents} icon={CalendarDays} />
        <StatCard title="Pending Requests" value={dashboardStats.pendingRequests} icon={FileCheck} />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Fund Collection (Monthly)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData.fundCollection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expenses (Monthly)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.expenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Event Participation">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartData.eventParticipation} dataKey="participants" nameKey="event" cx="50%" cy="50%" outerRadius={100}
                label={({ event, percent }) => `${event} ${(percent * 100).toFixed(0)}%`}>
                {chartData.eventParticipation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Member Activity">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.memberActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="active" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inactive" fill="#93C5FD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
