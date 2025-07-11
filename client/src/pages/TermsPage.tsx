import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, FileText } from 'lucide-react';
import Button from '../components/ui/Button';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 bg-clip-text text-transparent">
                WorkBeat
              </h1>
            </Link>
            
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-xl">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-xl text-primary-100">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg mx-auto dark:prose-invert">
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using WorkBeat's attendance management services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Service Description</h2>
            <p>
              WorkBeat provides biometric attendance management solutions including:
            </p>
            <ul>
              <li>Fingerprint and facial recognition authentication</li>
              <li>Real-time attendance tracking</li>
              <li>Comprehensive reporting and analytics</li>
              <li>Employee management tools</li>
              <li>API integration capabilities</li>
            </ul>

            <h2>3. User Responsibilities</h2>
            <p>
              Users are responsible for:
            </p>
            <ul>
              <li>Providing accurate biometric data for enrollment</li>
              <li>Maintaining the confidentiality of account credentials</li>
              <li>Using the service in compliance with applicable laws</li>
              <li>Ensuring employee consent for biometric data collection</li>
              <li>Paying subscription fees on time</li>
            </ul>

            <h2>4. Biometric Data Consent</h2>
            <p>
              By using our biometric features, organizations confirm they have obtained proper consent from employees for biometric data collection and processing in accordance with Nigerian data protection laws.
            </p>

            <h2>5. Subscription and Payment</h2>
            <ul>
              <li>Subscription fees are billed monthly or annually</li>
              <li>All fees are in Nigerian Naira (₦)</li>
              <li>No refunds for partial months of service</li>
              <li>We reserve the right to modify pricing with 30 days notice</li>
            </ul>

            <h2>6. Service Availability</h2>
            <p>
              We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance.
            </p>

            <h2>7. Data Security and Privacy</h2>
            <p>
              We implement industry-standard security measures to protect your data. Please refer to our Privacy Policy for detailed information about data handling.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              WorkBeat shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2>9. Termination</h2>
            <p>
              Either party may terminate this agreement with 30 days written notice. Upon termination, access to the service will be discontinued and data may be deleted after a grace period.
            </p>

            <h2>10. Governing Law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.
            </p>

            <h2>11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact us at:
            </p>
            <ul>
              <li>Email: legal@workbeat.com.ng</li>
              <li>Phone: +234 (0) 809 123 4567</li>
              <li>Address: Plot 123, Victoria Island, Lagos, Nigeria</li>
            </ul>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} WorkBeat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;