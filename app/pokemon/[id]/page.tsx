import { getPokemonById, generatePokemonDescription } from '@/lib/pokemon'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AiDescription from './_components/AiDescription'
import { Suspense } from 'react'

export async function generateStaticParams() {
    const ids = Array.from({ length: 1000 }, (_, i) => i + 1);
 
  return ids.map((id) => ({
    id: id.toString(),
  }))
}

export default async function PokemonDetail({ params }: { params: { id: string } }) {
  const paramsAwaited = await params
  const paramsId = paramsAwaited.id
  const pokemon = await getPokemonById(paramsId)
  const descriptionPromise = generatePokemonDescription(pokemon)

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} className="h-[300px] w-[300px] mx-auto" />
          <h2 className="text-xl font-bold mt-4">Statistiche</h2>
          <ul className="mt-2">
          {pokemon.stats.map((stat: { name: string; value: number }) => (
               <li key={stat.name} className="flex flex-col gap-1">
               <div className="flex justify-between">
                 <span className="font-medium">{stat.name}:</span>
                 <span>{stat.value}</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="h-2 rounded-full" 
                   style={{
                     width: `${(stat.value / 255) * 100}%`,
                     backgroundColor: stat.value > 150 ? '#4ade80' : 
                                    stat.value > 100 ? '#60a5fa' : 
                                    stat.value > 50 ? '#fbbf24' : '#f87171'
                   }}
                 />
               </div>
             </li>
            ))}
          </ul>
          <h2 className="text-xl font-bold mt-4">Descrizione</h2>
          <Suspense fallback={
              <div className="animate-pulse space-y-2 mt-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          }>
           <AiDescription descriptionPromise={descriptionPromise}/>
           </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}