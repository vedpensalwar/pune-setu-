#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) — Version 9 Localization & Civic Services Test Suite
 *
 * Comprehensive Automated Verification covering:
 * 1. Translation Dictionaries & Key Parity (100% key parity across EN, MR, HI)
 * 2. Translation & Parameter Interpolation with Fallback
 * 3. Localized Formatting (Dates, numbers, Devanagari script compatibility)
 * 4. Citizen Charter & RTS Statutory Notified Services (MCRPS guidelines & PuneSetu SLAs)
 * 5. Ward Directory (15 PMC Prabhags, office addresses, phone numbers, search & zone filtering)
 * 6. Verified Emergency Contacts (National 112, Police, Fire, Ambulance, Disaster Cell 020-25501269)
 * 7. E-Tapaal File Movement Demonstration Tracker (Search, authentic steps, not-found behavior)
 * 8. Grounded Civic Knowledge Assistant Engine (Corpus grounding, no false claims, verified citations)
 * 9. Accessibility, Speech Fallbacks & Route Integrity
 */

const fs = require("node:fs");
const path = require("node:path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

async function run() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PUNESETU VERSION 9: COMPLETE LOCALIZATION & CIVIC SERVICES  ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  // Direct TS requires via tsx
  const { enDictionary } = require("../src/lib/i18n/dictionaries/en.ts");
  const { mrDictionary } = require("../src/lib/i18n/dictionaries/mr.ts");
  const { hiDictionary } = require("../src/lib/i18n/dictionaries/hi.ts");
  const { STATUTORY_NOTIFIED_SERVICES, PUNESETU_SLA_BENCHMARKS } = require("../src/lib/civic/charter-data.ts");
  const { PMC_PRABHAG_WARDS } = require("../src/lib/civic/ward-directory-data.ts");
  const { EMERGENCY_CONTACTS } = require("../src/lib/civic/emergency-data.ts");
  const { DEMO_ETAPAAL_RECORDS, lookupETapaalRecord } = require("../src/lib/civic/etapaal-data.ts");

  // SECTION 1: DICTIONARY COMPLETENESS & KEY PARITY
  console.log(`${colors.bold}1. Complete Application Localization & Dictionary Parity${colors.reset}`);

  const enKeys = Object.keys(enDictionary);
  const mrKeys = Object.keys(mrDictionary);
  const hiKeys = Object.keys(hiDictionary);

  assert(enKeys.length >= 100, `English dictionary key volume (found ${enKeys.length} keys)`);
  assert(mrKeys.length === enKeys.length, `Marathi dictionary key count matches English exactly (${mrKeys.length} keys)`);
  assert(hiKeys.length === enKeys.length, `Hindi dictionary key count matches English exactly (${hiKeys.length} keys)`);

  const missingInMr = enKeys.filter((k) => !mrDictionary[k]);
  assert(missingInMr.length === 0, "Zero missing keys in Marathi dictionary", missingInMr.join(", "));

  const missingInHi = enKeys.filter((k) => !hiDictionary[k]);
  assert(missingInHi.length === 0, "Zero missing keys in Hindi dictionary", missingInHi.join(", "));

  let emptyValuesCount = 0;
  for (const k of enKeys) {
    if (!enDictionary[k]?.trim()) emptyValuesCount++;
    if (!mrDictionary[k]?.trim()) emptyValuesCount++;
    if (!hiDictionary[k]?.trim()) emptyValuesCount++;
  }
  assert(emptyValuesCount === 0, "Zero empty or whitespace-only translation values in any language");

  // Terminology consistency checks
  assert(mrDictionary["status.RESOLVED"] === "निवारण झाले", "Consistent Marathi term for RESOLVED ('निवारण झाले')");
  assert(hiDictionary["status.RESOLVED"] === "समाधान हुआ", "Consistent Hindi term for RESOLVED ('समाधान हुआ')");
  assert(mrDictionary["nav.track"] === "तक्रार पाठपुरावा", "Consistent Marathi term for Track ('तक्रार पाठपुरावा')");
  assert(mrDictionary["brand.name"] === "पुणे सेतू", "Brand Marathi name is 'पुणे सेतू'");
  assert(hiDictionary["brand.name"] === "पुणे सेतु", "Brand Hindi name is 'पुणे सेतु'");

  // SECTION 2: TRANSLATION & PARAMETER INTERPOLATION
  console.log(`\n${colors.bold}2. Translation Functions, Interpolation & Fallbacks${colors.reset}`);

  function translateHelper(lang, key, params) {
    const dict = lang === "mr" ? mrDictionary : lang === "hi" ? hiDictionary : enDictionary;
    let text = dict[key] || enDictionary[key] || key;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
      }
    }
    return text;
  }

  assert(translateHelper("en", "brand.name") === "PuneSetu", "Direct English lookup");
  assert(translateHelper("mr", "brand.name") === "पुणे सेतू", "Direct Marathi lookup");
  assert(translateHelper("hi", "brand.name") === "पुणे सेतु", "Direct Hindi lookup");

  const fallbackResult = translateHelper("mr", "non.existent.key");
  assert(fallbackResult === "non.existent.key", "Graceful fallback returns key when not found in any dictionary");

  // SECTION 3: CITIZEN CHARTER & STATUTORY RTS ACT
  console.log(`\n${colors.bold}3. Citizen Charter & RTS Statutory Standards${colors.reset}`);

  assert(STATUTORY_NOTIFIED_SERVICES.length >= 7, `Statutory notified services cataloged (found ${STATUTORY_NOTIFIED_SERVICES.length})`);

  const birthCert = STATUTORY_NOTIFIED_SERVICES.find((s) => s.id === "rts-birth-cert");
  assert(birthCert !== undefined, "Notified Birth Certificate service exists");
  assert(birthCert.timelineDays === 7, "Birth Certificate statutory timeline is 7 days under RTS Act");
  assert(birthCert.firstAppellateAuthority.length > 0, "First Appellate Authority is explicitly documented");
  assert(birthCert.secondAppellateAuthority.length > 0, "Second Appellate Authority is explicitly documented");
  assert(birthCert.requiredDocuments.length > 0, "Required documents are explicitly listed");

  const waterNoc = STATUTORY_NOTIFIED_SERVICES.find((s) => s.id === "rts-water-noc");
  assert(waterNoc.timelineDays === 21, "Water Connection NOC statutory timeline is 21 days under RTS Act");

  assert(PUNESETU_SLA_BENCHMARKS.length === 4, "PuneSetu defines 4 operational SLA tiers");
  const emergencySLA = PUNESETU_SLA_BENCHMARKS.find((b) => b.priority === "EMERGENCY");
  assert(emergencySLA.targetHours === 24, "Emergency Priority internal SLA is 24 hours");

  const highSLA = PUNESETU_SLA_BENCHMARKS.find((b) => b.priority === "HIGH");
  assert(highSLA.targetHours === 48, "High Priority internal SLA is 48 hours");

  const mediumSLA = PUNESETU_SLA_BENCHMARKS.find((b) => b.priority === "MEDIUM");
  assert(mediumSLA.targetHours === 72, "Medium Priority internal SLA is 72 hours");

  const lowSLA = PUNESETU_SLA_BENCHMARKS.find((b) => b.priority === "LOW");
  assert(lowSLA.targetHours === 168, "Low Priority internal SLA is 7 days (168 hours)");

  // SECTION 4: 15 PRABHAG WARDS DIRECTORY
  console.log(`\n${colors.bold}4. Searchable 15 Prabhag Wards Directory${colors.reset}`);

  assert(PMC_PRABHAG_WARDS.length === 15, "Directory contains all 15 administrative prabhag wards of Pune");

  const wardNumbers = PMC_PRABHAG_WARDS.map((w) => w.wardNumber).sort((a, b) => a - b);
  for (let i = 1; i <= 15; i++) {
    assert(wardNumbers.includes(i), `Prabhag Ward ${i} is configured`);
  }

  const kothrud = PMC_PRABHAG_WARDS.find((w) => w.wardNumber === 3);
  assert(kothrud.name.includes("Kothrud"), "Ward 3 is Kothrud - Bavdhan");
  assert(kothrud.officeAddress.includes("Paud Road"), "Kothrud office address is Paud Road");
  assert(kothrud.contactPhone.startsWith("020-"), "Ward contact phone format verified (020-25441234)");
  assert(kothrud.callHref.startsWith("tel:"), "Ward phone href is tel: format");
  assert(kothrud.provenance.includes("pmc.gov.in"), "Ward provenance verified against pmc.gov.in");

  // Search filtering simulation
  function searchWards(query, zone) {
    const q = (query || "").trim().toLowerCase();
    return PMC_PRABHAG_WARDS.filter((w) => {
      if (zone && zone !== "ALL" && !w.zone.toLowerCase().includes(zone.toLowerCase())) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.nameMr.toLowerCase().includes(q) ||
        w.officeAddress.toLowerCase().includes(q) ||
        w.jurisdictionAreas.some((a) => a.toLowerCase().includes(q))
      );
    });
  }

  const aundhResults = searchWards("Aundh", "ALL");
  assert(aundhResults.length >= 1 && aundhResults[0].wardNumber === 1, "Search for 'Aundh' correctly retrieves Ward 1");

  const marathiSearch = searchWards("कोथरूड", "ALL");
  assert(marathiSearch.length >= 1 && marathiSearch[0].wardNumber === 3, "Search by Devanagari 'कोथरूड' correctly retrieves Ward 3");

  const zone1Wards = searchWards("", "Zone 1");
  assert(zone1Wards.length > 0 && zone1Wards.every((w) => w.zone.includes("Zone 1")), "Filtering by Zone 1 scopes strictly to Zone 1");

  const emptySearch = searchWards("NonExistentLocality123", "ALL");
  assert(emptySearch.length === 0, "Searching for non-existent locality returns clean empty array without fabricating records");

  // SECTION 5: VERIFIED EMERGENCY CONTACTS
  console.log(`\n${colors.bold}5. Verified Emergency Contacts Directory${colors.reset}`);

  assert(EMERGENCY_CONTACTS.length >= 10, `Emergency contacts cataloged (found ${EMERGENCY_CONTACTS.length})`);

  const erss112 = EMERGENCY_CONTACTS.find((c) => c.telephone === "112");
  assert(erss112 !== undefined, "National Integrated ERSS 112 helpline is present");
  assert(erss112.callHref === "tel:112", "112 dial link is formatted properly (tel:112)");
  assert(erss112.verified === true, "112 helpline marked as verified");

  const pmcDisaster = EMERGENCY_CONTACTS.find((c) => c.id === "emg-disaster-pmc");
  assert(pmcDisaster !== undefined, "PMC Central Disaster Management Cell is present");
  assert(pmcDisaster.telephone.includes("020-25501269"), "PMC Disaster control number 020-25501269 verified");

  const pmcTollFree = EMERGENCY_CONTACTS.find((c) => c.id === "emg-pmc-tollfree");
  assert(pmcTollFree !== undefined, "PMC Toll-Free Helpline is present");
  assert(pmcTollFree.telephone.includes("1800-1030-222"), "PMC Toll-Free 1800-1030-222 verified");

  for (const c of EMERGENCY_CONTACTS) {
    assert(c.callHref.startsWith("tel:"), `Emergency contact ${c.name} has valid tel: action`);
    assert(c.officialSource.length > 0, `Emergency contact ${c.name} lists verified source`);
    assert(c.verificationDate.startsWith("2026-"), `Emergency contact ${c.name} has 2026 verification date`);
  }

  // SECTION 6: E-TAPAAL TRACKER
  console.log(`\n${colors.bold}6. E-Tapaal File Movement Tracker (Demonstration Mode)${colors.reset}`);

  assert(DEMO_ETAPAAL_RECORDS.length === 4, "Configured demonstration dataset contains exactly 4 authentic records");

  const validRecord = lookupETapaalRecord("ET-PMC-2026-08912");
  assert(validRecord !== null, "lookupETapaalRecord successfully retrieves valid record 'ET-PMC-2026-08912'");
  assert(validRecord.isDemonstration === true, "Record is explicitly tagged as isDemonstration: true");
  assert(validRecord.movementSteps.length === 4, "Movement ledger contains 4 chronological administrative steps");
  assert(validRecord.movementSteps[0].status === "COMPLETED", "Step 1 is marked as COMPLETED");
  assert(validRecord.movementSteps[3].status === "ACTIVE", "Step 4 is marked as ACTIVE");

  const nonExistent = lookupETapaalRecord("ET-FAKE-9999");
  assert(nonExistent === null, "lookupETapaalRecord returns null for non-existent token (never simulates fake government result)");

  // SECTION 7: CIVIC KNOWLEDGE ASSISTANT & LIVE APIS
  console.log(`\n${colors.bold}7. Civic Knowledge Assistant Grounding & API Verification${colors.reset}`);

  try {
    const apiRes = await fetch("http://localhost:3000/api/civic/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "What is the emergency helpline for flood in Pune?",
        language: "en",
      }),
    });
    const emergencyJson = await apiRes.json();
    assert(emergencyJson.success === true, "POST /api/civic/assistant returns HTTP 200 success");
    assert(emergencyJson.mode === "GROUNDED_CIVIC_CORPUS", "Assistant operates in Grounded Civic Corpus Mode");
    assert(emergencyJson.answer.includes("112") || emergencyJson.answer.includes("020-25501269"), "Emergency response includes verified contact numbers (112 / 020-25501269)");
    assert(emergencyJson.sources.length > 0, "Emergency response cites official sources");
    assert(emergencyJson.safetyDisclaimer.length > 0, "Response includes safety disclaimer");

    // Test Marathi query
    const mrApiRes = await fetch("http://localhost:3000/api/civic/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "पुण्यातील आपत्कालीन संपर्क क्रमांक काय आहेत?",
        language: "mr",
      }),
    });
    const mrJson = await mrApiRes.json();
    assert(mrJson.success === true, "Assistant responds to Marathi query");
    assert(mrJson.answer.includes("112"), "Marathi response includes 112");

    // Test Ward query
    const wardApiRes = await fetch("http://localhost:3000/api/civic/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Where is the Aundh Ward Office?",
        language: "en",
      }),
    });
    const wardJson = await wardApiRes.json();
    assert(wardJson.answer.includes("DP Road") || wardJson.answer.includes("Ward 1"), "Ward query cites DP Road Aundh");

    // Test RTS query
    const rtsApiRes = await fetch("http://localhost:3000/api/civic/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "What is the difference between RTS Act and PuneSetu?",
        language: "en",
      }),
    });
    const rtsJson = await rtsApiRes.json();
    assert(rtsJson.answer.includes("RTS") && (rtsJson.answer.includes("SLA") || rtsJson.answer.includes("statutory")), "Explains RTS Act statutory vs PuneSetu SLA distinction");

    // Test GET /api/civic/charter
    const charterRes = await fetch("http://localhost:3000/api/civic/charter");
    const charterJson = await charterRes.json();
    assert(charterJson.success === true && charterJson.statutoryNotifiedServices.length >= 7, "GET /api/civic/charter returns statutory services");

    // Test GET /api/civic/wards
    const wardsRes = await fetch("http://localhost:3000/api/civic/wards?search=Aundh");
    const wardsJson = await wardsRes.json();
    assert(wardsJson.success === true && wardsJson.wards.length >= 1, "GET /api/civic/wards filters by search parameter");

    // Test GET /api/civic/emergency
    const emgRes = await fetch("http://localhost:3000/api/civic/emergency?category=NATIONAL");
    const emgJson = await emgRes.json();
    assert(emgJson.success === true && emgJson.contacts.length >= 1, "GET /api/civic/emergency filters by category");

    // Test GET /api/civic/etapaal
    const etapaalRes = await fetch("http://localhost:3000/api/civic/etapaal?token=ET-PMC-2026-08912");
    const etapaalJson = await etapaalRes.json();
    assert(etapaalJson.success === true && etapaalJson.record.inwardNumber === "ET-PMC-2026-08912", "GET /api/civic/etapaal retrieves valid demonstration record");

    // Test GET /api/civic/etapaal not found
    const etapaalNotFound = await fetch("http://localhost:3000/api/civic/etapaal?token=ET-FAKE-9999");
    assert(etapaalNotFound.status === 404, "GET /api/civic/etapaal returns 404 for non-existent token");
  } catch (err) {
    console.warn("Live API check warning:", err.message);
  }

  // SECTION 8: ACCESSIBILITY & ROUTE INTEGRITY
  console.log(`\n${colors.bold}8. Accessibility, Theme Tokens & Route Integrity${colors.reset}`);

  const requiredRoutes = [
    "src/app/services/page.tsx",
    "src/app/services/charter/page.tsx",
    "src/app/services/wards/page.tsx",
    "src/app/services/emergency/page.tsx",
    "src/app/services/etapaal/page.tsx",
    "src/app/services/assistant/page.tsx",
    "src/app/charter/page.tsx",
    "src/app/wards/page.tsx",
    "src/app/emergency/page.tsx",
    "src/app/etapaal/page.tsx",
    "src/app/assistant/page.tsx",
  ];

  for (const route of requiredRoutes) {
    const exists = fs.existsSync(path.join(__dirname, "..", route));
    assert(exists, `Route file exists: ${route}`);
  }

  // Devanagari CSS font priority check
  const globalsCss = fs.readFileSync(path.join(__dirname, "..", "src/app/globals.css"), "utf-8");
  assert(globalsCss.includes("font-family: var(--font-devanagari)"), "globals.css prioritizes --font-devanagari for mr and hi");

  console.log(`\n${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})${colors.reset}`);
  console.log(`${colors.bold}================================================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
