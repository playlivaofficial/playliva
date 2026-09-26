import { PowerPage, powerMetadata } from '@/components/originals/power/page-content'
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){return powerMetadata('raio',(await params).locale)}
export default async function Page({params}:{params:Promise<{locale:string}>}){return <PowerPage kind="raio" segment={(await params).locale}/>}
