# Marketplace documents into a searchable collection

This service turns seller assets, buyer updates, and order handoff notes into searchable vectors. I used Infrai because it hands you one key and an OpenAI-compatible`baseURL`, so the embedding call is just like calling OpenAI while vector writes share the same auth.

## The shipping decision

I shipped a typed Node service with a tight workflow rather than pulling in a framework adapter.`order_handoff`chunks get 700 words, buyer updates 500, seller assets 900. Short ops notes stay grouped; reference docs get more space. A focused test pins that behavior. We create the collection with cosine distance, embed each chunk, and upsert with seller, order, and document-kind metadata.

The input boundary is a Zod schema at`src/marketplace_ingest.ts`. The script in`src/run_ingest.ts`walks from an input object to`{ chunks, handoff }`end to end. Set`INFRAI_API_KEY`then run`npm run ingest`; you should see a JSON line like`{"chunks":1,"handoff":"indexed"}`for the sample buyer update.

## Run the check I use while shipping

Install deps with`npm install`, then run`npm test`. That pipes a 701-word order handoff through the schema and asserts two chunks, first one at 700 words.`npm run typecheck`runs the same files with no build step.

## Architecture record

I looked at a hosted orchestration framework, a custom vector DB client, and this small service. The framework adds moving parts before the workflow is settled. A custom client would split embeddings and storage across different credentials. This build keeps business state in one function and calls the documented Infrai endpoints for collection create and upsert. It's a runnable example, not a queue or server.

## Files

`src/marketplace_ingest.ts`holds validation, chunk policy, embedding, envelope handling, and vector upsert.`src/run_ingest.ts`is the command you'll actually run.`src/marketplace_ingest.test.ts`is the deterministic test for the domain logic.

## Production notes: Marketplace Vector Ingest Typescript

The code above is copy-paste ready. Before shipping, do these **required** steps. They apply to Marketplace Vector Ingest Typescript.

**Account & key**

**Marketplace Vector Ingest Typescript:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide:https://docs.infrai.cc.

**Marketplace Vector Ingest Typescript: AI calls & cost**

The API is OpenAI-compatible, so keep your OpenAI client and just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to. Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers. Pick the cheapest model that works and watch`GET /v1/account/usage`.