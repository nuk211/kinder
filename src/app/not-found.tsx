// src/app/not-found.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    title: "عذراً الصفحة غير متوفرة",
    message: "يبدو اننا فقدنا هذه الصفحة في صندوق العابنا!",
    homeButton: "العودة الى الصفحة الرئيسية",
    switchLanguage: "العربية"
  },
  ar: {
    title: "عذراً! الصفحة غير موجودة",
    message: "يبدو أننا فقدنا هذه الصفحة في صندوق ألعابنا!",
    homeButton: "العودة إلى الصفحة الرئيسية",
    switchLanguage: "English"
  }
};

export default function NotFound() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="space-y-6 animate-bounce-slow">
          <div className="text-9xl">🎈</div>
          <h1 className="text-6xl font-bold font-comic bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-blue-500">
            404
          </h1>
          <h2 className="text-3xl font-bold font-comic text-gray-700">{t.title}</h2>
          <p className="text-xl text-gray-600 font-comic">{t.message}</p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-blue-600 transition-all duration-200 font-comic transform hover:scale-105"
        >
          <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
          {t.homeButton}
        </Link>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
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