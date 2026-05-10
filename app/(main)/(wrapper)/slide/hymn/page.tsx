'use client'

import { useState, useEffect } from 'react'

const PRESENTER_KEY = 'antema-presenter'
const DISPLAY_KEY   = 'antema-display'

interface SlideState {
    tononkira: string
    isRefrain: boolean
    fontSize: number
}

function readSlide(): SlideState | null {
    try {
        const raw = localStorage.getItem(PRESENTER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function readDisplay() {
    try {
        const raw = localStorage.getItem(DISPLAY_KEY)
        return raw ? JSON.parse(raw) : { blackout: false, clear: false }
    } catch { return { blackout: false, clear: false } }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
}

const newsreader: React.CSSProperties = { fontFamily: "'Newsreader','Georgia',serif" }
const manrope: React.CSSProperties    = { fontFamily: "'Manrope',system-ui,sans-serif" }

export default function HymnAudiencePage() {
    const [slide, setSlide]       = useState<SlideState | null>(null)
    const [blackout, setBlackout] = useState(false)
    const [isClear, setIsClear]   = useState(false)

    useEffect(() => {
        setSlide(readSlide())
        const d = readDisplay()
        setBlackout(d.blackout)
        setIsClear(d.clear)

        function onStorage(e: StorageEvent) {
            if (e.key === PRESENTER_KEY) setSlide(readSlide())
            if (e.key === DISPLAY_KEY) {
                const d = readDisplay()
                setBlackout(d.blackout)
                setIsClear(d.clear)
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey && e.key === 'g') || e.key === 'F11') {
                e.preventDefault(); toggleFullscreen(); return
            }
            if (e.key === 'b' || e.key === 'B') {
                setBlackout(prev => {
                    const next = !prev
                    if (next) setIsClear(false)
                    localStorage.setItem(DISPLAY_KEY, JSON.stringify({ blackout: next, clear: next ? false : isClear }))
                    return next
                })
            }
            if (e.key === 'l' || e.key === 'L') {
                setIsClear(prev => {
                    const next = !prev
                    if (next) setBlackout(false)
                    localStorage.setItem(DISPLAY_KEY, JSON.stringify({ blackout: next ? false : blackout, clear: next }))
                    return next
                })
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                localStorage.setItem('antema-nav', JSON.stringify({ action: 'prev', ts: Date.now() }))
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault()
                localStorage.setItem('antema-nav', JSON.stringify({ action: 'next', ts: Date.now() }))
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [blackout, isClear])

    return (
        <div
            className="fixed inset-0 bg-[#0d1b2e] flex items-center justify-center overflow-hidden"
            style={manrope}
            onDoubleClick={toggleFullscreen}
        >
            {!blackout && !isClear && slide && (
                <p
                    style={{ ...newsreader, fontSize: `${slide.fontSize || 50}px` }}
                    className={`text-white text-center leading-loose whitespace-pre-wrap italic px-16 ${
                        slide.isRefrain ? 'text-blue-200' : ''
                    }`}
                >
                    {slide.tononkira}
                </p>
            )}
            {!slide && (
                <p className="text-slate-600 text-xl font-light" style={newsreader}>
                    En attente de présentation…
                </p>
            )}
            {blackout && <div className="absolute inset-0 bg-black" />}
        </div>
    )
}
