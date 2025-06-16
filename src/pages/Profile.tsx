
import React, { useState } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import AvatarUpload from "@/components/AvatarUpload";
import { User, Settings, History, Save, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { analyses, loading: analysesLoading, deleteAnalysis } = useAnalysisHistory();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDeleteAnalysis = async (id: string) => {
    await deleteAnalysis(id);
  };

  if (!user) {
    return <div className="p-8 text-center">Not logged in.</div>;
  }

  if (profileLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile & Settings</h1>
          <p className="text-lg text-slate-600">Manage your account and view your analysis history</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Analysis History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <AvatarUpload
                    currentAvatarUrl={profile?.avatar_url}
                    onUpload={uploadAvatar}
                    userName={profile?.full_name || profile?.email}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Personal Details</h3>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Account Status</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Active</Badge>
                    <span className="text-sm text-slate-600">
                      Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Dark Mode</h4>
                      <p className="text-sm text-slate-600">Toggle dark mode interface</p>
                    </div>
                    <Switch disabled />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-600">Receive analysis completion notifications</p>
                    </div>
                    <Switch disabled />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-save Results</h4>
                      <p className="text-sm text-slate-600">Automatically save analysis results to history</p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-4">
                    Note: Advanced settings are coming soon in future updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <p className="text-sm text-slate-600">
                  View and manage your past workflow runs and results
                </p>
              </CardHeader>
              <CardContent>
                {analysesLoading ? (
                  <div className="text-center py-8">Loading analysis history...</div>
                ) : analyses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No analysis history found. Run a workflow to see results here.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workflow Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="font-medium">
                            {analysis.workflow_name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={analysis.status === 'completed' ? 'default' : 
                                     analysis.status === 'failed' ? 'destructive' : 'secondary'}
                            >
                              {analysis.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {analysis.summary ? (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {analysis.summary.peaksDetected || 0} peaks
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {analysis.summary.compoundsIdentified || 0} compounds
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-slate-400">No summary</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this analysis? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAnalysis(analysis.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
