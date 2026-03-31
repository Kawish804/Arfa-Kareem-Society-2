import { useState, useRef, useEffect } from 'react';
import { Upload, UserPlus, Users, Search, FileSpreadsheet, Trash2, Edit3, Check, X, Filter, Download } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './StudentManagement.module.css';

const ROLE = localStorage.getItem('userRole') || 'President';
const isPresident = ROLE === 'President' || ROLE === 'Admin';

const emptyForm = { fullName: '', rollNumber: '', department: '', batch: '', shift: '', fatherName: '', semester: '' };

const departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Mathematics', 'Business Administration'];
const batches = ['2021', '2022', '2023', '2024', '2025'];
const shifts = ['Morning', 'Evening'];
const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const fundOptions = ['Paid', 'Unpaid', 'Pending'];

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [students, setStudents] = useState([]); // Starts empty, fetches from DB
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [editingFund, setEditingFund] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const fileRef = useRef();
  const { toast } = useToast();

  const tabs = [
    { value: 'upload', label: 'Upload Students', icon: Upload },
    { value: 'add', label: 'Add Student', icon: UserPlus },
    { value: 'list', label: 'Student List', icon: Users },
  ];

  // --- 1. FETCH ALL STUDENTS FROM MONGODB ---
  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/students/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast({ title: 'Failed to fetch students', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // --- 2. PARSE CSV AND SEND TO BACKEND (WITH DEBUGGING) ---
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast({ title: 'Error', description: 'File is empty.', variant: 'destructive' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newStudents = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 6) continue;
        newStudents.push({
          fullName: cols[headers.indexOf('full name')] || cols[0],
          rollNumber: cols[headers.indexOf('roll number')] || cols[1],
          department: cols[headers.indexOf('department')] || cols[2],
          batch: cols[headers.indexOf('batch')] || cols[3],
          shift: cols[headers.indexOf('shift')] || cols[4],
          fatherName: cols[headers.indexOf("father's name")] || cols[5],
          semester: cols[headers.indexOf('semester')] || cols[6] || '',
          fundStatus: 'Unpaid',
        });
      }

      try {
        console.log("📤 FRONTEND: Sending this data to backend:", newStudents.length, newStudents[0]);

        const res = await fetch('http://localhost:5000/api/students/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ students: newStudents })
        });

        const data = await res.json();
        console.log("📥 FRONTEND: Backend replied with status:", res.status, data);

        if (res.ok) {
          toast({ title: 'Success', description: `${newStudents.length} students uploaded!` });
          fetchStudents();
          setActiveTab('list');
        } else {
          // ADDED data.message SO IT NEVER HIDES THE ERROR AGAIN!
          toast({
            title: 'Upload Failed',
            description: data.error || data.details || data.message || 'Unknown backend error',
            variant: 'destructive'
          });
        } 
      } catch (error) {
        console.error("🔴 FRONTEND FETCH CRASH:", error);
        toast({ title: 'Server Error', description: 'Check browser console (F12).', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  // --- 3. UPDATE FUND STATUS IN BACKEND ---
  const handleFundUpdate = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/students/${id}/fund`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, fundStatus: status } : s));
        setEditingFund(null);
        toast({ title: 'Updated', description: `Fund status changed to ${status}.` });
      }
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDownloadCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Full Name', 'Roll Number', 'Department', 'Semester', 'Shift', 'Batch', 'Father\'s Name', 'Fund Status'];
    const csvRows = filtered.map(s => [`"${s.fullName}"`, `"${s.rollNumber}"`, `"${s.department}"`, `"${s.semester}"`, `"${s.shift}"`, `"${s.batch}"`, `"${s.fatherName}"`, `"${s.fundStatus}"`].join(','));
    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const filtered = students.filter(s => {
    if (search && !s.fullName?.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDepartment && s.department !== filterDepartment) return false;
    if (filterBatch && s.batch !== filterBatch) return false;
    if (filterShift && s.shift !== filterShift) return false;
    if (filterSemester && s.semester !== filterSemester) return false;
    return true;
  });

  const fundBadgeVariant = (s) => s === 'Paid' ? 'success' : s === 'Unpaid' ? 'destructive' : 'secondary';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Management</h1>
          <p className={styles.subtitle}>Manage all student records, uploads, and data</p>
        </div>
        <Badge variant="secondary">President Access</Badge>
      </div>

      <div className={styles.tabs}>
        {tabs.map(t => (
          <button key={t.value} className={`${styles.tab} ${activeTab === t.value ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.value)}>
            <t.icon size={16} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'upload' && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadCard}>
              <div className={styles.uploadIcon}><FileSpreadsheet size={48} /></div>
              <h2 className={styles.uploadTitle}>Upload Student List</h2>
              <p className={styles.uploadDesc}>Upload a CSV file with columns: Full Name, Roll Number, Department, Batch, Shift, Father's Name, Semester</p>
              <div className={styles.uploadArea} onClick={() => fileRef.current?.click()}>
                <Upload size={32} />
                <span>Click to browse or drag & drop your file here</span>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className={styles.listSection}>
            <div className={styles.filters} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                <div className={styles.searchWrap}>
                  <Search size={16} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={14} />
                  <Select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Depts</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                  <Select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Sems</option>{semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select value={filterShift} onChange={e => setFilterShift(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Shifts</option>{shifts.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Batches</option>{batches.map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadCSV}><Download size={16} style={{ marginRight: '8px' }} /> Export</Button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th><th>Full Name</th><th>Roll Number</th><th>Department</th><th>Semester</th><th>Shift</th><th>Batch</th><th>Fund Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((s, i) => (
                    <tr key={s._id || i}>
                      <td>{i + 1}</td>
                      <td className={styles.nameCell}>{s.fullName}</td>
                      <td><code className={styles.rollCode}>{s.rollNumber}</code></td>
                      <td>{s.department}</td>
                      <td>{s.semester}</td>
                      <td><Badge variant="secondary">{s.shift}</Badge></td>
                      <td>{s.batch}</td>
                      <td>
                        {editingFund === s._id ? (
                          <div className={styles.fundEdit}>
                            {fundOptions.map(opt => (
                              <button key={opt} className={`${styles.fundOption} ${styles[`fund${opt}`]}`} onClick={() => handleFundUpdate(s._id, opt)}>{opt}</button>
                            ))}
                            <button className={styles.fundCancel} onClick={() => setEditingFund(null)}><X size={14} /></button>
                          </div>
                        ) : (
                          <span className={styles.fundBadge} onClick={() => setEditingFund(s._id)} style={{ cursor: 'pointer' }}>
                            <Badge variant={fundBadgeVariant(s.fundStatus)}>{s.fundStatus}</Badge>
                            <Edit3 size={12} className={styles.fundEditIcon} />
                          </span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;