import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    plan: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success('Thank you for your message! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        plan: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };

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
            Get in Touch
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-100">
            Ready to transform your attendance management? Let's discuss how WorkBeat can help your business.
          </p>
        </div>
      </div>

      {/* Contact Information and Form */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Email</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">sales@workbeat.com.ng</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Phone</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">+234 (0) 809 123 4567</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Address</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      Plot 123, Victoria Island<br />
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                  Business Hours
                </h3>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">Monday - Friday</span>
                      <span className="text-neutral-900 dark:text-white font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">Saturday</span>
                      <span className="text-neutral-900 dark:text-white font-medium">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">Sunday</span>
                      <span className="text-neutral-900 dark:text-white font-medium">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Send us a Message
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company Name"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Interested Plan
                    </label>
                    <select
                      name="plan"
                      value={formData.plan}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white"
                    >
                      <option value="">Select a plan</option>
                      <option value="starter">Starter - ₦15,000/month</option>
                      <option value="professional">Professional - ₦35,000/month</option>
                      <option value="enterprise">Enterprise - ₦150,000/month</option>
                      <option value="custom">Custom Solution</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your requirements..."
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<Send size={18} />}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-200">Start your free trial today.</span>
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

export default ContactPage;