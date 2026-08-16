import { SITE } from "@/lib/constants";
import { ogCard, OG_SIZE } from "../og-card";

export const runtime = "edge";
export const alt = `Omni Gridder | ${SITE.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OGImage() {
  return ogCard("Omni Gridder", "A featured example of Earth-data transformation");
}
