'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
    { href: '/admin/lithurgy',      icon: 'list_alt',       label: 'Service Order' },
    { href: '/admin/fihirana',      icon: 'library_music',  label: 'Song Library' },
    { href: '/admin/song-category', icon: 'label',          label: 'Catégorie' },
    { href: '/admin/list',          icon: 'queue_music',    label: 'Liste hira' },
]

export default function AppSidebar() {
    const pathname = usePathname()

    return (
        <aside className="bg-slate-900 h-full w-64 border-r border-slate-800 flex flex-col shrink-0">
            {/* Brand */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                        <span className="material-symbols-outlined text-blue-500 text-xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
                    </div>
                    <div>
                        <p className="text-blue-400 font-bold text-sm" style={{ fontFamily: "'Newsreader','Georgia',serif", fontStyle: 'italic' }}>
                            Hira Pro
                        </p>
                        <p className="text-slate-600 text-[9px] uppercase tracking-widest"
                            style={{ fontFamily: "'Manrope',system-ui,sans-serif" }}>
                            Liturgical Control
                        </p>
                    </div>
                </div>

                <nav className="space-y-0.5">
                    {nav.map(({ href, icon, label }) => {
                        const active = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                    active
                                        ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500 font-semibold'
                                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300 border-l-4 border-transparent'
                                }`}
                                style={{ fontFamily: "'Manrope',system-ui,sans-serif" }}
                            >
                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                {label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto px-6 py-4 border-t border-slate-800 space-y-1">
                <button className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm w-full rounded-lg hover:bg-slate-800 transition-colors"
                    style={{ fontFamily: "'Manrope',system-ui,sans-serif" }}>
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    Help
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-500 text-xs" style={{ fontFamily: "'Manrope',system-ui,sans-serif" }}>
                        System Online
                    </span>
                </div>
            </div>
        </aside>
    )
}
