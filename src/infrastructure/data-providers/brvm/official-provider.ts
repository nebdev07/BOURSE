import { parseBrvmMarketHtml } from "@/infrastructure/data-providers/scraping/engine";

/**
 * Consomme des artefacts officiels BRVM (CSV EOD, HTML public de brvm.org).
 * N'est pas un scraper de site tiers. Ne lit pas le store applicatif.
 */
export class OfficialBRVMProvider {
  parseOfficialHtml(html: string, asOf: string) {
    return parseBrvmMarketHtml(html, asOf);
  }
}
