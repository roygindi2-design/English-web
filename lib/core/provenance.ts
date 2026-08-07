/**
 * T-012 — the guard that keeps a wrong NGSL file from becoming a wrong fact.
 *
 * Two independent things can be wrong about a source file and only one of them
 * is visible in the data: the row count (measurable) and where the bytes came
 * from (not measurable after the fact — it has to be checked at fetch time and
 * recorded). R-004 is the case that made this real: a mirror on a domain nobody
 * controls ships 2,801 rows, parses perfectly, and silently shifts every
 * frequency rank in the product.
 *
 * Pure: no fetch, no fs. The caller does the I/O and hands the result here.
 */
import { dataSource, type SourceId } from './dataSources';

export const NGSL_VERSION = '1.2' as const;
export const NGSL_EXPECTED_ROWS = 2809 as const;

export type ProvenanceVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

const OK: ProvenanceVerdict = Object.freeze({ ok: true });

function fail(reason: string): ProvenanceVerdict {
  return Object.freeze({ ok: false, reason });
}

/**
 * True when `hostname` is the domain itself or a subdomain of it.
 *
 * `endsWith(domain)` alone accepts `evil-newgeneralservicelist.com`; requiring
 * the dot is what makes it a label boundary rather than a substring.
 */
function isHostOf(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function checkSourceUrl(id: SourceId, url: string): ProvenanceVerdict {
  const source = dataSource(id);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return fail(
      `"${url}" is not an absolute url — ${id} must be fetched from https://${source.host}`,
    );
  }
  if (parsed.protocol !== 'https:') {
    return fail(`${id} was fetched over ${parsed.protocol} — only https is accepted (R-004)`);
  }
  if (!isHostOf(parsed.hostname, source.host)) {
    return fail(
      `${id} was fetched from "${parsed.hostname}" — the only permitted host is "${source.host}" (R-004)`,
    );
  }
  return OK;
}

export function checkNgslRowCount(rows: number): ProvenanceVerdict {
  if (rows === NGSL_EXPECTED_ROWS) return OK;
  // 2,801 is named explicitly: it is the count of the early mirrored version
  // (F-005 · R-004), it parses cleanly, and without the name the message reads
  // as a parser bug to whoever hits it.
  const known =
    rows === 2801
      ? 'that is the early version mirrored on the domain we do not control (F-005 · R-004)'
      : `${rows} rows is a different list, and 2801 in particular is the early mirrored version (F-005 · R-004)`;
  return fail(
    `NGSL has ${rows} rows, expected exactly ${NGSL_EXPECTED_ROWS} (v${NGSL_VERSION}) — ${known}.`,
  );
}
