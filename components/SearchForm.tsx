"use client"

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from 'next/navigation'



export default function SearchForm() {
  const [query, setQuery] = useState('')
  const searchParams = useSearchParams() 
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('q', query)
    newSearchParams.set('page', '1') 
    router.push(`/?${newSearchParams.toString()}`)
  }
  return (
    <Card>
      <CardContent>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4 items-center mt-7">
          <Input
            type="text"
            placeholder="Cerca Pokémon per nome, tipo o descrizione. Es: 'mostrami i Pokémon di tipo elettro' oppure 'mostrami i Pokémon con attacco superiore a 100'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit">Cerca</Button>
        </form>
      </CardContent>
    </Card>
  )
}