'use client'

import { useState, useEffect } from 'react'
import { Hymn } from '@/src/interface/interface'

function parseFile(data: any, source: 'ffpm' | 'fanampiny'): Hymn[] {
    return Object.entries(data.fihirana).map(([id, val]: [string, any]) => ({
        id,
        source,
        laharana: val.laharana ?? '',
        sokajy: val.sokajy ?? '',
        lohateny: val.lohateny ?? '',
        mpanoratra: val.mpanoratra ?? [],
        hira: val.hira ?? [],
    }))
}

export function useHymns() {
    const [hymns, setHymns] = useState<Hymn[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        Promise.all([
            fetch('/ressources/hira/01_fihirana_ffpm.json').then(r => r.json()),
            fetch('/ressources/hira/02_fihirana_fanampiny.json').then(r => r.json()),
            fetch('/ressources/hira/03_antema.json').then(r => r.json()),
            fetch('/ressources/hira/04_hira_salamo.json').then(r => r.json()),
        ])
            .then(([ffpm, fanampiny, antema, salamo]) => {
                setHymns([
                    ...parseFile(ffpm, 'ffpm'),
                    ...parseFile(fanampiny, 'fanampiny'),
                    ...parseFile(antema, 'antema'),
                    ...parseFile(salamo, 'salamo'),
                ])
                setLoading(false)
            })
            .catch(err => {
                setError(err)
                setLoading(false)
            })
    }, [])

    return { hymns, loading, error }
}
