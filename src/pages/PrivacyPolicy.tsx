import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
              <Lock className="h-12 w-12 text-brand-red mr-4" />
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                Privacy Policy
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
            <h2 className="text-2xl font-display font-bold mb-4">1. Information We Collect</h2>
            <p className="text-gray-700">
              We collect information that you provide directly to us. This can include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li className="text-gray-600">Contact information (name, email address, phone number)</li>
              <li className="text-gray-600">Shipping and billing addresses</li>
              <li className="text-gray-600">Payment information</li>
              <li className="text-gray-600">Order history and preferences</li>
            </ul>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li className="text-gray-600">Process and fulfill orders</li>
              <li className="text-gray-600">Send you order confirmations and updates</li>
              <li className="text-gray-600">Provide customer support</li>
              <li className="text-gray-600">Send marketing communications (with your consent)</li>
            </ul>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">3. Data Security</h2>
            <p className="text-gray-700">
              We implement security measures to protect your personal information. 
              Your payment information is processed through secure payment gateways.
            </p>
          </div>

          {/* <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">4. Children's Privacy</h2>
            <p className="text-gray-600">
              Our website is not intended for children under 13 years of age. 
              We do not knowingly collect personal information from children under 13.
            </p>
          </div> */}

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">4. Your Rights</h2>
            <p className="text-gray-700">
              You have the right to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li className="text-gray-600">Access your personal information</li>
              <li className="text-gray-600">Correct inaccurate information</li>
              <li className="text-gray-600">Request deletion of your information</li>
              <li className="text-gray-600">Opt out of marketing communications</li>
            </ul>
          </div>

          <div className="bg-brand-blue/5 rounded-lg p-6">
            <h2 className="text-2xl font-display font-bold mb-4">5. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. 
              Any changes will be posted on this page with a new "Last Updated" date.
            </p>
          </div>
        </article>
      </section>
    </motion.main>
  );
};

export default PrivacyPolicy;