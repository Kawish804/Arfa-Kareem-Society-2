import { useState, useRef, useEffect } from 'react';
import { Upload, UserPlus, Users, Search, FileSpreadsheet, Trash2, Edit3, Check, X, Filter, Download } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './StudentManagement.module.css';

const ROLE = sessionStorage.getItem('userRole') || 'President';
const isPresident = ROLE === 'President' || ROLE === 'Admin';

const emptyForm = { fullName: '', rollNumber: '', department: '', batch: '', shift: '', fatherName: '', semester: '' };

const departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Mathematics', 'Business Administration'];
const batches = ['2021', '2022', '2023', '2024', '2025', '2026', '2027'];
const shifts = ['Morning', 'Evening'];
const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const fundOptions = ['Paid', 'Unpaid', 'Pending'];

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [editingFund, setEditingFund] = useState(null);
  
  // 🔴 NEW: STATE FOR EDITING A STUDENT
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', ...emptyForm });
  
  const fileRef = useRef();
  const { toast } = useToast();

  const tabs = [
    { value: 'upload', label: 'Upload Students', icon: Upload },
    { value: 'add', label: 'Add Student', icon: UserPlus },
    { value: 'list', label: 'Student List', icon: Users },
  ];

  // --- 1. FETCH ALL STUDENTS ---
  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/students/all', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
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
  const setEditField = (key, val) => setEditForm(p => ({ ...p, [key]: val }));

  // --- 2. UPLOAD CSV ---
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
        const res = await fetch('http://localhost:5000/api/students/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ students: newStudents })
        });

        const data = await res.json();

        if (res.ok) {
          toast({ title: 'Success', description: `${newStudents.length} students uploaded!` });
          fetchStudents();
          setActiveTab('list');
        } else {
          toast({ title: 'Upload Failed', description: data.message || 'Unknown backend error', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Server Error', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  // --- 3. ADD SINGLE STUDENT ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.rollNumber || !form.department || !form.semester) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    try {
      const newStudent = { ...form, fundStatus: 'Unpaid' };
      const res = await fetch('http://localhost:5000/api/students/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
        },
        body: JSON.stringify({ students: [newStudent] })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Student added manually!' });
        setForm(emptyForm);
        fetchStudents();
        setActiveTab('list'); 
      } else {
        const data = await res.json();
        toast({ title: 'Failed', description: data.message || 'Error adding student', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Server error', variant: 'destructive' });
    }
  };

  // --- 4. UPDATE FUND STATUS ---
  const handleFundUpdate = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/students/${id}/fund`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
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

  // --- 🔴 5. DELETE STUDENT (NEW CRUD LOGIC) ---
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this student record? This cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });

      if (res.ok) {
        setStudents(prev => prev.filter(s => s._id !== id));
        toast({ title: 'Deleted', description: 'Student record removed.' });
      } else {
        toast({ title: 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // --- 🔴 6. OPEN EDIT MODAL & SAVE UPDATES (NEW CRUD LOGIC) ---
  const openEditModal = (student) => {
    setEditForm({
      id: student._id,
      fullName: student.fullName || '',
      fatherName: student.fatherName || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      semester: student.semester || '',
      shift: student.shift || '',
      batch: student.batch || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/students/${editForm.id}`, {
        method: 'PUT', // or PATCH depending on your backend
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Student details updated!' });
        // Update local state immediately so we don't have to re-fetch
        setStudents(prev => prev.map(s => s._id === editForm.id ? { ...s, ...editForm } : s));
        setEditModalOpen(false);
      } else {
        toast({ title: 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // --- 7. UTILS ---
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
        
        {/* ADD TAB */}
        {activeTab === 'add' && (
          <div className={styles.uploadSection}>
            <form onSubmit={handleAddStudent} style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>Manually Add Student</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name *</label>
                  <Input value={form.fullName} onChange={e => setField('fullName', e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Father's Name</label>
                  <Input value={form.fatherName} onChange={e => setField('fatherName', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Roll Number *</label>
                  <Input placeholder="e.g. 22034156-043" value={form.rollNumber} onChange={e => setField('rollNumber', e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Department *</label>
                  <Select value={form.department} onChange={e => setField('department', e.target.value)} required>
                    <option value="">Select Dept</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Semester *</label>
                  <Select value={form.semester} onChange={e => setField('semester', e.target.value)} required>
                    <option value="">Select</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Shift *</label>
                  <Select value={form.shift} onChange={e => setField('shift', e.target.value)} required>
                    <option value="">Select</option>
                    {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Batch *</label>
                  <Select value={form.batch} onChange={e => setField('batch', e.target.value)} required>
                    <option value="">Select</option>
                    {batches.map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </div>
              </div>

              <Button type="submit" style={{ width: '100%' }}>Save Student to Database</Button>
            </form>
          </div>
        )}

        {/* UPLOAD TAB */}
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

        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div className={styles.listSection}>
            <div className={styles.filters} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                <div className={styles.searchWrap}>
                  <Search size={16} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder="Search Name/Roll..." value={search} onChange={e => setSearch(e.target.value)} />
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
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Semester & Shift</th>
                    <th>Fund Status</th>
                    {/* 🔴 NEW ACTIONS COLUMN */}
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((s, i) => (
                    <tr key={s._id || i}>
                      <td>{i + 1}</td>
                      <td className={styles.nameCell}>
                        {s.fullName}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.fatherName}</div>
                      </td>
                      <td><code className={styles.rollCode}>{s.rollNumber}</code></td>
                      <td>{s.department}</td>
                      <td>
                        {s.semester} <Badge variant="secondary" style={{ marginLeft: '6px' }}>{s.shift}</Badge>
                      </td>
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
                      {/* 🔴 CRUD EDIT AND DELETE BUTTONS */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(s)} style={{ padding: '4px 8px' }}>
                            <Edit3 size={14} />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(s._id)} style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#ef4444' }}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🔴 NEW MODAL: EDIT STUDENT DATA */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Student Details"
        footer={<>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStudent}>Save Changes</Button>
        </>}>
        <div className={styles.formFields}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name *</label>
              <Input value={editForm.fullName} onChange={e => setEditField('fullName', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Father's Name</label>
              <Input value={editForm.fatherName} onChange={e => setEditField('fatherName', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Roll Number *</label>
              <Input value={editForm.rollNumber} onChange={e => setEditField('rollNumber', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Department *</label>
              <Select value={editForm.department} onChange={e => setEditField('department', e.target.value)} required>
                <option value="">Select Dept</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '8px' }}>
            <div className={styles.field}>
              <label className={styles.label}>Semester *</label>
              <Select value={editForm.semester} onChange={e => setEditField('semester', e.target.value)} required>
                <option value="">Select</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Shift *</label>
              <Select value={editForm.shift} onChange={e => setEditField('shift', e.target.value)} required>
                <option value="">Select</option>
                {shifts.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Batch *</label>
              <Select value={editForm.batch} onChange={e => setEditField('batch', e.target.value)} required>
                <option value="">Select</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default StudentManagement;