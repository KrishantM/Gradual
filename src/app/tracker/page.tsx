'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authenticatedFetch } from '@/lib/api-helper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddApplicationModal from '@/components/AddApplicationModal';
import AddActionItemModal from '@/components/AddActionItemModal';
import EditApplicationModal from '@/components/EditApplicationModal';
import EditActionItemModal from '@/components/EditActionItemModal';
import { 
  Plus, 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  Calendar,
  Building,
  Briefcase,
  Link,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  DollarSign,
  MoreVertical,
  ArrowUpDown,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  createdAt: string;
  updatedAt: string;
}

interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export default function TrackerPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [showAddActionItem, setShowAddActionItem] = useState(false);
  const [editingApplication, setEditingApplication] = useState<string | null>(null);
  const [editingActionItem, setEditingActionItem] = useState<string | null>(null);

  // Fetch applications and action items
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Please log in to access the tracker.');
      return;
    }
    
    const fetchData = async () => {
      try {
        setError(null);
        
        // Get the user's ID token
        const token = await user.getIdToken();
        
        // Fetch applications
        const applicationsRes = await fetch('/api/applications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!applicationsRes.ok) {
          const errorData = await applicationsRes.json().catch(() => ({}));
          console.error('Applications API error:', errorData);
          throw new Error(`Failed to fetch applications: ${applicationsRes.status}`);
        }
        const applicationsData = await applicationsRes.json();
        
        // Fetch action items
        const actionItemsRes = await fetch('/api/action-items', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!actionItemsRes.ok) {
          const errorData = await actionItemsRes.json().catch(() => ({}));
          console.error('Action items API error:', errorData);
          throw new Error(`Failed to fetch action items: ${actionItemsRes.status}`);
        }
        const actionItemsData = await actionItemsRes.json();

        setApplications(applicationsData.applications || []);
        setActionItems(actionItemsData.actionItems || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error instanceof Error) {
          setError(`Failed to load data: ${error.message}. Please try refreshing the page.`);
        } else {
          setError('Failed to load data. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle adding new application
  const handleAddApplication = async (applicationData: any) => {
    try {
      const token = await user?.getIdToken();
      if (!token) {
        console.error('User not authenticated');
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        const newApplication = await response.json();
        setApplications(prev => [newApplication, ...prev]);
      } else {
        console.error('Failed to add application');
      }
    } catch (error) {
      console.error('Error adding application:', error);
    }
  };

  // Handle adding new action item
  const handleAddActionItem = async (actionItemData: any) => {
    try {
      const token = await user?.getIdToken();
      if (!token) {
        console.error('User not authenticated');
        return;
      }

      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...actionItemData,
          completed: false
        }),
      });

      if (response.ok) {
        const newActionItem = await response.json();
        setActionItems(prev => [newActionItem, ...prev]);
      } else {
        console.error('Failed to add action item');
      }
    } catch (error) {
      console.error('Error adding action item:', error);
    }
  };

  // Handle toggling action item completion
  const handleToggleActionItem = async (itemId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/action-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: itemId,
          completed: !completed
        }),
      });

      if (response.ok) {
        setActionItems(prev => 
          prev.map(item => 
            item.id === itemId 
              ? { ...item, completed: !completed }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating action item:', error);
    }
  };

  const handleEditApplication = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    setEditingApplication(applicationId);
  };

  const handleEditActionItem = (itemId: string) => {
    const actionItem = actionItems.find(item => item.id === itemId);
    setEditingActionItem(itemId);
  };

  const handleUpdateApplication = async (applicationData: any) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingApplication,
          ...applicationData
        }),
      });

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === editingApplication 
              ? { ...app, ...applicationData }
              : app
          )
        );
        setEditingApplication(null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const handleUpdateActionItem = async (actionItemData: any) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/action-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingActionItem,
          ...actionItemData
        }),
      });

      if (response.ok) {
        setActionItems(prev => 
          prev.map(item => 
            item.id === editingActionItem 
              ? { ...item, ...actionItemData }
              : item
          )
        );
        setEditingActionItem(null);
      }
    } catch (error) {
      console.error('Error updating action item:', error);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/applications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: applicationId }),
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const handleDeleteActionItem = async (itemId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();

      const response = await fetch('/api/action-items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: itemId }),
      });

      if (response.ok) {
        setActionItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting action item:', error);
    }
  };

  // Filter applications based on search and stage
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || app.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'to_apply': return 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-soft)]';
      case 'applied': return 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-[var(--accent-blue)]/30';
      case 'interviewing': return 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30';
      case 'offered': return 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30';
      case 'rejected': return 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30';
      default: return 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-soft)]';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'to_apply': return 'To Apply';
      case 'applied': return 'Applied';
      case 'interviewing': return 'Interviewing';
      case 'offered': return 'Offered';
      case 'rejected': return 'Rejected';
      default: return stage;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)] mx-auto mb-3"></div>
          <p className="text-sm text-[var(--text-muted)]">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-[var(--danger-soft)] p-3 w-fit mx-auto mb-4">
            <ClipboardList className="h-6 w-6 text-[var(--danger)]" />
          </div>
          <p className="text-[var(--text-muted)] mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="page-container">
        <div>
          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="page-title">Application Tracker</h1>
            <p className="page-subtitle">
              Track your job applications and manage your career search progress
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 section-gap">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{applications.length}</div>
                <div className="text-[var(--text-muted)] text-sm">Total Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--accent-blue)]">
                  {applications.filter(app => app.stage === 'applied').length}
                </div>
                <div className="text-[var(--text-muted)] text-sm">Applied</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--warning)]">
                  {applications.filter(app => app.stage === 'interviewing').length}
                </div>
                <div className="text-[var(--text-muted)] text-sm">Interviewing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[var(--success)]">
                  {applications.filter(app => app.stage === 'offered').length}
                </div>
                <div className="text-[var(--text-muted)] text-sm">Offers</div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 section-gap">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-subtle)] h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="rounded-md border bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 text-sm"
                >
                  <option value="all">All Stages</option>
                  <option value="to_apply">To Apply</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button
                  onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                  variant="outline"
                  title={viewMode === 'card' ? 'Switch to Table View' : 'Switch to Card View'}
                >
                  {viewMode === 'card' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => setShowAddApplication(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </div>
          </div>

          {/* Applications */}
          {filteredApplications.length === 0 ? (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-12">
              <CardContent className="p-8">
                <div className="empty-state">
                  <Building className="empty-state-icon" />
                  <h3 className="font-semibold mb-1">No applications found</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    {searchTerm || filterStage !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start tracking your job applications to see them here'
                    }
                  </p>
                  <Button onClick={() => setShowAddApplication(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 section-gap">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover-lift">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5 truncate">{application.position}</h3>
                        <p className="text-sm text-[var(--text-muted)] flex items-center">
                          <Building className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                          {application.company}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ml-2 ${getStageColor(application.stage)}`}>
                        {getStageLabel(application.stage)}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {application.location && (
                        <div className="flex items-center text-[var(--text-subtle)] text-xs">
                          <MapPin className="h-3 w-3 mr-1.5" />
                          {application.location}
                        </div>
                      )}
                      {application.salary && (
                        <div className="flex items-center text-[var(--text-subtle)] text-xs">
                          <DollarSign className="h-3 w-3 mr-1.5" />
                          {application.salary}
                        </div>
                      )}
                      <div className="flex items-center text-[var(--text-subtle)] text-xs">
                        <Calendar className="h-3 w-3 mr-1.5" />
                        Applied: {formatDate(application.applyDate)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => window.open(application.jobUrl, '_blank')}>
                        <Link className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditApplication(application.id)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => handleDeleteApplication(application.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="section-gap">
              <CardContent className="p-5">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Stage</th>
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Company</th>
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Position</th>
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Location</th>
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Applied</th>
                        <th className="text-left py-3 text-sm font-medium text-[var(--text-muted)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="border-b border-[var(--border-soft)]">
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(application.stage)}`}>
                              {getStageLabel(application.stage)}
                            </span>
                          </td>
                          <td className="py-3 text-sm">{application.company}</td>
                          <td className="py-3 text-sm">{application.position}</td>
                          <td className="py-3 text-sm text-[var(--text-muted)]">{application.location || '-'}</td>
                          <td className="py-3 text-sm text-[var(--text-muted)]">{formatDate(application.applyDate)}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditApplication(application.id)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(application.jobUrl, '_blank')}>
                                <Link className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => handleDeleteApplication(application.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredApplications.map((application) => (
                    <div key={application.id} className="surface-card-subtle rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-0.5">{application.position}</h3>
                          <p className="text-sm text-[var(--text-muted)] flex items-center mb-1.5">
                            <Building className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            {application.company}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(application.stage)}`}>
                            {getStageLabel(application.stage)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-[var(--text-subtle)]">
                        {application.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
                            <span className="truncate">{application.location}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
                          <span>{formatDate(application.applyDate)}</span>
                        </div>
                        {application.salary && (
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1.5 shrink-0" />
                            <span className="truncate">{application.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1.5 shrink-0" />
                          <span className="truncate">{application.resumeUsed}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={() => window.open(application.jobUrl, '_blank')}>
                          <Link className="h-3 w-3 mr-1" /> View Job
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditApplication(application.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => handleDeleteApplication(application.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-0.5">Action Items</h2>
                  <p className="text-sm text-[var(--text-muted)]">Outline and prioritize tasks for your job search journey</p>
                </div>
                <Button onClick={() => setShowAddActionItem(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-2">
                {actionItems.length === 0 ? (
                  <div className="empty-state py-6">
                    <CheckCircle className="empty-state-icon" />
                    <h3 className="font-semibold mb-1">No action items yet</h3>
                    <p className="text-sm text-[var(--text-muted)]">Add tasks to keep track of your job search progress</p>
                  </div>
                ) : (
                  actionItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 surface-card-subtle rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          className="text-[var(--accent-blue)] hover:opacity-80 flex-shrink-0"
                          onClick={() => handleToggleActionItem(item.id, item.completed)}
                        >
                          {item.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                        </button>
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-[var(--text-subtle)]' : ''}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className={`badge text-xs ${
                          item.priority === 'high' ? 'badge-danger' :
                          item.priority === 'medium' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {item.priority}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditActionItem(item.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => handleDeleteActionItem(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddApplicationModal
        isOpen={showAddApplication}
        onClose={() => setShowAddApplication(false)}
        onSubmit={handleAddApplication}
      />
      <AddActionItemModal
        isOpen={showAddActionItem}
        onClose={() => setShowAddActionItem(false)}
        onSubmit={handleAddActionItem}
      />
      <EditApplicationModal
        isOpen={!!editingApplication}
        onClose={() => setEditingApplication(null)}
        onSubmit={handleUpdateApplication}
        application={applications.find(app => app.id === editingApplication)}
      />
      <EditActionItemModal
        isOpen={!!editingActionItem}
        onClose={() => setEditingActionItem(null)}
        onSubmit={handleUpdateActionItem}
        actionItem={actionItems.find(item => item.id === editingActionItem)}
      />
    </motion.div>
  );
} 