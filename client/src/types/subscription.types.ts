export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'pending' | 'pending_payment';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  maxEmployees: number;
  features: string[];
}

export interface SubscriptionFeatures {
  // Employee limits
  maxEmployees: number;
  
  // Attendance features
  basicAttendance: boolean;
  biometricFingerprint: boolean;
  biometricFacial: boolean;
  geofencing: boolean;
  qrCodeAttendance: boolean;
  
  // Reporting and analytics
  basicReports: boolean;
  advancedReports: boolean;
  customReports: boolean;
  dataExport: boolean;
  analyticsCharts: boolean;
  
  // Management features
  employeeManagement: boolean;
  departmentManagement: boolean;
  shiftScheduling: boolean;
  leaveManagement: boolean;
  
  // Branding and customization
  whiteLabelBranding: boolean;
  customLogo: boolean;
  themeCustomization: boolean;
  
  // Integration and API
  apiAccess: boolean;
  webhooks: boolean;
  thirdPartyIntegrations: boolean;
  
  // Support
  emailSupport: boolean;
  prioritySupport: boolean;
  phoneSupport: boolean;
  dedicatedAccountManager: boolean;
  
  // Enterprise features
  onPremiseDeployment: boolean;
  ssoIntegration: boolean;
  advancedSecurity: boolean;
  multiTenant: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlan, SubscriptionFeatures> = {
  free: {
    maxEmployees: 7,
    basicAttendance: true,
    biometricFingerprint: false,
    biometricFacial: false,
    geofencing: false,
    qrCodeAttendance: true,
    basicReports: true,
    advancedReports: false,
    customReports: false,
    dataExport: false,
    analyticsCharts: false,
    employeeManagement: true,
    departmentManagement: false,
    shiftScheduling: false,
    leaveManagement: false,
    whiteLabelBranding: false,
    customLogo: false,
    themeCustomization: false,
    apiAccess: false,
    webhooks: false,
    thirdPartyIntegrations: false,
    emailSupport: true,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedAccountManager: false,
    onPremiseDeployment: false,
    ssoIntegration: false,
    advancedSecurity: false,
    multiTenant: false,
  },
  starter: {
    maxEmployees: 25,
    basicAttendance: true,
    biometricFingerprint: false,
    biometricFacial: false,
    geofencing: false,
    qrCodeAttendance: true,
    basicReports: true,
    advancedReports: false,
    customReports: false,
    dataExport: true,
    analyticsCharts: false,
    employeeManagement: true,
    departmentManagement: true,
    shiftScheduling: false,
    leaveManagement: false,
    whiteLabelBranding: false,
    customLogo: false,
    themeCustomization: false,
    apiAccess: false,
    webhooks: false,
    thirdPartyIntegrations: false,
    emailSupport: true,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedAccountManager: false,
    onPremiseDeployment: false,
    ssoIntegration: false,
    advancedSecurity: false,
    multiTenant: false,
  },
  professional: {
    maxEmployees: 100,
    basicAttendance: true,
    biometricFingerprint: true,
    biometricFacial: true,
    geofencing: true,
    qrCodeAttendance: true,
    basicReports: true,
    advancedReports: true,
    customReports: false,
    dataExport: true,
    analyticsCharts: true,
    employeeManagement: true,
    departmentManagement: true,
    shiftScheduling: true,
    leaveManagement: true,
    whiteLabelBranding: true,
    customLogo: true,
    themeCustomization: true,
    apiAccess: false,
    webhooks: false,
    thirdPartyIntegrations: true,
    emailSupport: true,
    prioritySupport: true,
    phoneSupport: false,
    dedicatedAccountManager: false,
    onPremiseDeployment: false,
    ssoIntegration: false,
    advancedSecurity: true,
    multiTenant: false,
  },
  enterprise: {
    maxEmployees: -1, // Unlimited
    basicAttendance: true,
    biometricFingerprint: true,
    biometricFacial: true,
    geofencing: true,
    qrCodeAttendance: true,
    basicReports: true,
    advancedReports: true,
    customReports: true,
    dataExport: true,
    analyticsCharts: true,
    employeeManagement: true,
    departmentManagement: true,
    shiftScheduling: true,
    leaveManagement: true,
    whiteLabelBranding: true,
    customLogo: true,
    themeCustomization: true,
    apiAccess: true,
    webhooks: true,
    thirdPartyIntegrations: true,
    emailSupport: true,
    prioritySupport: true,
    phoneSupport: true,
    dedicatedAccountManager: true,
    onPremiseDeployment: true,
    ssoIntegration: true,
    advancedSecurity: true,
    multiTenant: true,
  },
};

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  free: 'Free Trial (30 days)',
  starter: 'Starter',
  professional: 'Professional', 
  enterprise: 'Enterprise',
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  free: 0,
  starter: 15000,
  professional: 35000,
  enterprise: 150000,
};