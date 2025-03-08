import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  CalendarRange, 
  ClipboardList, 
  UserCheck,
  GraduationCap,
  Clock,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card'; 
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInternships: 0,
    activeInternships: 0,
    pendingRequests: 0,
    expiringThisMonth: 0,
    departments: {}
  });

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

  const loadDashboardData = async () => {
    try {
      // Get current date
      const today = new Date();
      const currentDate = today.toISOString().split('T')[0];
      
      // Calculate end of current month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Get total internships
      const { data: totalData, error: totalError } = await supabase
        .from('v5_backgrounds')
        .select('count')
        .eq('type', 'internship');
      
      if (totalError) throw totalError;
      
      // Get active internships
      const { data: activeData, error: activeError } = await supabase
        .from('v5_backgrounds')
        .select('count')
        .eq('type', 'internship')
        .gte('date_end', currentDate);
      
      if (activeError) throw activeError;
      
      // Get pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('v5_backgrounds')
        .select('count')
        .eq('type', 'internship')
        .eq('status', 'Pending');
      
      if (pendingError) throw pendingError;
      
      // Get internships expiring this month
      const { data: expiringData, error: expiringError } = await supabase
        .from('v5_backgrounds')
        .select('count')
        .eq('type', 'internship')
        .gte('date_end', currentDate)
        .lte('date_end', endOfMonth);
      
      if (expiringError) throw expiringError;

      // Get department distribution
      const { data: departmentData, error: deptError } = await supabase
        .from('v5_backgrounds')
        .select('department_name')
        .eq('type', 'internship')
        .gte('date_end', currentDate);
      
      if (deptError) throw deptError;

      // Calculate department distribution
      const departmentCounts = {};
      departmentData.forEach(record => {
        const dept = record.department_name || 'Unknown';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });

      setStats({
        totalInternships: totalData[0]?.count || 0,
        activeInternships: activeData[0]?.count || 0,
        pendingRequests: pendingData[0]?.count || 0,
        expiringThisMonth: expiringData[0]?.count || 0,
        departments: departmentCounts
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadDashboardData();
    }
  }, [loading]);

  // Top departments (for the bar chart)
  const topDepartments = Object.entries(stats.departments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {getGreeting()}, {user?.full_name || user?.username}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome to Go Digital Edition 5
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <UserPlus className="h-8 w-8 mb-2" />
                  <h3 className="font-medium text-lg">New Request</h3>
                  <p className="text-sm text-blue-100">Create a new internship background request</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/20 text-white border-white/40 hover:bg-white/30"
                    onClick={() => navigate('/newbackground')}
                  >
                    Start New Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <CalendarRange className="h-8 w-8 mb-2" />
                  <h3 className="font-medium text-lg">Update Status</h3>
                  <p className="text-sm text-purple-100">Update or close an existing request</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/20 text-white border-white/40 hover:bg-white/30"
                    onClick={() => navigate('/updatebackground')}
                  >
                    Find & Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <ClipboardList className="h-8 w-8 mb-2" />
                  <h3 className="font-medium text-lg">View Internships</h3>
                  <p className="text-sm text-emerald-100">See all active and past internships</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/20 text-white border-white/40 hover:bg-white/30"
                    onClick={() => navigate('/backgrounds')}
                  >
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <UserCheck className="h-8 w-8 mb-2" />
                  <h3 className="font-medium text-lg">Manage Users</h3>
                  <p className="text-sm text-amber-100">Add or edit system users</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/20 text-white border-white/40 hover:bg-white/30"
                    onClick={() => navigate('/users')}
                  >
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Status</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 dark:text-gray-400"
              onClick={loadDashboardData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Total Internships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-blue-500 mr-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInternships}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Active Internships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeInternships}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-amber-500 mr-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingRequests}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Expiring This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CalendarRange className="h-8 w-8 text-red-500 mr-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.expiringThisMonth}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Department Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Active internships by department</CardDescription>
            </CardHeader>
            <CardContent>
              {topDepartments.length > 0 ? (
                <div className="space-y-4">
                  {topDepartments.map(([department, count], i) => {
                    // Calculate percentage
                    const percentage = Math.round((count / stats.activeInternships) * 100) || 0;
                    
                    return (
                      <div key={department} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{department}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{count} interns ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              i % 4 === 0 ? 'bg-blue-500' : 
                              i % 4 === 1 ? 'bg-purple-500' : 
                              i % 4 === 2 ? 'bg-emerald-500' : 
                              'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No active internships to display
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="ghost" 
                className="text-sm text-gray-600 dark:text-gray-400"
                onClick={() => navigate('/backgrounds')}
              >
                View full report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
