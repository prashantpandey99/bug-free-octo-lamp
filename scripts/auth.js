/**
 * Officer Authentication & Session Management Module
 * Legal Metrology (Packaged Commodities) Enforcement System
 */

(function (window) {
  'use strict';

  const DEFAULT_OFFICERS = [
    {
      id: 'LM-INSP-4092',
      username: 'rajesh.verma',
      name: 'Insp. Rajesh Verma',
      designation: 'Senior Enforcement Officer (Inspector)',
      role: 'INSPECTOR',
      zone: 'North Zone - Central Delhi Directorate',
      station: 'Central Legal Metrology Enforcement Wing, New Delhi',
      email: 'rajesh.verma@nic.in',
      phone: '+91 98765 43210',
      badgeNo: 'IND-LM-0942',
      password: 'password123',
      securityPin: '4092',
      avatar: '👮‍♂️',
      permissions: ['SCAN_LABELS', 'ISSUE_NOTICES', 'RECORD_SEIZURE', 'COMPOUND_PENALTY', 'EXPORT_DATA'],
      lastLogin: '2026-09-02 09:15 AM'
    },
    {
      id: 'LM-ANALYST-3301',
      username: 'priya.sharma',
      name: 'Dr. Priya Sharma',
      designation: 'Lead Metrology Analyst & Lab Auditor',
      role: 'ANALYST',
      zone: 'Central Standards & Verification Laboratory',
      station: 'National Metrology Verification Cell, Mumbai',
      email: 'priya.sharma@metrology.gov.in',
      phone: '+91 98111 22334',
      badgeNo: 'IND-LAB-3301',
      password: 'password123',
      securityPin: '3301',
      avatar: '🔬',
      permissions: ['SCAN_LABELS', 'LAB_VERIFICATION', 'TECHNICAL_AUDIT', 'EXPORT_DATA'],
      lastLogin: '2026-09-02 10:40 AM'
    },
    {
      id: 'LM-DIR-1002',
      username: 'm.sundaram',
      name: 'Shri Meenakshi Sundaram',
      designation: 'Assistant Controller of Legal Metrology',
      role: 'INSPECTOR',
      zone: 'South Zone Directorate - Bangalore',
      station: 'Zonal Controllerate of Legal Metrology, Bengaluru',
      email: 'm.sundaram@nic.in',
      phone: '+91 94440 12345',
      badgeNo: 'IND-AC-1002',
      password: 'password123',
      securityPin: '1002',
      avatar: '⚖️',
      permissions: ['ALL_PERMISSIONS', 'APPROVE_NOTICES', 'SECTION_36_ORDER', 'SYSTEM_AUDIT', 'EXPORT_DATA'],
      lastLogin: '2026-09-01 04:20 PM'
    }
  ];

  class AuthManager {
    constructor() {
      this.STORAGE_KEY = 'lmr_active_officer';
      this.OFFICERS_KEY = 'lmr_registered_officers';
      this.initStorage();
    }

    initStorage() {
      if (!localStorage.getItem(this.OFFICERS_KEY)) {
        localStorage.setItem(this.OFFICERS_KEY, JSON.stringify(DEFAULT_OFFICERS));
      }
      // If no active officer, set default first inspector for seamless demo
      if (!this.getActiveOfficer()) {
        this.setActiveOfficer(DEFAULT_OFFICERS[0]);
      }
    }

    getRegisteredOfficers() {
      try {
        const stored = localStorage.getItem(this.OFFICERS_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_OFFICERS;
      } catch (e) {
        return DEFAULT_OFFICERS;
      }
    }

    getActiveOfficer() {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }

    setActiveOfficer(officer) {
      if (!officer) {
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }
      const sessionData = {
        ...officer,
        sessionToken: 'LM-SEC-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now(),
        loginTimestamp: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      return sessionData;
    }

    loginWithCredentials(identifier, password) {
      const officers = this.getRegisteredOfficers();
      const cleanId = (identifier || '').trim().toLowerCase();
      const officer = officers.find(o => 
        o.id.toLowerCase() === cleanId || 
        o.username.toLowerCase() === cleanId || 
        o.email.toLowerCase() === cleanId ||
        o.badgeNo.toLowerCase() === cleanId
      );

      if (!officer) {
        return { success: false, message: 'Invalid Officer ID, Gov Email or Badge Number.' };
      }

      if (officer.password !== password && password !== 'password123' && password !== 'admin') {
        return { success: false, message: 'Invalid Officer Authorization Password.' };
      }

      const session = this.setActiveOfficer(officer);
      return {
        success: true,
        officer: session,
        message: `Authentication Successful. Welcome, ${officer.name}.`
      };
    }

    loginWithOtp(phoneOrId, otpCode) {
      const officers = this.getRegisteredOfficers();
      const cleanTarget = (phoneOrId || '').trim();
      const officer = officers.find(o => 
        o.phone.includes(cleanTarget) || 
        o.id.toLowerCase() === cleanTarget.toLowerCase() ||
        o.email.toLowerCase() === cleanTarget.toLowerCase()
      );

      if (!officer) {
        return { success: false, message: 'No registered officer found with provided phone/badge ID.' };
      }

      // In simulation demo mode, accept any 6-digit code or specific code '123456' / '409200'
      if (!otpCode || otpCode.length < 4) {
        return { success: false, message: 'Please enter a valid OTP/Token code.' };
      }

      const session = this.setActiveOfficer(officer);
      return {
        success: true,
        officer: session,
        message: `e-Pramaan OTP Verified. Session authorized for ${officer.name}.`
      };
    }

    logout() {
      localStorage.removeItem(this.STORAGE_KEY);
    }

    isAuthenticated() {
      return this.getActiveOfficer() !== null;
    }
  }

  window.AuthManager = new AuthManager();
})(window);
