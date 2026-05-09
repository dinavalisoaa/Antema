'use client'

import { useState, useMemo, useEffect } from 'react'
import { useHymns } from '@/src/hooks/use-hymns'
import { Input } from '@/src/components/ui/input'
import { Hymn } from '@/src/interface/interface'

const PRESENTER_KEY = 'antema-presenter'

function verseLabel(verse: { andininy: number; fiverenany: boolean }) {
    return verse.fiverenany ? 'R' : `And ${verse.andininy}`
}

function sourceLabel(hymn: Hymn) {
    return hymn.source === 'ffpm' ? 'FFPM' : 'FA'
}

function splitIntoChunks(text: string, linesPerChunk: number): string[] {
    const lines = text.split('\n')
    const lpc = linesPerChunk > 0 ? linesPerChunk : lines.length
    const result: string[] = []
    for (let i = 0; i < lines.length; i += lpc) {
        result.push(lines.slice(i, i + lpc).join('\n'))
    }
    return result.length ? result : ['']
}

const PAGE_SIZE = 30

export default function HymnBrowser() {
    const { hymns, loading, error } = useHymns()
    const [selectedId, setSelectedId]   = useState<string | null>(null)
    const [verseIdx, setVerseIdx]       = useState(0)
    const [chunkIdx, setChunkIdx]       = useState(0)
    const [keyword, setKeyword]         = useState('')
    const [page, setPage]               = useState(1)
    const [fontSize, setFontSize]       = useState(36)     // px, sent to audience
    const [linesPerChunk, setLinesPerChunk] = useState(0) // 0 = show all

    const filtered = useMemo(() =>
        keyword.trim()
            ? hymns.filter(h =>
                h.laharana.includes(keyword) ||
                h.lohateny.toLowerCase().includes(keyword.toLowerCase())
            )
            : hymns,
        [hymns, keyword]
    )

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const selectedHymn: Hymn | null =
        (selectedId ? hymns.find(h => h.id === selectedId) : null) ?? null

    const verses      = selectedHymn?.hira ?? []
    const currentVerse = verses[verseIdx] ?? null
    const nextVerse    = verses[verseIdx + 1] ?? null

    // Split current verse into chunks
    const chunks = useMemo(() =>
        currentVerse ? splitIntoChunks(currentVerse.tononkira, linesPerChunk) : [''],
        [currentVerse, linesPerChunk]
    )
    const safeChunkIdx   = Math.min(chunkIdx, chunks.length - 1)
    const currentChunkText = chunks[safeChunkIdx] ?? ''

    // Compute next-slide preview
    const nextChunkText: string | null = useMemo(() => {
        if (safeChunkIdx < chunks.length - 1) return chunks[safeChunkIdx + 1]
        if (nextVerse) return splitIntoChunks(nextVerse.tononkira, linesPerChunk)[0]
        return null
    }, [safeChunkIdx, chunks, nextVerse, linesPerChunk])

    const nextChunkLabel: string | null = useMemo(() => {
        if (!selectedHymn || !currentVerse) return null
        if (safeChunkIdx < chunks.length - 1)
            return `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(currentVerse)} (${safeChunkIdx + 2}/${chunks.length})`
        if (nextVerse)
            return `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(nextVerse)}`
        return null
    }, [selectedHymn, currentVerse, nextVerse, safeChunkIdx, chunks.length])

    // Sync to localStorage → audience window
    useEffect(() => {
        if (!selectedHymn || !currentVerse) return
        const label = `${sourceLabel(selectedHymn)} ${selectedHymn.laharana} · ${verseLabel(currentVerse)}` +
            (chunks.length > 1 ? ` (${safeChunkIdx + 1}/${chunks.length})` : '')
        localStorage.setItem(PRESENTER_KEY, JSON.stringify({
            tononkira: currentChunkText,
            label,
            hymnTitle: selectedHymn.lohateny.trim() || `Hira ${selectedHymn.laharana}`,
            isRefrain: currentVerse.fiverenany,
            fontSize,
        }))
    }, [selectedHymn, currentVerse, currentChunkText, fontSize, safeChunkIdx, chunks.length])

    function selectHymn(hymn: Hymn) {
        setSelectedId(hymn.id)
        setVerseIdx(0)
        setChunkIdx(0)
    }

    function onSearch(value: string) {
        setKeyword(value)
        setPage(1)
    }

    function goPrev() {
        if (safeChunkIdx > 0) {
            setChunkIdx(safeChunkIdx - 1)
        } else {
            setVerseIdx(i => {
                if (i > 0) { setChunkIdx(0); return i - 1 }
                return i
            })
        }
    }

    function goNext() {
        if (safeChunkIdx < chunks.length - 1) {
            setChunkIdx(safeChunkIdx + 1)
        } else {
            setVerseIdx(i => {
                if (i < verses.length - 1) { setChunkIdx(0); return i + 1 }
                return i
            })
        }
    }

    function openAudienceWindow() {
        window.open('/slide/hymn', 'antema-audience', 'width=1280,height=720,menubar=no,toolbar=no,location=no')
    }

    const ctrlBtn = 'px-2 py-0.5 rounded border border-slate-600 text-xs hover:bg-slate-700 transition-colors disabled:opacity-30'

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Mampiditra hira...
        </div>
    )
    if (error) return (
        <div className="flex items-center justify-center h-64 text-destructive text-sm">
            Nisy olana: {error.message}
        </div>
    )

    const hymnGlobalIdx = selectedHymn ? hymns.indexOf(selectedHymn) : 0
    const isPrevDisabled = verseIdx === 0 && safeChunkIdx === 0
    const isNextDisabled = verseIdx === verses.length - 1 && safeChunkIdx === chunks.length - 1

    return (
        <div className="flex flex-1 gap-0 min-h-0 h-full overflow-hidden">
            {/* ── Left: song list ── */}
            <div className="w-64 shrink-0 flex flex-col gap-2 pr-3 border-r">
                <Input
                    placeholder="Laharana na lohateny..."
                    value={keyword}
                    onChange={e => onSearch(e.target.value)}
                    className="h-8 text-xs"
                />
                <div className="flex-1 overflow-y-auto divide-y text-xs">
                    {pageItems.map(hymn => (
                        <button
                            key={hymn.id}
                            onClick={() => selectHymn(hymn)}
                            className={`w-full text-left px-2 py-1.5 hover:bg-accent transition-colors flex items-center gap-2 ${
                                selectedHymn?.id === hymn.id ? 'bg-accent font-semibold' : ''
                            }`}
                        >
                            <span className="text-muted-foreground font-mono w-7 shrink-0">{hymn.laharana}</span>
                            <span className="line-clamp-1 flex-1">
                                {hymn.lohateny.trim() || `Hira ${hymn.laharana}`}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                                {hymn.source === 'ffpm' ? 'F' : 'A'}
                            </span>
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Tsy hita</p>
                    )}
                </div>
                <div className="flex items-center justify-between gap-1 shrink-0">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-2 py-0.5 text-xs rounded border disabled:opacity-30 hover:bg-accent transition-colors">‹</button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {totalPages} <span className="text-muted-foreground/50">({filtered.length})</span>
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="px-2 py-0.5 text-xs rounded border disabled:opacity-30 hover:bg-accent transition-colors">›</button>
                </div>
            </div>

            {/* ── Right: presenter view ── */}
            <div className="flex-1 flex flex-col bg-[#0d1b2e] rounded-lg ml-3 overflow-hidden text-white min-h-0">

                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 shrink-0">
                    <span className="text-sky-400 text-xs font-semibold tracking-wide">Mode présentateur</span>
                    <div className="flex items-center gap-3">
                        {selectedHymn && (
                            <span className="text-slate-400 text-xs">
                                {selectedHymn.sokajy} {selectedHymn.laharana}
                                {selectedHymn.lohateny.trim() ? ` · ${selectedHymn.lohateny.trim()}` : ''}
                            </span>
                        )}
                        <button onClick={openAudienceWindow}
                            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors">
                            ⎋ Présenter
                        </button>
                    </div>
                </div>

                {!selectedHymn ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                        Misafidiana hira...
                    </div>
                ) : (
                    <>
                        {/* Main content area */}
                        <div className="flex flex-1 gap-3 p-3 min-h-0 overflow-hidden">

                            {/* Current chunk — big slide */}
                            <div className="flex-1 relative rounded-xl bg-sky-100 flex items-center justify-center p-10 min-h-0">
                                <p className="text-slate-800 text-2xl font-bold text-center leading-relaxed whitespace-pre-wrap">
                                    {currentChunkText}
                                </p>
                                <span className="absolute bottom-3 right-4 text-xs text-slate-500 font-medium">
                                    {sourceLabel(selectedHymn)} {selectedHymn.laharana} · {currentVerse ? verseLabel(currentVerse) : ''}
                                    {chunks.length > 1 && ` (${safeChunkIdx + 1}/${chunks.length})`}
                                </span>
                            </div>

                            {/* Right sidebar */}
                            <div className="w-52 shrink-0 flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <p className="text-slate-400 text-xs font-semibold tracking-widest">SLIDE SUIVANTE</p>
                                    <div className="rounded-xl bg-sky-100 p-3 h-[120px] flex items-center justify-center">
                                        {nextChunkText ? (
                                            <p className="text-slate-700 text-xs text-center line-clamp-5 whitespace-pre-wrap leading-relaxed">
                                                {nextChunkText}
                                            </p>
                                        ) : (
                                            <p className="text-slate-400 text-xs">Farany</p>
                                        )}
                                    </div>
                                    {nextChunkLabel && (
                                        <p className="text-slate-500 text-xs">{nextChunkLabel}</p>
                                    )}
                                </div>

                                <div className="flex-1 rounded-xl bg-slate-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-sky-400 text-4xl font-bold tracking-tight">
                                            {verseIdx + 1}&nbsp;<span className="text-slate-500 text-2xl">/ {verses.length}</span>
                                        </p>
                                        {chunks.length > 1 && (
                                            <p className="text-slate-500 text-xs mt-1">
                                                partie {safeChunkIdx + 1}/{chunks.length}
                                            </p>
                                        )}
                                        <p className="text-slate-500 text-xs mt-1">Andininy</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verse chips */}
                        <div className="px-3 py-2 bg-slate-800/60 border-t border-slate-700 shrink-0">
                            <p className="text-slate-500 text-xs mb-1.5 tracking-widest font-medium">ANDININY</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {verses.map((verse, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setVerseIdx(idx); setChunkIdx(0) }}
                                        className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                                            idx === verseIdx
                                                ? 'bg-sky-600 text-white'
                                                : verse.fiverenany
                                                ? 'bg-slate-600 text-slate-300 italic'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        {verseLabel(verse)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav bar */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 shrink-0 gap-2">
                            <button onClick={goPrev} disabled={isPrevDisabled}
                                className="px-4 py-1.5 rounded border border-slate-600 text-sm disabled:opacity-30 hover:bg-slate-700 transition-colors shrink-0">
                                ← Prev
                            </button>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                                {/* Font size */}
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setFontSize(s => Math.max(20, s - 4))} className={ctrlBtn}>A−</button>
                                    <span className="text-slate-400 text-xs w-8 text-center">{fontSize}px</span>
                                    <button onClick={() => setFontSize(s => Math.min(96, s + 4))} className={ctrlBtn}>A+</button>
                                </div>
                                <div className="w-px h-4 bg-slate-700" />
                                {/* Lines per chunk */}
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-500 text-xs">Lignes:</span>
                                    <button onClick={() => { setLinesPerChunk(s => Math.max(0, s - 1)); setChunkIdx(0) }} className={ctrlBtn}>−</button>
                                    <span className="text-slate-400 text-xs w-5 text-center">{linesPerChunk || '∞'}</span>
                                    <button onClick={() => { setLinesPerChunk(s => s + 1); setChunkIdx(0) }} className={ctrlBtn}>+</button>
                                </div>
                            </div>

                            <span className="text-slate-500 text-xs shrink-0">
                                {verseIdx + 1}/{verses.length} · {hymnGlobalIdx + 1}/{hymns.length}
                            </span>

                            <button onClick={goNext} disabled={isNextDisabled}
                                className="px-4 py-1.5 rounded border border-slate-600 text-sm disabled:opacity-30 hover:bg-slate-700 transition-colors shrink-0">
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
