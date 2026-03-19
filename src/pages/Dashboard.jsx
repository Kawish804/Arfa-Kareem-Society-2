import { useState, useEffect } from 'react';
import { Users, Wallet, Receipt, CalendarDays, FileCheck } from 'lucide-react';
import StatCard from '@/components/StatCard.jsx';
import ChartCard from '@/components/ChartCard.jsx';
import { chartData } from '@/data/mockData.js'; // Keep this for charts until we build backend chart data
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#EF4444', '#22C55E'];

const Dashboard = () => {
  // 1. Create state to hold our dynamic data
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalFunds: 0,
    totalExpenses: 0,
    activeEvents: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  // 2. Fetch data when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Adjust this URL if your backend is running on a different port/address
        const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
          headers: {
            // Assuming you store your JWT token in localStorage
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
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

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back! Here's your society overview.</p>
      </div>

      {/* 3. Pass the fetched state to your StatCards */}
      <div className={styles.statsGrid}>
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} />
        <StatCard title="Total Funds" value={`Rs ${stats.totalFunds.toLocaleString()}`} icon={Wallet} />
        <StatCard title="Total Expenses" value={`Rs ${stats.totalExpenses.toLocaleString()}`} icon={Receipt} />
        <StatCard title="Active Events" value={stats.activeEvents} icon={CalendarDays} />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={FileCheck} />
      </div>

      <div className={styles.chartsGrid}>
        {/* ... KEEP YOUR CHART CODE EXACTLY AS IT WAS ... */}
        {/* (Using chartData from mockData until backend models are ready) */}
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
        {/* ... Rest of your charts ... */}
      </div>
    </div>
  );
};

export default Dashboard;