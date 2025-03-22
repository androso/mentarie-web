"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function VerifyEmail() {
  const [status, setStatus] = useState("loading") // loading, success, error
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [resendStatus, setResendStatus] = useState("idle") // idle, sending, sent, failed
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Missing verification token")
      return
    }
    
    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setStatus("success")
          setMessage(data.message || "Email verified successfully!")
          // Redirect to login after 3 seconds on success
          setTimeout(() => {
            router.push("/login")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.message || "Failed to verify email")
        }
      } catch (error) {
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }
    
    verifyEmail()
  }, [token, router])
  
  const handleResendEmail = async (e) => {
    e.preventDefault()
    
    if (!email || resendStatus === "sending") return
    
    setResendStatus("sending")
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResendStatus("sent")
      } else {
        setResendStatus("failed")
        setMessage(data.message || "Failed to resend verification email")
      }
    } catch (error) {
      setResendStatus("failed")
      setMessage("An unexpected error occurred")
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
          
          {status === "loading" && (
            <div className="mt-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="mt-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 font-medium text-green-600">{message}</p>
              <p className="mt-2 text-sm text-gray-500">Redirecting to login page...</p>
            </div>
          )}
          
          {status === "error" && (
            <div className="mt-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 font-medium text-red-600">{message}</p>
              <Link 
                href="/login" 
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </Link>
              
              {/* Resend verification email section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Didn't receive the email?</h2>
                <form onSubmit={handleResendEmail} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resendStatus === "sending" || resendStatus === "sent"}
                      className={`w-full px-4 py-2 text-white rounded-md transition-colors ${
                        resendStatus === "sent" 
                          ? "bg-green-500 hover:bg-green-600" 
                          : resendStatus === "sending"
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {resendStatus === "sending" ? "Sending..." : 
                       resendStatus === "sent" ? "Email Sent!" : 
                       "Resend Verification Email"}
                    </button>
                    
                    {resendStatus === "sent" && (
                      <p className="mt-2 text-sm text-green-600">
                        Verification email has been sent. Please check your inbox.
                      </p>
                    )}
                    
                    {resendStatus === "failed" && (
                      <p className="mt-2 text-sm text-red-600">
                        Failed to send verification email. Please try again.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}