"use client"

import { useState } from "react"
import { Eye, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { useRouter } from "next/navigation"

// Define the props interface outside of the component
interface SignInFormProps {
  onSwitchForm?: () => void
}

// Define API base URL with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function SignInForm({ onSwitchForm }: SignInFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isValidationSent, setIsValidationSent] = useState(false)
  const [showValidationOption, setShowValidationOption] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setIsEmailInvalid(value.length > 0 && !value.includes("@"))
  }

  const sendVerificationEmail = async () => {
    if (!email || email.trim() === "") {
      setError("Please enter your email address first")
      return
    }
    
    // Clear any previous errors or messages
    setIsLoading(true)
    setError("")
    console.log("Sending verification for email:", email) // Debug log
    
    try {
      // Updated URL to the new resend verification endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      // Check if the response is JSON before parsing
      const contentType = response.headers.get("content-type")
      let data
      
      try {
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const text = await response.text()
          console.error("Non-JSON response:", text.substring(0, 100) + "...") // Log first 100 chars
          throw new Error("Server returned an invalid response format. Please try again later.")
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        // Try to recover with whatever we received
        data = { message: "Could not process server response. Please try again." }
      }
      
      if (response.ok) {
        setError("")
        setIsValidationSent(true)
        // Success is shown by UI state change instead of alert
      } else {
        setError(data.message || "Failed to send verification email")
      }
    } catch (err) {
      console.error("Error sending verification:", err)
      setError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    
    if (isEmailInvalid) {
      setError("Please enter a valid email address")
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log(`Attempting to login with API URL: ${API_BASE_URL}/api/auth/login`)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      // Log the response for debugging
      console.log('Login response:', { status: response.status, data })
      
      if (!response.ok) {
        // Check both status code AND error message content for verification issues
        if ((response.status === 403 && data.needsVerification) || 
            (data.message && (
              data.message.toLowerCase().includes('verif') || 
              (data.message.toLowerCase().includes('email') && 
               data.message.toLowerCase().includes('not'))
            ))
           ) {
          console.log('Email verification needed, showing validation option')
          setShowValidationOption(true)
          throw new Error(data.message || "Your email address is not validated. Please verify your email before logging in.")
        }
        throw new Error(data.message || "Failed to sign in")
      }
      
      // Store tokens properly
      if (data.token) {
        if (data.token.accessTk) {
          localStorage.setItem('accessToken', data.token.accessTk)
        }
        if (data.token.refreshTk) {
          localStorage.setItem('refreshToken', data.token.refreshTk)
        }
      }
      
      // Store user data for use in home page
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      // Reset verification states
      setNeedsVerification(false)
      setShowValidationOption(false)
      
      // Redirect to home page
      router.push('/home')
    } catch (err) {
      console.error("Sign in error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLoginSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google authentication failed")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: response.credential }),
      })
      
      const data = await backendResponse.json()
      
      if (!backendResponse.ok) {
        throw new Error(data.message || "Google authentication failed")
      }
      
      // Store tokens properly - using the format from your backend
      if (data.token) {
        if (data.token.accessTk) {
          localStorage.setItem('accessToken', data.token.accessTk)
        }
        if (data.token.refreshTk) {
          localStorage.setItem('refreshToken', data.token.refreshTk)
        }
      }
      
      // Store user data from Google login
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      // Redirect to the home page after successful Google login
      router.push('/home');
      
    } catch (err) {
      console.error('Google login error:', err)
      setError(err instanceof Error ? err.message : "Failed to authenticate with Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLoginFailure = () => {
    setError("Google sign-in was unsuccessful. Please try again.")
  }

  // Show verification needed UI
  if (needsVerification) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f5f2ef]">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex flex-col items-center text-center">
            <Mail className="w-16 h-16 text-[#e67e51] mb-4" />
            
            <h1 className="text-2xl font-bold text-[#4a3728] mb-4">
              Email Verification Required
            </h1>
            
            <p className="text-[#4a3728] mb-6">
              Your account exists but you need to verify your email address before logging in.
              Please check your inbox for the verification link.
            </p>
            
            <div className="flex flex-col space-y-4 w-full">
              {isValidationSent ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4">
                  <span className="block font-medium">Verification email sent!</span>
                  <span className="block text-sm mt-1">Please check your inbox and click the link to verify your email.</span>
                </div>
              ) : null}
              
              <button
                onClick={sendVerificationEmail}
                disabled={isLoading || isValidationSent}
                className="bg-[#4a3728] text-white py-3 px-6 rounded-full flex items-center justify-center space-x-2 hover:bg-[#3a2a1f] transition-colors disabled:opacity-50"
              >
                <span>{isLoading ? "Sending..." : isValidationSent ? "Email Sent Successfully" : "Send Verification Email"}</span>
              </button>
              
                              <button
                onClick={() => {
                  setNeedsVerification(false)
                  setIsValidationSent(false)
                  // Keep the validation option visible when returning to login screen
                  // Don't reset the email when going back
                }}
                className="text-[#e67e51] hover:underline font-medium"
              >
                Back to Sign In
              </button>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-4">
                Using email: {email || "not set"}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

            {/* Error Message Display with validation link based on error content */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
                {(showValidationOption || 
                  error.toLowerCase().includes('verif') || 
                  (error.toLowerCase().includes('email') && 
                   error.toLowerCase().includes('not'))
                ) && (
                  <button 
                    onClick={() => {
                      // Make sure email is valid before showing verification screen
                      if (!email) {
                        setError("Please enter your email address first");
                        return;
                      }
                      setNeedsVerification(true);
                    }}
                    className="block mt-2 text-[#e67e51] hover:underline font-medium"
                  >
                    Click here to validate your email
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-6">
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
                    Invalid Email Address!
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
                  disabled={isLoading}
                  className="w-full bg-[#4a3728] text-white py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-[#3a2a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xl font-medium">
                    {isLoading ? "Signing In..." : "Sign In"}
                  </span>
                  {!isLoading && <ArrowRight className="h-5 w-5" />}
                </button>

                {/* No validation button here anymore - now it's only in the error message */}

                {/* Divider */}
                <div className="relative w-full flex items-center justify-center mt-4">
                  <div className="border-t border-gray-300 w-full"></div>
                  <span className="bg-[#f5f2ef] px-3 text-sm text-gray-500 absolute">or</span>
                </div>

                {/* Google Login Button */}
                <div className="w-full flex justify-center mt-2">
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginFailure}
                    useOneTap
                    shape="pill"
                    text="signin_with"
                    theme="outline"
                    width="100%"
                  />
                </div>
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
            </form>

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