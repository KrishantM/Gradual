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
  ArrowUpDown
} from 'lucide-react';

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
    
    if (!confirm('Are you sure you want to delete this application?')) return;
    
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
    
    if (!confirm('Are you sure you want to delete this action item?')) return;
    
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
      case 'to_apply': return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      case 'applied': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'interviewing': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'offered': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Job Application <span className="text-blue-400">Tracker</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Track your job applications and manage your career search progress
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{applications.length}</div>
                <div className="text-gray-400 text-sm">Total Applications</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {applications.filter(app => app.stage === 'applied').length}
                </div>
                <div className="text-gray-400 text-sm">Applied</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {applications.filter(app => app.stage === 'interviewing').length}
                </div>
                <div className="text-gray-400 text-sm">Interviewing</div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {applications.filter(app => app.stage === 'offered').length}
                </div>
                <div className="text-gray-400 text-sm">Offers</div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
                style={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="all" style={{ backgroundColor: '#1e293b', color: 'white' }}>All Stages</option>
                <option value="to_apply" style={{ backgroundColor: '#1e293b', color: 'white' }}>To Apply</option>
                <option value="applied" style={{ backgroundColor: '#1e293b', color: 'white' }}>Applied</option>
                <option value="interviewing" style={{ backgroundColor: '#1e293b', color: 'white' }}>Interviewing</option>
                <option value="offered" style={{ backgroundColor: '#1e293b', color: 'white' }}>Offered</option>
                <option value="rejected" style={{ backgroundColor: '#1e293b', color: 'white' }}>Rejected</option>
              </select>
              <Button
                onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {viewMode === 'card' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setShowAddApplication(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </div>
          </div>

          {/* Applications */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">{application.position}</h3>
                        <p className="text-gray-300 flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          {application.company}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(application.stage)}`}>
                          {getStageLabel(application.stage)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {application.location && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="h-3 w-3 mr-2" />
                          {application.location}
                        </div>
                      )}
                      {application.salary && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <DollarSign className="h-3 w-3 mr-2" />
                          {application.salary}
                        </div>
                      )}
                      <div className="flex items-center text-gray-400 text-sm">
                        <FileText className="h-3 w-3 mr-2" />
                        {application.resumeUsed}
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="h-3 w-3 mr-2" />
                        Applied: {formatDate(application.applyDate)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => window.open(application.jobUrl, '_blank')}
                      >
                        <Link className="h-3 w-3 mr-1" />
                        View Job
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => handleEditApplication(application.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteApplication(application.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-12">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-300 font-medium">Stage</th>
                        <th className="text-left py-3 text-gray-300 font-medium">Company</th>
                        <th className="text-left py-3 text-gray-300 font-medium">Position</th>
                        <th className="text-left py-3 text-gray-300 font-medium">Location</th>
                        <th className="text-left py-3 text-gray-300 font-medium">Applied</th>
                        <th className="text-left py-3 text-gray-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="border-b border-white/5">
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStageColor(application.stage)}`}>
                              {getStageLabel(application.stage)}
                            </span>
                          </td>
                          <td className="py-3 text-white">{application.company}</td>
                          <td className="py-3 text-white">{application.position}</td>
                          <td className="py-3 text-gray-300">{application.location || '-'}</td>
                          <td className="py-3 text-gray-300">{formatDate(application.applyDate)}</td>
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => handleEditApplication(application.id)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => window.open(application.jobUrl, '_blank')}
                              >
                                <Link className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteApplication(application.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Action Items</h2>
                  <p className="text-gray-300">Outline and prioritize tasks for your job search journey</p>
                </div>
                <Button
                  onClick={() => setShowAddActionItem(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                    <button 
                      className="text-blue-400 hover:text-blue-300"
                      onClick={() => handleToggleActionItem(item.id, item.completed)}
                    >
                      {item.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {item.title}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {item.priority}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => handleEditActionItem(item.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-red-400"
                        onClick={() => handleDeleteActionItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
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
    </div>
  );
} 