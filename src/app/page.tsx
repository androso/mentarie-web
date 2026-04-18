"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import SignUpForm from "@/components/SignInForm"
import SignInForm from "@/components/SignUpForm"

export default function Home() {
  const [showSignIn, setShowSignIn] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/home")
    }
  }, [isLoading, user, router])

  const toggleForm = () => {
    setShowSignIn(!showSignIn)
  }

  if (isLoading || user) return null

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
  