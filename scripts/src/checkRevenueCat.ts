import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProducts,
  listOfferings,
  listPackages,
  listEntitlements,
} from "@replit/revenuecat-sdk";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP_ID = process.env.REVENUECAT_TEST_STORE_APP_ID!;

async function main() {
  const client = await getUncachableRevenueCatClient();

  console.log("\n=== PRODUCTS ===");
  const { data: products, error: prodErr } = await listProducts({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  if (prodErr) { console.error("Products error:", prodErr); }
  else {
    products.items.forEach((p: any) => {
      const storeLabel = p.app_id === TEST_APP_ID ? "[TEST]" : "[PROD]";
      console.log(`  ${storeLabel} ${p.identifier} | ${p.display_name} | ${p.product_type}`);
    });
  }

  console.log("\n=== ENTITLEMENTS ===");
  const { data: entitlements, error: entErr } = await listEntitlements({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  if (entErr) { console.error("Entitlements error:", entErr); }
  else {
    entitlements.items.forEach((e: any) => {
      console.log(`  ${e.lookup_key} (${e.object})`);
    });
  }

  console.log("\n=== OFFERINGS ===");
  const { data: offerings, error: offErr } = await listOfferings({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  if (offErr) { console.error("Offerings error:", offErr); }
  else {
    for (const o of offerings.items) {
      console.log(`  Offering: ${o.lookup_key} | is_current: ${o.is_current}`);

      const { data: pkgs, error: pkgErr } = await listPackages({
        client,
        path: { project_id: PROJECT_ID, offering_id: o.id },
        query: { limit: 20 },
      });
      if (pkgErr) { console.error("  Packages error:", pkgErr); }
      else {
        pkgs.items.forEach((pkg: any) => {
          console.log(`    Package: ${pkg.lookup_key}`);
        });
      }
    }
  }
}

main().catch(console.error);
