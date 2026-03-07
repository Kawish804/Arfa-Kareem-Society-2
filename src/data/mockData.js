export const members = [
  { id: "1", name: "Ahmed Khan", role: "President", email: "ahmed@society.edu", status: "Active", joinDate: "2024-01-15", class: "BSCS-8A" },
  { id: "2", name: "Sara Ali", role: "Vice President", email: "sara@society.edu", status: "Active", joinDate: "2024-01-15", class: "BSIT-6B" },
  { id: "3", name: "Hassan Raza", role: "Finance Head", email: "hassan@society.edu", status: "Active", joinDate: "2024-02-01", class: "BSCS-6A" },
  { id: "4", name: "Fatima Noor", role: "Event Coordinator", email: "fatima@society.edu", status: "Active", joinDate: "2024-02-10", class: "BSSE-4B" },
  { id: "5", name: "Usman Tariq", role: "Member", email: "usman@society.edu", status: "Inactive", joinDate: "2024-03-05", class: "BSCS-2A" },
  { id: "6", name: "Ayesha Malik", role: "Member", email: "ayesha@society.edu", status: "Active", joinDate: "2024-03-12", class: "BSIT-4A" },
  { id: "7", name: "Bilal Hussain", role: "Secretary", email: "bilal@society.edu", status: "Active", joinDate: "2024-01-20", class: "BSCS-8B" },
  { id: "8", name: "Zainab Shah", role: "Member", email: "zainab@society.edu", status: "Active", joinDate: "2024-04-01", class: "BSSE-6A" },
  { id: "9", name: "Kamran Yousuf", role: "Member", email: "kamran@society.edu", status: "Pending", joinDate: "2024-05-15", class: "BSCS-2B" },
  { id: "10", name: "Nadia Iqbal", role: "Member", email: "nadia@society.edu", status: "Active", joinDate: "2024-04-20", class: "BSIT-8A" },
];

export const funds = [
  { id: "1", memberName: "Ahmed Khan", class: "BSCS-8A", amount: 5000, status: "Paid", date: "2024-09-01" },
  { id: "2", memberName: "Sara Ali", class: "BSIT-6B", amount: 5000, status: "Paid", date: "2024-09-01" },
  { id: "3", memberName: "Hassan Raza", class: "BSCS-6A", amount: 5000, status: "Paid", date: "2024-09-02" },
  { id: "4", memberName: "Fatima Noor", class: "BSSE-4B", amount: 5000, status: "Unpaid", date: "2024-09-05" },
  { id: "5", memberName: "Usman Tariq", class: "BSCS-2A", amount: 3000, status: "Unpaid", date: "2024-09-10" },
  { id: "6", memberName: "Ayesha Malik", class: "BSIT-4A", amount: 5000, status: "Paid", date: "2024-09-03" },
  { id: "7", memberName: "Bilal Hussain", class: "BSCS-8B", amount: 5000, status: "Paid", date: "2024-09-01" },
  { id: "8", memberName: "Zainab Shah", class: "BSSE-6A", amount: 3000, status: "Paid", date: "2024-09-04" },
];

export const expenses = [
  { id: "1", title: "Event Decorations", category: "Events", amount: 8000, date: "2024-09-15", receipt: "receipt1.pdf" },
  { id: "2", title: "Banner Printing", category: "Marketing", amount: 3500, date: "2024-09-20", receipt: "receipt2.pdf" },
  { id: "3", title: "Refreshments", category: "Events", amount: 5000, date: "2024-10-01", receipt: "receipt3.pdf" },
  { id: "4", title: "Sound System Rent", category: "Equipment", amount: 7000, date: "2024-10-05", receipt: "receipt4.pdf" },
  { id: "5", title: "Certificates Printing", category: "Stationery", amount: 2500, date: "2024-10-10", receipt: "receipt5.pdf" },
  { id: "6", title: "Guest Speaker Gift", category: "Gifts", amount: 4000, date: "2024-10-15", receipt: "receipt6.pdf" },
];

export const events = [
  { id: "1", title: "Annual Tech Fest 2024", date: "2024-11-15", description: "A grand technology festival featuring coding competitions, robotics displays, and tech talks by industry leaders.", budget: 50000, status: "Upcoming" },
  { id: "2", title: "Career Counseling Seminar", date: "2024-10-20", description: "Interactive session with industry professionals on career paths in IT and software development.", budget: 15000, status: "Completed" },
  { id: "3", title: "Coding Competition", date: "2024-12-01", description: "Competitive programming contest for all university students with exciting prizes.", budget: 20000, status: "Upcoming" },
  { id: "4", title: "Workshop: AI & ML Basics", date: "2024-10-05", description: "Hands-on workshop introducing students to artificial intelligence and machine learning fundamentals.", budget: 10000, status: "Completed" },
  { id: "5", title: "Sports Gala", date: "2024-11-25", description: "Annual sports event including cricket, football, badminton and table tennis tournaments.", budget: 35000, status: "Upcoming" },
  { id: "6", title: "Welcome Party for Freshers", date: "2024-09-15", description: "A fun-filled orientation event for incoming freshmen with performances and activities.", budget: 25000, status: "Completed" },
];

