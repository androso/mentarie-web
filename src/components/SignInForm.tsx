"use client"

import { useState } from "react"
import { Eye, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"

// Define the props interface outside of the component
interface SignInFormProps {
  onSwitchForm?: () => void
}

export default function SignInForm({ onSwitchForm }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setIsEmailInvalid(value.length > 0 && !value.includes("@"))
  }

  const handleGoogleLoginSuccess = (response: CredentialResponse) => {
    const token = response.credential // Google token
    fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
    })
    .catch(console.error)
  }

  const handleGoogleLoginFailure = () => {
    console.error('Google Login Failed')
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f5f2ef]">
      <div className="w-full max-w-4xl flex shadow-2xl rounded-2xl overflow-hidden">
        {/* Left side with curved design and branding */}
        <div className="relative w-2/5 bg-[#222] hidden md:block">
          <div className="absolute inset-y-0 right-0">
            <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="h-full w-10 fill-[#f5f2ef]">
              <path d="M0,0 C50,125 30,250 50,375 C30,450 0,500 0,500 L100,500 L100,0 Z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center items-center h-full px-8">
            <div className="w-24 h-24 bg-[#e0e0e0] rounded-sm mb-8"></div>
            <h2 className="text-3xl text-white font-bold text-center">Welcome back</h2>
            <p className="text-gray-300 mt-4 text-center">Sign in to continue your journey with us.</p>
          </div>
        </div>

        {/* Right side with form */}
        <div className="w-full md:w-3/5 bg-[#f5f2ef] p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center md:hidden mb-8">
              <div className="w-16 h-16 bg-[#e0e0e0] rounded-sm"></div>
            </div>

            <h1 className="text-4xl font-bold text-center mb-8 text-[#4a3728]">Sign In To Mentarie</h1>

            <div className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-lg font-medium text-[#4a3728]">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-12 pr-4 py-3 w-full bg-white rounded-full border-2 border-[#f8d7c7] focus:outline-none focus:border-[#f8d7c7] text-gray-700"
                    placeholder="Enter your email..."
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>
                {isEmailInvalid && email.length > 0 && (
                  <div className="mt-2 bg-[#f8d7c7] text-[#e67e51] px-4 py-2 rounded-full flex items-center">
                    <div className="bg-[#e67e51] text-white rounded-full p-1 mr-2 flex items-center justify-center w-5 h-5">
                      <span className="text-sm font-bold">!</span>
                    </div>
                    Invalid Email Address!!
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-lg font-medium text-[#4a3728]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 py-3 w-full bg-white rounded-full border-2 border-[#f8f8f8] focus:outline-none focus:border-[#f8d7c7] text-gray-700"
                    placeholder="Enter your password..."
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Submit & Google Login Buttons */}
              <div className="flex flex-col justify-center items-center space-y-4">
                <button
                  type="submit"
                  className="w-full bg-[#4a3728] text-white py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-[#3a2a1f] transition-colors"
                >
                  <span className="text-xl font-medium">Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Google Login Button */}
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginFailure}
                  useOneTap
                  shape="pill"
                  text="signin_with"
                  theme="outline"
                  
                />
              </div>

              {/* Links for Signup and Forgot Password */}
              <div className="text-center mt-6 text-[#4a3728]">
                Don't have an account?{" "}
                {onSwitchForm ? (
                  <button 
                    onClick={onSwitchForm}
                    className="text-[#e67e51] hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                ) : (
                  <Link href="/SignUpForm" className="text-[#e67e51] hover:underline font-medium">
                    Sign Up
                  </Link>
                )}
              </div>

              <div className="text-center mt-6 text-[#4a3728]">
                <Link href="/PasswordReset" className="text-[#e67e51] hover:underline font-medium">

                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Bottom indicator - only on mobile */}
            <div className="flex justify-center pt-8 md:hidden">
              <div className="w-12 h-1 bg-[#4a3728] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
