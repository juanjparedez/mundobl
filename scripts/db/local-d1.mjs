// D1 local sobre un archivo SQLite (better-sqlite3), con la misma interfaz
// que el binding `env.DB` del Worker. Lo usan `npm run dev`, las pruebas y
// los scripts contra la base local.
//
// Por que no el adapter de better-sqlite3 de Prisma: ese SI tiene
// transacciones, y produccion (D1) no. Con este shim Prisma usa el mismo
// adapter que en produccion (@prisma/adapter-d1), asi una prueba local no
// puede pasar gracias a un rollback que en D1 no existe.
//
// Tambien aplica los limites de D1 que mas se pisan: 100 parametros por
// consulta y foreign keys siempre activas.

import Database from 'better-sqlite3';

export const D1_MAX_BOUND_PARAMETERS = 100;

function toSqliteValue(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (Array.isArray(value)) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return value;
}

function fromSqliteValue(value) {
  if (Buffer.isBuffer(value)) {
    return value.buffer.slice(
      value.byteOffset,
      value.byteOffset + value.byteLength
    );
  }
  return value;
}

class LocalD1Statement {
  constructor(db, sql, args = []) {
    this.db = db;
    this.sql = sql;
    this.args = args;
  }

  bind(...args) {
    if (args.length > D1_MAX_BOUND_PARAMETERS) {
      throw new Error(
        `D1_ERROR: too many SQL variables (${args.length} > ${D1_MAX_BOUND_PARAMETERS})`
      );
    }
    return new LocalD1Statement(this.db, this.sql, args.map(toSqliteValue));
  }

  prepared() {
    return this.db.prepare(this.sql);
  }

  execute() {
    const stmt = this.prepared();
    if (stmt.reader) {
      const rows = stmt.all(...this.args);
      return {
        success: true,
        results: rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, fromSqliteValue(v)])
          )
        ),
        meta: { changes: 0, last_row_id: 0, rows_read: rows.length },
      };
    }
    const info = stmt.run(...this.args);
    return {
      success: true,
      results: [],
      meta: {
        changes: info.changes,
        last_row_id: Number(info.lastInsertRowid),
      },
    };
  }

  async run() {
    return this.execute();
  }

  async all() {
    return this.execute();
  }

  async first(column) {
    const [row] = this.execute().results;
    if (!row) return null;
    return column ? row[column] : row;
  }

  async raw(options = {}) {
    const stmt = this.prepared();
    if (!stmt.reader) {
      stmt.run(...this.args);
      return options.columnNames ? [[]] : [];
    }
    const columns = stmt.columns().map((c) => c.name);
    const rows = stmt
      .raw(true)
      .all(...this.args)
      .map((row) => row.map(fromSqliteValue));
    return options.columnNames ? [columns, ...rows] : rows;
  }
}

export function createLocalD1(file) {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return {
    prepare(sql) {
      return new LocalD1Statement(db, sql);
    },
    // Igual que D1: el lote entero es una transaccion (todo o nada).
    async batch(statements) {
      return db.transaction(() => statements.map((s) => s.execute()))();
    },
    async exec(sql) {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
    close() {
      db.close();
    },
  };
}
