import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-24 pb-20"
    >
      <section className="py-12 bg-brand-blue/10">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <Shield className="h-12 w-12 text-brand-red mr-4" />
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                Terms and Conditions
              </h1>
            </div>
            <p className="text-lg text-gray-700">
              Last Updated: April 18, 2025
            </p>
          </div>
        </div>
      </section>

      <section className="section-container">
        <article className="prose prose-lg max-w-4xl mx-auto space-y-8">
          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using SCR Agro Farms, you agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, you must not use our website.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">2. Products and Services</h2>
            <p className="text-gray-700">
              We offer a variety of dairy products through our website. 
              All products are subject to availability and may be discontinued at any time.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">3. Account Registration</h2>
            <p className="text-gray-700">
              You may need to create an account to use certain features of our website. 
              You are responsible for maintaining the confidentiality of your account information.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">4. Orders and Payments</h2>
            <p className="text-gray-700">
              Orders are subject to acceptance and availability. 
              Prices are subject to change without notice. 
              We reserve the right to refuse or cancel any order.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">5. Shipping and Delivery</h2>
            <p className="text-gray-700">
              Delivery times may vary. 
              We are not responsible for delays caused by circumstances beyond our control.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">6. Returns and Refunds</h2>
            <p className="text-gray-700">
              Our return policy is as follows:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li className="text-gray-600">Products must be returned within 7 days of delivery</li>
              <li className="text-gray-600">Products must be in their original condition</li>
              <li className="text-gray-600">Refunds will be processed within 7 business days</li>
            </ul>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on our website is protected by copyright. 
              You may not use our content without our express permission.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700">
              We are not liable for any indirect, incidental, or consequential damages 
              arising from the use of our website or products.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">9. Governing Law</h2>
            <p className="text-gray-700">
              These Terms and Conditions are governed by and construed in accordance with the laws of your jurisdiction.
            </p>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700">
              We may update these Terms and Conditions from time to time. 
              Any changes will be posted on this page with a new "Last Updated" date.
            </p>
          </div>
        </article>
      </section>
    </motion.main>
  );
};

export default Terms;