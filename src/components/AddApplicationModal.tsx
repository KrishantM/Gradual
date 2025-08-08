'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (application: any) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onSubmit }: AddApplicationModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    jobUrl: '',
    stage: 'to_apply' as const,
    resumeUsed: '',
    applyDate: new Date().toISOString().split('T')[0],
    notes: '',
    salary: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      company: '',
      position: '',
      jobUrl: '',
      stage: 'to_apply',
      resumeUsed: '',
      applyDate: new Date().toISOString().split('T')[0],
      notes: '',
      salary: '',
      location: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold text-white">Add Application</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Company *</label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Company name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Position *</label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="Job title"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Job URL *</label>
              <Input
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="https://..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                  style={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <option value="to_apply" style={{ backgroundColor: '#1e293b', color: 'white' }}>To Apply</option>
                  <option value="applied" style={{ backgroundColor: '#1e293b', color: 'white' }}>Applied</option>
                  <option value="interviewing" style={{ backgroundColor: '#1e293b', color: 'white' }}>Interviewing</option>
                  <option value="offered" style={{ backgroundColor: '#1e293b', color: 'white' }}>Offered</option>
                  <option value="rejected" style={{ backgroundColor: '#1e293b', color: 'white' }}>Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Apply Date</label>
                <Input
                  type="date"
                  value={formData.applyDate}
                  onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Resume Used</label>
                <Input
                  value={formData.resumeUsed}
                  onChange={(e) => setFormData({ ...formData, resumeUsed: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="CV filename"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Salary (Optional)</label>
              <Input
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder="e.g., $50,000 - $70,000"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 placeholder:text-gray-400"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Add Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 