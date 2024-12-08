'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, Users, Plus, X, Globe } from 'lucide-react';

type Language = 'en' | 'ar';
type Stage = 'parent' | 'children';

interface ChildData {
  name: string;
  id?: string;
}

const translations = {
  en: {
    stages: {
      parent: "Parent Registration",
      children: "Children Information"
    },
    email: "Email",
    password: "Password",
    parentName: "Parent Full Name",
    childName: "Child Full Name",
    phoneNumber: "Phone Number",
    next: "Next Step",
    back: "Back",
    signUp: "Complete Registration",
    addChild: "Add Another Child",
    removeChild: "Remove Child",
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log In",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "********",
    parentNamePlaceholder: "Parent's Full Name",
    childNamePlaceholder: "Child's Full Name",
    phoneNumberPlaceholder: "+1234567890",
    switchLanguage: "العربية"
  },
  ar: {
    stages: {
      parent: "تسجيل ولي الأمر",
      children: "معلومات الأطفال"
    },
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    parentName: "اسم ولي الأمر الكامل",
    childName: "اسم الطفل الكامل",
    phoneNumber: "رقم الهاتف",
    next: "الخطوة التالية",
    back: "رجوع",
    signUp: "إكمال التسجيل",
    addChild: "إضافة طفل آخر",
    removeChild: "إزالة الطفل",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    logIn: "تسجيل الدخول",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "********",
    parentNamePlaceholder: "اسم ولي الأمر الكامل",
    childNamePlaceholder: "اسم الطفل الكامل",
    phoneNumberPlaceholder: "+1234567890",
    switchLanguage: "English"
  }
};

export default function SignupPage() {
  const [stage, setStage] = useState<Stage>('parent');
  const [parentData, setParentData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: ''
  });
  const [children, setChildren] = useState<ChildData[]>([{ name: '' }]);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const router = useRouter();

  const t = translations[language];

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleChildChange = (index: number, value: string) => {
    const newChildren = [...children];
    newChildren[index].name = value;
    setChildren(newChildren);
  };

  const addChild = () => {
    setChildren(prev => [...prev, { name: '' }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    if (!parentData.email || !parentData.password || !parentData.name || !parentData.phoneNumber) {
      setError('Please fill in all parent information');
      return;
    }
    setError('');
    setStage('children');
  };

  const handleBack = () => {
    setStage('parent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (children.some(child => !child.name)) {
      setError('Please fill in all children names');
      return;
    }

    try {
      const parentRes = await fetch('/api/auth/signup/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentData)
      });

      if (!parentRes.ok) {
        const data = await parentRes.json();
        setError(data.error || 'Failed to create parent account');
        return;
      }

      const { id: parentId } = await parentRes.json();

      const childrenRes = await fetch('/api/auth/signup/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          children: children
        })
      });

      if (childrenRes.ok) {
        router.push('/login');
      } else {
        const data = await childrenRes.json();
        setError(data.error || 'Failed to register children');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const InputField = ({ 
    icon: Icon, 
    name, 
    type, 
    label, 
    placeholder,
    value,
    onChange
  }: { 
    icon: any, 
    name: string, 
    type: string, 
    label: string, 
    placeholder: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 font-comic">
        {label}
      </label>
      <div className="relative">
        <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
          <Icon className="h-5 w-5 text-pink-400" />
        </div>
        <input 
          type={type}
          name={name}
          className={`block w-full ${language === 'ar' ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 bg-blue-50 border-2 border-blue-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 hover:bg-blue-100/80 font-comic`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>
    </div>
  );

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

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
        </div>

        {/* Decorative Emojis */}
        <div className="absolute top-20 left-10 transform -rotate-12 animate-float">
          <div className="text-6xl">✏️</div>
        </div>
        <div className="absolute top-40 right-10 transform rotate-12 animate-float animation-delay-2000">
          <div className="text-6xl">📚</div>
        </div>
        <div className="absolute bottom-20 left-10 transform rotate-12 animate-float animation-delay-4000">
          <div className="text-6xl">🎨</div>
        </div>
        <div className="absolute bottom-40 right-10 transform -rotate-12 animate-float animation-delay-6000">
          <div className="text-6xl">🌟</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-4xl font-bold mb-2 font-comic">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-pink-500">
                {t.stages[stage]}
              </span>
            </h1>
          </div>

          <div className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.1)] border-4 border-pink-200 animate-fade-up">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm animate-shake font-comic border-2 border-red-200 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={stage === 'parent' ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} 
                  className="space-y-6">
              
              {stage === 'parent' ? (
                <>
                  <InputField 
                    icon={Mail}
                    name="email"
                    type="email"
                    label={t.email}
                    placeholder={t.emailPlaceholder}
                    value={parentData.email}
                    onChange={handleParentChange}
                  />
                  
                  <InputField 
                    icon={Lock}
                    name="password"
                    type="password"
                    label={t.password}
                    placeholder={t.passwordPlaceholder}
                    value={parentData.password}
                    onChange={handleParentChange}
                  />

                  <InputField 
                    icon={User}
                    name="name"
                    type="text"
                    label={t.parentName}
                    placeholder={t.parentNamePlaceholder}
                    value={parentData.name}
                    onChange={handleParentChange}
                  />

                  <InputField 
                    icon={Phone}
                    name="phoneNumber"
                    type="tel"
                    label={t.phoneNumber}
                    placeholder={t.phoneNumberPlaceholder}
                    value={parentData.phoneNumber}
                    onChange={handleParentChange}
                  />

                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-pink-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center font-comic text-lg"
                  >
                    {t.next}
                  </button>
                </>
              ) : (
                <>
                  {children.map((child, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <InputField 
                          icon={Users}
                          name={`child-${index}`}
                          type="text"
                          label={`${t.childName} ${index + 1}`}
                          placeholder={t.childNamePlaceholder}
                          value={child.name}
                          onChange={(e) => handleChildChange(index, e.target.value)}
                        />
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(index)}
                            className="mt-8 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={addChild}
                      className="flex items-center gap-2 px-4 py-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-colors font-comic"
                    >
                      <Plus className="h-5 w-5" />
                      {t.addChild}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 font-comic"
                    >
                      {t.back}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-pink-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-pink-600 focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 transition-all duration-200 font-comic"
                    >
                      {t.signUp}
                    </button>
                  </div>
                </>
              )}
              </form>

<p className="text-center mt-6 font-comic text-gray-600">
  {t.alreadyHaveAccount}{' '}
  <Link 
    href="/login" 
    className="text-pink-500 hover:text-pink-600 transition-colors font-medium"
  >
    {t.logIn}
  </Link>
</p>
</div>
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
@keyframes float {
0%, 100% { transform: translateY(0) rotate(0); }
50% { transform: translateY(-20px) rotate(5deg); }
}
.animate-blob {
animation: blob 7s infinite;
}
.animate-float {
animation: float 6s ease-in-out infinite;
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