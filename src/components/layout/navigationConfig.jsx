import { 
  LayoutDashboard,
  UserCog,
  MessageSquare,

} from 'lucide-react';

export const roleBasedNavigation = {
  administrator: [
    { 
      name: 'Dashboard', 
      path: '/admindashboard', 
      icon: LayoutDashboard 
    },
    
    {
      name: 'User Management',
      path: '/user-management',
      icon: UserCog
    },

    {
      title: 'Internship Overview',
      icon: <UserCheck className="w-5 h-5" />,
      children: [
        {
          title: 'New Internship',
          icon: <FileText className="w-5 h-5" />,
          href: '/newbackground'
        },
        {
          title: 'Update Internship',
          icon: <Edit className="w-5 h-5" />,
          href: '/updatebackground'
        },

        {
          title: 'Internship Overview',
          icon: <GraduationCap className="w-5 h-5" />,
          href: '/internshipoverview'
        },
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
    }

  ],
  supervisor: [
    { 
      name: 'Dashboard', 
      path: '/supervisordashboard', 
      icon: LayoutDashboard 
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
    }
  ]
};





  
