import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const CMS_BASE = "https://data.cms.gov/provider-data/api/1/datastore/query";

const DATASETS = {
  generalInfo: "yc9t-dgbk",
  providerData: "252m-zfp9",
  cahps: "gxki-hrr8",
  spending: "0ddf-4325",
} as const;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function cmsQuery(
  datasetId: string,
  conditions: Array<{ property: string; value: string; operator: string }>,
  limit = 500,
  offset = 0
): Promise<{ results: Record<string, string>[]; count: number }> {
  const url = new URL(`${CMS_BASE}/${datasetId}/0`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  conditions.forEach((c, i) => {
    url.searchParams.set(`conditions[${i}][property]`, c.property);
    url.searchParams.set(`conditions[${i}][value]`, c.value);
    url.searchParams.set(`conditions[${i}][operator]`, c.operator);
  });

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`CMS API returned ${res.status}`);
  }
  return res.json() as Promise<{ results: Record<string, string>[]; count: number }>;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapGeneralInfoToProvider(row: Record<string, string>) {
  return {
    id: `cms-${row.cms_certification_number_ccn}`,
    ccn: row.cms_certification_number_ccn,
    name: titleCase(row.facility_name || ""),
    address: titleCase(row.address_line_1 || ""),
    city: titleCase(row.citytown || ""),
    state: row.state || "",
    zip: row.zip_code || "",
    phone: row.telephone_number || "",
    county: titleCase(row.countyparish || ""),
    cmsOwnershipType: row.ownership_type || "",
    certificationDate: row.certification_date || "",
    cmsRegion: row.cms_region || "",
    acceptsMedicare: true,
    acceptsMedicaid: false,
    services: [
      "Skilled nursing",
      "Medical social work",
      "Physician services",
      "Counseling",
      "Home health aide",
    ],
    accreditations: ["Medicare Certified"],
    specialties: [],
    description: `${titleCase(row.facility_name || "")} is a Medicare-certified hospice provider located in ${titleCase(row.citytown || "")}, ${row.state}. Ownership type: ${row.ownership_type || "N/A"}. Certified since ${row.certification_date || "N/A"}.`,
    medicareGovUrl: `https://www.medicare.gov/care-compare/details/hospice/${row.cms_certification_number_ccn}`,
  };
}

