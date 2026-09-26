import { ThreeGamePage, threeMetadata } from '@/components/originals/three-games/page-content'
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){return threeMetadata('samba-drop',(await params).locale)}
export default async function Page({params}:{params:Promise<{locale:string}>}){return <ThreeGamePage kind="samba-drop" segment={(await params).locale}/>}