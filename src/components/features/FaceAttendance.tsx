import { useState, useRef, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveAttendanceRecord } from '@/lib/storage';
import type { AttendanceRecord } from '@/types';

interface Props {
  type: 'check-in' | 'check-out';
  onSuccess?: (record: AttendanceRecord) => void;
}

type ScanState = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed';

export default function FaceAttendance({ type, onSuccess }: Props) {
  const { t } = useApp();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<ScanState>('idle');
  const [message, setMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setState('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setState('failed');
      setMessage(t('تعذر الوصول للكاميرا', 'Camera access denied'));
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const captureAndVerify = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !user) return;
    setState('verifying');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedImage(imageData);
    stopCamera();

    // Simulate AI face verification (always succeeds for demo)
    setTimeout(() => {
      const now = new Date().toISOString();
      const supervisorId = user.id;

      const record = saveAttendanceRecord({
        supervisorId,
        date: new Date().toDateString(),
        checkInTime: type === 'check-in' ? now : undefined,
        checkOutTime: type === 'check-out' ? now : undefined,
        status: 'present',
        faceVerified: true,
        faceImage: imageData,
      });

      setState('success');
      setMessage(
        type === 'check-in'
          ? t('تم تسجيل الحضور بنجاح ✓', 'Check-in recorded successfully ✓')
          : t('تم تسجيل الانصراف بنجاح ✓', 'Check-out recorded successfully ✓')
      );
      onSuccess?.(record);
    }, 2000);
  }, [user, type, stopCamera, onSuccess, t]);

  function reset() {
    setState('idle');
    setMessage('');
    setCapturedImage(null);
    stopCamera();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0f2460]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Camera size={28} className="text-[#0f2460]" />
        </div>
        <h3 className="font-bold text-lg text-[#0f2460]">
          {type === 'check-in' ? t('تسجيل الحضور', 'Check In') : t('تسجيل الانصراف', 'Check Out')}
        </h3>
        <p className="text-slate-500 text-sm">
          {t('سيتم التحقق من هويتك عبر الكاميرا', 'Your identity will be verified via camera')}
        </p>
      </div>

      {/* Camera View */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video mb-4">
        {state === 'scanning' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Face overlay guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="face-scan-overlay w-40 h-48 border-4 border-[#d4a339] rounded-full opacity-80" />
            </div>
          </>
        )}

        {capturedImage && (
          <img src={capturedImage} alt="captured" className="w-full h-full object-cover" />
        )}

        {state === 'verifying' && (
          <div className="absolute inset-0 bg-[#0f2460]/70 flex flex-col items-center justify-center text-white">
            <Loader size={32} className="animate-spin mb-2" />
            <p className="text-sm">{t('جاري التحقق...', 'Verifying...')}</p>
          </div>
        )}

        {state === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Camera size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('اضغط لتشغيل الكاميرا', 'Tap to start camera')}</p>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
            <CheckCircle size={60} className="text-white" />
          </div>
        )}

        {state === 'failed' && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-sm text-center p-4">
            <div>
              <XCircle size={40} className="mx-auto mb-2" />
              <p>{message}</p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {message && state === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm text-center mb-4 font-medium">
          {message}
        </div>
      )}

      <div className="flex gap-3">
        {state === 'idle' && (
          <button onClick={startCamera} className="btn-primary flex-1">
            {t('تشغيل الكاميرا', 'Start Camera')}
          </button>
        )}
        {state === 'scanning' && (
          <button onClick={captureAndVerify} className="btn-gold flex-1 animate-pulse-gold">
            {t('التقاط والتحقق', 'Capture & Verify')}
          </button>
        )}
        {(state === 'success' || state === 'failed') && (
          <button onClick={reset} className="btn-outline flex-1 flex items-center justify-center gap-2">
            <RefreshCw size={16} />
            {t('إعادة المحاولة', 'Try Again')}
          </button>
        )}
        {state === 'scanning' && (
          <button onClick={reset} className="btn-outline px-4">
            {t('إلغاء', 'Cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
