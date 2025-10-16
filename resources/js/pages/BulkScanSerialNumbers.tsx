import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Check, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedSerial {
  serial_number: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function BulkScanSerialNumbers() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedSerials, setScannedSerials] = useState<ScannedSerial[]>([]);

  // Fetch asset details
  const { data: asset } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const response = await api.get(`/assets/${assetId}`);
      return response.data.data;
    },
  });

  // Fetch existing serial numbers
  const { data: existingSerials } = useQuery({
    queryKey: ['asset-serial-numbers', assetId],
    queryFn: async () => {
      const response = await api.get(`/asset-serial-numbers?asset_id=${assetId}`);
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

      if (!response.data.success) {
        toast.error(response.data.message || 'No barcode detected. Please try again.');
        return;
      }

      const serialNumber = response.data.serial_number;

      // Check if already scanned
      if (scannedSerials.some(s => s.serial_number === serialNumber)) {
        toast.warning('This serial number has already been scanned');
        return;
      }

      // Check if quantity limit will be exceeded
      const currentCount = existingSerials?.data?.length || 0;
      const scannedCount = scannedSerials.filter(s => s.status !== 'error').length;
      const totalCount = currentCount + scannedCount + 1;

      if (asset && totalCount > asset.quantity) {
        toast.error(`Cannot add more serial numbers. Asset quantity is ${asset.quantity}, you already have ${currentCount} registered and ${scannedCount} scanned.`);
        return;
      }

      // Add to scanned list
      const newSerial: ScannedSerial = {
        serial_number: serialNumber,
        status: 'pending',
      };

      setScannedSerials(prev => [newSerial, ...prev]);
      toast.success(`Scanned: ${serialNumber}`);
      
      createSerialMutation.mutate({
        asset_id: assetId,
        serial_number: serialNumber,
        condition: 'good',
        assigned_to: '',
        notes: 'Added via bulk scan',
      });

    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeScanned = (serialNumber: string) => {
    setScannedSerials(prev => prev.filter(s => s.serial_number !== serialNumber));
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => navigate('/assets')} className="self-start -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Bulk S/N Assignment</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {asset?.name} - Scan barcodes to add serial numbers
        </p>
      </div>

      {/* Asset Info */}
      {asset && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Total Quantity</Label>
                <p className="text-xl sm:text-2xl font-bold">{asset.quantity}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Registered S/N</Label>
                <p className="text-xl sm:text-2xl font-bold">{existingSerials?.data?.length || 0}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Remaining</Label>
                <p className={`text-xl sm:text-2xl font-bold ${
                  (asset.quantity - (existingSerials?.data?.length || 0)) <= 0 
                    ? 'text-red-600' 
                    : (asset.quantity - (existingSerials?.data?.length || 0)) <= 5 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                }`}>
                  {asset.quantity - (existingSerials?.data?.length || 0)}
                </p>
              </div>
            </div>
            {(asset.quantity - (existingSerials?.data?.length || 0)) <= 0 && (
              <div className="mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-800 font-medium">
                  ⚠️ Capacity reached! You cannot add more serial numbers. Please update the asset quantity or remove existing serial numbers.
                </p>
              </div>
            )}
            {(asset.quantity - (existingSerials?.data?.length || 0)) > 0 && 
             (asset.quantity - (existingSerials?.data?.length || 0)) <= 5 && (
              <div className="mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                  ⚠️ Only {asset.quantity - (existingSerials?.data?.length || 0)} slots remaining!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    disabled={isProcessing || (asset && (asset.quantity - (existingSerials?.data?.length || 0)) <= 0)}
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
            <CardDescription>Recently scanned barcodes</CardDescription>
          </CardHeader>
          <CardContent>
            {scannedSerials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No serial numbers scanned yet</p>
                <p className="text-sm mt-2">Start scanning to add serial numbers</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {scannedSerials.map((serial, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-mono font-medium">{serial.serial_number}</p>
                      {serial.error && (
                        <p className="text-xs text-red-500 mt-1">{serial.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {serial.status === 'pending' && (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                      )}
                      {serial.status === 'success' && (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Added
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
