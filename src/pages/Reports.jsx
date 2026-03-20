import { useState, useEffect } from 'react';
import ChartCard from '../components/ChartCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import styles from './Reports.module.css';

const Reports = () => {
  const [fundData, setFundData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [participationData, setParticipationData] = useState([]);
  const [memberActivityData, setMemberActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all data simultaneously. We use allSettled so if one backend isn't ready, the others still load!
        const [fundsRes, expensesRes, partsRes] = await Promise.allSettled([
          fetch('http://localhost:5000/api/fund-collections/records').then(r => r.json()),
          fetch('http://localhost:5000/api/expenses/records').then(r => r.json()),
          fetch('http://localhost:5000/api/participants/all').then(r => r.json())
        ]);

        const funds = fundsRes.status === 'fulfilled' && Array.isArray(fundsRes.value) ? fundsRes.value : [];
        const expenses = expensesRes.status === 'fulfilled' && Array.isArray(expensesRes.value) ? expensesRes.value : [];
        const participants = partsRes.status === 'fulfilled' && Array.isArray(partsRes.value) ? partsRes.value : [];

        // 1. Process Monthly Funds (Only "Paid" amounts)
        const monthlyFunds = Array(12).fill(0).map((_, i) => ({ 
          month: new Date(0, i).toLocaleString('default', { month: 'short' }), 
          amount: 0 
        }));
        
        funds.forEach(f => {
          if (f.status === 'Paid' && f.date) {
            const m = new Date(f.date).getMonth();
            if (!isNaN(m)) monthlyFunds[m].amount += Number(f.amount) || 0;
          }
        });
        setFundData(monthlyFunds);

        // 2. Process Monthly Expenses
        const monthlyExpenses = Array(12).fill(0).map((_, i) => ({ 
          month: new Date(0, i).toLocaleString('default', { month: 'short' }), 
          amount: 0 
        }));
        
        expenses.forEach(e => {
          if (e.date) {
            const m = new Date(e.date).getMonth();
            if (!isNaN(m)) monthlyExpenses[m].amount += Number(e.amount) || 0;
          }
        });
        setExpenseData(monthlyExpenses);

        // 3. Process Event Participation (Group by Event Title)
        const eventCounts = {};
        participants.forEach(p => {
          if (p.status === 'Approved') {
            eventCounts[p.eventTitle] = (eventCounts[p.eventTitle] || 0) + 1;
          }
        });
        
        const partData = Object.keys(eventCounts).map(key => ({
          // Truncate long event names so they fit nicely on the chart X-Axis
          event: key.length > 15 ? key.substring(0, 15) + '...' : key,
          participants: eventCounts[key]
        }));
        setParticipationData(partData);

        // 4. Process Member Activity (Derived from Participant Requests over time)
        const activityData = Array(12).fill(0).map((_, i) => ({ 
          month: new Date(0, i).toLocaleString('default', { month: 'short' }), 
          active: 0, 
          inactive: 0 
        }));
        
        participants.forEach(p => {
          const dateToUse = p.createdAt || p.date;
          if (dateToUse) {
            const m = new Date(dateToUse).getMonth();
            if (!isNaN(m)) {
              if (p.status === 'Approved') activityData[m].active += 1;
              else activityData[m].inactive += 1; // Pending or Rejected count as inactive/unsuccessful
            }
          }
        });
        setMemberActivityData(activityData);

      } catch (error) {
        console.error("Error generating reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Generating real-time analytics...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h1>Reports & Analytics</h1>
        <p className={styles.sub}>Real-time detailed analytical reports of society activities.</p>
      </div>
      
      <div className={styles.grid}>
        <ChartCard title="Monthly Fund Collection">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fundData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{fontSize:12}} />
              <YAxis tick={{fontSize:12}} />
              <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
              <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expenses Summary">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{fontSize:12}} />
              <YAxis tick={{fontSize:12}} />
              <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#1E3A8A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Event Participation">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={participationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="event" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:12}} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="participants" fill="#60A5FA" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Society Engagement Activity">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memberActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" />
              <XAxis dataKey="month" tick={{fontSize:12}} />
              <YAxis tick={{fontSize:12}} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" name="Approved Engagements" dataKey="active" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" name="Pending/Rejected" dataKey="inactive" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Reports;