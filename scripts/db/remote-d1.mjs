// D1 de produccion (o de prueba) por la API REST de Cloudflare, con la misma
// interfaz que el binding `env.DB`. Lo usan los scripts que corren fuera del
// Worker (backfills, backups, la copia de datos). Cada consulta es un request
// HTTP: sirve para scripts, no para servir paginas.
//
// Requiere CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID y un token con
// permiso "D1: Edit" en CLOUDFLARE_D1_TOKEN (o CLOUDFLARE_API_TOKEN).

const API = 'https://api.cloudflare.com/client/v4';

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token =
    process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !databaseId || !token) {
    throw new Error(
      'D1 remoto: faltan CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID o CLOUDFLARE_D1_TOKEN.'
    );
  }
  return { accountId, databaseId, token };
}

function toParam(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    throw new Error(
      'D1 remoto: la API REST no acepta binarios como parametro.'
    );
  }
  return value;
}

async function call(endpoint, body) {
  const { accountId, databaseId, token } = config();
  const response = await fetch(
    `${API}/accounts/${accountId}/d1/database/${databaseId}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    const message =
      json?.errors?.map((e) => e.message).join('; ') ||
      `HTTP ${response.status}`;
    throw new Error(`D1_ERROR: ${message}`);
  }
  return json.result;
}

class RemoteD1Statement {
  constructor(sql, args = []) {
    this.sql = sql;
    this.args = args;
  }

  bind(...args) {
    return new RemoteD1Statement(this.sql, args.map(toParam));
  }

  body() {
    return { sql: this.sql, params: this.args };
  }

  async run() {
    const [result] = await call('query', this.body());
    return { success: true, results: result.results ?? [], meta: result.meta };
  }

  async all() {
    return this.run();
  }

  async first(column) {
    const { results } = await this.run();
    const row = results[0];
    if (!row) return null;
    return column ? row[column] : row;
  }

  async raw(options = {}) {
    const [result] = await call('raw', this.body());
    const columns = result.results?.columns ?? [];
    const rows = result.results?.rows ?? [];
    return options.columnNames ? [columns, ...rows] : rows;
  }
}

export function createRemoteD1() {
  config();
  return {
    prepare(sql) {
      return new RemoteD1Statement(sql);
    },
    // La API ejecuta el lote como una transaccion, igual que el binding.
    async batch(statements) {
      const results = await call('query', {
        batch: statements.map((s) => s.body()),
      });
      return results.map((r) => ({
        success: true,
        results: r.results ?? [],
        meta: r.meta,
      }));
    },
    async exec(sql) {
      await call('query', { sql });
      return { count: 1, duration: 0 };
    },
  };
}
