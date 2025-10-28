import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Key, CheckCircle, XCircle, Loader2, Lock, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface SystemSetting {
    id: number;
    key: string;
    value: string;
    type: string;
    description: string | null;
    is_encrypted: boolean;
    updated_at: string;
}

export default function SystemSettings() {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SystemSetting | null>(null);
    const [formData, setFormData] = useState({ key: '', value: '', description: '' });
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testApiKey, setTestApiKey] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: async () => {
            const response = await api.get('/system-settings');
            return response.data as SystemSetting[];
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, data }: { key: string; data: any }) => 
            api.put(`/system-settings/${key}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            toast.success('Setting updated successfully');
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update setting');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (key: string) => api.delete(`/system-settings/${key}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            toast.success('Setting deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete setting');
        },
    });

    const resetForm = () => {
        setFormData({ key: '', value: '', description: '' });
        setEditing(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const key = editing ? editing.key : formData.key;
        updateMutation.mutate({
            key,
            data: {
                value: formData.value,
                description: formData.description,
            },
        });
    };

    const handleEdit = (setting: SystemSetting) => {
        setEditing(setting);
        setFormData({
            key: setting.key,
            value: '', // Don't show encrypted values
            description: setting.description || '',
        });
        setOpen(true);
    };

    const handleDelete = (key: string) => {
        if (confirm('Are you sure you want to delete this setting?')) {
            deleteMutation.mutate(key);
        }
    };

    const handleTestGroqApi = async () => {
        if (!testApiKey) {
            toast.error('Please enter an API key to test');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const response = await api.post('/system-settings/test-groq', {
                api_key: testApiKey,
            });
            setTestResult({
                success: response.data.success,
                message: response.data.message,
            });
            if (response.data.success) {
                toast.success('API key is valid!');
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.response?.data?.error || error.response?.data?.message || 'Connection test failed',
            });
            toast.error('API key test failed');
        } finally {
            setTesting(false);
        }
    };

    const handleQuickUpdateGroq = () => {
        setEditing(null);
        setFormData({
            key: 'groq_api_key',
            value: '',
            description: 'Groq API key for barcode scanning and AI features',
        });
        setOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">
                        Manage system-wide configuration and API keys
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setTestDialogOpen(true)}
                        variant="outline"
                    >
                        <Key className="mr-2 h-4 w-4" />
                        Test Groq API
                    </Button>
                    <Button onClick={handleQuickUpdateGroq}>
                        <Plus className="mr-2 h-4 w-4" />
                        Update Groq API Key
                    </Button>
                </div>
            </div>

            {/* Groq API Key Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Groq API Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the Groq API key for AI-powered barcode scanning
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {settings?.find(s => s.key === 'groq_api_key') ? (
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">API Key Status</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="gap-1">
                                        <Lock className="h-3 w-3" />
                                        Configured (Encrypted)
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Last updated: {new Date(settings.find(s => s.key === 'groq_api_key')!.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleEdit(settings.find(s => s.key === 'groq_api_key')!)}
                                variant="outline"
                                size="sm"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Update Key
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">No API key configured</p>
                                <p className="text-xs text-muted-foreground">
                                    Add a Groq API key to enable barcode scanning features
                                </p>
                            </div>
                            <Button onClick={handleQuickUpdateGroq} size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add API Key
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All Settings Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        All System Settings
                    </CardTitle>
                    <CardDescription>
                        View and manage all system configuration settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : settings && settings.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Security</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {settings.map((setting) => (
                                    <TableRow key={setting.id}>
                                        <TableCell className="font-mono text-sm">
                                            {setting.key}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {setting.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{setting.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {setting.is_encrypted ? (
                                                <Badge variant="outline" className="gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    Encrypted
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Plain</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(setting.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(setting)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(setting.key)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No settings configured yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Update/Create Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Update Setting' : 'Add Setting'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing 
                                ? `Update the value for ${formData.key}`
                                : 'Add a new system setting'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!editing && (
                            <div className="space-y-2">
                                <Label htmlFor="key">Setting Key</Label>
                                <Input
                                    id="key"
                                    value={formData.key}
                                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                    placeholder="e.g., groq_api_key"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="value">Value</Label>
                            <Input
                                id="value"
                                type={formData.key.includes('key') || formData.key.includes('secret') ? 'password' : 'text'}
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="Enter value"
                                required
                            />
                            {editing && editing.is_encrypted && (
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to keep the current value
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this setting"
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Test Groq API Dialog */}
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Test Groq API Connection</DialogTitle>
                        <DialogDescription>
                            Test an API key before saving it to ensure it works correctly
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="test-api-key">API Key</Label>
                            <Input
                                id="test-api-key"
                                type="password"
                                value={testApiKey}
                                onChange={(e) => setTestApiKey(e.target.value)}
                                placeholder="Enter Groq API key to test"
                            />
                        </div>
                        {testResult && (
                            <div className={`flex items-start gap-2 rounded-lg border p-3 ${
                                testResult.success 
                                    ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200' 
                                    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
                            }`}>
                                {testResult.success ? (
                                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-5 w-5 flex-shrink-0" />
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                                    </p>
                                    <p className="text-xs">{testResult.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTestDialogOpen(false);
                                setTestApiKey('');
                                setTestResult(null);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleTestGroqApi}
                            disabled={testing || !testApiKey}
                        >
                            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Test Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
