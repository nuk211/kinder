//DONE
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Scan, Globe } from 'lucide-react';

interface ScanResult {
  name: string;
  status: 'CHECK_IN' | 'PICK_UP';
  message: string;
  timestamp: string;
}

interface ScanStatus {
  success?: boolean;
  message?: string;
  children?: ScanResult[];
  loading?: boolean;
}

type Language = 'en' | 'ar';

const translations = {
  en: {
    welcome: "Welcome Back!",
    subtitle: "Let's scan your special code! 🎯",
    loadingMessage: "Reading your magic code... ✨",
    success: "🎉 Yay! Success!",
    error: "❌ Oops!",
    scannerGuide: "Position your special code in the magic box! ✨",
    redirecting: "Going back home in",
    seconds: "seconds!",
    checkInMessage: "checked in successfully",
    pickUpMessage: "pickup request sent successfully",
    processedMessage: "processed successfully",
    switchLanguage: "العربية"
  },
  ar: {
    welcome: "!مرحباً بك",
    subtitle: "!دعنا نقرأ رمزك الخاص 🎯",
    loadingMessage: "...جاري قراءة الرمز ✨",
    success: "!نجاح 🎉",
    error: "!عذراً ❌",
    scannerGuide: "!ضع الرمز الخاص بك في المربع السحري ✨",
    redirecting: "العودة إلى الصفحة الرئيسية خلال",
    seconds: "!ثوان",
    checkInMessage: "تم تسجيل الحضور بنجاح",
    pickUpMessage: "تم إرسال طلب الاستلام بنجاح",
    processedMessage: "تمت المعالجة بنجاح",
    switchLanguage: "English"
  }
};

export default function ParentPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [scanStatus, setScanStatus] = useState<ScanStatus>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  const getActionMessage = (status: string) => {
    switch (status) {
      case 'CHECK_IN':
        return t.checkInMessage;
      case 'PICK_UP':
        return t.pickUpMessage;
      default:
        return t.processedMessage;
    }
  };

  const handleScan = async (result: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setScanStatus({ loading: true });

      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: result }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate QR code');
      }

      setScanStatus({
        success: true,
        message: data.message,
        children: data.data?.children.map((child: any) => ({
          name: child.name,
          status: child.status,
          message: child.message,
          timestamp: child.timestamp
        })),
        loading: false
      });

    } catch (error) {
      console.error('Scan processing error:', error);
      setScanStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process QR code',
        loading: false
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scanStatus.success) {
      setCountdown(5);
    }
  }, [scanStatus.success]);

  useEffect(() => {
    if (countdown === 5 && scanStatus.success) {
      const intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) {
            return prev - 1;
          } else {
            clearInterval(intervalId);
            return null;
          }
        });
      }, 1000);

      const timeoutId = setTimeout(() => {
        router.push('/');
      }, 5000);

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [countdown, scanStatus.success, router]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-blue-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200 z-10 flex items-center gap-2 shadow-md`}
      >
        <Globe className="h-5 w-5 text-pink-500" />
        <span className="text-sm font-medium text-pink-500">
          {t.switchLanguage}
        </span>
      </button>

      {/* Background elements remain the same */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 transform -rotate-12">
          <div className="text-6xl">👋</div>
        </div>
        <div className="absolute top-20 right-20 transform rotate-12">
          <div className="text-6xl">📸</div>
        </div>
        <div className="absolute bottom-20 left-20 transform rotate-12">
          <div className="text-6xl">🌟</div>
        </div>
        <div className="absolute bottom-10 right-10 transform -rotate-12">
          <div className="text-6xl">✨</div>
        </div>
      </div>

      <div className="relative container mx-auto p-4 max-w-2xl">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-bold mb-2 font-comic">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-blue-500">
              {t.welcome}
            </span>
          </h1>
          <p className="text-gray-600 font-comic">{t.subtitle}</p>
        </div>
        
        {(scanStatus.message || scanStatus.loading) && (
          <Alert 
            variant={scanStatus.success ? "default" : "destructive"} 
            className="mb-6 bg-white/90 backdrop-blur-sm border-4 border-pink-200 rounded-2xl animate-fade-up"
          >
            {scanStatus.loading ? (
              <div className="flex items-center space-x-2 font-comic">
                <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                <span>{t.loadingMessage}</span>
              </div>
            ) : (
              <>
                <AlertTitle className="font-comic text-lg">
                  {scanStatus.success ? t.success : t.error}
                </AlertTitle>
                <AlertDescription className="font-comic">
                  {scanStatus.success ? (
                    <>
                      {scanStatus.children?.map((child, index) => (
                        <div key={index} className="mb-2 p-3 bg-blue-50/50 rounded-xl border-2 border-blue-200">
                          <p className="font-medium text-blue-800">
                            {child.name} {getActionMessage(child.status)} 🌟
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'الوقت:' : 'Time:'} {child.timestamp}
                          </p>
                        </div>
                      ))}
                      {countdown !== null && (
                        <p className="text-sm mt-4 text-gray-500 font-medium">
                          {t.redirecting} {countdown} {t.seconds} 🏃‍♂️
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{scanStatus.message}</p>
                  )}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-pink-200 animate-fade-up">
          <div className="relative">
            <QRScanner
              onScan={handleScan}
              onError={(error) => {
                setScanStatus({
                  success: false,
                  message: error.message
                });
              }}
            />
            <div className="absolute inset-0 border-8 border-dashed border-blue-300 rounded-lg pointer-events-none animate-pulse"></div>
          </div>
          <p className="text-center text-gray-600 mt-6 font-comic flex items-center justify-center gap-2">
            <Scan className="w-5 h-5 text-pink-500" />
            {t.scannerGuide}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        .font-comic {
          font-family: 'Comic Sans MS', cursive, sans-serif;
        }
      `}</style>
    </main>
  );
}