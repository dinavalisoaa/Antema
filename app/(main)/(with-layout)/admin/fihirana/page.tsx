import HymnBrowser from '@/components/features/hymn-browser/HymnBrowser'
import PageContainer from '@/src/components/layout/page-container'
import { Heading } from '@/src/components/ui/heading'
import { Separator } from '@/src/components/ui/separator'

export default function Page() {
    return (
        <PageContainer scrollable={false}>
            <div className="flex flex-1 flex-col space-y-4 h-full">
                <div className="flex items-start justify-between">
                    <Heading title="Fihirana" description="Hira FFPM sy Fanampiny" />
                </div>
                <Separator />
                <HymnBrowser />
            </div>
        </PageContainer>
    )
}
