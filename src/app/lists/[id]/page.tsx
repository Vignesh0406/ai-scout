import { notFound } from "next/navigation";
import ListDetailLocalClient from "@/components/ListDetailLocalClient";

export default async function ListDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  return <ListDetailLocalClient listId={id} />;
}