export const requests = [
  { id: "1", title: "Budget for New Projector", submittedBy: "Ahmed Khan", date: "2024-10-01", status: "Pending", type: "Budget" },
  { id: "2", title: "Approve Coding Competition", submittedBy: "Fatima Noor", date: "2024-10-05", status: "Approved", type: "Event" },
  { id: "3", title: "Department Lab Access", submittedBy: "Hassan Raza", date: "2024-10-10", status: "Pending", type: "Department" },
  { id: "4", title: "Guest Speaker Invitation", submittedBy: "Sara Ali", date: "2024-10-12", status: "Rejected", type: "Event" },
  { id: "5", title: "Budget for Certificates", submittedBy: "Bilal Hussain", date: "2024-10-15", status: "Approved", type: "Budget" },
  { id: "6", title: "Workshop Room Booking", submittedBy: "Ayesha Malik", date: "2024-10-18", status: "Pending", type: "Department" },
];

export const announcements = [
  { id: "1", title: "Annual Tech Fest Registration Open", description: "Registration for the Annual Tech Fest 2024 is now open. All students can register through the society portal. Early bird registration closes on November 1st.", postedDate: "2024-10-20", postedBy: "Ahmed Khan" },
  { id: "2", title: "Monthly Meeting Scheduled", description: "The monthly society meeting is scheduled for October 25th at 3:00 PM in the CS Lab. All members must attend. Agenda includes event planning and fund allocation.", postedDate: "2024-10-18", postedBy: "Sara Ali" },
  { id: "3", title: "Fund Collection Deadline", description: "All society members are reminded to submit their semester contribution by October 30th. Late payments will incur a penalty. Contact the finance head for details.", postedDate: "2024-10-15", postedBy: "Hassan Raza" },
  { id: "4", title: "Volunteer Needed for Sports Gala", description: "We need volunteers for the upcoming Sports Gala. Interested members please sign up by November 10th. Volunteers will receive certificates and refreshments.", postedDate: "2024-10-12", postedBy: "Fatima Noor" },
];

export const galleryImages = [
  { id: "1", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop", event: "Tech Fest 2023", caption: "Opening ceremony" },
  { id: "2", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop", event: "Career Seminar", caption: "Guest speaker session" },
  { id: "3", url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop", event: "Sports Gala", caption: "Cricket tournament" },
  { id: "4", url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=300&fit=crop", event: "Welcome Party", caption: "Freshers welcome" },
  { id: "5", url: "https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=400&h=300&fit=crop", event: "Workshop", caption: "AI workshop hands-on" },
  { id: "6", url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop", event: "Tech Fest 2023", caption: "Award distribution" },
  { id: "7", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=300&fit=crop", event: "Workshop", caption: "Group activity" },
  { id: "8", url: "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=400&h=300&fit=crop", event: "Sports Gala", caption: "Football match" },
];

export const chartData = {
  fundCollection: [
    { month: "Jan", amount: 15000 }, { month: "Feb", amount: 22000 }, { month: "Mar", amount: 18000 },
    { month: "Apr", amount: 28000 }, { month: "May", amount: 25000 }, { month: "Jun", amount: 32000 },
    { month: "Jul", amount: 20000 }, { month: "Aug", amount: 35000 }, { month: "Sep", amount: 38000 },
    { month: "Oct", amount: 30000 },
  ],
  expenses: [
    { month: "Jan", amount: 8000 }, { month: "Feb", amount: 12000 }, { month: "Mar", amount: 6000 },
    { month: "Apr", amount: 15000 }, { month: "May", amount: 10000 }, { month: "Jun", amount: 18000 },
    { month: "Jul", amount: 9000 }, { month: "Aug", amount: 20000 }, { month: "Sep", amount: 16000 },
    { month: "Oct", amount: 14000 },
  ],
  eventParticipation: [
    { event: "Tech Fest", participants: 150 }, { event: "Seminar", participants: 80 },
    { event: "Workshop", participants: 60 }, { event: "Welcome Party", participants: 200 },
    { event: "Sports Gala", participants: 120 }, { event: "Coding Comp", participants: 90 },
  ],
  memberActivity: [
    { month: "Jan", active: 25, inactive: 5 }, { month: "Feb", active: 28, inactive: 4 },
    { month: "Mar", active: 30, inactive: 6 }, { month: "Apr", active: 35, inactive: 3 },
    { month: "May", active: 32, inactive: 5 }, { month: "Jun", active: 38, inactive: 4 },
  ],
};

export const dashboardStats = {
  totalMembers: 45,
  totalFunds: 263000,
  totalExpenses: 128000,
  activeEvents: 3,
  pendingRequests: 3,
};
