"use client"

import { useState } from "react"
import SignUpForm from "@/components/SignInForm"
import SignInForm from "@/components/SignUpForm"
import { GoogleOAuthProvider } from "@react-oauth/google"

export default function Home() {
  const [showSignIn, setShowSignIn] = useState(false)
  
  // Toggle between sign in and sign up forms
  const toggleForm = () => {
    setShowSignIn(!showSignIn)
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2ef]">
        {showSignIn ? (
          <SignInForm onSwitchForm={toggleForm} />
        ) : (
          <SignUpForm onSwitchForm={toggleForm} />
        )}
      </main>
    </GoogleOAuthProvider>
  )
}
  