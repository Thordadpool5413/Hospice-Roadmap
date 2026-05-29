import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "Hospice Roadmap";

// ── Plans ───────────────────────────────────────────────────────────────────
// Caregiver tier — $4.99/mo  (core tracking + guidance)
// Companion tier — $9.99/mo  (everything + Ragna AI)

const PLANS = [
  {
    label: "Caregiver",
    identifier: "hospice_caregiver_monthly",
    playStoreIdentifier: "hospice_caregiver_monthly:monthly",
    displayName: "Caregiver Monthly",
    userFacingTitle: "Caregiver Plan — Monthly",
    duration: "P1M" as const,
    prices: [
      { amount_micros: 4990000, currency: "USD" },
      { amount_micros: 4490000, currency: "EUR" },
    ],
    packageIdentifier: "$rc_monthly",
    packageDisplayName: "Caregiver Monthly",
  },
  {
    label: "Companion",
    identifier: "hospice_companion_monthly",
    playStoreIdentifier: "hospice_companion_monthly:monthly",
    displayName: "Companion Monthly",
    userFacingTitle: "Companion Plan — Monthly",
    duration: "P1M" as const,
    prices: [
      { amount_micros: 9990000, currency: "USD" },
      { amount_micros: 8990000, currency: "EUR" },
    ],
    packageIdentifier: "companion_monthly",
    packageDisplayName: "Companion Monthly",
  },
] as const;

const APP_STORE_APP_NAME = "Hospice Roadmap iOS";
const APP_STORE_BUNDLE_ID = "com.thordadpool.hospiceroadmap";
const PLAY_STORE_APP_NAME = "Hospice Roadmap Android";
const PLAY_STORE_PACKAGE_NAME = "app.replit.hospiceroadmap";

