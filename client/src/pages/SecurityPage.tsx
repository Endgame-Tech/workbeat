import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Shield, Lock, Database, Eye, Award } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const SecurityPage: React.FC = () => {
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

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            Enterprise Security
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-100">
            Bank-level security protecting your most sensitive data with advanced encryption and compliance standards.
          </p>
        </div>
      </div>

      {/* Security Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Security Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">End-to-End Encryption</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  All data is encrypted using AES-256 encryption both in transit and at rest, ensuring maximum protection.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Secure Data Storage</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Biometric data is stored using advanced hashing algorithms, making it impossible to reverse-engineer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Access Control</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Multi-level access controls ensure only authorized personnel can access sensitive information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white dark:bg-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Compliance & Certifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-neutral-900 dark:text-white">GDPR Compliant</h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Full compliance with General Data Protection Regulation ensuring user privacy and data protection rights.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-neutral-900 dark:text-white">ISO 27001</h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Information security management system certified to international standards for data protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready for enterprise security?</span>
            <span className="block text-primary-200">Start your secure trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register">
                <Button variant="secondary" className="py-3 px-6 bg-white text-primary-600 hover:bg-neutral-50">
                  Start Free Trial
                </Button>
              </Link>
            </div>
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

export default SecurityPage;