router.get("/cms/providers", async (req: Request, res: Response) => {
  try {
    const { state, zip, limit: limitParam, offset: offsetParam } = req.query;
    if (!state && !zip) {
      res.status(400).json({ error: "Provide 'state' (2-letter abbreviation) or 'zip' (5-digit ZIP code) query parameter" });
      return;
    }

    const cacheKey = `providers:${state || ""}:${zip || ""}:${limitParam || 50}:${offsetParam || 0}`;
    const cached = getCached<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const stateStr = String(state || "").toUpperCase();
    const zipStr = String(zip || "");
    if (state && !/^[A-Z]{2}$/.test(stateStr)) {
      res.status(400).json({ error: "State must be a 2-letter abbreviation (e.g., CA, TX)" });
      return;
    }
    if (zip && !/^\d{5}$/.test(zipStr)) {
      res.status(400).json({ error: "ZIP code must be exactly 5 digits" });
      return;
    }

    const conditions: Array<{ property: string; value: string; operator: string }> = [];
    if (state) {
      conditions.push({
        property: "state",
        value: stateStr,
        operator: "=",
      });
    }
    if (zip) {
      conditions.push({
        property: "zip_code",
        value: zipStr,
        operator: "=",
      });
    }

    const limit = Math.min(Number(limitParam) || 50, 200);
    const offset = Number(offsetParam) || 0;

    const data = await cmsQuery(DATASETS.generalInfo, conditions, limit, offset);
    const providers = data.results.map(mapGeneralInfoToProvider);
    const result = {
      providers,
      total: data.count,
      limit,
      offset,
      source: "CMS Provider Data Catalog",
      datasetId: DATASETS.generalInfo,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("CMS providers error:", message);
    res.status(502).json({
      error: "Unable to fetch data from CMS. Please try again later.",
      detail: message,
    });
  }
});

router.get("/cms/quality/:ccn", async (req: Request, res: Response) => {
  try {
    const { ccn } = req.params;
    if (!ccn || ccn.length < 4) {
      res.status(400).json({ error: "Valid CCN (CMS Certification Number) is required" });
      return;
    }

    const cacheKey = `quality:${ccn}`;
    const cached = getCached<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const [providerData, cahpsData] = await Promise.all([
      cmsQuery(DATASETS.providerData, [
        { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
      ], 200),
      cmsQuery(DATASETS.cahps, [
        { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
      ], 100),
    ]);

    const qualityMeasures: Record<string, { code: string; name: string; score: string; percentile?: string }> = {};
    for (const row of providerData.results) {
      const code = row.measure_code || "";
      if (code.endsWith("_OBSERVED") || code === "Average_Daily_Census") {
        qualityMeasures[code] = {
          code,
          name: row.measure_name || "",
          score: row.score || "",
          percentile: undefined,
        };
      }
      if (code.endsWith("_PERCENTILE")) {
        const observedCode = code.replace("_PERCENTILE", "_OBSERVED");
        if (qualityMeasures[observedCode]) {
          qualityMeasures[observedCode].percentile = row.score || "";
        }
      }
    }

    let hciScore: string | null = null;
    let perBeneficiarySpending: string | null = null;
    let avgDailyCensus: string | null = null;
    let visitsNearDeath: string | null = null;
    let compositeProcessMeasure: string | null = null;

    for (const row of providerData.results) {
      if (row.measure_code === "H_012_00_OBSERVED") hciScore = row.score;
      if (row.measure_code === "H_012_07_OBSERVED") perBeneficiarySpending = row.score;
      if (row.measure_code === "Average_Daily_Census") avgDailyCensus = row.score;
      if (row.measure_code === "H_011_01_OBSERVED") visitsNearDeath = row.score;
      if (row.measure_code === "H_008_01_OBSERVED") compositeProcessMeasure = row.score;
    }

    const cahpsMeasures: Record<string, { code: string; name: string; score: string; starRating: string }> = {};
    let summaryStarRating: string | null = null;
    for (const row of cahpsData.results) {
      const code = row.measure_code || "";
      cahpsMeasures[code] = {
        code,
        name: row.measure_name || "",
        score: row.score || "",
        starRating: row.star_rating || "",
      };
      if (code === "SUMMARY_STAR_RATING") {
        summaryStarRating = row.star_rating || null;
      }
    }

    const result = {
      ccn,
      hciScore,
      summaryStarRating,
      compositeProcessMeasure,
      perBeneficiarySpending,
      avgDailyCensus,
      visitsNearDeath,
      cahps: {
        overallRating9or10: cahpsMeasures["RATING_TBV"]?.score || null,
        wouldDefinitelyRecommend: cahpsMeasures["RECOMMEND_TBV"]?.score || null,
        alwaysTreatedWithRespect: cahpsMeasures["RESPECT_TBV"]?.score || null,
        alwaysGotPainHelp: cahpsMeasures["SYMPTOMS_TBV"]?.score || null,
        alwaysCommunicatedWell: cahpsMeasures["TEAM_COMM_TBV"]?.score || null,
        alwaysTimelyHelp: cahpsMeasures["TIMELY_CARE_TBV"]?.score || null,
        alwaysRightEmotionalSupport: cahpsMeasures["EMO_REL_TBV"]?.score || null,
        definitelyReceivedTraining: cahpsMeasures["TRAINING_TBV"]?.score || null,
      },
      qualityMeasures: Object.values(qualityMeasures),
      cahpsRaw: Object.values(cahpsMeasures),
      source: "CMS Hospice Quality Reporting Program & CAHPS Hospice Survey",
      medicareGovUrl: `https://www.medicare.gov/care-compare/details/hospice/${ccn}`,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("CMS quality error:", message);
    res.status(502).json({
      error: "Unable to fetch quality data from CMS. Please try again later.",
      detail: message,
    });
  }
});

router.get("/cms/quality-summary", async (req: Request, res: Response) => {
  try {
    const { ccns } = req.query;
    if (!ccns || typeof ccns !== "string") {
      res.status(400).json({ error: "Provide 'ccns' as comma-separated CCNs" });
      return;
    }
    const ccnList = ccns.split(",").filter((c) => c.length >= 4).slice(0, 20);
    if (ccnList.length === 0) {
      res.json({ summaries: {} });
      return;
    }

    const cacheKey = `quality-summary:${ccnList.sort().join(",")}`;
    const cached = getCached<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const summaries: Record<string, { hciScore: string | null; starRating: string | null; avgDailyCensus: string | null }> = {};

    await Promise.all(
      ccnList.map(async (ccn) => {
        try {
          const [provData, cahpsData] = await Promise.all([
            cmsQuery(DATASETS.providerData, [
              { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
            ], 50),
            cmsQuery(DATASETS.cahps, [
              { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
            ], 10),
          ]);

          let hciScore: string | null = null;
          let avgDailyCensus: string | null = null;
          for (const row of provData.results) {
            if (row.measure_code === "H_012_00_OBSERVED") hciScore = row.score;
            if (row.measure_code === "Average_Daily_Census") avgDailyCensus = row.score;
          }

          let starRating: string | null = null;
          for (const row of cahpsData.results) {
            if (row.measure_code === "SUMMARY_STAR_RATING") {
              starRating = row.star_rating || null;
            }
          }

          summaries[ccn] = { hciScore, starRating, avgDailyCensus };
        } catch {
          summaries[ccn] = { hciScore: null, starRating: null, avgDailyCensus: null };
        }
      })
    );

    const result = { summaries, source: "CMS Hospice Quality Reporting Program" };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("CMS quality summary error:", message);
    res.status(502).json({
      error: "Unable to fetch quality summaries from CMS.",
      detail: message,
    });
  }
});

router.get("/cms/spending/:ccn", async (req: Request, res: Response) => {
  try {
    const { ccn } = req.params;
    if (!ccn || ccn.length < 4) {
      res.status(400).json({ error: "Valid CCN (CMS Certification Number) is required" });
      return;
    }

    const cacheKey = `spending:${ccn}`;
    const cached = getCached<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const [providerMeasures, generalInfo] = await Promise.all([
      cmsQuery(DATASETS.providerData, [
        { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
      ], 200),
      cmsQuery(DATASETS.generalInfo, [
        { property: "cms_certification_number_ccn", value: ccn, operator: "=" },
      ], 1),
    ]);

    if (providerMeasures.results.length === 0) {
      res.json({
        ccn,
        found: false,
        source: "CMS Hospice Quality Reporting Program",
      });
      return;
    }

    let perBeneficiarySpending: string | null = null;
    let avgDailyCensus: string | null = null;
    const utilizationMeasures: Array<{ code: string; name: string; score: string }> = [];

    for (const row of providerMeasures.results) {
      const code = row.measure_code || "";
      if (code === "H_012_07_OBSERVED") perBeneficiarySpending = row.score;
      if (code === "Average_Daily_Census") avgDailyCensus = row.score;

      if (
        code.startsWith("H_012") ||
        code === "Average_Daily_Census"
      ) {
        utilizationMeasures.push({
          code,
          name: row.measure_name || "",
          score: row.score || "",
        });
      }
    }

    let officeVisitCosts = null;
    const providerZip = generalInfo.results[0]?.zip_code;
    if (providerZip) {
      try {
        const spendingData = await cmsQuery(DATASETS.spending, [
          { property: "zip_code", value: providerZip, operator: "=" },
        ], 1);
        if (spendingData.results.length > 0) {
          const s = spendingData.results[0];
          officeVisitCosts = {
            zip: providerZip,
            newPatientCopay: s.mode_copay_for_new_patient || null,
            establishedPatientCopay: s.mode_copay_for_established_patient || null,
            newPatientMedicarePricing: s.mode_medicare_pricing_for_new_patient || null,
            establishedPatientMedicarePricing: s.mode_medicare_pricing_for_established_patient || null,
          };
        }
      } catch {
        officeVisitCosts = null;
      }
    }

    const result = {
      ccn,
      found: true,
      perBeneficiarySpending,
      avgDailyCensus,
      utilizationMeasures,
      officeVisitCosts,
      source: "CMS Hospice Quality Reporting Program & Hospice Office Visit Costs",
      medicareGovUrl: `https://www.medicare.gov/care-compare/details/hospice/${ccn}`,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("CMS spending error:", message);
    res.status(502).json({
      error: "Unable to fetch spending data from CMS. Please try again later.",
      detail: message,
    });
  }
});

export default router;
