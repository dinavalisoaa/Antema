import AppSidebar from '@/src/components/layout/app-sidebar'
import Header from '@/src/components/layout/header'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Hira Pro',
    description: 'Liturgical Control'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-hidden bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    )
}
