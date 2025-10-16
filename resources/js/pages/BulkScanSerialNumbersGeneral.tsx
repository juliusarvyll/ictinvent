import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, X, Check, Loader2, ArrowLeft, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedSerial {
  serial_number: string;
  asset_id?: string;
  asset_name?: string;
  condition: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function BulkScanSerialNumbersGeneral() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedSerials, setScannedSerials] = useState<ScannedSerial[]>([]);

  // Fetch assets for assignment
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
  });

  const createSerialMutation = useMutation({
    mutationFn: (data: any) => api.post('/asset-serial-numbers', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset-serial-numbers'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      setScannedSerials(prev => 
        prev.map(s => 
          s.serial_number === variables.serial_number 
            ? { ...s, status: 'success' }
            : s
        )
      );
    },
    onError: (error: any, variables) => {
      const errorMessage = error.response?.data?.message || 'Failed to add serial number';
      setScannedSerials(prev => 
        prev.map(s => 
          s.serial_number === variables.serial_number 
            ? { ...s, status: 'error', error: errorMessage }
            : s
        )
      );
    },
  });

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      console.log('Camera access granted, stream:', mediaStream);
      setStream(mediaStream);
      setIsCameraActive(true);
      
      // Wait a bit for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = mediaStream;
          
          // Wait for video to be ready and play
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing...');
            videoRef.current?.play().catch(err => {
              console.error('Error playing video:', err);
              toast.error('Failed to play video stream');
            });
          };
        } else {
          console.error('Video ref is null after state update');
        }
      }, 100);
      
      toast.success('Camera started successfully');
    } catch (error: any) {
      toast.error('Failed to access camera. Please grant camera permissions.');
      console.error('Camera error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Call backend API to scan barcode
      const response = await api.post('/barcode/scan', {
        image: imageData
      });

      console.log('Scan response:', response.data);

      if (!response.data.success) {
        const errorMsg = response.data.message || response.data.error || 'No barcode detected. Please try again.';
        console.error('Scan failed:', response.data);
        toast.error(errorMsg);
        return;
      }

      const serialNumber = response.data.serial_number;

      // Check if already scanned
      if (scannedSerials.some(s => s.serial_number === serialNumber)) {
        toast.warning('This serial number has already been scanned');
        return;
      }

      // Add to scanned list (without saving to DB yet)
      const newSerial: ScannedSerial = {
        serial_number: serialNumber,
        condition: 'good',
        status: 'pending',
      };

      setScannedSerials(prev => [newSerial, ...prev]);
      toast.success(`Scanned: ${serialNumber}`);

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSerialAsset = (serialNumber: string, assetId: string) => {
    const asset = assets?.data?.find((a: any) => a.id.toString() === assetId);
    setScannedSerials(prev =>
      prev.map(s =>
        s.serial_number === serialNumber
          ? { ...s, asset_id: assetId, asset_name: asset?.name }
          : s
      )
    );
  };

  const updateSerialCondition = (serialNumber: string, condition: string) => {
    setScannedSerials(prev =>
      prev.map(s =>
        s.serial_number === serialNumber
          ? { ...s, condition }
          : s
      )
    );
  };

  const removeScanned = (serialNumber: string) => {
    setScannedSerials(prev => prev.filter(s => s.serial_number !== serialNumber));
  };

  const saveAllSerials = async () => {
    const unsavedSerials = scannedSerials.filter(s => s.status === 'pending' && s.asset_id);
    
    if (unsavedSerials.length === 0) {
      toast.warning('No serial numbers to save. Please assign assets first.');
      return;
    }

    // Check quantity limits for each asset
    const assetCounts: { [key: string]: number } = {};
    for (const serial of unsavedSerials) {
      if (serial.asset_id) {
        assetCounts[serial.asset_id] = (assetCounts[serial.asset_id] || 0) + 1;
      }
    }

    // Validate against asset quantities
    for (const [assetId, count] of Object.entries(assetCounts)) {
      const asset = assets?.data?.find((a: any) => a.id.toString() === assetId);
      if (asset) {
        // Fetch current serial count for this asset
        try {
          const response = await api.get(`/asset-serial-numbers?asset_id=${assetId}`);
          const currentCount = response.data.data?.length || 0;
          const totalCount = currentCount + count;
          
          if (totalCount > asset.quantity) {
            toast.error(`Cannot save. Asset "${asset.name}" has quantity ${asset.quantity} but would have ${totalCount} serial numbers (${currentCount} existing + ${count} new).`);
            return;
          }
        } catch (error) {
          console.error('Error checking asset capacity:', error);
        }
      }
    }

    toast.info(`Saving ${unsavedSerials.length} serial numbers...`);

    for (const serial of unsavedSerials) {
      createSerialMutation.mutate({
        asset_id: serial.asset_id,
        serial_number: serial.serial_number,
        condition: serial.condition,
        assigned_to: '',
        notes: 'Added via bulk scan',
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const pendingCount = scannedSerials.filter(s => s.status === 'pending').length;
  const successCount = scannedSerials.filter(s => s.status === 'success').length;
  const unassignedCount = scannedSerials.filter(s => s.status === 'pending' && !s.asset_id).length;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate('/serial-numbers')} className="-ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Serial Numbers
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Bulk Scan Serial Numbers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Scan barcodes first, then assign to assets
          </p>
        </div>
        {scannedSerials.length > 0 && (
          <Button 
            onClick={saveAllSerials} 
            disabled={unassignedCount > 0 || createSerialMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All ({pendingCount} pending)
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Scanned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold">{scannedSerials.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{unassignedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{successCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Camera Section */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Scanner</CardTitle>
            <CardDescription>
              Point camera at barcode and click "Capture & Scan"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isCameraActive ? 'block' : 'none' }}
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Camera not active</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Debug info */}
            <div className="text-xs text-muted-foreground">
              Status: {isCameraActive ? '✅ Active' : '❌ Inactive'} | 
              Stream: {stream ? '✅ Connected' : '❌ No stream'} | 
              Video Ref: {videoRef.current ? '✅ Ready' : '❌ Not ready'}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!isCameraActive ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={captureAndScan}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture & Scan
                      </>
                    )}
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scanned Results */}
        <Card>
          <CardHeader>
            <CardTitle>Scanned Serial Numbers ({scannedSerials.length})</CardTitle>
            <CardDescription>Assign assets to scanned serial numbers</CardDescription>
          </CardHeader>
          <CardContent>
            {scannedSerials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No serial numbers scanned yet</p>
                <p className="text-sm mt-2">Start scanning to add serial numbers</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {scannedSerials.map((serial, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-medium">{serial.serial_number}</p>
                      <div className="flex items-center gap-2">
                        {serial.status === 'pending' && !serial.asset_id && (
                          <Badge variant="secondary">Unassigned</Badge>
                        )}
                        {serial.status === 'pending' && serial.asset_id && (
                          <Badge variant="outline">Ready</Badge>
                        )}
                        {serial.status === 'success' && (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Saved
                          </Badge>
                        )}
                        {serial.status === 'error' && (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScanned(serial.serial_number)}
                          disabled={serial.status === 'success'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {serial.error && (
                      <p className="text-xs text-red-500">{serial.error}</p>
                    )}

                    {serial.status !== 'success' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Asset</Label>
                          <Select
                            value={serial.asset_id || ''}
                            onValueChange={(value) => updateSerialAsset(serial.serial_number, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                              {assets?.data?.map((asset: any) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Condition</Label>
                          <Select
                            value={serial.condition}
                            onValueChange={(value) => updateSerialCondition(serial.serial_number, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {serial.asset_name && (
                      <p className="text-xs text-muted-foreground">
                        Asset: {serial.asset_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
