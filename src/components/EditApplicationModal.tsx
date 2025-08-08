'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JobApplication {
  id: string;
  company: string;
  position: string;
  jobUrl: string;
  stage: 'to_apply' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  resumeUsed: string;
  applyDate: string;
  notes?: string;
  salary?: string;
  location?: string;
}

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  application?: JobApplication;
}

export default function EditApplicationModal({ isOpen, onClose, onSubmit, application }: EditApplicationModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    jobUrl: '',
    stage: 'to_apply' as 'to_apply' | 'applied' | 'interviewing' | 'offered' | 'rejected',
    resumeUsed: '',
    applyDate: '',
    notes: '',
    salary: '',
    location: ''
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company,
        position: application.position,
        jobUrl: application.jobUrl,
        stage: application.stage,
        resumeUsed: application.resumeUsed,
        applyDate: application.applyDate,
        notes: application.notes || '',
        salary: application.salary || '',
        location: application.location || ''
      });
    }
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-slate-900 border-slate-700 text-white w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Edit Application</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-1">Position</label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-300 mb-1">Job URL</label>
              <Input
                id="jobUrl"
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-300 mb-1">Stage</label>
                <select 
                  value={formData.stage} 
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2"
                  style={{
                    color: 'white',
                    backgroundColor: '#1e293b'
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
                <label htmlFor="resumeUsed" className="block text-sm font-medium text-gray-300 mb-1">Resume Used</label>
                <Input
                  id="resumeUsed"
                  value={formData.resumeUsed}
                  onChange={(e) => setFormData({ ...formData, resumeUsed: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="applyDate" className="block text-sm font-medium text-gray-300 mb-1">Apply Date</label>
                <Input
                  id="applyDate"
                  type="date"
                  value={formData.applyDate}
                  onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-300 mb-1">Salary (Optional)</label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="e.g., $50,000 - $70,000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Location (Optional)</label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2"
                placeholder="Any additional notes about this application..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 text-gray-300">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Update Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 