import { Markdown } from "@/components/Markdown";
import { use } from "react";

export default function AiDescription({descriptionPromise}: {descriptionPromise: Promise<string>}) {
    const description = use(descriptionPromise)
    return (
    <Markdown>{description}</Markdown>)
}