
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDashboard from '@/components/dashboard/UserDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user && !loading) {
        try {
          // Use the has_role function instead of direct query
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });
          
          if (error) {
            console.error('Error checking admin role:', error);
            // If there's an error, we'll assume user is not admin
            return;
          }
          
          if (data) {
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
        }
      }
    };

    checkAdminRole();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return <UserDashboard />;
};

export default Dashboard;
