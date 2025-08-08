'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
}

interface EditActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  actionItem?: ActionItem;
}

export default function EditActionItemModal({ isOpen, onClose, onSubmit, actionItem }: EditActionItemModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    if (actionItem) {
      setFormData({
        title: actionItem.title,
        priority: actionItem.priority,
        dueDate: actionItem.dueDate || '',
        notes: actionItem.notes || ''
      });
    }
  }, [actionItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-slate-900 border-slate-700 text-white w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Edit Action Item</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2"
                style={{
                  color: 'white',
                  backgroundColor: '#1e293b'
                }}
              >
                <option value="low" style={{ backgroundColor: '#1e293b', color: 'white' }}>Low</option>
                <option value="medium" style={{ backgroundColor: '#1e293b', color: 'white' }}>Medium</option>
                <option value="high" style={{ backgroundColor: '#1e293b', color: 'white' }}>High</option>
              </select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">Due Date (Optional)</label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes (Optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-3 py-2"
                placeholder="Any additional notes about this task..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-600 text-gray-300">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Update Task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 