import { Client, auth } from "cassandra-driver";
import fs from "fs";
import path from "path";

(async () => {
  const schemaPath = path.resolve(__dirname, "db.cql");
  const client = new Client({
    contactPoints: ["127.0.0.1"],
    protocolOptions: { port: 41600 },
    localDataCenter: "dc1",
    keyspace: undefined,
  });

  await client.connect();
  const cql = fs.readFileSync(schemaPath, "utf8");
  for (const stmt of cql.split(";").map(s => s.trim()).filter(Boolean)) {
    await client.execute(stmt + ";");
  }
  await client.shutdown();
  console.log("Schema applied from", schemaPath);
})();
