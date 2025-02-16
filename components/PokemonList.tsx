"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface Pokemon {
  id: number
  name: string
  image: string
  types: string[]
}

interface PokemonListProps {
    pokemonsPromise: Promise<{
        error: string | null
        results: Pokemon[]
        total: number
        page: number
        limit: number
    }>
}

export default function PokemonList({ pokemonsPromise }: PokemonListProps) {
    const { error, results: pokemons, total, page, limit } = use(pokemonsPromise)
    const searchParams = useSearchParams()
    const query = searchParams.get('q')

    if (error) {
        return (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 text-lg">{error}</p>
          </div>
        )
    }

    const totalPages = Math.ceil(total / limit)

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {pokemons.map((pokemon) => (
                    <Link href={`/pokemon/${pokemon.id}`} key={pokemon.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{pokemon.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <img 
                                src={pokemon.image} 
                                alt={pokemon.name} 
                                className="w-full h-32 object-contain mb-2"
                            />
                            <div className="flex flex-wrap gap-2">
                                {pokemon.types.map((type) => (
                                    <span 
                                        key={type}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                                    >
                                        {type}
                                    </span>
                                ))}
                            </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Pagination Controls */}

            <Pagination className='mt-4'>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            href={`?q=${query}&page=${page - 1}`}
                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                            <PaginationLink 
                                href={`?q=${query}&page=${pageNumber}`}
                                isActive={pageNumber === page}
                            >
                                {pageNumber}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext 
                            href={`?q=${query}&page=${page + 1}`}
                            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
