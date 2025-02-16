"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Badge } from './ui/badge'

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

    const typeColors: Record<string, string> = {
        normal: 'bg-gray-400',
        fire: 'bg-red-500',
        water: 'bg-blue-500',
        electric: 'bg-yellow-400',
        grass: 'bg-green-500',
        ice: 'bg-cyan-300',
        fighting: 'bg-red-700',
        poison: 'bg-purple-500',
        ground: 'bg-yellow-700',
        flying: 'bg-sky-400',
        psychic: 'bg-pink-500',
        bug: 'bg-lime-500',
        rock: 'bg-yellow-800',
        ghost: 'bg-indigo-700',
        dragon: 'bg-violet-600',
        dark: 'bg-gray-800',
        steel: 'bg-gray-500',
        fairy: 'bg-pink-300',
      }

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
                                    <Badge 
                                        key={type}
                                        className={`${typeColors[type.toLowerCase()] || 'bg-gray-500'} text-white`}
                                    >
                                        {type}
                                    </Badge>
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
                    {/* Show first page */}
                    <PaginationItem>
                        <PaginationLink 
                            href={`?q=${query}&page=1`}
                            isActive={1 === page}
                        >
                            1
                        </PaginationLink>
                    </PaginationItem>
                    
                    {/* Show ellipsis if current page is more than 3 */}
                    {page > 3 && (
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                    )}

                    {/* Show current page and surrounding pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = Math.max(2, Math.min(page - 2, totalPages - 4)) + i;
                        if (pageNumber > 1 && pageNumber < totalPages) {
                            return (
                                <PaginationItem key={pageNumber}>
                                    <PaginationLink 
                                        href={`?q=${query}&page=${pageNumber}`}
                                        isActive={pageNumber === page}
                                    >
                                        {pageNumber}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        }
                        return null;
                    })}

                    {/* Show ellipsis if current page is more than 3 pages from the end */}
                    {page < totalPages - 2 && (
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                    )}

                    {/* Show last page if there's more than one page */}
                    {totalPages > 1 && (
                        <PaginationItem>
                            <PaginationLink 
                                href={`?q=${query}&page=${totalPages}`}
                                isActive={totalPages === page}
                            >
                                {totalPages}
                            </PaginationLink>
                        </PaginationItem>
                    )}
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
