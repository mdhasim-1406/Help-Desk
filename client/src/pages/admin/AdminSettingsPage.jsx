import React, { useState } from 'react';
import { Save, Settings, Shield, Bell, Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import Toggle from '@/components/common/Toggle';

const AdminSettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    systemName: 'HelpDesk Pro',
    timezone: 'UTC',
    language: 'English',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    sslEnabled: true,
    backupEnabled: true,
    backupFrequency: 'daily',
    maxUploadSize: '50',
    sessionTimeout: '30',
    twoFactorRequired: false,
    passwordExpiry: false,
    passwordExpiryDays: '90',
  });

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure system-wide preferences and security.</p>
      </div>

      {/* General Settings */}
      <Card title="General Settings" subtitle="Basic system configuration">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">System Name</label>
            <input 
              type="text" 
              value={settings.systemName}
              onChange={(e) => handleChange('systemName', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Timezone</label>
            <select 
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option>UTC</option>
              <option>EST</option>
              <option>CST</option>
              <option>MST</option>
              <option>PST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Language</label>
            <select 
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Portuguese</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Max Upload Size (MB)</label>
            <input 
              type="number" 
              value={settings.maxUploadSize}
              onChange={(e) => handleChange('maxUploadSize', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card title="System Status" subtitle="Enable or disable system features">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Maintenance Mode</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Temporarily disable access for maintenance</p>
            </div>
            <Toggle 
              checked={settings.maintenanceMode}
              onChange={(checked) => handleChange('maintenanceMode', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Allow New Registrations</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Allow new users to create accounts</p>
            </div>
            <Toggle 
              checked={settings.allowNewRegistrations}
              onChange={(checked) => handleChange('allowNewRegistrations', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Require Email Verification</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Verify email addresses on registration</p>
            </div>
            <Toggle 
              checked={settings.requireEmailVerification}
              onChange={(checked) => handleChange('requireEmailVerification', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">SSL/TLS Enabled</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Encrypt all connections</p>
            </div>
            <Toggle 
              checked={settings.sslEnabled}
              onChange={(checked) => handleChange('sslEnabled', checked)}
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card title="Security Settings" subtitle="Protect your system from unauthorized access" icon={Shield}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Two-Factor Authentication</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Require 2FA for all users</p>
            </div>
            <Toggle 
              checked={settings.twoFactorRequired}
              onChange={(checked) => handleChange('twoFactorRequired', checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Password Expiration</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Force password changes periodically</p>
            </div>
            <Toggle 
              checked={settings.passwordExpiry}
              onChange={(checked) => handleChange('passwordExpiry', checked)}
            />
          </div>
          {settings.passwordExpiry && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <label className="block text-sm font-bold mb-2">Password Expiry (days)</label>
              <input 
                type="number" 
                value={settings.passwordExpiryDays}
                onChange={(e) => handleChange('passwordExpiryDays', e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <label className="block text-sm font-bold mb-2">Session Timeout (minutes)</label>
            <input 
              type="number" 
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Backup Settings */}
      <Card title="Backup & Recovery" subtitle="Automatic backup configuration" icon={Zap}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-bold">Enable Automatic Backups</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Automatically back up database and files</p>
            </div>
            <Toggle 
              checked={settings.backupEnabled}
              onChange={(checked) => handleChange('backupEnabled', checked)}
            />
          </div>
          {settings.backupEnabled && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <label className="block text-sm font-bold mb-2">Backup Frequency</label>
              <select 
                value={settings.backupFrequency}
                onChange={(e) => handleChange('backupFrequency', e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option>hourly</option>
                <option>daily</option>
                <option>weekly</option>
                <option>monthly</option>
              </select>
            </div>
          )}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Last backup: <span className="font-bold">2 hours ago</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Email Configuration */}
      <Card title="Email Configuration" subtitle="SMTP and email settings" icon={Mail}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">SMTP Host</label>
            <input 
              type="text" 
              placeholder="smtp.gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">SMTP Port</label>
            <input 
              type="number" 
              placeholder="587"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">From Email</label>
            <input 
              type="email" 
              placeholder="noreply@example.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">From Name</label>
            <input 
              type="text" 
              placeholder="HelpDesk Pro"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2">SMTP Username</label>
            <input 
              type="email" 
              placeholder="your-email@gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2">SMTP Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter SMTP password"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button icon={Save}>Save Settings</Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
