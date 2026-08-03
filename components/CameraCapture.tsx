'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle2, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface CameraCaptureProps {
  onPhotoSelected: (url: string) => void;
  existingUrl?: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function CameraCapture({ onPhotoSelected, existingUrl, showToast }: CameraCaptureProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(existingUrl || null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload a photo instead.');
    }
  }, [facingMode]);

  useEffect(() => {
    let isMounted = true;

    if (activeTab === 'camera' && !capturedImage) {
      navigator.mediaDevices?.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      }).then((mediaStream) => {
        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraError(null);
      }).catch((err) => {
        if (isMounted) {
          console.warn('Camera access error:', err);
          setCameraError('Camera access unavailable. You can upload a photo instead.');
        }
      });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeTab, capturedImage, facingMode]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;

    const startX = ((video.videoWidth || size) - size) / 2;
    const startY = ((video.videoHeight || size) - size) / 2;

    context.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    // Convert dataUrl to blob & upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `passport-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await uploadToStorage(file);
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      if (showToast) showToast('Please select a JPG, PNG, or WEBP image.', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCapturedImage(previewUrl);
    await uploadToStorage(file);
  };

  const uploadToStorage = async (file: File) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `passport-${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from('profile-pictures').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadErr) {
        throw uploadErr;
      }

      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      onPhotoSelected(publicUrl);
      if (showToast) showToast('Profile photo saved successfully!', 'success');
    } catch (err: any) {
      console.error('Storage upload error:', err);
      if (showToast) showToast(`Photo upload failed: ${err.message || 'Error uploading image'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121917] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
      {/* Tab Switcher */}
      <div className="flex bg-[#1a2321] p-1.5 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => {
            setActiveTab('camera');
            setCapturedImage(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'camera' ? 'bg-[#dbf0de] text-[#1a2321] shadow-md font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" /> Option A: Live Camera
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            stopCamera();
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'upload' ? 'bg-[#dbf0de] text-[#1a2321] shadow-md font-bold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" /> Option B: File Upload
        </button>
      </div>

      {/* Option A: Live Camera View */}
      {activeTab === 'camera' && (
        <div className="flex flex-col items-center space-y-4">
          {capturedImage ? (
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#dbf0de] shadow-2xl relative bg-black">
                <img src={capturedImage} alt="Passport Preview" className="w-full h-full object-cover" />
                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white">
                    Uploading...
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={retakePhoto}
                  disabled={loading}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
                >
                  <RefreshCw className="w-4 h-4" /> Retake Photo
                </button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center bg-rose-950/30 border border-rose-500/30 rounded-2xl text-rose-200 text-xs sm:text-sm space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 rounded-xl font-semibold transition-colors"
              >
                Switch to File Upload
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white/20 bg-black shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-[#dbf0de] text-[#1a2321] rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                >
                  <Camera className="w-4 h-4" /> Capture Passport Photo
                </button>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                  title="Switch Camera (Front / Back)"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Option B: File Upload View */}
      {activeTab === 'upload' && (
        <div className="flex flex-col items-center space-y-4">
          <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 hover:border-[#dbf0de] rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all text-center group">
            {capturedImage ? (
              <div className="flex flex-col items-center space-y-3">
                <img src={capturedImage} alt="Selected Passport" className="w-32 h-32 rounded-full object-cover border-2 border-[#dbf0de]" />
                <span className="text-xs text-[#dbf0de] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Photo Selected (Click to Change)
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-4 bg-white/10 rounded-full text-[#dbf0de] group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold text-gray-200">Click to upload Passport Photograph</span>
                <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
