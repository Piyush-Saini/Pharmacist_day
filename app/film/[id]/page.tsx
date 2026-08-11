import { notFound } from "next/navigation";

import { FilmView } from "@/components/FilmView";
import { isValidId } from "@/lib/store";

/**
 * The film's page. Keyed to an unguessable UUID rather than a login (PRD §8.1),
 * so an invalid-shaped id is rejected before it reaches the store.
 */
export default async function FilmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  return <FilmView id={id} />;
}
