
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
        Example 1: For "show me pikachu" return {"name": "pikachu"}
        Example 2: For "mostrami pikachu" return {"name": "pikachu"}
        Example 3: For "show me water type pokemon" return {"types": ["water"]}
        Return only a valid JSON object with these possible fields.`,
      system: "You are a Pokémon search query interpreter. Return only valid JSON that matches the specified format.",
    });

    // Parse and validate the filter criteria
    let filters: PokemonFilter;
    try {
      const parsedFilters = JSON.parse(filterCriteria.replace(/```json\n?|```/g, '').trim());
      filters = PokemonFilterSchema.parse(parsedFilters);
    } catch (error) {
      console.error('Invalid filter criteria:', error);
      filters = {};
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

    // For other searches, proceed with the regular filtering logic
    const countResponse = await fetch('https://pokeapi.co/api/v2/pokemon');
    const countData = await countResponse.json();
    const totalPokemons = countData.count;

    // Create a cache map for batch processing
    const pokemonCache = new Map<string, Promise<Pokemon | null>>();

    // Function to fetch individual Pokémon data
    const fetchPokemonData = async (url: string): Promise<Pokemon | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();

        return {
          id: data.id,
          name: data.name,
          types: data.types.map((type: any) => type.type.name),
          image: data.sprites.front_default,
          stats: data.stats.map((stat: any) => ({
            name: stat.stat.name,
            value: stat.base_stat,
          })),
        };
      } catch (error) {
        console.error(`Error fetching Pokémon data:`, error);
        return null;
      }
    };

    // Function to fetch and filter a batch of Pokémon
    const fetchAndFilterBatch = async (offset: number, batchSize: number) => {
      const apiResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${batchSize}`
      );
      
      if (!apiResponse.ok) {
        throw new Error('Failed to fetch Pokémon list from PokeAPI');
      }
      
      const apiData = await apiResponse.json();

      const pokemonDataPromises = apiData.results.map((p: any) => {
        if (!pokemonCache.has(p.url)) {
          pokemonCache.set(p.url, fetchPokemonData(p.url));
        }
        return pokemonCache.get(p.url);
      });

      const pokemons = await Promise.all(pokemonDataPromises);

      return pokemons
        .filter((pokemon): pokemon is Pokemon => pokemon !== null)
        .filter(pokemon => {
          if (!Object.keys(filters).length) return true;

          const stats = Object.fromEntries(
            pokemon.stats.map(stat => [stat.name, stat.value])
          );

          if (filters.minAttack && stats.attack < filters.minAttack) return false;
          if (filters.maxAttack && stats.attack > filters.maxAttack) return false;
          if (filters.minDefense && stats.defense < filters.minDefense) return false;
          if (filters.maxDefense && stats.defense > filters.maxDefense) return false;
          if (filters.types?.length && !filters.types.some(type => pokemon.types.includes(type))) return false;

          return true;
        });
    };

    // Fetch all Pokémon in batches
    const batchSize = 100;
    let allFilteredPokemons: Pokemon[] = [];
    
    const numberOfBatches = Math.ceil(totalPokemons / batchSize);
    
    const concurrencyLimit = 3;
    for (let i = 0; i < numberOfBatches; i += concurrencyLimit) {
      const batchPromises = Array.from({ length: Math.min(concurrencyLimit, numberOfBatches - i) }, (_, index) => {
        const offset = (i + index) * batchSize;
        return fetchAndFilterBatch(offset, batchSize);
      });

      const batchResults = await Promise.all(batchPromises);
      allFilteredPokemons = allFilteredPokemons.concat(...batchResults);
    }

    const startIndex = (page - 1) * limit;
    const paginatedResults = allFilteredPokemons.slice(startIndex, startIndex + limit);
    const total = allFilteredPokemons.length;

    return {
      error: null,
      results: paginatedResults,
      total,
      page,
      limit,
      hasMore: total > page * limit
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