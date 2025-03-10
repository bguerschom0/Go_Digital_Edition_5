import { LayoutDashboard, UserCog, MessageSquare, GraduationCap, UserCheck, FileText, Edit, BarChart, ClipboardList } from 'lucide-react';

export const roleBasedNavigation = {
  admin: [
    { 
      name: 'Dashboard', 
      path: '/admindashboard', 
      icon: LayoutDashboard 
    },
        { 
      name: 'Guard Shift Report', 
      path: '/GuardShiftForm', 
      icon: ClipboardList
    },
    {
      name: 'User Management',
      path: '/user-management',
      icon: UserCog
    },
    {
      name: 'Internship Overview',
      icon: UserCheck,
      children: [
        {
          name: 'New Internship',
          path: '/newbackground',
          icon: FileText
        },
        {
          name: 'Update Internship',
          path: '/updatebackground',
          icon: Edit
        },
        {
          name: 'Internship Overview',
          path: '/internshipoverview',
          icon: GraduationCap
        },
      ]
    },
    {
      name: 'Reports',
      icon: BarChart,
      children: [
        { name: 'Guard Shift Report', path: '/GuardShiftReport', icon: BarChart }
      ]
    },
    {
      name: 'Contact Support',
      path: '/contact',
      icon: MessageSquare
    }
  ],
  manager: [
    { 
      name: 'Dashboard', 
      path: '/managerdashboard', 
      icon: LayoutDashboard 
    },
    {
      name: 'Reports',
      icon: BarChart,
      children: [
        { name: 'Guard Shift Report', path: '/GuardShiftReport', icon: BarChart }
      ]
    }
  ],
  supervisor: [
    { 
      name: 'Dashboard', 
      path: '/supervisordashboard', 
      icon: LayoutDashboard 
    },
    { 
      name: 'Guard Shift Report', 
      path: '/GuardShiftForm', 
      icon: ClipboardList
    },
    {
      name: 'Internship Overview',
      path: '/internshipoverview',
      icon: GraduationCap
    }
  ],
  security_guard: [
    { 
      name: 'Dashboard', 
      path: '/securityguarddashboard', 
      icon: LayoutDashboard 
    }
  ],
  user: [
    { 
      name: 'Dashboard', 
      path: '/userdashboard', 
      icon: LayoutDashboard 
    },
    {
      name: 'Internship Overview',
      path: '/internshipoverview',
      icon: GraduationCap
    }
  ],

  user1: [
    { 
      name: 'Dashboard', 
      path: '/userdashboard', 
      icon: LayoutDashboard 
    },
    {
      name: 'Internship Overview',
      path: '/internshipoverview',
      icon: GraduationCap
    }
  ],

  user2: [
    { 
      name: 'Dashboard', 
      path: '/userdashboard', 
      icon: LayoutDashboard 
    }
  ]
};

// Also update the getRoleDisplayName function in Header.js
export const getRoleDisplayName = (role) => {
  switch(role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'supervisor':
      return 'Supervisor';
    case 'security_guard':
      return 'Security Guard';
    case 'user':
      return 'User';
    case 'user1':
      return 'User Level 1';
    case 'user2':
      return 'User Level 2';
    default:
      return role;
  }
};
