//DONE
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, Globe } from 'lucide-react';

type Language = 'en' | 'ar';

type TranslationType = {
  welcome: string;
  subtitle: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  loginButton: string;
  loading: string;
  switchToArabic: string;
  switchToEnglish: string;
};

type TranslationsType = {
  [key in Language]: TranslationType;
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const translations: TranslationsType = {
    en: {
      welcome: "Welcome to",
      subtitle: "Where learning meets fun! 🌈",
      email: "Email Address",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      loginButton: "Lets Go! 🚀",
      loading: "Please wait...",
      switchToArabic: "العربية",
      switchToEnglish: "English"
    },
    ar: {
      welcome: "مرحباً بكم في",
      subtitle: "حيث يلتقي التعلم بالمرح! 🌈",
      email: "البريد الإلكتروني",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      loginButton: "هيا بنا! 🚀",
      loading: "...يرجى الانتظار",
      switchToArabic: "العربية",
      switchToEnglish: "English"
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (res?.error) {
        setError(res.error);
        return;
      }

      if (res?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const t = translations[language];

  return (
    <main className="min-h-screen relative overflow-hidden bg-blue-50"> {/* Changed from orange-50 */}
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white transition-all duration-200 z-10 flex items-center gap-2"
      >
        <Globe className="h-5 w-5 text-pink-500" /> {/* Changed from gray-600 */}
        <span className="text-sm font-medium text-pink-500"> {/* Changed from gray-600 */}
          {language === 'en' ? translations.en.switchToArabic : translations.en.switchToEnglish}
        </span>
      </button>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          {/* Changed blob colors to pink and blue shades */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>
        
        {/* Keep decorative elements */}
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-4xl font-bold mb-2 font-comic">
              {t.welcome}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-500">
                SunWay
              </span>
            </h1>
            <p className="text-gray-600 font-comic">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} 
            className={`bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-pink-200 space-y-6 animate-fade-up hover:shadow-[0_0_25px_rgba(0,0,0,0.15)] transition-all duration-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-comic">
                {t.email}
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <Mail className="h-5 w-5 text-blue-400 group-hover:text-pink-500 transition-colors duration-200" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full ${language === 'ar' ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} py-3 bg-blue-50 border-2 border-blue-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:bg-blue-100/80 font-comic`}
                  required
                  placeholder={t.emailPlaceholder}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-comic">
                {t.password}
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <Lock className="h-5 w-5 text-blue-400 group-hover:text-pink-500 transition-colors duration-200" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full ${language === 'ar' ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} py-3 bg-blue-50 border-2 border-blue-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:bg-blue-100/80 font-comic`}
                  required
                  placeholder={t.passwordPlaceholder}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${language === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-400 hover:text-pink-500 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-400 hover:text-pink-500 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl text-sm animate-shake font-comic border-2 border-pink-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white p-3 rounded-2xl hover:from-blue-600 hover:to-pink-600 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center font-comic text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  {t.loading}
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Keep all animations and styles */}
    </main>
  )};