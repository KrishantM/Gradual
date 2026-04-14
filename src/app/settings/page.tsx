'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, ChevronUp, Settings, Database, Info, Trash2 } from 'lucide-react';

function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  collapsed,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Chevron = collapsed ? ChevronDown : ChevronUp;
  return (
    <div className="surface-card overflow-hidden section-gap">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-5 cursor-pointer transition-colors duration-150"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-subtle)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
          <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            {title}
          </span>
        </div>
        <Chevron className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
      </button>

      {!collapsed && (
        <div
          className="px-6 pb-6 pt-2"
          style={{
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [cvScoreCache, setCvScoreCache] = useState<Map<string, any>>(new Map());
  const [collapsed, setCollapsed] = useState({
    cache: false,
    scoring: false,
    system: false,
  });

  useEffect(() => {
    if (user) {
      const cached = localStorage.getItem('cvScoreCache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const map = new Map(Object.entries(parsed));
          setCvScoreCache(map);
        } catch (error) {
          console.error('Error parsing cache:', error);
        }
      }
    }
  }, [user]);

  const clearCache = () => {
    localStorage.removeItem('cvScoreCache');
    setCvScoreCache(new Map());
  };

  const getCVHashPreview = (cvText: string) => {
    if (!cvText) return 'No CV text';
    const normalized = cvText.trim().toLowerCase();
    const words = normalized.split(/\s+/);
    const preview = words.slice(0, 10).join(' ');
    return `${preview}${words.length > 10 ? '...' : ''} (${words.length} words)`;
  };

  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!user) {
    return (
      <div className="page-container max-w-3xl">
        <div className="surface-card p-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and view system information</p>
      </div>

      {/* CV Scoring Configuration */}
      <CollapsibleSection
        icon={Settings}
        iconColor="var(--accent-blue)"
        title="CV Scoring Configuration"
        collapsed={collapsed.scoring}
        onToggle={() => toggleSection('scoring')}
      >
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="feedback-card p-4">
              <h4
                className="font-semibold text-sm mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                Word Count Limits
              </h4>
              <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex justify-between">
                  <span>Minimum</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>10 words</span>
                </li>
                <li className="flex justify-between">
                  <span>Maximum</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>1,500 words</span>
                </li>
                <li className="flex justify-between">
                  <span>Optimal</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>300 - 600 words</span>
                </li>
              </ul>
            </div>

            <div className="feedback-card p-4">
              <h4
                className="font-semibold text-sm mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                Scoring Ranges
              </h4>
              <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                <li className="flex justify-between">
                  <span>&lt;50 words</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>0 - 5 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>50 - 99 words</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>5 - 10 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>100 - 299 words</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>10 - 50 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>300+ words</span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>30 - 90 pts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quality Gates — accent card */}
          <div className="card-section-accent p-5">
            <h4
              className="font-semibold text-sm mb-3"
              style={{ color: 'var(--accent-blue)' }}
            >
              Quality Gates
            </h4>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Professional Indicators
                </span>
                <p className="mt-0.5">Requires 4+ professional terms</p>
              </div>
              <div>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Structure Elements
                </span>
                <p className="mt-0.5">Requires 3+ structural components</p>
              </div>
              <div>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  Content Validation
                </span>
                <p className="mt-0.5">Checks for inappropriate content</p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Cache Management */}
      <CollapsibleSection
        icon={Database}
        iconColor="var(--success)"
        title="CV Score Cache"
        collapsed={collapsed.cache}
        onToggle={() => toggleSection('cache')}
      >
        <div className="space-y-5 mt-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cached scores:{' '}
                <span className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
                  {cvScoreCache.size}
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Caching prevents duplicate API calls for identical CVs
              </p>
            </div>
            <button
              onClick={clearCache}
              className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--danger-soft)';
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.borderColor = 'var(--danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Cache
            </button>
          </div>

          {cvScoreCache.size > 0 && (
            <div className="feedback-card p-4">
              <h4
                className="font-semibold text-sm mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                Recent Cache Entries
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Array.from(cvScoreCache.entries())
                  .slice(0, 5)
                  .map(([hash, data], index) => (
                    <div
                      key={index}
                      className="rounded-lg py-2.5 px-3"
                      style={{
                        borderLeft: '3px solid var(--success)',
                        background: 'var(--surface)',
                      }}
                    >
                      <div
                        className="text-xs font-mono mb-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Hash: {hash.substring(0, 16)}...
                      </div>
                      <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {getCVHashPreview(data.cvText || 'No text available')}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Cached: {new Date(data.timestamp || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* System Status */}
      <CollapsibleSection
        icon={Info}
        iconColor="var(--accent-purple)"
        title="System Status"
        collapsed={collapsed.system}
        onToggle={() => toggleSection('system')}
      >
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Authentication', status: 'Active' },
              { label: 'CV Scoring', status: 'Operational' },
              { label: 'Cache System', status: 'Active' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'var(--success-soft)',
                  border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
                }}
              >
                <div className="text-xl font-bold mb-1" style={{ color: 'var(--success)' }}>
                  &#10003;
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {item.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>

          <div className="feedback-card p-4">
            <h4
              className="font-semibold text-sm mb-3"
              style={{ color: 'var(--foreground)' }}
            >
              Recent Updates
            </h4>
            <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent-blue)' }}
                />
                Implemented stricter CV scoring algorithm
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent-blue)' }}
                />
                Added quality gates for professional content
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent-blue)' }}
                />
                Enhanced structure validation
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent-blue)' }}
                />
                Improved cache management
              </li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
