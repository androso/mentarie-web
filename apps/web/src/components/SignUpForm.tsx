import type React from "react"
import { useState } from "react"
import { Eye, Mail, Lock, Check, ArrowRight } from "lucide-react"
import Link from "next/link"

// Use the same environment variable as your Google login
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

interface SignUpFormProps {
  onSwitchForm?: () => void
}

export default function SignUpForm({ onSwitchForm }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [isAgreed, setIsAgreed] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // New state for tracking registration success
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState("")

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Simple validation for demonstration
    setIsEmailInvalid(e.target.value.length > 0 && !e.target.value.includes("@"))
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPasswordsMatch(e.target.value === password || e.target.value === "")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordsMatch(confirmPassword === "" || confirmPassword === e.target.value)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Log non-sensitive form data for debugging
    console.log("Form submission initiated for:", email);

    // Validate form fields before sending the request
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    
    if (isEmailInvalid) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    
    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    if (!isAgreed) {
      setErrorMessage("Please agree to the Terms & Conditions.");
      return;
    }

    setIsLoading(true)
    setErrorMessage("") // Clear any previous error messages

    try {
      console.log("Submitting registration to:", `${API_BASE_URL}/api/auth/register`);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
        credentials: "include", // Include cookies in the request
      })

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        try {
          const data = await response.json();
          console.error("Error response:", data);
          setErrorMessage(data.message || "An error occurred. Please try again.");
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setErrorMessage(`Server error (${response.status}): ${response.statusText}`);
        }
      } else {
        // Handle successful sign-up
        const data = await response.json();
        console.log("Success response received");
        
        // Store the email for the success message and show verification screen
        setRegisteredEmail(email);
        setIsRegistered(true);
        
        // Reset form fields
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setIsAgreed(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage("Failed to connect to the server. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // If registration was successful, show a verification message instead of the form
  if (isRegistered) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f5f2ef]">
        <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex flex-col items-center text-center">
            <Mail className="w-16 h-16 text-[#4a3728] mb-4" />
            
            <h1 className="text-2xl font-bold text-[#4a3728] mb-4">
              Verify Your Email Address
            </h1>
            
            <p className="text-[#4a3728] mb-2">
              We've sent a verification link to:
            </p>
            
            <p className="text-[#e67e51] font-semibold mb-6">
              {registeredEmail}
            </p>
            
            <p className="text-[#4a3728] mb-6">
              Please check your inbox and click the verification link to complete your registration.
              The link will expire in 24 hours.
            </p>
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => setIsRegistered(false)}
                className="bg-[#4a3728] text-white py-3 px-6 rounded-full flex items-center justify-center space-x-2 hover:bg-[#3a2a1f] transition-colors"
              >
                <span>Register Another Account</span>
              </button>
              
              {onSwitchForm ? (
                <button
                  onClick={onSwitchForm}
                  className="text-[#e67e51] hover:underline font-medium"
                >
                  Go to Sign In
                </button>
              ) : (
                <Link href="/SignInForm" className="text-[#e67e51] hover:underline font-medium">
                  Go to Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Original form UI for sign-up process
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
            <h2 className="text-3xl text-white font-bold text-center">Welcome to our platform</h2>
            <p className="text-gray-300 mt-4 text-center">Create an account and start your journey with us today.</p>
          </div>
        </div>
        
        {/* Right side with form */}
        <div className="w-full md:w-3/5 bg-[#f5f2ef] p-8 md:p-12">
          <div className="max-w-md mx-auto">
            {/* Mobile logo (visible only on small screens) */}
            <div className="flex justify-center md:hidden mb-8">
              <div className="w-16 h-16 bg-[#e0e0e0] rounded-sm"></div>
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-8 text-[#4a3728]">Sign Up For Free</h1>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-lg font-medium text-[#4a3728]">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full bg-white rounded-full border-2 border-[#f8d7c7] focus:outline-none focus:border-[#f8d7c7] text-gray-700"
                    placeholder="Enter your full name..."
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-lg font-medium text-[#4a3728]">
                  Email Address
                </label>
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

              <div className="space-y-2">
                <label htmlFor="password" className="block text-lg font-medium text-[#4a3728]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
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

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-lg font-medium text-[#4a3728]">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="pl-12 pr-12 py-3 w-full bg-white rounded-full border-2 border-[#f8f8f8] focus:outline-none focus:border-[#f8d7c7] text-gray-700"
                    placeholder="Confirm your password..."
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4a3728]"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
                {!passwordsMatch && confirmPassword.length > 0 && (
                  <div className="mt-2 bg-[#f8d7c7] text-[#e67e51] px-4 py-2 rounded-full flex items-center">
                    <div className="bg-[#e67e51] text-white rounded-full p-1 mr-2 flex items-center justify-center w-5 h-5">
                      <span className="text-sm font-bold">!</span>
                    </div>
                    Passwords do not match!
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAgreed(!isAgreed)}
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#4a3728] ${
                    isAgreed ? "bg-[#4a3728] text-white" : "bg-transparent"
                  }`}
                >
                  {isAgreed && <Check className="h-4 w-4" />}
                </button>
                <span className="text-[#4a3728]">
                  I Agree with the{" "}
                  <Link href="#" className="text-[#8ba872] hover:underline">
                    Terms & Conditions
                  </Link>
                </span>
              </div>

              {errorMessage && (
                <div className="mt-2 bg-[#f8d7c7] text-[#e67e51] px-4 py-2 rounded-full flex items-center">
                  <div className="bg-[#e67e51] text-white rounded-full p-1 mr-2 flex items-center justify-center w-5 h-5">
                    <span className="text-sm font-bold">!</span>
                  </div>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                onClick={handleSignUp}
                className="w-full bg-[#4a3728] text-white py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-[#3a2a1f] transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="text-xl font-medium">Signing Up...</span>
                ) : (
                  <span className="text-xl font-medium">Sign Up</span>
                )}
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="text-center mt-6 text-[#4a3728]">
                Already have an account?{" "}
                {onSwitchForm ? (
                  <button
                    onClick={onSwitchForm}
                    className="text-[#e67e51] hover:underline font-medium"
                  >
                    Sign In
                  </button>
                ) : (
                  <Link href="/SignInForm" className="text-[#e67e51] hover:underline font-medium">
                    Sign In
                  </Link>
                )}
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
  );
}