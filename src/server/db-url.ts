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
 *   the physical core count plus one connections; node-postgres would open
 *   10. Node only reports logical CPUs, so count two per core, which never
 *   exceeds Prisma 6's default.
 * - `connect_timeout` (Prisma default 5s) and `pool_timeout` (default 10s):
 *   node-postgres has a single timeout for opening a connection and for
 *   waiting for a free one in the pool, so use the longer of the two. With
 *   both set to 0 (no limit), there is no timeout.
 * - `socket_timeout`: seconds a query may take.
 * - Timeouts too large for a Node timer mean no timeout.
 * - Prisma 6's `sslcert` (the server certificate), `sslidentity` and
 *   `sslpassword` are refused rather than silently changing meaning:
 *   node-postgres reads `sslcert` as a client certificate (with `sslkey`) and
 *   has no PKCS#12 identity.
 * - A URL that uses node-postgres's own certificate options (`sslrootcert`,
 *   or `sslcert` with `sslkey`) is left to node-postgres, `sslmode` included.
 *   Note that the Prisma CLI (migrations) still reads DATABASE_URL in
 *   Prisma's own format.
 * - Numeric options must be whole numbers, as Prisma 6 required.
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
  const numbers = {
    connection_limit: connectionLimit,
    connect_timeout: connectTimeout,
    pool_timeout: poolTimeout,
    socket_timeout: socketTimeout,
  };
  for (const [name, value] of Object.entries(numbers)) {
    if (value !== undefined && !/^\d+$/.test(value)) {
      throw new Error(`DATABASE_URL: ${name} must be a whole number.`);
    }
  }
  const pgTls =
    params.has("sslrootcert") ||
    (params.has("sslcert") && params.has("sslkey"));
  const prismaTlsParams = ["sslidentity", "sslpassword"];
  if (params.has("sslcert") && !params.has("sslkey")) {
    prismaTlsParams.push("sslcert");
  }
  for (const key of prismaTlsParams) {
    if (params.has(key)) {
      throw new Error(
        `DATABASE_URL: Prisma's "${key}" is not supported with the pg adapter; use sslrootcert for the server certificate, or sslcert with sslkey for a client certificate.`,
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
  if (pgTls) {
    // node-postgres applies its certificate options from the URL itself.
    if (sslmode !== undefined) params.set("sslmode", sslmode);
  } else if (sslmode === "disable") {
    ssl = false;
  } else if (sslmode === "require" || sslmode === "prefer") {
    ssl = { rejectUnauthorized: verified };
  } else if (sslmode === undefined) {
    ssl = isLocal ? false : { rejectUnauthorized: verified };
  } else {
    // verify-ca / verify-full and other libpq modes: let node-postgres apply them.
    params.set("sslmode", sslmode);
  }

  // Node timers cap at 2^31 - 1 ms; node-postgres treats 0 as no timeout.
  const millis = (seconds: number) => {
    const ms = seconds * 1000;
    return ms > 0 && ms <= 2 ** 31 - 1 ? ms : 0;
  };
  const poolConfig: PoolConfig = {
    connectionString: url.toString(),
    connectionTimeoutMillis: millis(
      Math.max(Number(connectTimeout ?? 5), Number(poolTimeout ?? 10)),
    ),
  };
  if (ssl !== undefined) poolConfig.ssl = ssl;
  poolConfig.max =
    connectionLimit === undefined
      ? Math.max(1, Math.floor(availableParallelism() / 2)) * 2 + 1
      : Number(connectionLimit);
  if (socketTimeout !== undefined && millis(Number(socketTimeout)) > 0) {
    poolConfig.query_timeout = millis(Number(socketTimeout));
  }

  return { poolConfig, schema };
}
