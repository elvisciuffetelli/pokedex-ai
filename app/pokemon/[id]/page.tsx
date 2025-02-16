import { getPokemonById, generatePokemonDescription } from '@/lib/pokemon'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PokemonDetail({ params }: { params: { id: string } }) {
  const paramsAwaited = await params
    const paramsId = paramsAwaited.id
  const pokemon = await getPokemonById(paramsId)
  const description = await generatePokemonDescription(pokemon)

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{pokemon.name}</CardTitle>
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
          <p className="mt-2">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}