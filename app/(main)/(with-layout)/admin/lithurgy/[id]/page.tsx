"use client";
import {useEffect, useState} from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import { Separator } from '@/src/components/ui/separator'
import {Main} from "../main";
import {useParams, useRouter} from "next/navigation";
const appText = new Map<string, string>([
    ['all', 'All Apps'],
    ['connected', 'Connected'],
    ['notConnected', 'Not Connected'],
])

export default function Apps() {
    const [sort, setSort] = useState('ascending');
    const router = useRouter();
    const params = useParams();
    const [data, setData] = useState<any>(null);
    const [appType, setAppType] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    useEffect(() => {

        fetch("/ressources/litorjia/template.json")
            .then((response) => response.json())
            .then((jsonData) => {
                console.log(jsonData.litorjia.filter((app) => app.id == params.id));
                setData(jsonData.litorjia.filter((app) => app.id == params.id)[0]);
            })
            .catch((error) => console.error("Error fetching the JSON data:", error));
    }, [params.id]);
    const lithurgyDetail = (id: number) => {
        router.push(`/litorjia/${id}`);
    }
    // const filteredApps = data
    //     .sort((a, b) =>
    //         sort === 'ascending'
    //             ? a.name.localeCompare(b.name)
    //             : b.name.localeCompare(a.name)
    //     )
    //     .filter((app) =>
    //         appType === 'connected'
    //             ? app.connected
    //             : appType === 'notConnected'
    //                 ? !app.connected
    //                 : true
    //     )
    //     .filter((app) => app.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <>

            <Main >
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>
                        {data?.nom}
                    </h1>
                </div>
                <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
                    <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
                        <Input
                            placeholder='Filter hira...'
                            className='h-9 w-40 lg:w-[250px]'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className='w-16'>
                            <SelectValue>

                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent align='end'>
                            <SelectItem value='ascending'>
                                <div className='flex items-center gap-4'>
                                    Ascending
                                </div>
                            </SelectItem>
                            <SelectItem value='descending'>
                                <div className='flex items-center gap-4'>
                                    Descending
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator className='shadow' />
                <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3'>
                    {data?.fizarana?.map((app) => (
                        <li
                            key={app.nom}
                            className='rounded-lg border p-4 hover:shadow-md'
                        >
                            <div className='mb-8 flex items-center justify-between'>
                                {/*<div*/}
                                {/*    className={`flex size-10 items-center justify-center rounded-lg bg-muted p-2`}*/}
                                {/*>*/}
                                {/*    {app.logo}*/}
                                {/*</div>*/}
                                <h1 className="font-bold">{app.id}</h1>
                            </div>
                            <div>
                            <h2 className='mb-1 font-semibold'>{app.title}</h2>
                                <p className='line-clamp-2 text-gray-500'>{app.desc}</p>
                            </div>
                            <div className={"float-left"}>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className={`${app.connected ? 'border border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' : ''}`}
                                >
                                    Voir plus
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </Main>
        </>
    )
}
