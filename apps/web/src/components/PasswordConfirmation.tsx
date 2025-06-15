import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordConfirmationProps {
    onSubmit: (password: string) => void;
    onBack: () => void;
}

const PasswordConfirmation = ({ onSubmit, onBack }: PasswordConfirmationProps) => {
    const [password, setPassword] = useState('');
    const [isInvalid, setIsInvalid] = useState(false);
    const [attempted, setAttempted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAttempted(true);

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const isPasswordValid = passwordRegex.test(password);
        setIsInvalid(!isPasswordValid);

        if (isPasswordValid) {
            onSubmit(password);
        }
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
                        Password Reset
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Write the new password you want to use and we'll update your account.
                    </p>
                </div>
                
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={20} className="text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your new password..."
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (attempted) {
                                        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
                                        setIsInvalid(!passwordRegex.test(e.target.value));
                                    }
                                }}
                                className={`appearance-none block w-full px-3 py-3 pl-10 pr-10 border ${
                                    isInvalid && attempted ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                } rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isInvalid && attempted ? 'focus:ring-red-500' : 'focus:ring-amber-700'
                                }`}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="text-gray-500 hover:text-amber-800 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Password requirements hint */}
                        <p className="mt-2 text-xs text-gray-500">
                            Password must be at least 8 characters and include both letters and numbers.
                        </p>
                    </div>
                    
                    {isInvalid && attempted && (
                        <div className="rounded-full bg-red-100 py-3 px-4 flex items-center justify-center text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" x2="12" y1="8" y2="12"/>
                                <line x1="12" x2="12.01" y1="16" y2="16"/>
                            </svg>
                            <span>Password must be at least 8 characters with letters and numbers</span>
                        </div>
                    )}
                    
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-white bg-amber-900 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordConfirmation;