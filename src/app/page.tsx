"use client"

import { useState } from "react"
import SignUpForm from "@/components/SignInForm"
import SignInForm from "@/components/SignUpForm"
export default function Home() {
  // State to track which form to display
  const [showSignIn, setShowSignIn] = useState(false)
  
  // Toggle between sign in and sign up forms
  const toggleForm = () => {
    setShowSignIn(!showSignIn)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2ef]">
      {showSignIn ? (
        <SignInForm onSwitchForm={toggleForm} />
      ) : (
        <SignUpForm onSwitchForm={toggleForm} />
      )}
    </main>
  )
}