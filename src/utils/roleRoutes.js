export const getRoleBasedDashboard = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return '/admindashboard';
    case 'security_guard':
      return '/securityguarddashboard';
    case 'supervisor':
      return '/supervisordashboard';
    case 'user':
    case 'user1':
    case 'user2': 
      return '/userdashboard';
    case 'manager':
      return '/managerdashboard';
    default:
      return '/unauthorized';
  }
};
