import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  // Add a conditional check to prevent destructuring undefined
  const auth = useAuth();
  const username = auth?.user?.full_name || auth?.user?.username || 'Admin';
  
  const getGreeting = () => {
    const hour = new Date().getHours();
   
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  const username = user?.full_name || user?.username || 'Admin';

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {full_name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome to Go Digital Edition 5
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
