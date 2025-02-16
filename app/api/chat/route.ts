import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

//export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: "Sei un assistente Pokémon esperto che aiuta a trovare Pokémon in base alle descrizioni in italiano.",
  });
  return result.toDataStreamResponse();
}