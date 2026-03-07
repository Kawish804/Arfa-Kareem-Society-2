import ChartCard from '../components/ChartCard.jsx';
import { chartData } from '../data/mockData.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import styles from './Reports.module.css';

const Reports = () => (
  <div>
    <div className={styles.header}><h1>Reports & Analytics</h1><p className={styles.sub}>Detailed analytical reports of society activities.</p></div>
    <div className={styles.grid}>
      <ChartCard title="Monthly Fund Collection">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.fundCollection}><CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" /><XAxis dataKey="month" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} /><Tooltip /><Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} /></AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Expenses Summary">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.expenses}><CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" /><XAxis dataKey="month" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} /><Tooltip /><Bar dataKey="amount" fill="#1E3A8A" radius={[4,4,0,0]} /></BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Event Participation">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.eventParticipation}><CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" /><XAxis dataKey="event" tick={{fontSize:11}} /><YAxis tick={{fontSize:12}} /><Tooltip /><Bar dataKey="participants" fill="#60A5FA" radius={[4,4,0,0]} /></BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Member Activity">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.memberActivity}><CartesianGrid strokeDasharray="3 3" stroke="#D1DBE8" /><XAxis dataKey="month" tick={{fontSize:12}} /><YAxis tick={{fontSize:12}} /><Tooltip /><Line type="monotone" dataKey="active" stroke="#3B82F6" strokeWidth={2} /><Line type="monotone" dataKey="inactive" stroke="#EF4444" strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);

export default Reports;
