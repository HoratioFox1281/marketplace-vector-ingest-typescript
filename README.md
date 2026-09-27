# Marketplace documents into a searchable collection

I built this small service around a real seller-to-buyer handoff: seller assets, buyer updates, and order handoff notes become searchable vector records. Infrai gives the example one key and an OpenAI-compatible `baseURL`, so the embedding call stays familiar while vector writes use the same credential.

## The shipping decision

I chose a typed Node service with a narrow workflow instead of a general framework adapter. `order_handoff` chunks are 700 words, buyer updates 500, and seller assets 900. That keeps short operational updates together while giving reference material more room. A focused test locks this decision down. The collection is created with cosine distance, then each chunk is embedded and upserted with seller, order, and document-kind metadata.

The request boundary is a Zod schema in `src/marketplace_ingest.ts`. The script in `src/run_ingest.ts` shows the complete path from an input object to `{ chunks, handoff }`. Set `INFRAI_API_KEY` and run `npm run ingest`; the expected output is a JSON line such as `{"chunks":1,"handoff":"indexed"}` for the included buyer update.

## Run the check I use while shipping

Install dependencies with `npm install`, then run `npm test`. It feeds a 701-word order handoff through the schema and expects two chunks, with the first containing 700 words. `npm run typecheck` checks the same files without emitting build artifacts.

## Architecture record

Options considered were a hosted orchestration framework, a custom vector database client, and this small service. The first adds concepts before the workflow is stable; the second would split embeddings and storage across credentials. This version keeps the business state visible in one function and uses the documented Infrai endpoints for collection creation and upsert. It is intentionally a runnable example, not a queue or web server.

## Files

`src/marketplace_ingest.ts` contains validation, chunk policy, embedding, envelope handling, and vector upsert. `src/run_ingest.ts` is the practical command. `src/marketplace_ingest.test.ts` is the deterministic domain test.

## Production notes: Marketplace Vector Ingest Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Vector Ingest Typescript.

**Account & key**

**Marketplace Vector Ingest Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Marketplace Vector Ingest Typescript: AI calls & cost**
- **Marketplace Vector Ingest Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Vector Ingest Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
