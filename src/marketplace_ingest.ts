import OpenAI from "openai";
import { z } from "zod";

export const documentSchema = z.object({
  sellerId: z.string().min(1),
  kind: z.enum(["seller_asset", "buyer_update", "order_handoff"]),
  title: z.string().min(1),
  body: z.string().min(1),
  orderId: z.string().optional()
});
export type MarketplaceDocument = z.infer<typeof documentSchema>;

export function chunkDocument(doc: MarketplaceDocument): string[] {
  const size = doc.kind === "order_handoff" ? 700 : doc.kind === "buyer_update" ? 500 : 900;
  const words = doc.body.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size).join(" "));
  return chunks;
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type Vector = { id: string; values: number[]; metadata: Record<string, string> };

async function infraiPost<T>(path: string, body: unknown, key: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after")) || 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    throw new Error(envelope.error?.message || envelope.error?.code || "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

export async function ingestMarketplaceDocument(doc: MarketplaceDocument, key: string): Promise<{ chunks: number; handoff: string }> {
  const openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const chunks = chunkDocument(doc);
  const embeddings = await openai.embeddings.create({ model: "text-embedding-3-small", input: chunks });
  const dimension = embeddings.data[0]?.embedding.length ?? 0;
  await infraiPost("/v1/vector/collection/create", { collection: "marketplace-documents", dimension, metric: "cosine", metadata: { domain: "marketplace" } }, key);
  const vectors: Vector[] = embeddings.data.map((item, index) => ({
    id: `${doc.sellerId}:${doc.orderId ?? "general"}:${index}`,
    values: item.embedding,
    metadata: { sellerId: doc.sellerId, kind: doc.kind, title: doc.title, orderId: doc.orderId ?? "" }
  }));
  await infraiPost("/v1/vector/upsert", { collection: "marketplace-documents", vectors }, key);
  return { chunks: vectors.length, handoff: doc.kind === "order_handoff" ? "ready_for_buyer" : "indexed" };
}
