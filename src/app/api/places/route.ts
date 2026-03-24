import { NextRequest, NextResponse } from "next/server";

interface NominatimResult {
  display_name: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
    "ISO3166-2-lvl4"?: string;
  };
}

function buildShort(r: NominatimResult): string {
  const a = r.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const state = a.state;
  const cc = a.country_code?.toUpperCase();
  const iso = a["ISO3166-2-lvl4"];
  const stateCode = iso ? iso.split("-").pop() : undefined;

  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(stateCode ?? state);
  if (cc && cc !== "US") parts.push(cc);
  if (parts.length === 0) {
    return r.display_name.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
  }
  return parts.join(", ");
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    limit: "8",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      "User-Agent": "AetherisVision/1.0 (contact@aetherisvision.com)",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return NextResponse.json([]);

  const data: NominatimResult[] = await res.json();

  const places = data
    .map((r) => ({ short: buildShort(r) }))
    .filter((p, i, arr) => arr.findIndex((x) => x.short === p.short) === i)
    .slice(0, 5);

  return NextResponse.json(places);
}
