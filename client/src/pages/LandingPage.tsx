import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Clock, CheckCircle, Shield, Users, BarChart2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-transparent to-accent-600/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent-400/10 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary-400/10 animate-bounce-slow"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Fingerprint className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block animate-slide-up">WorkBeat</span>
              <span className="block text-primary-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Biometric Attendance System
              </span>
            </h1>
            
            <p className="mt-8 max-w-2xl mx-auto text-xl text-primary-100 sm:text-2xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
              Secure, reliable attendance tracking with dual-factor biometric authentication.
              <span className="block mt-2 text-lg text-primary-200">
                Boost productivity and eliminate time theft with our cutting-edge solution.
              </span>
            </p>
            
            <div className="mt-12 max-w-md mx-auto sm:max-w-none sm:flex sm:justify-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="w-full bg-white text-primary-600 hover:bg-primary-50 shadow-xl hover:shadow-2xl">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <p className="text-primary-200 text-sm mb-4">Trusted by leading companies worldwide</p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="text-white font-semibold">TechCorp</div>
                <div className="text-white font-semibold">InnovateCo</div>
                <div className="text-white font-semibold">FutureSoft</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern wave pattern divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 0L48 8.3C96 17 192 33 288 53.3C384 73 480 93 576 93.3C672 93 768 73 864 58.3C960 43 1056 33 1152 38.3C1248 43 1344 63 1392 73.3L1440 83V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" fill="white" className="dark:fill-neutral-900"></path>
          </svg>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 sm:py-28 lg:py-32 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">
              Powerful Features
            </h2>
            <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
              Everything you need for
              <span className="block text-gradient-primary">attendance tracking</span>
            </h3>
            <p className="max-w-2xl mt-6 mx-auto text-xl text-neutral-600 dark:text-neutral-300">
              Our solution combines cutting-edge biometric technology with powerful management tools
              to deliver unparalleled accuracy and security.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 gradient-primary rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Fingerprint className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Dual Biometric Authentication
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Combine fingerprint scanning and facial recognition for foolproof attendance verification 
                    with 99.9% accuracy.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 gradient-accent rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Real-time Tracking
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Monitor attendance in real-time with instant notifications for late arrivals, absences, 
                    and overtime alerts.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 gradient-success rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Enterprise Security
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Bank-level encryption and secure data storage ensure your sensitive attendance data 
                    remains protected at all times.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Team Management
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Organize employees by department, track performance metrics, and manage permissions 
                    with intuitive admin tools.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-accent-500 to-success-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Advanced Analytics
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Generate comprehensive reports with detailed insights, attendance patterns, 
                    and productivity metrics for informed decision-making.
                  </p>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-success-500 to-primary-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="pt-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                    Smart Automation
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Automated payroll integration, shift scheduling, and compliance reporting 
                    save hours of manual work every week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-neutral-100 dark:bg-neutral-800 py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">
              Transparent Pricing
            </h2>
            <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl">
              Plans for businesses of
              <span className="block text-gradient-primary">all sizes</span>
            </h3>
            <p className="max-w-2xl mt-6 mx-auto text-xl text-neutral-600 dark:text-neutral-300">
              Choose the plan that works best for your organization with flexible, scalable pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
            {/* Free Plan */}
            <Card variant="elevated" className="relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-2xl mb-6">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Free Trial
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    Perfect for small teams getting started
                  </p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-neutral-900 dark:text-white">$0</span>
                    <span className="text-lg text-neutral-600 dark:text-neutral-400">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Up to 10 employees</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Basic attendance tracking</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Simple reports</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Email support</span>
                  </li>
                </ul>
                
                <Link to="/register" className="block">
                  <Button variant="outline" className="w-full rounded-xl h-12 font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan - Featured */}
            <Card variant="elevated" className="relative overflow-hidden group hover:scale-105 transition-all duration-300 border-2 border-primary-500">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-b-xl text-sm font-semibold">
                Most Popular
              </div>
              <CardContent className="p-8 pt-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Professional
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    For growing businesses with complex needs
                  </p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-neutral-900 dark:text-white">$19</span>
                    <span className="text-lg text-neutral-600 dark:text-neutral-400">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Up to 50 employees</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Advanced biometric verification</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Comprehensive analytics</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">API access</span>
                  </li>
                </ul>
                
                <Link to="/register" className="block">
                  <Button variant="primary" className="w-full rounded-xl h-12 font-semibold">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card variant="elevated" className="relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-success-500 rounded-2xl mb-6">
                    <BarChart2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Enterprise
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                    For large organizations with custom requirements
                  </p>
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-neutral-900 dark:text-white">$49</span>
                    <span className="text-lg text-neutral-600 dark:text-neutral-400">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Unlimited employees</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Advanced security features</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">Dedicated support</span>
                  </li>
                  <li className="flex items-center">
                    <div className="flex-shrink-0 w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                    <span className="ml-3 text-neutral-700 dark:text-neutral-300">On-premise deployment</span>
                  </li>
                </ul>
                
                <Button variant="outline" className="w-full rounded-xl h-12 font-semibold">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="bg-white dark:bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Testimonials</h2> */}
            <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight">
              Trusted by businesses everywhere
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-bold text-xl">T</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Endgame</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Agency</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "WorkBeat's biometric system solved our attendance tracking challenges instantly. Our employees love the simplicity and security."
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-bold text-xl">H</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Kome Care</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Healthcare Provider</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "The dual-factor authentication gives us peace of mind knowing exactly who is clocking in and when. The reporting features have been invaluable."
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-bold text-xl">E</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">DO TakeAction</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">NGO</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "We've seen a 30% increase in punctuality since implementing WorkBeat. The analytics help us identify patterns and improve staff scheduling."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="bg-blue-600 dark:bg-blue-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Join thousands of satisfied companies today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register">
                <Button variant="primary" className="py-3 px-6">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link to="/contact">
                <Button variant="ghost" className="py-3 px-6 bg-white text-blue-600 hover:text-blue-500 dark:bg-gray-900 dark:text-blue-400 dark:hover:text-blue-300">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <Fingerprint className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">WorkBeat</span>
              </div>
              <p className="text-gray-500 dark:text-gray-300 text-base">
                Revolutionizing attendance tracking with secure biometric authentication.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Product</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Security
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Integrations
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Support</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Guides
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Company</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Press
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Legal</h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Terms
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Cookie Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Data Processing
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-base text-gray-400 dark:text-gray-300 xl:text-center">
              &copy; {new Date().getFullYear()} WorkBeat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;