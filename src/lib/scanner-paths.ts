/**
 * Paths que solo piden los scanners de vulnerabilidades: ninguna ruta de
 * MundoBL se llama asi. Los usan:
 * - cloudflare/worker.ts: 404 inmediato, antes de Next (no gasta CPU en
 *   renderizar la pagina de error), salvo en /admin;
 * - src/proxy.ts: en /admin ademas registra la IP para poder bloquearla.
 * Sin alias `@/`: el Worker lo importa con ruta relativa.
 */
export const SCANNER_PATTERNS = [
  /\.php/i,
  /\/wp-/i,
  /\/wordpress/i,
  /\/\.env/i,
  /\/\.git/i,
  /\/\.aws/i,
  /\/\.docker/i,
  /\/cgi-bin/i,
  /\/phpmyadmin/i,
  /\/myadmin/i,
  /\/mysql/i,
  /\/adminer/i,
  /\/phpinfo/i,
  /\/xmlrpc/i,
  /\/config\.(json|yml|yaml|xml|bak|old)/i,
  /\/backup/i,
  /\/debug/i,
  /\/shell/i,
  /\/eval/i,
  /\/exec/i,
  /\/cmd/i,
  /\/console/i,
  /\/actuator/i,
  /\/api\/v1\/pods/i,
  /\/solr/i,
  /\/struts/i,
  /\/jenkins/i,
  /\/\.well-known\/security\.txt/i,
];

export function isScannerPath(pathname: string): boolean {
  return SCANNER_PATTERNS.some((pattern) => pattern.test(pathname));
}
