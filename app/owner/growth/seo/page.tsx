import { GrowthPage } from '@/components/owner/pages'
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <GrowthPage section="seo" searchParams={searchParams} /> }
