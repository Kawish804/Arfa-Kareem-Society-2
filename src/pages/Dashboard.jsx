import { useState, useEffect } from 'react';
import { Users, Wallet, Receipt, CalendarDays, FileCheck, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard.jsx';
import ChartCard from '@/components/ChartCard.jsx';
// REMOVED: import { chartData } from '@/data/mockData.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#EF4444', '#22C55E'];

// Temporary mock data for the charts we haven't built backends for yet (Events/Members)
const fallbackPieData = [{ event: 'No Data', participants: 1 }];
const fallbackActivityData = [{ month: 'Jan', active: 0, inactive: 0 }];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalFunds: 0,
    totalExpenses: 0,
    activeEvents: 0,
    pendingRequests: 0,
    chartData: {
      fundCollection: [],
      expenses: []
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Ensure chartData exists to prevent crashes if backend is slow
          if (!data.stats.chartData) {
            data.stats.chartData = { fundCollection: [], expenses: [] };
          }
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading dashboard data...
      </div>
    );
  }

  const availableBalance = stats.totalFunds - stats.totalExpenses;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back! Here's your society overview.</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Available Balance" value={`Rs ${availableBalance.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Total Funds" value={`Rs ${stats.totalFunds.toLocaleString()}`} icon={Wallet} />
        <StatCard title="Total Expenses" value={`Rs ${stats.totalExpenses.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={FileCheck} />
        <StatCard title="Active Events" value={stats.activeEvents} icon={CalendarDays} />
      </div>

      <div className={styles.chartsGrid}>
        
        {/* DYNAMIC: Fund Collection Chart */}
        <ChartCard title="Fund Collection (Monthly)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.chartData.fundCollection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `Rs ${value}`} />
              <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* DYNAMIC: Expenses Chart */}
        <ChartCard title="Expenses (Monthly)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chartData.expenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `Rs ${value}`} />
              <Bar dataKey="amount" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* STATIC for now: Event Participation */}
        <ChartCard title="Event Participation">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={fallbackPieData} dataKey="participants" nameKey="event" cx="50%" cy="50%" outerRadius={100}
                label={({ event, percent }) => `${event} ${(percent * 100).toFixed(0)}%`}>
                {fallbackPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* STATIC for now: Member Activity */}
        <ChartCard title="Member Activity">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fallbackActivityData}>
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