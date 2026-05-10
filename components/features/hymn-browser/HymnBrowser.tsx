'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useHymns } from '@/src/hooks/use-hymns'
import { Hymn } from '@/src/interface/interface'

const PRESENTER_KEY = 'antema-presenter'
const DISPLAY_KEY   = 'antema-display'
const PAGE_SIZE = 30

function formatTime(s: number) {
    const h   = Math.floor(s / 3600)
    const m   = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

// Friendly labels for sokajy values
const CAT_LABEL: Record<string, string> = {
    'all':                   'Tous',
    'Hira FFPM':             'FFPM',
    'Fihirana Fanampiny':    'FF',
    'Antema':                'Antema',
    'Salamo':                'Salamo',
}

function verseLabel(verse: { andininy: number; fiverenany: boolean }) {
    return verse.fiverenany ? 'Refrain' : `Andininy ${verse.andininy}`
}
function sourceLabel(hymn: Hymn) {
    return CAT_LABEL[hymn.sokajy] ?? hymn.sokajy
}
function splitIntoChunks(text: string, lpc: number): string[] {
    const lines = text.split('\n')
    const n = lpc > 0 ? lpc : lines.length
    const r: string[] = []
    for (let i = 0; i < lines.length; i += n) r.push(lines.slice(i, i + n).join('\n'))
    return r.length ? r : ['']
}

const newsreader: React.CSSProperties = { fontFamily: "'Newsreader','Georgia',serif" }
const manrope: React.CSSProperties    = { fontFamily: "'Manrope',system-ui,sans-serif" }

export default function HymnBrowser() {
    const { hymns, loading, error } = useHymns()

    const [selectedId, setSelectedId]           = useState<string | null>(null)
    const [verseIdx, setVerseIdx]               = useState(0)
    const [chunkIdx, setChunkIdx]               = useState(0)
    const [keyword, setKeyword]                 = useState('')
    const [page, setPage]                       = useState(1)
    const [fontSize, setFontSize]               = useState(50)
    const [linesPerChunk, setLinesPerChunk]     = useState(4)
    const [categoryFilter, setCategoryFilter]   = useState('all')
    const [blackout, setBlackout]               = useState(false)
    const [isClear, setIsClear]                 = useState(false)
    const [elapsed, setElapsed]                 = useState(0)
    const [showCtrlK, setShowCtrlK]             = useState(false)
    const [ctrlKQuery, setCtrlKQuery]           = useState('')
    const [ctrlKIdx, setCtrlKIdx]               = useState(0)

    const searchRef = useRef<HTMLInputElement>(null)
    const startRef  = useRef<number>(Date.now())

    // ── Derived: category tabs ───────────────────────────────────────────────
    const categories = useMemo(() => {
        const seen = new Set<string>()
        for (const h of hymns) seen.add(h.sokajy)
        return ['all', ...Array.from(seen)]
    }, [hymns])

    // ── Derived: filtered list ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = hymns
        if (categoryFilter !== 'all') list = list.filter(h => h.sokajy === categoryFilter)
        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase()
            list = list.filter(h =>
                h.laharana.includes(kw) ||
                h.lohateny.toLowerCase().includes(kw)
            )
        }
        return list
    }, [hymns, keyword, categoryFilter])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const selectedHymn: Hymn | null = (selectedId ? hymns.find(h => h.id === selectedId) : null) ?? null
    const verses       = selectedHymn?.hira ?? []
    const currentVerse = verses[verseIdx] ?? null
    const nextVerse    = verses[verseIdx + 1] ?? null

    const chunks = useMemo(() =>
        currentVerse ? splitIntoChunks(currentVerse.tononkira, linesPerChunk) : [''],
        [currentVerse, linesPerChunk]
    )
    const safeChunk        = Math.min(chunkIdx, chunks.length - 1)
    const currentChunkText = chunks[safeChunk] ?? ''

    const allSlides = useMemo(() => {
        if (!selectedHymn) return []
        const slides: Array<{ text: string; label: string; isRefrain: boolean; verseIdx: number; chunkIdx: number }> = []
        for (let vi = 0; vi < selectedHymn.hira.length; vi++) {
            const verse = selectedHymn.hira[vi]
            const vChunks = splitIntoChunks(verse.tononkira, linesPerChunk)
            const base = `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(verse)}`
            vChunks.forEach((chunk, ci) => {
                slides.push({
                    text: chunk,
                    label: vChunks.length > 1 ? `${base} (${ci + 1}/${vChunks.length})` : base,
                    isRefrain: verse.fiverenany,
                    verseIdx: vi,
                    chunkIdx: ci,
                })
            })
        }
        return slides
    }, [selectedHymn, linesPerChunk])

    const currentSlideIndex = useMemo(() => {
        if (!selectedHymn) return 0
        let idx = 0
        for (let v = 0; v < verseIdx; v++) {
            idx += splitIntoChunks(selectedHymn.hira[v].tononkira, linesPerChunk).length
        }
        return idx + safeChunk
    }, [selectedHymn, verseIdx, safeChunk, linesPerChunk])

    const nextChunkText = useMemo(() => {
        if (safeChunk < chunks.length - 1) return chunks[safeChunk + 1]
        if (nextVerse) return splitIntoChunks(nextVerse.tononkira, linesPerChunk)[0]
        return null
    }, [safeChunk, chunks, nextVerse, linesPerChunk])

    const nextChunkLabel = useMemo(() => {
        if (!selectedHymn || !currentVerse) return null
        if (safeChunk < chunks.length - 1)
            return `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(currentVerse)} (${safeChunk + 2}/${chunks.length})`
        if (nextVerse)
            return `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(nextVerse)}`
        return null
    }, [selectedHymn, currentVerse, nextVerse, safeChunk, chunks.length])

    const ctrlKResults = useMemo(() => {
        if (!ctrlKQuery.trim()) return []
        const q = ctrlKQuery.trim().toLowerCase()
        return hymns.filter(h =>
            h.laharana.includes(ctrlKQuery.trim()) ||
            h.lohateny.toLowerCase().includes(q)
        ).slice(0, 20)
    }, [ctrlKQuery, hymns])

    // ── Sync to localStorage ─────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedHymn || !currentVerse) return
        const label = `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(currentVerse)}` +
            (chunks.length > 1 ? ` (${safeChunk + 1}/${chunks.length})` : '')
        localStorage.setItem(PRESENTER_KEY, JSON.stringify({
            tononkira: currentChunkText,
            label,
            hymnTitle: selectedHymn.lohateny.trim() || `Hira ${selectedHymn.laharana}`,
            isRefrain: currentVerse.fiverenany,
            fontSize,
            nextText: nextChunkText ?? null,
            nextLabel: nextChunkLabel,
            currentSlideIndex,
            totalSlides: allSlides.length,
            allSlides,
        }))
    }, [selectedHymn, currentVerse, currentChunkText, fontSize, safeChunk, chunks.length,
        nextChunkText, nextChunkLabel, currentSlideIndex, allSlides])

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
        return () => clearInterval(id)
    }, [])

    // ── Display state sync (blackout/clear from audience window) ─────────────
    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== DISPLAY_KEY || !e.newValue) return
            try {
                const { blackout, clear } = JSON.parse(e.newValue)
                setBlackout(blackout)
                setIsClear(clear)
            } catch {}
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const toggleBlackout = useCallback(() => {
        const next = !blackout
        setBlackout(next)
        if (next) setIsClear(false)
        localStorage.setItem(DISPLAY_KEY, JSON.stringify({ blackout: next, clear: next ? false : isClear }))
    }, [blackout, isClear])

    const toggleClear = useCallback(() => {
        const next = !isClear
        setIsClear(next)
        if (next) setBlackout(false)
        localStorage.setItem(DISPLAY_KEY, JSON.stringify({ blackout: next ? false : blackout, clear: next }))
    }, [isClear, blackout])

    // ── Navigation ───────────────────────────────────────────────────────────
    const goPrev = useCallback(() => {
        if (safeChunk > 0) { setChunkIdx(safeChunk - 1) }
        else setVerseIdx(i => { if (i > 0) { setChunkIdx(0); return i - 1 } return i })
    }, [safeChunk])

    const goNext = useCallback(() => {
        if (safeChunk < chunks.length - 1) { setChunkIdx(safeChunk + 1) }
        else setVerseIdx(i => { if (i < verses.length - 1) { setChunkIdx(0); return i + 1 } return i })
    }, [safeChunk, chunks.length, verses.length])

    function selectHymn(hymn: Hymn) { setSelectedId(hymn.id); setVerseIdx(0); setChunkIdx(0) }
    function onSearch(v: string)     { setKeyword(v); setPage(1) }
    function onCategory(c: string)   { setCategoryFilter(c); setPage(1) }

    function openAudienceWindow() {
        const w = window.screen.width
        const h = window.screen.height
        const win = window.open('/slide/hymn', 'antema-audience',
            `width=${w},height=${h},left=0,top=0,menubar=no,toolbar=no,location=no,status=no`)
        // Synchronously within the click (user gesture) → fullscreen allowed
        try { win?.document.documentElement.requestFullscreen() } catch {}
    }

    // ── Nav commands from audience window ────────────────────────────────────
    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== 'antema-nav' || !e.newValue) return
            try {
                const { action, index, id } = JSON.parse(e.newValue)
                if (action === 'prev') goPrev()
                if (action === 'next') goNext()
                if (action === 'goto' && typeof index === 'number') {
                    const s = allSlides[index]
                    if (s) { setVerseIdx(s.verseIdx); setChunkIdx(s.chunkIdx) }
                }
                if (action === 'select' && typeof id === 'string') {
                    const h = hymns.find(hh => hh.id === id)
                    if (h) { setSelectedId(h.id); setVerseIdx(0); setChunkIdx(0) }
                }
            } catch {}
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [goPrev, goNext, allSlides, hymns])

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (showCtrlK) return
            const tag = (e.target as HTMLElement).tagName
            const typing = tag === 'INPUT' || tag === 'TEXTAREA'

            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault()
                searchRef.current?.focus()
                searchRef.current?.select()
                return
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setShowCtrlK(true)
                return
            }
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault()
                openAudienceWindow()
                return
            }
            if (!typing) {
                if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev() }
                if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
                if (e.key === 'b' || e.key === 'B') toggleBlackout()
                if (e.key === 'l' || e.key === 'L') toggleClear()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [goPrev, goNext, toggleBlackout, toggleClear, showCtrlK])

    // ── Ctrl+K modal keyboard ────────────────────────────────────────────────
    useEffect(() => {
        if (!showCtrlK) return
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') { setShowCtrlK(false); setCtrlKQuery(''); setCtrlKIdx(0) }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setCtrlKIdx(i => Math.max(0, i - 1)) }
            if (e.key === 'ArrowDown') { e.preventDefault(); setCtrlKIdx(i => Math.min(ctrlKResults.length - 1, i + 1)) }
            if (e.key === 'Enter') {
                const sel = ctrlKResults[ctrlKIdx]
                if (sel) { selectHymn(sel); setShowCtrlK(false); setCtrlKQuery(''); setCtrlKIdx(0) }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [showCtrlK, ctrlKResults, ctrlKIdx])

    const isPrevDisabled = verseIdx === 0 && safeChunk === 0
    const isNextDisabled = verseIdx === verses.length - 1 && safeChunk === chunks.length - 1
    const hymnGlobalIdx  = selectedHymn ? hymns.indexOf(selectedHymn) : 0
    const ctrlBtn = 'px-2 py-0.5 rounded border border-slate-700 text-xs text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-30'

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm" style={manrope}>
            Mampiditra hira…
        </div>
    )
    if (error) return (
        <div className="flex items-center justify-center h-64 text-red-400 text-sm" style={manrope}>
            Nisy olana: {error.message}
        </div>
    )

    return (
        <>
        <div className="flex flex-1 min-h-0 h-full overflow-hidden" style={manrope}>

            {/* ══ LEFT — Song Library ══════════════════════════════════════ */}
            <aside className="w-64 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-slate-800">
                    <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Fihirana</p>
                    <h2 className="text-slate-100 text-lg font-semibold italic" style={newsreader}>Song Library</h2>
                    <p className="text-slate-500 text-xs mt-1">{hymns.length} hira disponibles</p>
                </div>

                {/* Category filter tabs */}
                <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-slate-800 shrink-0"
                    style={{ scrollbarWidth: 'none' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onCategory(cat)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors shrink-0 ${
                                categoryFilter === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            {CAT_LABEL[cat] ?? cat}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="px-4 py-2.5 border-b border-slate-800 shrink-0">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                        <input
                            ref={searchRef}
                            value={keyword}
                            onChange={e => onSearch(e.target.value)}
                            placeholder="Laharana na lohateny…"
                            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-700 bg-slate-800 px-1 rounded hidden group-focus:block">
                            Ctrl+F
                        </kbd>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {pageItems.map(hymn => {
                        const active = selectedHymn?.id === hymn.id
                        return (
                            <button
                                key={hymn.id}
                                onClick={() => selectHymn(hymn)}
                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-slate-800/50 transition-colors ${
                                    active
                                        ? 'bg-blue-500/10 border-l-4 border-l-blue-500 text-blue-300'
                                        : 'hover:bg-slate-800 text-slate-400 border-l-4 border-l-transparent'
                                }`}
                            >
                                <span className="font-mono text-[10px] w-7 shrink-0 text-slate-600">{hymn.laharana}</span>
                                <span className={`text-xs line-clamp-1 flex-1 ${active ? 'italic font-medium' : ''}`}
                                    style={active ? newsreader : {}}>
                                    {hymn.lohateny.trim() || `Hira ${hymn.laharana}`}
                                </span>
                                <span className="text-[9px] text-slate-700 uppercase tracking-wider shrink-0">
                                    {CAT_LABEL[hymn.sokajy] ?? hymn.sokajy.slice(0, 4)}
                                </span>
                            </button>
                        )
                    })}
                    {filtered.length === 0 && (
                        <p className="text-center text-slate-600 text-xs py-10">Tsy hita</p>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 shrink-0">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className={ctrlBtn}>‹</button>
                    <span className="text-[10px] text-slate-500">
                        {page} / {totalPages}
                        <span className="text-slate-700 ml-1">({filtered.length})</span>
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={ctrlBtn}>›</button>
                </div>
            </aside>

            {/* ══ RIGHT — Stage Preview ════════════════════════════════════ */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden min-h-0">

                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-xl">visibility</span>
                        <div>
                            <h3 className="text-slate-100 text-sm font-semibold">Stage Preview</h3>
                            {selectedHymn && (
                                <p className="text-slate-500 text-[10px] italic" style={newsreader}>
                                    {selectedHymn.sokajy} {selectedHymn.laharana}
                                    {selectedHymn.lohateny.trim() ? ` — ${selectedHymn.lohateny.trim()}` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Shortcut hints */}
                        <div className="hidden lg:flex items-center gap-2 mr-2">
                            <span className="text-[9px] text-slate-700">
                                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Ctrl+F</kbd> recherche
                            </span>
                            <span className="text-[9px] text-slate-700">
                                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">← →</kbd> nav
                            </span>
                            <span className="text-[9px] text-slate-700">
                                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Ctrl+G</kbd> plein écran
                            </span>
                        </div>
                        <button
                            onClick={openAudienceWindow}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                            title="Ctrl+G"
                        >
                            <span className="material-symbols-outlined text-sm">present_to_all</span>
                            Présenter
                        </button>
                    </div>
                </div>

                {!selectedHymn ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-700">
                        <span className="material-symbols-outlined text-5xl">library_music</span>
                        <p className="text-sm" style={newsreader}>Misafidiana hira eo ankavia…</p>
                        <p className="text-xs text-slate-800">
                            <kbd className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Ctrl+F</kbd>
                            {' '}pour rechercher
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Slides area */}
                        <div className="flex flex-1 gap-4 p-4 min-h-0 overflow-hidden">

                            {/* Current slide */}
                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        {currentVerse ? verseLabel(currentVerse) : ''}
                                        {chunks.length > 1 && ` · ${safeChunk + 1}/${chunks.length}`}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Active</span>
                                    </div>
                                </div>

                                <div className="relative flex-1 bg-black rounded-xl border-2 border-blue-500/60 overflow-hidden flex items-center justify-center p-10">
                                    <div className="absolute inset-4 border border-white/5 rounded pointer-events-none" />
                                    <div className="absolute inset-0 bg-blue-950/10" />
                                    <p style={{ ...newsreader, fontSize: `${Math.round(fontSize * 0.6)}px` }}
                                        className={`relative text-white text-center leading-relaxed whitespace-pre-wrap italic ${
                                            currentVerse?.fiverenany ? 'text-blue-200' : ''
                                        }`}>
                                        {currentChunkText}
                                    </p>
                                    <span className="absolute bottom-3 right-4 text-[10px] text-white/20 tracking-widest uppercase">
                                        {sourceLabel(selectedHymn)} {selectedHymn.laharana}
                                    </span>
                                </div>
                            </div>

                            {/* Right sidebar */}
                            <div className="w-52 shrink-0 flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>

                                {/* Next slide */}
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Slide suivante</span>
                                    <div className="relative bg-black rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center p-4"
                                        style={{ aspectRatio: '16/9' }}>
                                        <div className="absolute inset-3 border border-white/5 rounded pointer-events-none" />
                                        {nextChunkText ? (
                                            <p className="text-slate-300 text-[11px] text-center line-clamp-4 whitespace-pre-wrap leading-relaxed italic"
                                                style={newsreader}>{nextChunkText}</p>
                                        ) : (
                                            <p className="text-slate-700 text-[10px]">Farany</p>
                                        )}
                                    </div>
                                    {nextChunkLabel && (
                                        <p className="text-[10px] text-slate-600 truncate">{nextChunkLabel}</p>
                                    )}
                                </div>

                                {/* Verse counter */}
                                <div className="rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center py-4">
                                    <div className="text-center">
                                        <p className="text-blue-400 text-3xl font-bold" style={manrope}>
                                            {verseIdx + 1}
                                            <span className="text-slate-700 text-xl"> / {verses.length}</span>
                                        </p>
                                        {chunks.length > 1 && (
                                            <p className="text-slate-600 text-[10px] mt-1 uppercase tracking-wider">
                                                partie {safeChunk + 1}/{chunks.length}
                                            </p>
                                        )}
                                        <p className="text-slate-600 text-[10px] uppercase tracking-widest mt-1">Andininy</p>
                                    </div>
                                </div>

                                {/* Display controls */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Ecran</p>
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-[10px] text-slate-500">Taille</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setFontSize(s => Math.max(20, s - 4))} className={ctrlBtn}>A−</button>
                                            <span className="text-[10px] text-slate-400 w-8 text-center">{fontSize}</span>
                                            <button onClick={() => setFontSize(s => Math.min(96, s + 4))} className={ctrlBtn}>A+</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-[10px] text-slate-500">Lignes</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setLinesPerChunk(s => Math.max(0, s - 1)); setChunkIdx(0) }} className={ctrlBtn}>−</button>
                                            <span className="text-[10px] text-slate-400 w-5 text-center">{linesPerChunk || '∞'}</span>
                                            <button onClick={() => { setLinesPerChunk(s => s + 1); setChunkIdx(0) }} className={ctrlBtn}>+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Timer */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1.5">Durée</p>
                                    <p className="text-blue-400 text-2xl font-bold tabular-nums tracking-wide" style={manrope}>
                                        {formatTime(elapsed)}
                                    </p>
                                </div>

                                {/* Notes */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Notes</p>
                                    <textarea
                                        placeholder="Notes du présentateur…"
                                        className="h-20 w-full bg-transparent text-slate-400 text-xs resize-none focus:outline-none placeholder-slate-700 leading-relaxed"
                                        style={manrope}
                                    />
                                </div>

                                {/* Blackout / Clear */}
                                <div className="grid grid-cols-2 gap-2 shrink-0">
                                    <button
                                        onClick={toggleBlackout}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                                            blackout
                                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">dark_mode</span>
                                        <span>Noir (B)</span>
                                    </button>
                                    <button
                                        onClick={toggleClear}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                                            isClear
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">text_fields</span>
                                        <span>Vide (L)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Verse chips */}
                        <div className="px-4 py-2.5 bg-slate-900/50 border-t border-slate-800 shrink-0">
                            <div className="flex gap-1.5 flex-wrap">
                                {verses.map((verse, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setVerseIdx(idx); setChunkIdx(0) }}
                                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                            idx === verseIdx
                                                ? 'bg-blue-600 text-white'
                                                : verse.fiverenany
                                                ? 'bg-slate-800 text-slate-400 italic border border-slate-700 hover:border-blue-500'
                                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-blue-500 hover:text-blue-400'
                                        }`}
                                    >
                                        {verse.fiverenany ? 'R' : `${verse.andininy}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav bar */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/30 shrink-0">
                            <button
                                onClick={goPrev}
                                disabled={isPrevDisabled}
                                title="← flèche gauche"
                                className="flex items-center gap-1 px-4 py-2 rounded border border-slate-700 text-sm text-slate-300 disabled:opacity-30 hover:bg-slate-800 hover:border-slate-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Prev
                            </button>

                            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                                {verseIdx + 1} / {verses.length} · Hira {hymnGlobalIdx + 1} / {hymns.length}
                            </span>

                            <button
                                onClick={goNext}
                                disabled={isNextDisabled}
                                title="→ flèche droite"
                                className="flex items-center gap-1 px-4 py-2 rounded border border-slate-700 text-sm text-slate-300 disabled:opacity-30 hover:bg-slate-800 hover:border-slate-600 transition-colors"
                            >
                                Next
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* ── Ctrl+K Improvisation Overlay ──────────────────────────────── */}
        {showCtrlK && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4"
                onClick={() => { setShowCtrlK(false); setCtrlKQuery(''); setCtrlKIdx(0) }}
            >
                <div
                    className="w-full max-w-2xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950">
                        <span className="material-symbols-outlined text-blue-400 text-2xl">search</span>
                        <input
                            autoFocus
                            value={ctrlKQuery}
                            onChange={e => { setCtrlKQuery(e.target.value); setCtrlKIdx(0) }}
                            placeholder="Improvisation: Soraty ny lohateny na laharana…"
                            className="flex-1 bg-transparent text-lg text-white placeholder-slate-600 focus:outline-none"
                            style={manrope}
                        />
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] uppercase font-bold text-slate-500">
                            ESC
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                        {ctrlKResults.length === 0 ? (
                            <p className="text-center text-slate-600 text-sm py-10" style={newsreader}>
                                {ctrlKQuery.trim() ? 'Tsy hita' : 'Soraty ny lohateny na laharana…'}
                            </p>
                        ) : ctrlKResults.map((h, i) => (
                            <button
                                key={h.id}
                                onClick={() => {
                                    selectHymn(h)
                                    setShowCtrlK(false); setCtrlKQuery(''); setCtrlKIdx(0)
                                }}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors border border-transparent rounded mx-1 ${
                                    i === ctrlKIdx
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'hover:bg-blue-500/10 hover:border-blue-500/20'
                                }`}
                                style={{ width: 'calc(100% - 8px)' }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded border shrink-0 ${
                                        i === ctrlKIdx
                                            ? 'bg-slate-800 border-blue-500/40 text-blue-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-500'
                                    }`}>
                                        <span className="material-symbols-outlined text-xl">library_music</span>
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <h4 className={`text-sm font-bold truncate ${i === ctrlKIdx ? 'text-white' : 'text-slate-300'}`} style={newsreader}>
                                            {h.lohateny.trim() || `Hira ${h.laharana}`}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {CAT_LABEL[h.sokajy] ?? h.sokajy} · #{h.laharana}
                                        </p>
                                    </div>
                                </div>
                                {i === ctrlKIdx && (
                                    <div className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase tracking-wider shrink-0">
                                        Insert Now
                                        <span className="material-symbols-outlined text-sm">keyboard_return</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex gap-4 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                            <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500">↑↓</span>
                                Naviguer
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500">↵</span>
                                Choisir
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-700 uppercase font-bold italic" style={manrope}>
                            Recherche en direct
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
