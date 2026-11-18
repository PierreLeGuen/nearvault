import type { PoolConfig } from "pg";

/**
 * Prisma 6 read Prisma-specific options from DATABASE_URL. The Prisma 7 driver
 * adapter connects through node-postgres, which ignores those options and
 * reads `sslmode` differently (for example `require` verifies the server
 * certificate, and no `sslmode` means no TLS). Translate the URL so
 * connections behave as they did with Prisma 6:
 *
 * - `sslmode=disable`: no TLS.
 * - `sslmode=require` or `prefer`: TLS without certificate verification,
 *   unless `sslaccept=strict`.
 * - no `sslmode`: Prisma 6 tried TLS first. Remote hosts get TLS as with
 *   `require`; local hosts connect without TLS.
 * - `schema`: passed to the adapter (defaults to `public`).
 * - `connection_limit`: pool size.
 * - `connect_timeout` (Prisma default 5s) and `pool_timeout` (default 10s):
 *   node-postgres has a single timeout for opening a connection and for
 *   waiting for a free one in the pool, so use the longer of the two. With
 *   both set to 0 (no limit), there is no timeout.
 */
export function pgOptionsFromDatabaseUrl(databaseUrl: string): {
  poolConfig: PoolConfig;
  schema?: string;
} {
  const url = new URL(databaseUrl);
  const params = url.searchParams;
  const take = (key: string) => {
    const value = params.get(key) ?? undefined;
    params.delete(key);
    return value;
  };

  const sslmode = take("sslmode");
  const sslaccept = take("sslaccept");
  const schema = take("schema");
  const connectionLimit = take("connection_limit");
  const connectTimeout = take("connect_timeout");
  const poolTimeout = take("pool_timeout");
  // Prisma-only settings with no node-postgres equivalent.
  for (const key of ["pgbouncer", "socket_timeout", "statement_cache_size"]) {
    take(key);
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
  const isLocal = localHosts.has(url.hostname) || url.hostname === "";
  const verified = sslaccept === "strict";

  let ssl: PoolConfig["ssl"];
  if (sslmode === "disable") {
    ssl = false;
  } else if (sslmode === "require" || sslmode === "prefer") {
    ssl = { rejectUnauthorized: verified };
  } else if (sslmode === undefined) {
    ssl = isLocal ? false : { rejectUnauthorized: verified };
  } else {
    // verify-ca / verify-full and other libpq modes: let node-postgres apply them.
    params.set("sslmode", sslmode);
  }

  const timeoutSeconds = Math.max(
    Number(connectTimeout ?? 5),
    Number(poolTimeout ?? 10),
  );
  const poolConfig: PoolConfig = {
    connectionString: url.toString(),
    // 0 means no timeout for node-postgres too.
    connectionTimeoutMillis: timeoutSeconds * 1000,
  };
  if (ssl !== undefined) poolConfig.ssl = ssl;
  if (connectionLimit !== undefined) poolConfig.max = Number(connectionLimit);

  return { poolConfig, schema };
}
