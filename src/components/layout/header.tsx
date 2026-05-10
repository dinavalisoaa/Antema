'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const topNav = [
    { href: '/admin/lithurgy', label: 'Programme' },
    { href: '/admin/fihirana', label: 'Fihirana' },
    { href: '/admin/list',     label: 'Liste' },
    { href: '/slide/client',   label: 'Présentation' },
]

export default function Header() {
    const pathname = usePathname()

    return (
        <header className="bg-slate-950 flex items-center justify-between px-6 h-16 border-b border-slate-800 shrink-0">
            {/* Logo */}
            <div className="text-blue-500 font-bold text-xl uppercase tracking-widest"
                style={{ fontFamily: "'Newsreader','Georgia',serif", fontStyle: 'italic' }}>
                Hira
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8">
                {topNav.map(({ href, label }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`text-sm transition-colors pb-1 ${
                                active
                                    ? 'text-blue-400 border-b-2 border-blue-500'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            style={{ fontFamily: "'Newsreader','Georgia',serif", fontStyle: 'italic' }}
                        >
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-slate-400 text-xl">settings</span>
                </button>
                <button className="p-2 rounded-full hover:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined text-slate-400 text-xl">account_circle</span>
                </button>
            </div>
        </header>
    )
}
