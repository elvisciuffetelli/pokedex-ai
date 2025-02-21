
"use server"

import { generateText } from 'ai'
import { z } from 'zod';

import { createOpenAI } from '@ai-sdk/openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = createOpenAI({
   apiKey: OPENAI_API_KEY
});

const PokemonFilterSchema = z.object({
  name: z.string().optional(),
  minAttack: z.number().optional(),
  maxAttack: z.number().optional(),
  types: z.array(z.string()).optional(),
  minDefense: z.number().optional(),
  maxDefense: z.number().optional(),
});

type PokemonFilter = z.infer<typeof PokemonFilterSchema>;

type Pokemon = {
  id: number;
  name: string;
  types: string[];
  image: string;
  stats: Array<{ name: string; value: number }>;
};

export async function searchPokemon(query: string, page: number = 1, limit: number = 12) {
  try {
    let filters: PokemonFilter = {};

    if (query?.trim()) {
    // Use LLM to interpret the query
    const { text: filterCriteria } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Convert this Pokémon search query into filter criteria: "${query}".
          If the query mentions a specific Pokémon name, include it in the name field.
          Focus on these aspects:
          - Specific Pokémon name (as "name" field)
          - Attack range (minAttack, maxAttack)
          - Defense range (minDefense, maxDefense)
          - Types (as array of strings)
          
          Here are the valid Pokémon types in both English and Italian:
          - Normal / Normale
          - Fire / Fuoco
          - Water / Acqua
          - Electric / Elettro
          - Grass / Erba
          - Ice / Ghiaccio
          - Fighting / Lotta
          - Poison / Veleno
          - Ground / Terra
          - Flying / Volante
          - Psychic / Psico
          - Bug / Coleottero
          - Rock / Roccia
          - Ghost / Spettro
          - Dragon / Drago
          - Dark / Buio
          - Steel / Acciaio
          - Fairy / Folletto
          
          Example 1: For "show me pikachu" return {"name": "pikachu"}
          Example 2: For "mostrami pokemon di tipo acqua" return {"types": ["water"]}
          Example 3: For "cercami pokemon di tipo fuoco" return {"types": ["fire"]}
          Return only a valid JSON object with these possible fields.`,
        system: "You are a Pokémon search query interpreter. Return only valid JSON that matches the specified format.",
      });

     try {
        const parsedFilters = JSON.parse(filterCriteria.replace(/```json\n?|```/g, '').trim());
        filters = PokemonFilterSchema.parse(parsedFilters);
      } catch (error) {
        console.error('Invalid filter criteria:', error);
      }
    }

    // If searching for a specific Pokémon by name, use direct API endpoint
    if (filters.name) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${filters.name.toLowerCase()}`);
        if (!response.ok) {
          throw new Error('Pokemon not found');
        }
        const data = await response.json();
        
        const pokemon: Pokemon = {
          id: data.id,
          name: data.name,
          types: data.types.map((type: any) => type.type.name),
          image: data.sprites.front_default,
          stats: data.stats.map((stat: any) => ({
            name: stat.stat.name,
            value: stat.base_stat,
          })),
        };

        return {
          error: null,
          results: [pokemon],
          total: 1,
          page: 1,
          limit,
          hasMore: false
        };
      } catch (error) {
        console.error('Error fetching specific Pokémon:', error);
        return {
          error: "Pokémon not found.",
          results: [],
          total: 0,
          page: 1,
          limit,
          hasMore: false
        };
      }
    }

    // For type-based searches, use the type endpoint first
    if (filters.types?.length === 1) {
        console.log('Type-based search:', filters.types[0]);
      try {
        const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${filters.types[0].toLowerCase()}`);
        if (!typeResponse.ok) {
          throw new Error('Type not found');
        }
        const typeData = await typeResponse.json();
        
        // Get all Pokémon of this type
        const pokemonUrls = typeData.pokemon.map((p: any) => p.pokemon.url);
        
        // Calculate pagination for the filtered results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUrls = pokemonUrls.slice(startIndex, endIndex);

        // Fetch detailed data for the paginated Pokémon
        const pokemonDataPromises = paginatedUrls.map(async (url: string) => {
          try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();

            const pokemon: Pokemon = {
              id: data.id,
              name: data.name,
              types: data.types.map((type: any) => type.type.name),
              image: data.sprites.front_default,
              stats: data.stats.map((stat: any) => ({
                name: stat.stat.name,
                value: stat.base_stat,
              })),
            };

            // Apply any additional filters
            const stats = Object.fromEntries(
              pokemon.stats.map(stat => [stat.name, stat.value])
            );

            if (filters.minAttack && stats.attack < filters.minAttack) return null;
            if (filters.maxAttack && stats.attack > filters.maxAttack) return null;
            if (filters.minDefense && stats.defense < filters.minDefense) return null;
            if (filters.maxDefense && stats.defense > filters.maxDefense) return null;

            return pokemon;
          } catch (error) {
            console.error(`Error fetching Pokémon data:`, error);
            return null;
          }
        });

        const pokemons = (await Promise.all(pokemonDataPromises)).filter((p): p is Pokemon => p !== null);

        return {
          error: null,
          results: pokemons,
          total: pokemonUrls.length,
          page,
          limit,
          hasMore: endIndex < pokemonUrls.length
        };
      } catch (error) {
        console.error('Error fetching type-based Pokémon:', error);
      }
    }

    // Fallback to regular pagination for other searches
    const offset = (page - 1) * limit;
    const apiResponse = await fetch(
      `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
    );
    
    if (!apiResponse.ok) {
      throw new Error('Failed to fetch Pokémon list from PokeAPI');
    }
    
    const apiData = await apiResponse.json();

    const pokemonDataPromises = apiData.results.map(async (p: any) => {
      try {
        const response = await fetch(p.url);
        if (!response.ok) return null;
        const data = await response.json();

        const pokemon: Pokemon = {
          id: data.id,
          name: data.name,
          types: data.types.map((type: any) => type.type.name),
          image: data.sprites.front_default,
          stats: data.stats.map((stat: any) => ({
            name: stat.stat.name,
            value: stat.base_stat,
          })),
        };

        // Apply filters
        const stats = Object.fromEntries(
          pokemon.stats.map(stat => [stat.name, stat.value])
        );

        if (filters.minAttack && stats.attack < filters.minAttack) return null;
        if (filters.maxAttack && stats.attack > filters.maxAttack) return null;
        if (filters.minDefense && stats.defense < filters.minDefense) return null;
        if (filters.maxDefense && stats.defense > filters.maxDefense) return null;
        if (filters.types?.length && !filters.types.some(type => pokemon.types.includes(type))) return null;

        return pokemon;
      } catch (error) {
        console.error(`Error fetching Pokémon data:`, error);
        return null;
      }
    });

    const pokemons = (await Promise.all(pokemonDataPromises)).filter((p): p is Pokemon => p !== null);

    // Get total count
    const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon');
    const countData = await countResponse.json();

    return {
      error: null,
      results: pokemons,
      total: countData.count,
      page,
      limit,
      hasMore: offset + limit < countData.count
    };

  } catch (error) {
    console.error('Error in searchPokemon:', error);
    return {
      error: "An error occurred while searching for Pokémon. Please try again later.",
      results: [],
      total: 0,
      page,
      limit,
      hasMore: false
    };
  }
}

export async function getPokemonById(id: string) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    if (!response.ok) {
      throw new Error('Pokémon not found')
    }
    const data = await response.json()
    return {
      id: data.id,
      name: data.name,
      image: data.sprites.front_default,
      stats: data.stats.map((stat: any) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })),
      types: data.types.map((type: any) => type.type.name),
    }
  } catch (error) {
    console.error(`Error fetching Pokémon with ID ${id}:`, error)
    throw error
  }
}



export async function generatePokemonDescription(pokemon: any) {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Genera una descrizione in italiano per il Pokémon ${pokemon.name} basata sulle seguenti statistiche e tipi: ${JSON.stringify(pokemon.stats)}, Tipi: ${pokemon.types.join(', ')}. La descrizione dovrebbe essere in formato markdown con questa struttura:
  
  **# ${pokemon.name}**
  **## Tipi**
  - [Lista dei tipi]
  
  **## Statistiche**
  - [Lista delle statistiche]
  
  **## Descrizione**
  [Testo descrittivo e interessante]
  
  **## Curiosità**
  - [Fatti interessanti]`,
      system: "Sei un esperto Pokémon che crea descrizioni coinvolgenti in italiano, formattate in markdown con una struttura chiara.",
    })
  
    console.log({text})
    return text
  }