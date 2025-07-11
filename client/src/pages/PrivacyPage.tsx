import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Shield } from 'lucide-react';
import Button from '../components/ui/Button';

const PrivacyPage: React.FC = () => {
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
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Privacy Policy
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
            
            <h2>1. Information We Collect</h2>
            <p>
              WorkBeat collects information to provide better services to all our users. We collect information in the following ways:
            </p>
            <ul>
              <li><strong>Biometric Data:</strong> Fingerprint templates and facial recognition data for attendance verification</li>
              <li><strong>Personal Information:</strong> Name, email address, phone number, employee ID</li>
              <li><strong>Attendance Data:</strong> Clock-in/out times, location data, work hours</li>
              <li><strong>Usage Information:</strong> How you interact with our services</li>
            </ul>

            <h2>2. How We Use Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our attendance management services</li>
              <li>Verify employee identity through biometric authentication</li>
              <li>Generate attendance reports and analytics</li>
              <li>Communicate with you about our services</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>

            <h2>3. Biometric Data Protection</h2>
            <p>
              We take special care with biometric data:
            </p>
            <ul>
              <li>Biometric templates are encrypted using AES-256 encryption</li>
              <li>Original biometric images are never stored</li>
              <li>Data is processed locally when possible</li>
              <li>We comply with Nigerian data protection laws</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties except:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and the safety of our users</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We retain your information only as long as necessary to provide our services and comply with legal obligations. Biometric data can be deleted upon request when you leave the organization.
            </p>

            <h2>7. Your Rights</h2>
            <p>
              Under Nigerian data protection laws, you have the right to:
            </p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@workbeat.com.ng</li>
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

export default PrivacyPage;