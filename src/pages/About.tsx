import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Award, Heart, Leaf, Users, Shield, Cpu, Database, Smartphone, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import farm from '../../public/farm.png';
import sahiwal from '../../public/sahiwal.png';
import { useLanguage } from '../contexts/LanguageContext';

const About = () => {
    const { useTranslation } = useLanguage();
      const aboutTitle = useTranslation('About SCR Agro Farms');
        const aboutDesc = useTranslation('We are dedicated to preserving traditional dairy farming methods...');
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-20"
    >
      {/* Header Section */}
      <section className="py-12 bg-brand-blue/10">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              About SCR Admin
            </h1>
            <p className="text-lg text-gray-700">
              SCR Admin is a centralized management dashboard built to streamline and automate internal operations.
              Our goal is to provide administrators with a fast, secure and intuitive interface to manage essential business tasks in one place.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-display font-bold mb-6">
                What We Do
              </h2>
              <p className="text-gray-700 mb-6">
                SCR Admin allows authorized team members to manage all aspects of the business through a unified platform.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Manage products and inventory</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Track and update orders</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">View and manage user accounts</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Handle internal workflows with ease</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Maintain data securely through Supabase integration</p>
                </div>
              </div>
              <p className="text-gray-700 mt-6">
                The system is designed to replace manual tracking and give administrators full control over daily operations.
              </p>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <Cpu className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 italic">Admin Dashboard Interface</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-xl shadow-lg max-w-xs">
                <p className="text-sm italic">
                  "Our commitment to efficiency begins with intuitive design and extends to every feature we build."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-brand-cream">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Who Can Use It
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              The platform is intended only for authorized personnel with specific roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="glass-panel p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-brand-red/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-brand-red" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Internal Team Members</h3>
              <p className="text-sm text-gray-600">
                Dedicated staff with assigned roles and permissions for specific operational tasks.
              </p>
            </motion.div>

            <motion.div 
              className="glass-panel p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-brand-red/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-brand-red" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Authorized Admins</h3>
              <p className="text-sm text-gray-600">
                Administrators with full access to manage users, products, orders, and system settings.
              </p>
            </motion.div>

            <motion.div 
              className="glass-panel p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-brand-red/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-brand-red" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Business Operators</h3>
              <p className="text-sm text-gray-600">
                Team members who manage backend tasks and daily business operations.
              </p>
            </motion.div>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-700 font-semibold">
              Unauthorized users cannot access dashboard features.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 italic">Technology Infrastructure</p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-display font-bold mb-6">
                Technology Stack
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-brand-red" />
                  <p className="text-gray-700"><strong>React + TypeScript</strong> - Modern frontend development</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-brand-red" />
                  <p className="text-gray-700"><strong>Vite</strong> - Fast build tool and development server</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-brand-red" />
                  <p className="text-gray-700"><strong>Supabase</strong> - Authentication and database backend</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-brand-red" />
                  <p className="text-gray-700"><strong>Capacitor</strong> - Cross-platform mobile app deployment</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-brand-red" />
                  <p className="text-gray-700"><strong>Tailwind CSS</strong> - Utility-first CSS framework</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-brand-blue/10 rounded-lg">
                <h3 className="font-semibold mb-2">Version</h3>
                <p className="text-gray-700">SCR Admin v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 bg-brand-blue/10">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              To simplify backend operations and give teams a reliable, fast, and modern tool to manage their business efficiently.
            </p>
            <div className="glass-panel p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold mb-4">Get Started</h3>
              <p className="mb-4">
                Ready to streamline your operations? Access the admin dashboard to start managing your business more efficiently.
              </p>
              <Link to="/auth">
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white">
                  Access Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

export default About;