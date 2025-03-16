"use client"

import { useRouter } from "next/navigation"
import PasswordResetForm from "@/components/PasswordResetForm"

export default function PasswordResetPage() {
  const router = useRouter()
  
  const handleSubmit = (email: string) => {
    // Handle the password reset request
    console.log('Password reset requested for:', email)
    // Call your API endpoint here
    
    // Optionally show a success message or redirect
    // For now, we'll just log the email
  }
  
  const handleBack = () => {
    router.push("/") // Go back to the main page
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2ef] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <PasswordResetForm onSubmit={handleSubmit} onBack={handleBack} />
      </div>
    </main>
  )
}