import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Shield, Users, Target, Award, Globe } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const AboutPage: React.FC = () => {
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
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            About WorkBeat
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-100">
            Revolutionizing attendance management for businesses across Nigeria with cutting-edge biometric technology.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-neutral-900 dark:text-white">Our Mission</h2>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  To empower Nigerian businesses with secure, reliable, and innovative attendance management solutions that eliminate time theft, boost productivity, and ensure accurate payroll processing through advanced biometric technology.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="ml-4 text-2xl font-bold text-neutral-900 dark:text-white">Our Vision</h2>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  To become the leading attendance management platform in Africa, setting the standard for biometric authentication and workforce management solutions that drive business growth and employee satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="bg-white dark:bg-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Our Story
            </h2>
            <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-300">
              Built by Nigerians, for Nigerian businesses
            </p>
          </div>

          <div className="prose prose-lg mx-auto dark:prose-invert">
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
              WorkBeat was founded in 2024 with a simple yet powerful vision: to solve the persistent challenges Nigerian businesses face with employee attendance tracking. Our founders, experienced in both technology and business operations, witnessed firsthand how manual attendance systems and time theft were costing companies millions of naira annually.
            </p>
            
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
              Recognizing the unique needs of the Nigerian market—from unreliable internet connectivity to diverse workforce structures—we built WorkBeat from the ground up to be robust, affordable, and tailored for local businesses.
            </p>
            
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Today, we're proud to serve businesses across Nigeria, from small startups in Lagos to large corporations in Abuja, providing them with enterprise-grade biometric attendance solutions that were previously only available to multinational companies.
            </p>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Our Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Security First</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                We prioritize the security and privacy of your data with enterprise-grade encryption and protection measures.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Customer-Centric</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Every feature we build is designed with our customers' success in mind, backed by exceptional support.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Excellence</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                We strive for excellence in everything we do, from product development to customer service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="bg-white dark:bg-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
              Leadership Team
            </h2>
            <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-300">
              Experienced leaders driving innovation in workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">AO</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Adebayo Olumide</h3>
              <p className="text-primary-600 dark:text-primary-400 mb-2">CEO & Co-Founder</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Former tech lead at Flutterwave with 8+ years in fintech and enterprise software development.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">KA</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Kemi Adebayo</h3>
              <p className="text-primary-600 dark:text-primary-400 mb-2">CTO & Co-Founder</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Former senior engineer at Paystack, specializing in biometric systems and secure authentication.
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">OT</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Olumide Taiwo</h3>
              <p className="text-primary-600 dark:text-primary-400 mb-2">Head of Sales</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Former business development director at Interswitch with deep understanding of Nigerian market needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to join our mission?</span>
            <span className="block text-primary-200">Transform your business today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register">
                <Button variant="secondary" className="py-3 px-6 bg-white text-primary-600 hover:bg-neutral-50">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link to="/contact">
                <Button variant="ghost" className="py-3 px-6 bg-primary-700 text-white hover:bg-primary-800 border border-primary-500">
                  Contact Us
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

export default AboutPage;