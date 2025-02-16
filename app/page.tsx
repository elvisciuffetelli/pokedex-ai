

//import { useState } from 'react'
import SearchForm from '@/components/SearchForm'
import PokemonList from '@/components/PokemonList'
import { searchPokemon } from '@/lib/pokemon'
import { Suspense } from 'react'

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({searchParams}: Props) {
    const query = (await searchParams).q
    const page = (await searchParams).page
    const resultsPromise = searchPokemon(query as string, page ? parseInt(page as string) : 1)

    return (
        <main className="container mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold mb-4">Pokédex AI</h1>
        <SearchForm  />
        
        <Suspense fallback={   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg p-4 animate-pulse mt-8">
                        <div className="bg-gray-300 h-40 w-full rounded mb-2"></div>
                        <div className="bg-gray-300 h-6 w-3/4 mb-2"></div>
                        <div className="bg-gray-300 h-4 w-1/2"></div>
                    </div>
                ))}
            </div>} key={Math.random()}> 
            <PokemonList pokemonsPromise={resultsPromise}/>
        </Suspense>
        
        </main>
    )
}