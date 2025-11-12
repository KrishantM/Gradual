'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface AcademicItem {
  id: string;
  title: string;
  deadline?: string;
  progress?: number;
  type?: string;
  role?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  grade?: string;
  credits?: number;
}

interface AcademicInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  itemType: 'paper' | 'assessment' | 'club' | 'achievement' | 'course';
  existingItem?: AcademicItem;
  onSave: (item: AcademicItem) => void;
}

export default function AcademicInputModal({
  isOpen,
  onClose,
  mode,
  itemType,
  existingItem,
  onSave
}: AcademicInputModalProps) {
  const [formData, setFormData] = useState<Partial<AcademicItem>>({
    title: '',
    deadline: '',
    progress: 0,
    type: '',
    role: '',
    description: ''
  });

  // Reset form when modal opens/closes or when editing item changes
  useEffect(() => {
    if (isOpen) {
      if (existingItem && mode === 'edit') {
        // Populate form with existing item data
        setFormData({
          title: existingItem.title || '',
          deadline: existingItem.deadline || '',
          progress: existingItem.progress || 0,
          type: existingItem.type || '',
          role: existingItem.role || '',
          description: existingItem.description || ''
        });
      } else {
        // Reset form for new item
        setFormData({
          title: '',
          deadline: '',
          progress: 0,
          type: '',
          role: '',
          description: ''
        });
      }
    }
  }, [isOpen, existingItem, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) return;

    const item: AcademicItem = {
      id: existingItem?.id || `item_${Date.now()}`,
      title: formData.title.trim(),
      progress: formData.progress || 0
    };

    // Only add optional fields if they have values
    if (formData.deadline && formData.deadline.trim()) {
      item.deadline = formData.deadline.trim();
    }
    if (formData.type && formData.type.trim()) {
      item.type = formData.type.trim();
    }
    if (formData.role && formData.role.trim()) {
      item.role = formData.role.trim();
    }
    if (formData.grade && formData.grade.trim()) {
      item.grade = formData.grade.trim();
    }
    if (formData.credits) {
      item.credits = formData.credits;
    }
    if (formData.description && formData.description.trim()) {
      item.description = formData.description.trim();
    }

    onSave(item);
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getModalTitle = () => {
    const action = mode === 'add' ? 'Add' : 'Edit';
    const item = itemType === 'paper' ? 'Paper/Project' : 
                 itemType === 'assessment' ? 'Assessment' : 
                 itemType === 'club' ? 'Club/Involvement' :
                 itemType === 'achievement' ? 'Achievement' :
                 'Course';
    return `${action} ${item}`;
  };

  const getIcon = () => {
    switch (itemType) {
      case 'paper':
        return <Plus className="h-5 w-5" />;
      case 'assessment':
        return <Edit3 className="h-5 w-5" />;
      case 'club':
        return <Plus className="h-5 w-5" />;
      case 'achievement':
        return <Plus className="h-5 w-5" />;
      case 'course':
        return <Plus className="h-5 w-5" />;
      default:
        return <Plus className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900/95 border-white/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">
                {getIcon()}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {getModalTitle()}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {itemType === 'paper' ? 'Paper/Project Title' :
                 itemType === 'assessment' ? 'Assessment Name' :
                 itemType === 'club' ? 'Organization/Club Name' :
                 itemType === 'achievement' ? 'Achievement Name' :
                 'Course Name'}
              </label>
              <Input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={itemType === 'paper' ? 'e.g., Capstone Project: AI Platform' :
                           itemType === 'assessment' ? 'e.g., Data Structures Final Exam' :
                           itemType === 'club' ? 'e.g., Computer Science Club' :
                           itemType === 'achievement' ? 'e.g., Dean\'s List Fall 2023' :
                           'e.g., Introduction to Programming'}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                required
              />
            </div>

            {/* Grade (for courses) */}
            {itemType === 'course' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grade (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.grade || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    // Allow only A, B, C, D with optional + or -
                    const validGradePattern = /^[ABCD][+-]?$/;
                    if (value === '' || validGradePattern.test(value)) {
                      handleInputChange('grade', value);
                    }
                  }}
                  placeholder="e.g., A-, B+, A"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Valid grades: A, B, C, D with optional + or - (e.g., A+, B-, C)
                </p>
              </div>
            )}


            {/* Progress (for papers) */}
            {itemType === 'paper' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Progress (%)
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress || 0}
                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 w-20"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formData.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Type (for assessments and clubs) */}
            {(itemType === 'assessment' || itemType === 'club') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {itemType === 'assessment' ? 'Assessment Type' : 'Role/Position'}
                </label>
                <Input
                  type="text"
                  value={itemType === 'assessment' ? (formData.type || '') : (formData.role || '')}
                  onChange={(e) => handleInputChange(
                    itemType === 'assessment' ? 'type' : 'role', 
                    e.target.value
                  )}
                  placeholder={itemType === 'assessment' ? 'e.g., Final Exam, Presentation' :
                             'e.g., Member, Vice President, Treasurer'}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                />
              </div>
            )}

            {/* Progress (for papers) */}
            {itemType === 'paper' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Progress (%)
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress || 0}
                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 w-20"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formData.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Deadline/Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {itemType === 'paper' ? 'Deadline' : 
                 itemType === 'course' ? 'Date of Completion' :
                 itemType === 'achievement' ? 'Date of Achievement' :
                 'Date'}
              </label>
              {(itemType === 'course' || itemType === 'achievement') ? (
                <>
                  <Input
                    type="month"
                    value={formData.deadline || ''}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Select the month and year (e.g., December 2023)
                  </p>
                </>
              ) : (
                <Input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                />
              )}
            </div>

            {/* Description (optional for achievements) */}
            {itemType === 'achievement' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {mode === 'add' ? 'Add' : 'Update'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
