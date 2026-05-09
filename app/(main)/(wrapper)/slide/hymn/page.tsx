'use client'

import { useState, useEffect } from 'react'

const PRESENTER_KEY = 'antema-presenter'

interface SlideState {
    tononkira: string
    label: string
    hymnTitle: string
    isRefrain: boolean
    fontSize: number
}

function readState(): SlideState | null {
    try {
        const raw = localStorage.getItem(PRESENTER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export default function HymnAudiencePage() {
    const [slide, setSlide] = useState<SlideState | null>(null)

    useEffect(() => {
        setSlide(readState())

        // Auto fullscreen
        document.documentElement.requestFullscreen?.().catch(() => {})

        function onStorage(e: StorageEvent) {
            if (e.key === PRESENTER_KEY) setSlide(readState())
        }

        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    return (
        <div className="fixed inset-0 bg-[#0d1b2e] flex items-center justify-center px-24">
            {slide ? (
                 <>
                    <p
                        style={{ fontSize: `${slide.fontSize || 36}px` }}
                        className={`text-white font-bold text-center leading-loose whitespace-pre-wrap ${
                            slide.isRefrain ? 'italic text-sky-200' : ''
                        }`}
                    >
                        {slide.tononkira}
                    </p>
                    <span className="absolute bottom-6 right-8 text-slate-500 text-sm font-medium tracking-wide">
                        {slide.label}
                    </span>
                </>
            ) : (
                <p className="text-slate-600 text-2xl font-light">
                    En attente de présentation…
                </p>
            )}
        </div>
    )
}
