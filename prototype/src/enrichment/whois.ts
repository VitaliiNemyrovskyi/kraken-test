import { whoisDomain } from "whoiser";

export interface WhoisRecord {
  registrar: string | null;
  registrantOrg: string | null;
  registrantCountry: string | null;
  domainCreated: string | null;     // ISO date
  domainExpires: string | null;
  nameservers: string[];
}

// Try a list of common keys against the whoiser per-registry result.
// whoiser returns shape { "<registry>": { "Domain Name": ..., "Registrar": ..., ... } }
function pickFirst(record: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0].trim();
  }
  return null;
}

function pickArray(record: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = record[k];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string" && v.includes("\n")) return v.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normaliseDate(s: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function lookupWhois(domain: string): Promise<WhoisRecord> {
  const raw = (await whoisDomain(domain, { follow: 2, timeout: 8000 })) as Record<
    string,
    Record<string, unknown>
  >;
  // whoiser returns map of registry → fields. Pick the first non-empty result.
  const records = Object.values(raw).filter(
    (r) => typeof r === "object" && r !== null,
  );
  const first: Record<string, unknown> =
    records.find((r) => Object.keys(r).length > 0) ?? {};

  const registrar = pickFirst(first, [
    "Registrar",
    "Sponsoring Registrar",
    "Registrar Name",
  ]);
  const registrantOrg = pickFirst(first, [
    "Registrant Organization",
    "Registrant Organisation",
    "Registrant",
    "Registrant Name",
    "Holder",
  ]);
  const registrantCountry = pickFirst(first, [
    "Registrant Country",
    "Country",
    "Registrant Country/Economy",
  ]);
  const domainCreated = normaliseDate(
    pickFirst(first, ["Created Date", "Creation Date", "Registered", "created"]),
  );
  const domainExpires = normaliseDate(
    pickFirst(first, ["Expiry Date", "Expiration Date", "Expires", "Registry Expiry Date"]),
  );
  const nameservers = pickArray(first, ["Name Server", "Name Servers", "Nameservers"]);

  return {
    registrar,
    registrantOrg,
    registrantCountry,
    domainCreated,
    domainExpires,
    nameservers,
  };
}
