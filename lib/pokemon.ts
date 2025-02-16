
"use server"

import { generateText } from 'ai'

import { createOpenAI } from '@ai-sdk/openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = createOpenAI({
   apiKey: OPENAI_API_KEY
});


export async function searchPokemon(query: string, page: number = 1, limit: number = 12) {
    try {
        // First, try to get names from PokeAPI
        const apiResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`);
        if (!apiResponse.ok) {
            throw new Error('Failed to fetch Pokémon list from PokeAPI');
        }
        const apiData = await apiResponse.json();
        const allPokemonNames = apiData.results.map((p: any) => p.name);

        // Then use LLM to filter based on the query
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: `From this list of Pokémon names: ${JSON.stringify(allPokemonNames)}, return an array of names that match this description: "${query}". Return ONLY a valid JSON array of Pokémon names, without additional text. Example: ["pikachu", "charizard"].`,
            system: "You are a Pokémon expert assistant helping to find Pokémon based on descriptions. Always return a valid JSON array of Pokémon names, without additional text.",
        });

        const filteredPokemonNames = JSON.parse(text);
        console.log('Filtered Pokémon names:', filteredPokemonNames);

        // Handle empty results
        if (!filteredPokemonNames || filteredPokemonNames.length === 0) {
            return {
                error: "No Pokémon found. Try another search!",
                results: [],
                total: 0,
                page: 1,
                limit
            }
        }

        // Paginate the names
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedNames = filteredPokemonNames.slice(startIndex, endIndex);

        // Fetch detailed data for paginated results
        const pokemons = await Promise.all(paginatedNames.map(async (name: string) => {
            try {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                return {
                    id: data.id,
                    name: data.name,
                    types: data.types.map((type: any) => type.type.name),
                    image: data.sprites.front_default,
                }
            } catch (error) {
                console.error(`Error fetching Pokémon ${name}:`, error);
                return null;
            }
        }));

        const filteredPokemons = pokemons.filter(pokemon => pokemon !== null);

        // Handle case where all Pokémon fetches failed
        if (filteredPokemons.length === 0) {
            return {
                error: "No valid Pokémon found. Try another search!",
                results: [],
                total: 0,
                page,
                limit
            }
        }

        return {
            error: null,
            results: filteredPokemons,
            total: filteredPokemonNames.length,
            page,
            limit
        }

    } catch (error) {
        console.error('Error in searchPokemon:', error);
        return {
            error: "An error occurred while searching for Pokémon. Please try again later.",
            results: [],
            total: 0,
            page: 1,
            limit
        }
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
    prompt: `Genera una descrizione in italiano per il Pokémon ${pokemon.name} basata sulle seguenti statistiche e tipi: ${JSON.stringify(pokemon.stats)}, Tipi: ${pokemon.types.join(', ')}. La descrizione dovrebbe essere informativa e interessante per i fan dei Pokémon.`,
    system: "Sei un esperto Pokémon che crea descrizioni coinvolgenti in italiano.",
  })

  return text
}