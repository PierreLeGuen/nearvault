import { availableParallelism } from "node:os";
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
 * - `connection_limit`: pool size. Without it, Prisma 6 opened up to twice
 *   the CPU count plus one connections; node-postgres would open 10.
 * - `connect_timeout` (Prisma default 5s) and `pool_timeout` (default 10s):
 *   node-postgres has a single timeout for opening a connection and for
 *   waiting for a free one in the pool, so use the longer of the two. With
 *   both set to 0 (no limit), there is no timeout.
 * - `socket_timeout`: seconds a query may take.
 * - `sslcert`, `sslidentity`, `sslpassword`: node-postgres reads `sslcert` as
 *   a client certificate and has no PKCS#12 identity, so these are refused
 *   rather than silently changing meaning.
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
  const socketTimeout = take("socket_timeout");
  for (const key of ["sslcert", "sslidentity", "sslpassword"]) {
    if (params.has(key)) {
      throw new Error(
        `DATABASE_URL: "${key}" is not supported with the pg adapter; use sslrootcert, sslcert and sslkey with their node-postgres meaning instead.`,
      );
    }
  }
  // Prisma-only settings with no node-postgres equivalent.
  for (const key of ["pgbouncer", "statement_cache_size"]) {
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
  poolConfig.max =
    connectionLimit === undefined
      ? availableParallelism() * 2 + 1
      : Number(connectionLimit);
  if (socketTimeout !== undefined) {
    poolConfig.query_timeout = Number(socketTimeout) * 1000;
  }

  return { poolConfig, schema };
}
