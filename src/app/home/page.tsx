"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  
  // Check if user is authenticated
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      // Redirect to sign in page if no access token is found
      router.push('/')
      return
    }
    
    setIsAuthenticated(true)
  }, [router])
  
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <p>Checking authentication...</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>
      <div className="bg-gray-100 p-8 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Welcome to your dashboard!</h2>
        <p className="text-gray-600 mb-4">
          You have successfully logged in with Google and reached your dashboard.
        </p>
      </div>
    </div>
  )
}