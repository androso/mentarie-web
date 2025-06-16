import React, { useState } from 'react';
import { useRouter } from 'next/navigation';  // Use navigation instead of router

interface PasswordResetFormProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
}

const PasswordResetForm = ({ onSubmit, onBack }: PasswordResetFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    onSubmit(email);
    
    router.push('/PasswordConfirmation');
  };
  
  return (
    <div className="min-h-screen bg-[#f5f2ef] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-amber-900 text-amber-900 hover:bg-amber-50 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
          </button>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-800">
            Forgot Password
          </h2>
          <p className="mt-2 text-gray-600">
            Write the email you used to register and we'll send you a password reset link.
          </p>
        </div>
        
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <input
                id="email"
                name="email"
                type="text"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700"
              />
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-white bg-amber-900 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700"
            >
              Start Password Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetForm;