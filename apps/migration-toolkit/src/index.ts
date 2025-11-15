import { parse } from "csv-parse";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

export async function runMigration() {
  const stream = createReadStream(resolve("./data/bootstrap.csv"));
  const parser = stream.pipe(parse({ columns: true }));
  for await (const record of parser) {
    console.log("migrating", record);
  }
}

void runMigration();
