import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, MessageCircle, Send, LogOut, ArrowLeft, Search } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import { members, chatMessages as initialMessages } from '../data/mockData.js';
import styles from './Chat.module.css';

const currentUser = { id: '6', name: 'Ayesha Malik' };

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const contacts = members.filter(m => m.id !== currentUser.id);
  const filteredContacts = contacts.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getConversation = (contactId) => {
    return messages.filter(m =>
      (m.senderId === currentUser.id && m.receiverId === contactId) ||
      (m.senderId === contactId && m.receiverId === currentUser.id)
    ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  };

  const getLastMessage = (contactId) => {
    const conv = getConversation(contactId);
    return conv.length > 0 ? conv[conv.length - 1] : null;
  };

  const getUnreadCount = (contactId) => {
    return messages.filter(m => m.senderId === contactId && m.receiverId === currentUser.id && !m.read).length;
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedContact) return;
    const msg = {
      id: String(Date.now()),
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: selectedContact.id,
      receiverName: selectedContact.name,
      message: newMessage,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const conversation = selectedContact ? getConversation(selectedContact.id) : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
            <div className={styles.headerLogo}><MessageCircle size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Messages</h1>
              <p className={styles.headerSub}>Chat with society members</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogOut size={14} /> Logout</Button>
        </div>
      </header>

      <div className={styles.chatContainer}>
        <aside className={styles.sidebar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <Input placeholder="Search members..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className={styles.contactList}>
            {filteredContacts.map(c => {
              const last = getLastMessage(c.id);
              const unread = getUnreadCount(c.id);
              return (
                <button key={c.id}
                  className={`${styles.contactItem} ${selectedContact?.id === c.id ? styles.contactActive : ''}`}
                  onClick={() => setSelectedContact(c)}>
                  <div className={styles.avatar}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className={styles.contactInfo}>
                    <div className={styles.contactTop}>
                      <span className={styles.contactName}>{c.name}</span>
                      {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    </div>
                    <span className={styles.contactRole}>{c.role}</span>
                    {last && <p className={styles.lastMsg}>{last.message.slice(0, 40)}{last.message.length > 40 ? '...' : ''}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className={styles.chatMain}>
          {selectedContact ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.avatar}>{selectedContact.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <h3 className={styles.chatName}>{selectedContact.name}</h3>
                  <span className={styles.chatRole}>{selectedContact.role} • {selectedContact.class}</span>
                </div>
              </div>
              <div className={styles.messageArea}>
                {conversation.length === 0 && <p className={styles.emptyChat}>No messages yet. Start the conversation!</p>}
                {conversation.map(msg => (
                  <div key={msg.id} className={`${styles.msgBubble} ${msg.senderId === currentUser.id ? styles.msgSent : styles.msgReceived}`}>
                    <p className={styles.msgText}>{msg.message}</p>
                    <span className={styles.msgTime}>{msg.timestamp.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
              <div className={styles.inputBar}>
                <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <Button onClick={handleSend} disabled={!newMessage.trim()}><Send size={16} /></Button>
              </div>
            </>
          ) : (
            <div className={styles.noChat}>
              <MessageCircle size={48} className={styles.noChatIcon} />
              <h3>Select a conversation</h3>
              <p className={styles.muted}>Choose a member to start chatting</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;