import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, LogOut, ArrowLeft, Search, UserPlus, CheckCheck, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Chat.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();
  
  const [allUsers, setAllUsers] = useState([]); 
  const [messages, setMessages] = useState([]); 
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchChatData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [usersRes, msgsRes] = await Promise.all([
          fetch(`${API_URL}/messages/directory`, { headers }),
          fetch(`${API_URL}/messages/my-messages`, { headers })
        ]);

        if (usersRes.ok) {
          const fetchedData = await usersRes.json();
          let userArray = Array.isArray(fetchedData) ? fetchedData : (fetchedData.users || []);
          
          userArray = userArray.filter(u => (u._id || u.id) !== (currentUser._id || currentUser.id));

          const isStudent = currentUser.role === 'Student' || (Array.isArray(currentUser.role) && currentUser.role.includes('Student'));
          
          if (isStudent) {
            userArray = userArray.filter(u => u.role === 'President' || (Array.isArray(u.role) && u.role.includes('President')));
          }

          setAllUsers(userArray);
        }
        
        if (msgsRes.ok) {
          setMessages(await msgsRes.json());
        }
      } catch (error) {
        console.error("Failed to load chat data", error);
      } finally {
        if(initialLoad) setInitialLoad(false);
      }
    };

    fetchChatData();
    const interval = setInterval(fetchChatData, 3000);
    return () => clearInterval(interval);
  }, [currentUser, initialLoad]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      const contactId = selectedContact._id || selectedContact.id;
      fetch(`${API_URL}/messages/mark-read/${contactId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      }).catch(err => console.log(err));
      
      setMessages(prev => prev.map(m => 
        m.sender === contactId ? { ...m, read: true } : m
      ));
    }
  }, [selectedContact]);

  const myId = currentUser?._id || currentUser?.id;
  
  const activeContactIds = new Set();
  messages.forEach(msg => {
    if (msg.sender && msg.sender !== myId) activeContactIds.add(msg.sender);
    if (msg.receiver && msg.receiver !== myId) activeContactIds.add(msg.receiver);
  });

  let sidebarContacts = allUsers.filter(u => activeContactIds.has(u._id || u.id));

  if (selectedContact && !activeContactIds.has(selectedContact._id || selectedContact.id)) {
    sidebarContacts = [selectedContact, ...sidebarContacts];
  }

  const filteredSidebarContacts = sidebarContacts.filter(m => 
    (m.fullName || m.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversation = (contactId) => {
    return messages.filter(m =>
      (m.sender === myId && m.receiver === contactId) ||
      (m.sender === contactId && m.receiver === myId)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const getLastMessage = (contactId) => {
    const conv = getConversation(contactId);
    return conv.length > 0 ? conv[conv.length - 1] : null;
  };

  const getUnreadCount = (contactId) => {
    return messages.filter(m => m.sender === contactId && m.receiver === myId && !m.read).length;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;
    
    setIsSending(true);
    const receiverId = selectedContact._id || selectedContact.id;
    const messageText = newMessage.trim();
    setNewMessage(''); 

    try {
      const res = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ receiverId, text: messageText })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => [...prev, savedMsg]);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast({ title: 'Send Failed', description: 'Check your connection.', variant: 'destructive' });
      setNewMessage(messageText); // restore text on fail
    } finally {
      setIsSending(false);
    }
  };

  const conversation = selectedContact ? getConversation(selectedContact._id || selectedContact.id) : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} title="Go Back"><ArrowLeft size={20} /></button>
            <div className={styles.headerLogo}><MessageCircle size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>Society Messenger</h1>
              <p className={styles.headerSub}>Logged in as <strong style={{color: '#0f172a'}}>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className={styles.logoutBtn}>
            <LogOut size={14} style={{marginRight: '6px'}} /> <span className={styles.hideMobile}>Logout</span>
          </Button>
        </div>
      </header>

      <div className={styles.chatContainer}>
        {/* --- LEFT SIDEBAR --- */}
        <aside className={`${styles.sidebar} ${selectedContact ? styles.hideMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2>Chats</h2>
            <Button size="sm" onClick={() => setIsNewChatModalOpen(true)} title="Start New Chat" className={styles.newChatBtn}>
              <UserPlus size={16} />
            </Button>
          </div>

          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <Input placeholder="Search active chats..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={styles.searchInput} />
          </div>
          
          <div className={styles.contactList}>
            {initialLoad ? (
              <div className={styles.centerMsg}><Loader2 className={styles.spin} size={24} /></div>
            ) : filteredSidebarContacts.length === 0 ? (
              <div className={styles.centerMsg}>
                <p>No active conversations.</p>
                <Button variant="outline" size="sm" style={{ marginTop: '12px' }} onClick={() => setIsNewChatModalOpen(true)}>Start a new chat</Button>
              </div>
            ) : (
              filteredSidebarContacts.map(c => {
                const cId = c._id || c.id;
                const cName = c.fullName || c.name || 'Unknown';
                const last = getLastMessage(cId);
                const unread = getUnreadCount(cId);
                
                return (
                  <button key={cId}
                    className={`${styles.contactItem} ${selectedContact && (selectedContact._id || selectedContact.id) === cId ? styles.contactActive : ''}`}
                    onClick={() => setSelectedContact(c)}>
                    <div className={styles.avatar}>{cName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactTop}>
                        <span className={styles.contactName}>{cName}</span>
                        {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                      </div>
                      <span className={styles.contactRole}>{c.role || 'Member'}</span>
                      {last && <p className={styles.lastMsg}>
                        {last.sender === myId && <CheckCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom', color: last.read ? '#3b82f6' : '#94a3b8' }} />}
                        {last.text}
                      </p>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* --- MAIN CHAT AREA --- */}
        <main className={`${styles.chatMain} ${!selectedContact ? styles.hideMobile : ''}`}>
          {selectedContact ? (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.mobileBack} onClick={() => setSelectedContact(null)}><ArrowLeft size={20}/></button>
                <div className={styles.avatar}>{(selectedContact.fullName || selectedContact.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</div>
                <div className={styles.chatHeaderInfo}>
                  <h3 className={styles.chatName}>{selectedContact.fullName || selectedContact.name}</h3>
                  <span className={styles.chatRole}>{selectedContact.role} {selectedContact.department ? `• ${selectedContact.department}` : ''}</span>
                </div>
              </div>
              
              <div className={styles.messageArea}>
                {conversation.length === 0 && (
                  <div className={styles.emptyChat}>
                    <div className={styles.emptyChatBox}>
                      <h4>Say Hello 👋</h4>
                      <p>This is the beginning of your secure conversation with <strong>{selectedContact.fullName || selectedContact.name}</strong>.</p>
                    </div>
                  </div>
                )}
                
                {conversation.map((msg, index) => {
                  const isMine = msg.sender === myId;
                  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Logic to group messages slightly if they are from the same person back-to-back
                  const prevMsg = index > 0 ? conversation[index - 1] : null;
                  const isConsecutive = prevMsg && prevMsg.sender === msg.sender;

                  return (
                    <div key={msg._id || msg.id} className={`${styles.msgWrapper} ${isMine ? styles.wrapperMine : styles.wrapperTheirs} ${isConsecutive ? styles.consecutive : ''}`}>
                      <div className={`${styles.msgBubble} ${isMine ? styles.msgSent : styles.msgReceived}`}>
                        <p className={styles.msgText}>{msg.text}</p>
                        <div className={styles.msgTime}>
                          {time}
                          {isMine && <CheckCheck size={14} style={{ color: msg.read ? '#60a5fa' : 'inherit', marginLeft: '4px' }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputBar}>
                <Input 
                  placeholder="Type a message..." 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  autoFocus 
                  className={styles.chatInput}
                  disabled={isSending}
                />
                <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} className={styles.sendBtn}>
                  {isSending ? <Loader2 size={18} className={styles.spin} /> : <Send size={18} />}
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.noChat}>
              <div className={styles.noChatCircle}>
                <MessageCircle size={48} />
              </div>
              <h2>Arfa Kareem Society Messenger</h2>
              <p>Select a conversation from the sidebar or click <strong>+ New Chat</strong> to start messaging.</p>
            </div>
          )}
        </main>
      </div>

      {/* --- NEW CHAT PHONEBOOK MODAL --- */}
      <Modal open={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} title="Select Contact" footer={null}>
        <div style={{ marginBottom: '16px' }}>
          <Input 
            placeholder="Search directory by name..." 
            value={userSearchTerm} 
            onChange={e => setUserSearchTerm(e.target.value)} 
            autoFocus
            icon={<Search size={16}/>}
          />
        </div>
        
        <div className={styles.modalDirectory}>
          {allUsers
            .filter(u => (u.fullName || u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()))
            .map(user => (
              <button 
                key={user._id || user.id}
                className={styles.directoryBtn}
                onClick={() => {
                  setSelectedContact(user);
                  setIsNewChatModalOpen(false);
                  setUserSearchTerm('');
                }}
              >
                <div className={styles.avatarSm}>
                  {(user.fullName || user.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className={styles.dirInfo}>
                  <div className={styles.dirName}>{user.fullName || user.name}</div>
                  <div className={styles.dirRole}>{user.role} • {user.department || 'Society'}</div>
                </div>
              </button>
            ))
          }
          {allUsers.filter(u => (u.fullName || u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
            <div className={styles.centerMsg}>No available contacts found.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Chat;