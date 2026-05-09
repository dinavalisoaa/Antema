"use client"

import { useMemo, useState, useEffect } from "react"

import { Input } from "@/src/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { CategorySong } from "@/app/(main)/(with-layout)/admin/nl/page"
import PageContainer from "@/src/components/layout/page-container"
import { Heading } from '@/src/components/ui/heading'
import { Separator } from '@/src/components/ui/separator'
import NewSongCategoryDialog from "@/components/slide/common/new-song-category-dialog"
import { SongCategoryService } from "@/components/service/graphql/song-category/song-category-service"

export default function Page() {
    const [categories, setCategories] = useState<CategorySong[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [keyWord, setKeyWord] = useState("")

    const fetchCategories = () => {
        const songCategoryService = new SongCategoryService()
        setLoading(true)
        songCategoryService.findAll()
            .then((response) => {
                setCategories(response)
                setLoading(false)
            })
            .catch((error) => {
                setError(error)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const categoriesMapped = useMemo(() =>
        categories?.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            typeId: cat.types?.id || "Unknown",
            typeName: cat.types?.name || "Unknown",
        })) || [],
        [categories]
    )

    const filtered = categoriesMapped.filter((cat) => cat.name.includes(keyWord))

    return (
        <PageContainer scrollable={false}>
            <div className='flex flex-1 flex-col space-y-4'>
                <div className='flex items-start justify-between'>
                    <Heading title='Categorie de chant' description='' />
                </div>
                <Separator />
                <div className="w-full">
                    <div className="flex flex-row justify-between m-3 gap-2">
                        <Input
                            placeholder="Recherche le nom"
                            onChange={(event) => setKeyWord(event.target.value)}
                            className="max-w-sm"
                        />
                        <NewSongCategoryDialog onCategoryAdded={fetchCategories} />
                    </div>
                    <br />
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                        {filtered.map((value, index) => (
                            <Card key={index}>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>
                                        <div className='text-2xl font-bold'>{value.name}</div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between">
                                        <div>
                                            <p className='text-xs text-muted-foreground'>258 Hira</p>
                                        </div>
                                        <div>
                                            <p className='text-xs text-muted-foreground'>{value.typeName}</p>
                                        </div>
                                        <div>
                                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' className='h-6 w-6'>
                                                <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
                                            </svg>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className='flex' />
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </PageContainer>
    )
}
