import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast/ToastProvider';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal'; // Assuming you have your Modal component

const TransferRoleWidget = () => {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    
    const [isOpen, setIsOpen] = useState(false);
    const [targetEmail, setTargetEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async () => {
        if (!targetEmail.trim()) return toast({ title: "Email required", variant: "destructive" });
        if (targetEmail === user.email) return toast({ title: "You can't transfer to yourself!", variant: "destructive" });

        if (!window.confirm(`WARNING: You are about to transfer your position of ${user.role} to ${targetEmail}. You will instantly be demoted to Student. Continue?`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/transfer-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserId: user.id, targetUserEmail: targetEmail })
            });

            const data = await response.json();

            if (response.ok) {
                toast({ title: 'Role Transferred Successfully!' });
                setIsOpen(false);
                logout(); // Logs them out because they no longer have dashboard access!
                navigate('/login'); 
            } else {
                toast({ title: 'Transfer Failed', description: data.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Server error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)} style={{ borderColor: 'red', color: 'red' }}>
                Transfer Position
            </Button>

            <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Transfer Leadership Role">
                <div style={{ padding: '20px 0' }}>
                    <p style={{ marginBottom: '15px', color: '#666' }}>
                        Enter the registered email of the Student/Member you wish to hand your <strong>{user.role}</strong> position over to.
                    </p>
                    <Input 
                        placeholder="Student's Email Address" 
                        type="email" 
                        value={targetEmail} 
                        onChange={(e) => setTargetEmail(e.target.value)} 
                    />
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button style={{ background: 'red' }} onClick={handleTransfer} disabled={loading}>
                            {loading ? 'Transferring...' : 'Confirm Transfer'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TransferRoleWidget;