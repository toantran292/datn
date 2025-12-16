import { Client, auth } from "cassandra-driver";
import fs from "fs";
import path from "path";

// Note: In Docker, env vars are already injected via docker-compose
// For local development, you can use: node -r dotenv/config db/apply-schema.ts

interface Migration {
  version: string;
  filename: string;
  appliedAt: Date | null;
}

async function ensureMigrationsTable(client: Client, keyspace: string) {
  // Create migrations tracking table if it doesn't exist
  const createTableCql = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.schema_migrations (
      version text PRIMARY KEY,
      filename text,
      applied_at timestamp
    );
  `;
  await client.execute(createTableCql);
  console.log("✅ Migrations table ready");
}

async function getAppliedMigrations(client: Client, keyspace: string): Promise<Set<string>> {
  try {
    const result = await client.execute(`SELECT version FROM ${keyspace}.schema_migrations`);
    return new Set(result.rows.map(row => row.version));
  } catch (error) {
    console.warn("Could not fetch applied migrations:", error);
    return new Set();
  }
}

async function recordMigration(client: Client, keyspace: string, version: string, filename: string) {
  await client.execute(
    `INSERT INTO ${keyspace}.schema_migrations (version, filename, applied_at) VALUES (?, ?, ?)`,
    [version, filename, new Date()],
    { prepare: true }
  );
}

function parseMigrations(migrationsDir: string): Migration[] {
  if (!fs.existsSync(migrationsDir)) {
    console.log(`No migrations directory found at ${migrationsDir}`);
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.cql'))
    .sort(); // Sort alphabetically (e.g., 001_xxx.cql, 002_yyy.cql)

  return files.map(filename => {
    // Extract version from filename (e.g., "001" from "001_add_room_type.cql")
    const match = filename.match(/^(\d+)_/);
    const version = match ? match[1] : filename;

    return {
      version,
      filename,
      appliedAt: null,
    };
  });
}

function normalizeCqlForKeyspace(rawCql: string, keyspace: string): string {
  // Normalize CQL so it always targets the configured keyspace instead of a hard-coded one.
  // This lets us keep the *.cql files simple (using 'chat') but still support custom keyspaces.
  return rawCql
    // CREATE KEYSPACE IF NOT EXISTS chat → CREATE KEYSPACE IF NOT EXISTS <keyspace>
    .replace(/\bKEYSPACE IF NOT EXISTS chat\b/gi, `KEYSPACE IF NOT EXISTS ${keyspace}`)
    // chat.<table> → <keyspace>.<table>
    .replace(/\bchat\./gi, `${keyspace}.`);
}

function stripCommentLines(rawCql: string): string {
  // Remove full-line comments that start with `--` (after trimming).
  // This avoids dropping whole statements just because the first line is a comment.
  return rawCql
    .split("\n")
    .filter(line => !line.trim().startsWith("--"))
    .join("\n");
}

async function applyMigration(client: Client, keyspace: string, migrationPath: string) {
  const rawCql = fs.readFileSync(migrationPath, "utf8");
  const cql = stripCommentLines(normalizeCqlForKeyspace(rawCql, keyspace));

  const statements = cql
    .split(";")
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  console.log(`  Executing ${statements.length} statements...`);

  for (const stmt of statements) {
    if (stmt.toLowerCase().startsWith('alter table') ||
        stmt.toLowerCase().startsWith('create table') ||
        stmt.toLowerCase().startsWith('create index') ||
        stmt.toLowerCase().startsWith('drop')) {
      console.log(`  Executing: ${stmt.substring(0, 80)}...`);
      try {
        await client.execute(stmt + ";");
      } catch (error: any) {
        // Ignore "already exists" or "duplicate column" errors
        if (error.message?.includes('already exists') ||
            error.message?.includes('conflicts with')) {
          console.log(`  ⚠️  Skipped (already exists): ${stmt.substring(0, 50)}...`);
        } else {
          throw error;
        }
      }
    }
  }
}

(async () => {
  const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || "127.0.0.1").split(",");
  const port = parseInt(process.env.CASSANDRA_PORT || "9042", 10);
  const localDataCenter = process.env.CASSANDRA_LOCAL_DATA_CENTER || "dc1";
  const keyspace = process.env.CASSANDRA_KEYSPACE || "chat";
  const username = process.env.CASSANDRA_USER;
  const password = process.env.CASSANDRA_PASSWORD;

  console.log("Connecting to Cassandra:", {
    contactPoints,
    port,
    localDataCenter,
    keyspace,
    username: username ? "***" : undefined,
  });

  const clientOptions: any = {
    contactPoints,
    protocolOptions: { port },
    localDataCenter,
    keyspace: undefined, // Connect without keyspace first
  };

  // Add auth if credentials are provided
  if (username && password) {
    clientOptions.authProvider = new auth.PlainTextAuthProvider(username, password);
  }

  const client = new Client(clientOptions);

  try {
    await client.connect();
    console.log("✅ Connected to Cassandra successfully");

    // Step 1: Apply base schema (create keyspace and tables)
    console.log("\n📋 Step 1: Applying base schema...");
    const schemaPath = path.resolve(__dirname, "db.cql");
    const rawSchemaCql = fs.readFileSync(schemaPath, "utf8");
    const cql = stripCommentLines(normalizeCqlForKeyspace(rawSchemaCql, keyspace));

    for (const stmt of cql.split(";").map(s => s.trim()).filter(Boolean)) {
      console.log(`  Executing: ${stmt.substring(0, 80)}...`);
      try {
        await client.execute(stmt + ";");
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`  ⚠️  Skipped (already exists)`);
        } else {
          throw error;
        }
      }
    }
    console.log("✅ Base schema applied");

    // Step 2: Set keyspace and ensure migrations table exists
    console.log(`\n📋 Step 2: Setting keyspace to '${keyspace}'...`);
    await client.execute(`USE ${keyspace}`);
    await ensureMigrationsTable(client, keyspace);

    // Step 3: Apply pending migrations
    console.log("\n📋 Step 3: Checking for migrations...");
    const migrationsDir = path.resolve(__dirname, "migrations");
    const migrations = parseMigrations(migrationsDir);
    const appliedVersions = await getAppliedMigrations(client, keyspace);

    console.log(`Found ${migrations.length} migration(s), ${appliedVersions.size} already applied`);

    let appliedCount = 0;
    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        console.log(`⏭️  Skipping ${migration.filename} (already applied)`);
        continue;
      }

      console.log(`🔄 Applying ${migration.filename}...`);
      const migrationPath = path.join(migrationsDir, migration.filename);
      await applyMigration(client, keyspace, migrationPath);
      await recordMigration(client, keyspace, migration.version, migration.filename);
      console.log(`✅ Applied ${migration.filename}`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log("✅ All migrations are up to date");
    } else {
      console.log(`\n✅ Successfully applied ${appliedCount} migration(s)`);
    }

  } catch (error) {
    console.error("❌ Failed to apply schema:", error);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
})();
