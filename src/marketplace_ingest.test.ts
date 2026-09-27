import { strict as assert } from "node:assert";
import { chunkDocument, documentSchema } from "./marketplace_ingest.js";

const input = documentSchema.parse({ sellerId: "seller-7", kind: "order_handoff", title: "Packed order", body: Array.from({ length: 701 }, (_, i) => `word${i}`).join(" "), orderId: "order-9" });
const chunks = chunkDocument(input);
assert.equal(chunks.length, 2);
assert.equal(chunks[0].split(" ").length, 700);
assert.equal(chunks[1], "word700");
console.log("order handoff chunk decision: 700-word chunks");
