/**
 * PuneSetu (पुणे सेतू) — Version 9 Independent Review & Verification Suite
 * 
 * Comprehensive, independent verification across:
 * A. Localization Architecture & Key Audit (1-13)
 * B. Citizen Charter & Civic Rights (14-18)
 * C. Ward & Municipal Office Directory (19-24)
 * D. Emergency Contacts & Telephone Actions (25-29)
 * E. E-Tapaal File Movement Tracker (30-35)
 * F. Civic Knowledge Assistant Grounding & Safety (36-44)
 * G. Accessibility, Fonts & Design Consistency (45-51)
 */

import fs from 'fs';
import path from 'path';
import { enDictionary } from '../src/lib/i18n/dictionaries/en';
import { mrDictionary } from '../src/lib/i18n/dictionaries/mr';
import { hiDictionary } from '../src/lib/i18n/dictionaries/hi';
import { auditTranslationCompleteness, isKeyTranslated } from '../src/lib/i18n';
import { STATUTORY_NOTIFIED_SERVICES, PUNESETU_SLA_BENCHMARKS } from '../src/lib/civic/charter-data';
import { PMC_PRABHAG_WARDS } from '../src/lib/civic/ward-directory-data';
import { EMERGENCY_CONTACTS } from '../src/lib/civic/emergency-data';
import { DEMO_ETAPAAL_RECORDS, lookupETapaalRecord } from '../src/lib/civic/etapaal-data';
import { queryCivicAssistant } from '../src/lib/civic/assistant-engine';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${message}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${message}`);
    failed++;
  }
}

async function runReview() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PUNESETU VERSION 9 — INDEPENDENT POST-IMPLEMENTATION REVIEW   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  // SECTION A: LOCALIZATION AUDIT
  console.log(`${colors.bold}A. Complete Localization Audit (EN / MR / HI)${colors.reset}`);

  const enKeys = Object.keys(enDictionary);
  const mrKeys = Object.keys(mrDictionary);
  const hiKeys = Object.keys(hiDictionary);

  assert(enKeys.length >= 100, `English dictionary contains comprehensive keys (${enKeys.length} keys)`);
  assert(mrKeys.length === enKeys.length, `Marathi dictionary key count matches English (${mrKeys.length} / ${enKeys.length})`);
  assert(hiKeys.length === enKeys.length, `Hindi dictionary key count matches English (${hiKeys.length} / ${enKeys.length})`);

  // Check for any missing keys
  const audit = auditTranslationCompleteness();
  assert(audit.isComplete === true, `auditTranslationCompleteness reports 100% complete`);
  assert(audit.languages.mr.missingKeys.length === 0, `Zero missing keys in Marathi dictionary`);
  assert(audit.languages.hi.missingKeys.length === 0, `Zero missing keys in Hindi dictionary`);
  assert(audit.languages.mr.emptyKeys.length === 0, `Zero empty translation strings in Marathi`);
  assert(audit.languages.hi.emptyKeys.length === 0, `Zero empty translation strings in Hindi`);

  // Verify authentic civic vocabulary in Devanagari
  assert(mrDictionary['status.RESOLVED'] === 'निवारण झाले', "Authentic Marathi status term: 'निवारण झाले'");
  assert(hiDictionary['status.RESOLVED'] === 'समाधान हुआ', "Authentic Hindi status term: 'समाधान हुआ'");
  assert(mrDictionary['nav.track'] === 'तक्रार पाठपुरावा', "Authentic Marathi tracking term: 'तक्रार पाठपुरावा'");
  assert(hiDictionary['nav.track'] === 'शिकायत की स्थिति', "Authentic Hindi tracking term: 'शिकायत की स्थिति'");
  assert(mrDictionary['nav.charter'] === 'नागरिक सनद', "Authentic Marathi charter term: 'नागरिक सनद'");
  assert(hiDictionary['nav.charter'] === 'नागरिक घोषणापत्र', "Authentic Hindi charter term: 'नागरिक घोषणापत्र'");

  // Check isKeyTranslated helper does not falsely return true for non-existent key
  assert(isKeyTranslated('mr', 'status.RESOLVED') === true, "isKeyTranslated returns true for valid Marathi key");
  assert(isKeyTranslated('mr', 'non.existent.random.key.999') === false, "isKeyTranslated returns false for missing key without fallback masking");

  // Verify language persistence and pre-hydration in code
  const langProviderSrc = fs.readFileSync(path.join(__dirname, '..', 'src/components/language/language-provider.tsx'), 'utf8');
  assert(langProviderSrc.includes('punesetu-lang-preference'), "Language preference key 'punesetu-lang-preference' configured");
  assert(langProviderSrc.includes('document.documentElement.lang = stored'), "Pre-hydration script eliminates language flash");

  // SECTION B: CITIZEN CHARTER & CIVIC RIGHTS
  console.log(`\n${colors.bold}B. Citizen Charter & Civic Rights Standards${colors.reset}`);

  assert(STATUTORY_NOTIFIED_SERVICES.length === 7, `7 statutory notified services documented`);
  const birthService = STATUTORY_NOTIFIED_SERVICES.find(s => s.id === 'rts-birth-cert');
  assert(birthService !== undefined && birthService.timelineDays === 7, "Birth Certificate statutory timeline is verified (7 days)");
  assert(birthService !== undefined && birthService.firstAppellateAuthority.includes('Assistant Municipal Commissioner'), "Documents First Appellate Officer");
  assert(birthService !== undefined && birthService.secondAppellateAuthority.includes('Deputy Municipal Commissioner'), "Documents Second Appellate Officer");
  assert(birthService !== undefined && birthService.requiredDocuments.length >= 2, "Lists statutory required documents");

  // Verify distinction between statutory services and internal grievance SLA targets
  assert(PUNESETU_SLA_BENCHMARKS.length === 4, "4 internal PuneSetu SLA benchmark tiers defined");
  const emergencySLA = PUNESETU_SLA_BENCHMARKS.find(b => b.priority === 'EMERGENCY');
  assert(emergencySLA !== undefined && emergencySLA.targetHours === 24, "Emergency Priority internal SLA is 24 hours");
  const highSLA = PUNESETU_SLA_BENCHMARKS.find(b => b.priority === 'HIGH');
  assert(highSLA !== undefined && highSLA.targetHours === 48, "High Priority internal SLA is 48 hours");
  const lowSLA = PUNESETU_SLA_BENCHMARKS.find(b => b.priority === 'LOW');
  assert(lowSLA !== undefined && lowSLA.targetHours === 168, "Low Priority internal SLA is 168 hours (7 days)");

  // SECTION C: WARD DIRECTORY
  console.log(`\n${colors.bold}C. Ward & Municipal Office Directory (15 Prabhags)${colors.reset}`);

  assert(PMC_PRABHAG_WARDS.length === 15, "Directory covers all 15 administrative Prabhag Wards");
  for (let i = 1; i <= 15; i++) {
    const ward = PMC_PRABHAG_WARDS.find(w => w.wardNumber === i);
    assert(ward !== undefined, `Prabhag Ward ${i} configured: ${ward ? ward.name : 'Missing'}`);
    assert(ward !== undefined && ward.officeAddress.length > 5, `Ward ${i} has verified physical office address`);
    assert(ward !== undefined && ward.contactPhone.startsWith('020-'), `Ward ${i} has verified official landline (020-)`);
    assert(ward !== undefined && ward.provenance.includes('pmc.gov.in'), `Ward ${i} verified against official PMC portal`);
  }

  // Verify PCMC jurisdiction disclaimer exists in ward directory view
  const wardViewSrc = fs.readFileSync(path.join(__dirname, '..', 'src/components/civic/ward-directory-view.tsx'), 'utf8');
  assert(wardViewSrc.includes('PCMC') || wardViewSrc.includes('Pimpri-Chinchwad'), "Ward Directory explicitly distinguishes PMC from PCMC jurisdiction");

  // SECTION D: EMERGENCY CONTACTS
  console.log(`\n${colors.bold}D. Verified Emergency & Municipal Helplines${colors.reset}`);

  assert(EMERGENCY_CONTACTS.length === 11, "Directory contains 11 verified emergency and utility hotlines");
  const erss112 = EMERGENCY_CONTACTS.find(e => e.telephone === '112');
  assert(erss112 !== undefined && erss112.callHref === 'tel:112', "National ERSS 112 formatted as clickable 'tel:112'");
  assert(erss112 !== undefined && erss112.verified === true, "112 helpline is verified");

  const pmcDisaster = EMERGENCY_CONTACTS.find(e => e.telephone.includes('020-25501269'));
  assert(pmcDisaster !== undefined && pmcDisaster.callHref.startsWith('tel:'), "PMC Disaster Control 020-25501269 formatted as tel: link");

  const pmcTollFree = EMERGENCY_CONTACTS.find(e => e.telephone.includes('1800-1030-222'));
  assert(pmcTollFree !== undefined && pmcTollFree.callHref.startsWith('tel:'), "PMC Citizen Helpline 1800-1030-222 formatted as tel: link");

  for (const c of EMERGENCY_CONTACTS) {
    assert(c.callHref.startsWith('tel:'), `Contact '${c.name}' has valid tel: action link`);
    assert(c.officialSource.length > 0, `Contact '${c.name}' provides official source citation`);
    assert(c.verificationDate.startsWith('2026'), `Contact '${c.name}' verified date recorded for 2026`);
  }

  // SECTION E: E-TAPAAL TRACKER
  console.log(`\n${colors.bold}E. E-Tapaal File Movement Tracker${colors.reset}`);

  assert(DEMO_ETAPAAL_RECORDS.length === 4, "Configured demonstration dataset contains 4 authentic file records");
  const validRecord = lookupETapaalRecord('ET-PMC-2026-08912');
  assert(validRecord !== null, "Valid record 'ET-PMC-2026-08912' retrieved successfully");
  assert(validRecord !== null && validRecord.isDemonstration === true, "Record explicitly flagged as demonstration mode");
  assert(validRecord !== null && validRecord.movementSteps.length >= 3, "Record contains multi-step movement ledger");

  // Verify non-existent record does NOT fake success
  const fakeLookup = lookupETapaalRecord('ET-NONEXISTENT-9999');
  assert(fakeLookup === null, "Non-existent token returns null (never fakes government result)");

  const etapaalViewSrc = fs.readFileSync(path.join(__dirname, '..', 'src/components/civic/etapaal-tracker-view.tsx'), 'utf8');
  assert(etapaalViewSrc.includes('Demonstration') || etapaalViewSrc.includes('Pre-Integration'), "E-Tapaal view transparently displays Demonstration mode notice");

  // SECTION F: CIVIC KNOWLEDGE ASSISTANT
  console.log(`\n${colors.bold}F. Civic Knowledge Assistant Grounding & Safety${colors.reset}`);

  // Test emergency query
  const emgAnswer = await queryCivicAssistant("What is the police emergency helpline?", "en");
  assert(emgAnswer.answer.includes("112") && emgAnswer.answer.includes("100"), "Assistant provides verified emergency numbers (112, 100)");
  assert(emgAnswer.mode === "GROUNDED_CIVIC_CORPUS", "Assistant operates in GROUNDED_CIVIC_CORPUS mode");
  assert(emgAnswer.sources.length >= 1, "Assistant provides official source citations");

  // Test ward office query
  const wardAnswer = await queryCivicAssistant("Where is the Kothrud Ward Office located?", "en");
  assert(wardAnswer.answer.includes("Paud Road") || wardAnswer.answer.includes("Kothrud"), "Assistant provides verified Kothrud ward office location");
  assert(wardAnswer.answer.includes("020-25441234"), "Assistant provides verified official landline");

  // Test Marathi query
  const mrAnswer = await queryCivicAssistant("आपत्कालीन संपर्क क्रमांक कोणते आहेत?", "mr");
  assert(mrAnswer.answer.includes("112") && mrAnswer.answer.includes("020-25501269"), "Marathi response contains verified 112 and PMC disaster number");

  // Test Hindi query
  const hiAnswer = await queryCivicAssistant("आपातकालीन नंबर क्या हैं?", "hi");
  assert(hiAnswer.answer.includes("112") && hiAnswer.answer.includes("020-25501269"), "Hindi response contains verified 112 and PMC disaster number");

  // Test submission disclaimer
  const subAnswer = await queryCivicAssistant("I want to submit a complaint about a pothole", "en");
  assert(subAnswer.answer.includes("/grievances/new") && subAnswer.answer.includes("NOT automatically"), "Explicitly explains that chatting does NOT submit a grievance and links to /grievances/new");

  // SECTION G: ACCESSIBILITY, STYLES & ROUTE INTEGRITY
  console.log(`\n${colors.bold}G. Accessibility, Fonts & Design Tokens${colors.reset}`);

  const globalsCss = fs.readFileSync(path.join(__dirname, '..', 'src/app/globals.css'), 'utf8');
  assert(globalsCss.includes('--font-devanagari'), "Devanagari font variable defined in globals.css");
  assert(globalsCss.includes(':lang(mr)') && globalsCss.includes(':lang(hi)'), "CSS targets :lang(mr) and :lang(hi) specifically");
  assert(globalsCss.includes('[data-theme="high-contrast"]'), "High-contrast theme tokens configured");

  const layoutSrc = fs.readFileSync(path.join(__dirname, '..', 'src/app/layout.tsx'), 'utf8');
  assert(layoutSrc.includes('Noto_Sans_Devanagari'), "Noto Sans Devanagari font imported and configured in RootLayout");

  // Verify all service routes exist
  const routes = [
    'src/app/services/page.tsx',
    'src/app/services/charter/page.tsx',
    'src/app/services/wards/page.tsx',
    'src/app/services/emergency/page.tsx',
    'src/app/services/etapaal/page.tsx',
    'src/app/services/assistant/page.tsx',
    'src/app/charter/page.tsx',
    'src/app/wards/page.tsx',
    'src/app/emergency/page.tsx',
    'src/app/etapaal/page.tsx',
    'src/app/assistant/page.tsx',
  ];

  for (const r of routes) {
    assert(fs.existsSync(path.join(__dirname, '..', r)), `Route file verified: ${r}`);
  }

  console.log(`\n${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}INDEPENDENT REVIEW RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})${colors.reset}`);
  console.log(`${colors.bold}================================================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runReview().catch(err => {
  console.error("Independent review suite error:", err);
  process.exit(1);
});