const ENTITLEMENT_IDENTIFIER = "premium";
const ENTITLEMENT_DISPLAY_NAME = "Premium Access";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ───────────────────────────────────────────────────────────────
  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({
      client,
      body: { name: PROJECT_NAME },
    });
    if (error) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // ── Apps ──────────────────────────────────────────────────────────────────
  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) {
    throw new Error("No apps found for project");
  }

  let testApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!testApp) throw new Error("No test store app found — RevenueCat project is missing its test app");
  console.log("Test Store app found:", testApp.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app found:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app found:", playStoreApp.id);
  }

  // ── Existing products list ─────────────────────────────────────────────────
  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (
    targetApp: App,
    label: string,
    storeIdentifier: string,
    isTestStore: boolean,
    duration: "P1M",
    displayName: string,
    userFacingTitle: string,
  ): Promise<Product> => {
    const existing = existingProducts.items?.find(
      (p) => p.store_identifier === storeIdentifier && p.app_id === targetApp.id,
    );
    if (existing) {
      console.log(`${label} product already exists (${targetApp.type}):`, existing.id);
      return existing;
    }

    const body: CreateProductData["body"] = {
      store_identifier: storeIdentifier,
      app_id: targetApp.id,
      type: "subscription",
      display_name: displayName,
    };
    if (isTestStore) {
      body.subscription = { duration };
      body.title = userFacingTitle;
    }

    const { data: created, error } = await createProduct({
      client,
      path: { project_id: project.id },
      body,
    });
    if (error) throw new Error(`Failed to create ${label} product (${targetApp.type})`);
    console.log(`Created ${label} product (${targetApp.type}):`, created.id);
    return created;
  };

  // ── Create products for both plans across all three stores ─────────────────
  const planProducts: Array<{ plan: typeof PLANS[number]; testProduct: Product; appProduct: Product; playProduct: Product }> = [];

  for (const plan of PLANS) {
    console.log(`\n── ${plan.label} Plan ──────────────────────────────────`);
    const testProduct = await ensureProduct(testApp, plan.label, plan.identifier, true, plan.duration, plan.displayName, plan.userFacingTitle);
    const appProduct = await ensureProduct(appStoreApp, plan.label, plan.identifier, false, plan.duration, plan.displayName, plan.userFacingTitle);
    const playProduct = await ensureProduct(playStoreApp, plan.label, plan.playStoreIdentifier, false, plan.duration, plan.displayName, plan.userFacingTitle);

    // Add test store prices
    console.log(`Adding test store prices for ${plan.label} product:`, testProduct.id);
    const { data: priceData, error: priceError } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: plan.prices },
    } as any);
    if (priceError) {
      const err = priceError as { type?: string };
      if (err.type === "resource_already_exists") {
        console.log(`Test store prices already exist for ${plan.label} product`);
      } else {
        console.warn(`Warning: could not add test store prices for ${plan.label}:`, JSON.stringify(priceError));
      }
    } else {
      console.log(`Test store prices added for ${plan.label}:`, JSON.stringify(priceData));
    }

    planProducts.push({ plan, testProduct, appProduct, playProduct });
  }

  // ── Entitlement ────────────────────────────────────────────────────────────
  console.log("\n── Entitlement ─────────────────────────────────────────");
  let entitlement: Entitlement;
  const { data: existingEntitlements, error: listEntitlementsError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listEntitlementsError) throw new Error("Failed to list entitlements");

  const existingEntitlement = existingEntitlements.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEntitlement) {
    console.log("Entitlement already exists:", existingEntitlement.id);
    entitlement = existingEntitlement;
  } else {
    const { data: newEnt, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    console.log("Created entitlement:", newEnt.id);
    entitlement = newEnt;
  }

  // Attach all products from all plans to the entitlement
  const allProductIds = planProducts.flatMap(({ testProduct, appProduct, playProduct }) => [
    testProduct.id, appProduct.id, playProduct.id,
  ]);
  const { error: attachEntErr } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: allProductIds },
  });
  if (attachEntErr) {
    const err = attachEntErr as { type?: string };
    if (err.type === "unprocessable_entity_error") {
      console.log("Products already attached to entitlement");
    } else {
      throw new Error("Failed to attach products to entitlement");
    }
  } else {
    console.log("Attached all products to entitlement");
  }

  // ── Offering ───────────────────────────────────────────────────────────────
  console.log("\n── Offering ────────────────────────────────────────────");
  let offering: Offering;
  const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOfferingsError) throw new Error("Failed to list offerings");

  const existingOffering = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOffering) {
    console.log("Offering already exists:", existingOffering.id);
    offering = existingOffering;
  } else {
    const { data: newOff, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    console.log("Created offering:", newOff.id);
    offering = newOff;
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // ── Packages ───────────────────────────────────────────────────────────────
  console.log("\n── Packages ────────────────────────────────────────────");
  const { data: existingPackages, error: listPackagesError } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPackagesError) throw new Error("Failed to list packages");

  for (const { plan, testProduct, appProduct, playProduct } of planProducts) {
    let pkg: Package;
    const existingPkg = existingPackages.items?.find((p) => p.lookup_key === plan.packageIdentifier);

    if (existingPkg) {
      console.log(`Package '${plan.packageIdentifier}' already exists:`, existingPkg.id);
      pkg = existingPkg;
    } else {
      const { data: newPkg, error } = await createPackages({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: plan.packageIdentifier, display_name: plan.packageDisplayName },
      });
      if (error) throw new Error(`Failed to create package '${plan.packageIdentifier}'`);
      console.log(`Created package '${plan.packageIdentifier}':`, newPkg.id);
      pkg = newPkg;
    }

    const { error: attachPkgErr } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: testProduct.id, eligibility_criteria: "all" },
          { product_id: appProduct.id, eligibility_criteria: "all" },
          { product_id: playProduct.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (attachPkgErr) {
      const err = attachPkgErr as { type?: string; message?: string };
      if (err.type === "unprocessable_entity_error") {
        console.log(`Products already attached to package '${plan.packageIdentifier}'`);
      } else {
        throw new Error(`Failed to attach products to package '${plan.packageIdentifier}'`);
      }
    } else {
      console.log(`Attached products to package '${plan.packageIdentifier}'`);
    }
  }

  // ── API Keys ───────────────────────────────────────────────────────────────
  console.log("\n── Fetching Public API Keys ─────────────────────────────");
  const { data: testKeys, error: testKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: testApp.id },
  });
  if (testKeysErr) throw new Error("Failed to list test store API keys");

  const { data: appKeys, error: appKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: appStoreApp.id },
  });
  if (appKeysErr) throw new Error("Failed to list App Store API keys");

  const { data: playKeys, error: playKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: playStoreApp.id },
  });
  if (playKeysErr) throw new Error("Failed to list Play Store API keys");

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", testApp.id);
  console.log("App Store App ID:", appStoreApp.id);
  console.log("Play Store App ID:", playStoreApp.id);
  console.log("Entitlement Identifier:", ENTITLEMENT_IDENTIFIER);
  console.log("Offering Identifier:", OFFERING_IDENTIFIER);
  console.log("\nPlan package identifiers:");
  for (const plan of PLANS) {
    console.log(`  ${plan.label}: ${plan.packageIdentifier}`);
  }
  console.log("\nPublic API Keys:");
  console.log("  EXPO_PUBLIC_REVENUECAT_TEST_API_KEY:", testKeys?.items.map((i) => i.key).join(", ") ?? "N/A");
  console.log("  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:", appKeys?.items.map((i) => i.key).join(", ") ?? "N/A");
  console.log("  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:", playKeys?.items.map((i) => i.key).join(", ") ?? "N/A");
  console.log("\nProject / App IDs:");
  console.log("  REVENUECAT_PROJECT_ID:", project.id);
  console.log("  REVENUECAT_TEST_STORE_APP_ID:", testApp.id);
  console.log("  REVENUECAT_APPLE_APP_STORE_APP_ID:", appStoreApp.id);
  console.log("  REVENUECAT_GOOGLE_PLAY_STORE_APP_ID:", playStoreApp.id);
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
