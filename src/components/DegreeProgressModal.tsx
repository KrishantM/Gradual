'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DegreeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    graduationDate: string;
    semestersRemaining: number;
    totalSemestersRequired: number;
    creditsCompleted?: number;
    totalCredits?: number;
  }) => void;
  currentData: {
    graduationDate: string;
    semestersRemaining: number;
    totalSemestersRequired: number;
    creditsCompleted?: number;
    totalCredits?: number;
  };
}

export default function DegreeProgressModal({
  isOpen,
  onClose,
  onSave,
  currentData
}: DegreeProgressModalProps) {
  const [formData, setFormData] = useState({
    graduationDate: '',
    semestersRemaining: 0,
    totalSemestersRequired: 6,
    creditsCompleted: '',
    totalCredits: ''
  });

  useEffect(() => {
    if (isOpen && currentData) {
      setFormData({
        graduationDate: currentData.graduationDate || '',
        semestersRemaining: currentData.semestersRemaining || 0,
        totalSemestersRequired: currentData.totalSemestersRequired || 6,
        creditsCompleted: currentData.creditsCompleted?.toString() || '',
        totalCredits: currentData.totalCredits?.toString() || ''
      });
    }
  }, [isOpen, currentData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      graduationDate: formData.graduationDate,
      semestersRemaining: formData.semestersRemaining,
      totalSemestersRequired: formData.totalSemestersRequired,
      ...(formData.creditsCompleted && formData.totalCredits && {
        creditsCompleted: parseInt(formData.creditsCompleted),
        totalCredits: parseInt(formData.totalCredits)
      })
    };
    
    onSave(data);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900/95 border-white/20 shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Edit Degree Progress</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Graduation Date */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Expected Graduation Date
              </label>
              <input
                type="text"
                value={formData.graduationDate}
                onChange={(e) => handleInputChange('graduationDate', e.target.value)}
                placeholder="e.g., Spring 2025, December 2024"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter your expected graduation term or date
              </p>
            </div>

            {/* Total Semesters Required */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Total Semesters Required
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.totalSemestersRequired}
                onChange={(e) => handleInputChange('totalSemestersRequired', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Total semesters for your degree (e.g., 6 for 3-year degree)
              </p>
            </div>

            {/* Semesters Remaining */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Semesters Remaining
              </label>
              <input
                type="number"
                min="0"
                max={formData.totalSemestersRequired}
                value={formData.semestersRemaining}
                onChange={(e) => handleInputChange('semestersRemaining', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Number of semesters until graduation (0 if graduated)
              </p>
            </div>

            {/* Credits Section */}
            <div>
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium text-white">
                  Credit Information
                </label>
                <span className="text-xs text-gray-400 ml-2">(Optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Credits Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditsCompleted}
                    onChange={(e) => handleInputChange('creditsCompleted', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Total Credits Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalCredits}
                    onChange={(e) => handleInputChange('totalCredits', e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Leave blank if you don&apos;t know your credit count
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
