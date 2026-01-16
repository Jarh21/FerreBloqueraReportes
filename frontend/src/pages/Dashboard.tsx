"use client"

import { useState } from "react"
import { Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { usuario } = useAuth()

  if (!usuario) {
    return null
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar open={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
