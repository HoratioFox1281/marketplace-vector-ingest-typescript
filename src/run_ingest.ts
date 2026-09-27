import { ingestMarketplaceDocument, documentSchema } from "./marketplace_ingest.js";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the ingest script");
const document = documentSchema.parse({ sellerId: "seller-demo", kind: "buyer_update", title: "Dispatch update", body: "The parcel left the warehouse and is moving to the buyer." });
const result = await ingestMarketplaceDocument(document, key);
console.log(JSON.stringify(result));
