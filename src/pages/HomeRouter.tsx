import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from './LandingPage';
import Index from './Index';
import AdminHome from './admin/AdminHome';

const HomeRouter: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return null;

  if (!user) return <LandingPage />;

  if (user && isAdmin) return <AdminHome />;

  return <Index />;
};

export default HomeRouter;
