import { PMC_PRABHAG_WARDS } from "./ward-directory-data";
import { EMERGENCY_CONTACTS } from "./emergency-data";
import { STATUTORY_NOTIFIED_SERVICES, PUNESETU_SLA_BENCHMARKS } from "./charter-data";
import type { Language } from "@/lib/i18n";

export interface AssistantMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  sources?: string[];
  suggestedFollowups?: string[];
  timestamp: string;
}

export interface AssistantQueryResponse {
  answer: string;
  sources: string[];
  suggestedFollowups: string[];
  mode: "GROUNDED_CIVIC_CORPUS" | "EXTERNAL_LLM_ENHANCED";
}

/**
 * Deterministic Semantic Knowledge Engine for PuneSetu.
 * Matches citizen inquiries against verified civic domains.
 */
export async function queryCivicAssistant(
  query: string,
  lang: Language = "en"
): Promise<AssistantQueryResponse> {
  const clean = query.trim().toLowerCase();

  // 1. EMERGENCY CONTACT INQUIRIES
  if (
    clean.includes("emergency") ||
    clean.includes("helpline") ||
    clean.includes("police") ||
    clean.includes("fire") ||
    clean.includes("ambulance") ||
    clean.includes("disaster") ||
    clean.includes("आपत्कालीन") ||
    clean.includes("मदत") ||
    clean.includes("पोलीस") ||
    clean.includes("आपातकालीन") ||
    clean.includes("हेल्पलाइन")
  ) {
    if (lang === "mr") {
      return {
        answer: `पुणे शहरातील प्रमुख आपत्कालीन संपर्क क्रमांक खालीलप्रमाणे आहेत:
• **राष्ट्रीय एकात्मिक आपत्कालीन क्रमांक:** 112 (पोलीस, अग्निशामक, रुग्णवाहिका सर्व एकत्रित)
• **पुणे पोलीस नियंत्रण कक्ष:** 100 किंवा 020-26126296
• **अग्निशामक दल नियंत्रण कक्ष:** 101 किंवा 020-26451707
• **शासकीय रुग्णवाहिका सेवा (MEMS):** 108 किंवा 102
• **पुणे मनपा आपत्ती नियंत्रण कक्ष (पूर / झाडपडी):** 020-25501269 / 020-25506800
• **पुणे मनपा नागरिक मदत कक्ष (टोल फ्री):** 1800-1030-222
• **महिला मदत कक्ष:** 1091 / 181 | **बाल मदत (चाईल्डलाईन):** 1098
• **महावितरण वीज आपत्कालीन:** 1912

टीप: जीवघेण्या संकटात तात्काळ 112 वर संपर्क साधा.`,
        sources: [
          "पुणे पोलीस आयुक्तालय अधिकृत नियंत्रण कक्ष (punepolice.gov.in)",
          "पुणे महानगरपालिका मध्यवर्ती आपत्ती व्यवस्थापन कक्ष (pmc.gov.in)",
          "महाराष्ट्र आपत्कालीन वैद्यकीय सेवा (108)",
        ],
        suggestedFollowups: [
          "कोथरूड क्षेत्रीय कार्यालय कुठे आहे?",
          "पावसाळी पूरस्थितीची माहिती कुठे मिळेल?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else if (lang === "hi") {
      return {
        answer: `पुणे शहर के प्रमुख आपातकालीन संपर्क नंबर निम्नलिखित हैं:
• **राष्ट्रीय एकीकृत आपातकालीन नंबर:** 112 (पुलिस, अग्निशमन और एम्बुलेंस हेतु एकल नंबर)
• **पुणे पुलिस नियंत्रण कक्ष:** 100 या 020-26126296
• **अग्निशमन दल नियंत्रण कक्ष:** 101 या 020-26451707
• **सरकारी एम्बुलेंस सेवा:** 108 या 102
• **पुणे नगर निगम आपदा नियंत्रण कक्ष (बाढ़/पेड़ गिरना):** 020-25501269 / 020-25506800
• **नागरिक सहायता टोल-फ्री:** 1800-1030-222
• **महिला हेल्पलाइन:** 1091 / 181 | **चाइल्डलाइन:** 1098
• **बिजली आपातकालीन (महावितरण):** 1912

नोट: किसी भी जीवन-संकट में तुरंत 112 पर कॉल करें।`,
        sources: [
          "पुणे पुलिस आयुक्तालय आधिकारिक पोर्टल (punepolice.gov.in)",
          "पुणे नगर निगम केंद्रीय आपदा प्रबंधन सेल (pmc.gov.in)",
          "महाराष्ट्र आपातकालीन चिकित्सा सेवा (108)",
        ],
        suggestedFollowups: [
          "वार्ड कार्यालयों के पते कैसे देखें?",
          "सड़क के गड्ढे की शिकायत कैसे दर्ज करें?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else {
      return {
        answer: `Here are the verified emergency helplines for Pune:
• **National Integrated Helpline:** 112 (Police, Fire, Ambulance combined)
• **Pune City Police Control Room:** 100 or 020-26126296
• **PMC Fire Brigade Control Room:** 101 or 020-26451707
• **Government Ambulance (MEMS):** 108 or 102
• **PMC Central Disaster Management Cell (Floods/Tree Falls):** 020-25501269 / 020-25506800
• **PMC Toll-Free Civic Helpdesk:** 1800-1030-222 / 020-25501000
• **Women in Distress Helpline:** 1091 / 181 | **Childline:** 1098
• **MSEDCL Electricity Emergency:** 1912 / 1800-212-3435

Note: In immediate life-threatening crises, dial 112 without delay.`,
        sources: [
          "Pune Police Commissionerate (punepolice.gov.in)",
          "PMC Central Disaster Management Cell (pmc.gov.in)",
          "Maharashtra Emergency Medical Services (108)",
        ],
        suggestedFollowups: [
          "Where is the Kothrud Ward Office located?",
          "How do I submit a civic grievance in PuneSetu?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    }
  }

  // 2. WARD INQUIRIES
  const genericTokens = new Set(["pune", "road", "nagar", "city", "wada", "karyalay"]);
  for (const ward of PMC_PRABHAG_WARDS) {
    const wardTokens = ward.name.toLowerCase().split(/[\s-]+/);
    const matchesWard =
      clean.includes(ward.name.toLowerCase()) ||
      clean.includes(ward.nameMr.toLowerCase()) ||
      clean.includes(ward.nameHi.toLowerCase()) ||
      wardTokens.some(
        (token) => token.length > 3 && !genericTokens.has(token) && clean.includes(token)
      );
    if (matchesWard || clean.includes(`ward ${ward.wardNumber}`) || clean.includes(`प्रभाग ${ward.wardNumber}`)) {
      if (lang === "mr") {
        return {
          answer: `**प्रभाग क्र. ${ward.wardNumber}: ${ward.nameMr}** ची अधिकृत माहिती:
• **परिमंडळ:** ${ward.zoneNameMr}
• **कार्यालय पत्ता:** ${ward.officeAddressMr}
• **दूरध्वनी:** ${ward.contactPhone}
• **ईमेल:** ${ward.email}
• **जबाबदार पद:** ${ward.assistantCommissioner}
• **कार्यालयीन वेळ:** सोमवार ते शुक्रवार, सकाळी ९:४५ ते संध्याकाळी ६:१५ (नागरिकांसाठी भेटीची वेळ: दुपारी ३:०० ते ५:००)
• **अंतर्गत प्रमुख भाग:** ${ward.jurisdictionAreasMr.join(", ")}`,
          sources: [
            "पुणे महानगरपालिका अधिकृत प्रभाग कार्यालय मास्टर (pmc.gov.in/en/ward-offices)",
            "प्रशासकीय क्षेत्रीय रचना, पुणे महानगरपालिका",
          ],
          suggestedFollowups: [
            "सर्व १५ प्रभाग कार्यालयांची यादी पहा",
            "या प्रभागातील समस्या कशी नोंदवावी?",
          ],
          mode: "GROUNDED_CIVIC_CORPUS",
        };
      } else if (lang === "hi") {
        return {
          answer: `**वार्ड सं. ${ward.wardNumber}: ${ward.nameHi}** की आधिकारिक जानकारी:
• **क्षेत्र / परिमंडल:** ${ward.zoneNameHi}
• **कार्यालय पता:** ${ward.officeAddressHi}
• **फ़ोन नंबर:** ${ward.contactPhone}
• **ईमेल:** ${ward.email}
• **जिम्मेदार पद:** सहायक नगर आयुक्त (${ward.nameHi})
• **कार्यालय समय:** सोमवार से शुक्रवार, सुबह ९:४५ से शाम ६:१५ (नागरिकों हेतु: दोपहर ३:०० से शाम ५:००)
• **प्रमुख क्षेत्र:** ${ward.jurisdictionAreasHi.join(", ")}`,
          sources: [
            "पुणे नगर निगम आधिकारिक वार्ड कार्यालय मास्टर (pmc.gov.in)",
          ],
          suggestedFollowups: [
            "सभी १५ वार्डों की सूची देखें",
            "शिकायत दर्ज करने की प्रक्रिया क्या है?",
          ],
          mode: "GROUNDED_CIVIC_CORPUS",
        };
      } else {
        return {
          answer: `**Ward ${ward.wardNumber}: ${ward.name}** Official Information:
• **Zone:** ${ward.zone}
• **Office Address:** ${ward.officeAddress}
• **Contact Phone:** ${ward.contactPhone}
• **Email:** ${ward.email}
• **Designated Authority:** ${ward.assistantCommissioner}
• **Office Hours:** Monday to Friday, 9:45 AM - 6:15 PM (Citizen Hours: 3:00 PM - 5:00 PM)
• **Key Areas Covered:** ${ward.jurisdictionAreas.join(", ")}`,
          sources: [
            "PMC Official Ward Offices Master Directory (pmc.gov.in)",
            "Pune Municipal Corporation Administrative Boundaries",
          ],
          suggestedFollowups: [
            "View all 15 Pune ward offices",
            "How do I report an issue in this ward?",
          ],
          mode: "GROUNDED_CIVIC_CORPUS",
        };
      }
    }
  }

  // 3. RTS ACT VS PUNESETU CIVIC GRIEVANCES
  if (
    clean.includes("rts") ||
    clean.includes("right to service") ||
    clean.includes("charter") ||
    clean.includes("statutory") ||
    clean.includes("लोकसेवा") ||
    clean.includes("सनद") ||
    clean.includes("घोषणापत्र")
  ) {
    if (lang === "mr") {
      return {
        answer: `**महाराष्ट्र लोकसेवा हक्क अधिनियम (RTS), २०१५ आणि पुणे सेतू यातील महत्त्वाचा फरक:**

1. **अधिसूचित वैधानिक लोकसेवा (RTS Act):**
   • हे कायदेशीर दाखले, परवाने आणि प्रमाणपत्रे मिळवण्यासाठी आहे (उदा. जन्म/मृत्यू दाखला: ७ दिवस, नवीन नळजोड मंजुरी: २१ दिवस, व्यवसाय परवाना: ३० दिवस).
   • यामध्ये विहित वेळेत सेवा न मिळाल्यास प्रथम अपिलीय आणि द्वितीय अपिलीय अधिकाऱ्यांकडे कायदेशीर अपील करण्याची तरतूद आहे.

2. **नागरी भौतिक तक्रारी (पुणे सेतू):**
   • हे रस्त्यावरील खड्डे, कचरा, सांडपाणी गळती, बंद पथदिवे यांसारख्या भौतिक नागरी समस्यांसाठी आहे.
   • पुणे सेतू अंतर्गत महापालिकेच्या अभियांत्रिकी विभागांसाठी अंतर्गत मुदत मानके (SLA) निश्चित आहेत:
     - **आणीबाणी (Emergency):** २४ तास
     - **उच्च प्राधान्य (High Priority):** ४८ तास
     - **मध्यम प्राधान्य (Medium Priority):** ७२ तास
     - **कमी प्राधान्य (Low Priority):** ७ दिवस

3. **वरिष्ठांकडे वर्ग (Escalation):** मुदत उलटून ४८ तास उलटल्यास पुणे सेतूवर प्रशासकीय पुनरावलोकनाची सोय आहे.`,
        sources: [
          "महाराष्ट्र राज्य लोकसेवा हक्क आयोग (aaplesarkar.mahaonline.gov.in)",
          "महाराष्ट्र लोकसेवा हक्क अधिनियम, २०१५ (राजपत्रित प्रत)",
          "पुणे सेतू सेवा मुदत नियमावली (PuneSetu SLA Framework)",
        ],
        suggestedFollowups: [
          "नागरिक सनद पूर्ण वाचा",
          "तक्रार कशी नोंदवावी?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else if (lang === "hi") {
      return {
        answer: `**महाराष्ट्र लोकसेवा गारंटी अधिनियम (RTS), २०१५ और पुणे सेतू में महत्वपूर्ण अंतर:**

1. **अधिसूचित वैधानिक लोक सेवाएं (RTS Act):**
   • यह आधिकारिक प्रमाण पत्र, लाइसेंस और एनओसी हेतु लागू होता है (जैसे जन्म/मृत्यु प्रमाण पत्र: ५ दिन, नया नल कनेक्शन एनओसी: १५ दिन, व्यापार लाइसेंस: २१ दिन)।
   • नियत समय में सेवा न मिलने पर प्रथम अपीलीय व द्वितीय अपीलीय प्राधिकारियों के समक्ष कानूनी अपील का अधिकार है।

2. **नागरिक भौतिक शिकायतें (पुणे सेतू):**
   • यह सड़क के गड्ढे, कचरा, सीवर लीकेज व स्ट्रीट लाइट जैसी भौतिक नागरिक समस्याओं हेतु है।
   • पुणे सेतू के तहत नगर निगम के इंजीनियरिंग विभागों हेतु आंतरिक निवारण लक्ष्य (SLA) तय हैं:
     - **आपातकालीन (Emergency):** २४ घंटे
     - **उच्च प्राथमिकता (High Priority):** ४८ घंटे
     - **मध्यम प्राथमिकता (Medium Priority):** ७२ घंटे
     - **सामान्य प्राथमिकता (Low Priority):** ७ दिन (१६८ घंटे)

3. **प्रशासनिक अपील (Escalation):** समय सीमा से ४८ घंटे अधिक बीतने पर नागरिक सीधे प्रशासनिक समीक्षा की मांग कर सकते हैं।`,
        sources: [
          "महाराष्ट्र राज्य लोकसेवा अधिकार आयोग (aaplesarkar.mahaonline.gov.in)",
          "महाराष्ट्र लोकसेवा गारंटी अधिनियम, २०१५ (अधिसूचित राजपत्र)",
          "पुणे सेतू नागरिक सेवा नियम (PuneSetu SLA Framework)",
        ],
        suggestedFollowups: [
          "नागरिक अधिकार सनद देखें",
          "शिकायत दर्ज करने की प्रक्रिया",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else {
      return {
        answer: `**Important Distinction: Maharashtra RTS Act (2015) vs. PuneSetu Civic Grievances:**

1. **Statutory Notified Public Services (RTS Act):**
   • Applies to official government permissions, certificates, and licenses (e.g. Birth/Death Certificates: 7 days, Water Connection Sanction: 21 days, Trade License: 30 days).
   • Governed legally by the Maharashtra State Commission for Right to Public Services (MCRPS) with formal First and Second Appellate Authorities.

2. **Municipal Physical Grievances (PuneSetu):**
   • Applies to physical civic defects (potholes, garbage accumulation, sewage overflows, non-functional streetlights).
   • Handled via PMC Engineering Departments with internal target SLAs:
     - **Emergency:** 24 Hours
     - **High Priority:** 48 Hours
     - **Medium Priority:** 72 Hours
     - **Low Priority:** 7 Days

3. **Escalation Rights:** If a grievance exceeds its SLA target by more than 48 hours, citizens can trigger an Administrative Review escalation.`,
        sources: [
          "Maharashtra State Commission for Right to Public Services (aaplesarkar.mahaonline.gov.in)",
          "Maharashtra Right to Public Services Act, 2015 (Govt Gazette)",
          "PuneSetu Municipal SLA Charter & Architecture",
        ],
        suggestedFollowups: [
          "Explore the Citizen Charter page",
          "How do I submit a grievance with photographic evidence?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    }
  }

  // 4. HOW TO REPORT AN ISSUE
  if (
    clean.includes("report") ||
    clean.includes("submit") ||
    clean.includes("file") ||
    clean.includes("pothole") ||
    clean.includes("garbage") ||
    clean.includes("खड्डा") ||
    clean.includes("कचरा") ||
    clean.includes("तक्रार नोंद") ||
    clean.includes("शिकायत दर्ज")
  ) {
    if (lang === "mr") {
      return {
        answer: `*(महत्त्वाची टीप: या सहाय्यकाशी संवाद साधल्याने आपोआप तक्रार नोंदवली जात नाही. अधिकृत ट्रॅकिंग टोकन मिळवण्यासाठी कृपया /grievances/new वर जाऊन खालीलप्रमाणे प्रत्यक्ष तक्रार अर्ज पूर्ण करा.)*

**पुणे सेतूवर नागरी समस्या नोंदवण्याची सोपी पद्धत:**
1. मुख्य मेनूतील **'नागरी समस्या नोंदवा'** बटणावर क्लिक करा (किंवा थेट \`/grievances/new\` वर जा).
2. **समस्येचा प्रवर्ग निवडा:** रस्ते व खड्डे, कचरा, पाणी पुरवठा, पथदिवे, सांडपाणी, इत्यादी.
3. **स्थान निश्चित करा:** आपल्या प्रभागाची निवड करा (उदा. कोथरूड, औंध, कसबा) आणि जवळची खूण (Landmark) लिहा.
4. **तपशील आणि पुरावा:** समस्येचे संक्षिप्त वर्णन लिहा आणि जागेचा प्रत्यक्ष फोटो अपलोड करा. (तुम्ही आवाजी ध्वनी नोंदणीही करू शकता).
5. **सबमिट करा:** तक्रार सादर केल्यावर तुम्हाला **PS-PUN-2026-XXXXXX** असा ट्रॅकिंग क्रमांक मिळतो, ज्याद्वारे तुम्ही कामाची प्रगती तपासू शकता.`,
        sources: [
          "पुणे सेतू नागरिक मार्गदर्शक (PuneSetu Citizen Workflow)",
          "पुणे महानगरपालिका तक्रार निवारण मानक कार्यप्रणाली",
        ],
        suggestedFollowups: [
          "तक्रार ट्रॅक कशी करावी?",
          "माझ्या प्रभागाचे कार्यालय कुठे आहे?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else if (lang === "hi") {
      return {
        answer: `*(महत्वपूर्ण नोट: इस सहायक से बातचीत करने मात्र से शिकायत दर्ज नहीं होती है। आधिकारिक ट्रैकिंग टोकन प्राप्त करने के लिए कृपया /grievances/new पर जाकर ५ चरणों का फॉर्म पूरा करें।)*

**पुणे सेतू पर नागरिक समस्या दर्ज करने की प्रक्रिया:**
1. हेडर में **'शिकायत दर्ज करें'** बटन दबाएं या सीधे /grievances/new पर जाएं।
2. **समस्या श्रेणी चुनें:** सड़क व गड्ढे, ठोस अपशिष्ट, जलापूर्ति, स्ट्रीट लाइट, सीवरेज आदि।
3. **स्थान चयन:** अपना प्रशासनिक वार्ड (१ से १५) चुनें और निकटतम लैंडमार्क लिखें।
4. **विवरण व फोटो:** समस्या का संक्षिप्त विवरण लिखें और कम से कम एक वास्तविक फोटो अपलोड करें।
5. **सबमिट करें:** सफलतापूर्वक सबमिट करने पर आपको **PS-PUN-2026-XXXXXX** आधिकारिक ट्रैकिंग टोकन प्राप्त होता है।`,
        sources: [
          "पुणे सेतू नागरिक गाइड (PuneSetu Citizen Workflow)",
          "पुणे नगर निगम शिकायत निवारण दिशानिर्देश",
        ],
        suggestedFollowups: [
          "शिकायत का स्टेटस कैसे ट्रैक करें?",
          "वार्ड कार्यालय का पता कैसे खोजें?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else {
      return {
        answer: `*(Important Note: Conversational questions with this assistant do NOT automatically create or submit a formal civic grievance. To register your complaint and obtain an official tracking token, you must complete the 5-step form at /grievances/new.)*

**How to Report a Civic Issue on PuneSetu:**
1. Click the **'Report a Civic Issue'** button in the header or navigate to \`/grievances/new\`.
2. **Select Category:** Choose from Roads & Potholes, Solid Waste, Water Supply, Street Lighting, Drainage, etc.
3. **Specify Location:** Select your administrative ward (1 to 15) and provide a landmark or road name.
4. **Attach Evidence:** Provide a clear description and upload at least one photograph of the civic defect. (Voice recording in English, Marathi, or Hindi is also supported).
5. **Submit:** On submission, you receive an authoritative tracking token (e.g. **PS-PUN-2026-004128**) with real-time deadline monitoring.`,
        sources: [
          "PuneSetu Grievance Submission Architecture Guide",
          "PMC Citizen Redressal Workflow Standards",
        ],
        suggestedFollowups: [
          "How do I track a complaint?",
          "What are the resolution SLA timelines?",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    }
  }

  // 5. HOW TO TRACK OR APPEAL
  if (
    clean.includes("track") ||
    clean.includes("status") ||
    clean.includes("appeal") ||
    clean.includes("escalat") ||
    clean.includes("पाठपुरावा") ||
    clean.includes("ट्रॅक") ||
    clean.includes("स्थिती") ||
    clean.includes("अपील")
  ) {
    if (lang === "mr") {
      return {
        answer: `**तक्रारीचा पाठपुरावा आणि दाद मागणे (Tracking & Appeals):**
• **तक्रार ट्रॅक करण्यासाठी:** मुख्य पृष्ठावरील ट्रॅकिंग बॉक्समध्ये किंवा \`/track\` पानावर आपला ट्रॅकिंग क्रमांक (उदा. \`PS-PUN-2026-004128\`) प्रविष्ट करा.
• **सद्यस्थिती समजून घ्या:**
  - *नोंदवली (Submitted):* तक्रार दाखल झाली आहे.
  - *नियुक्त (Assigned):* प्रभाग अभियंत्याकडे वर्ग झाली आहे.
  - *काम सुरू (Work in Progress):* प्रत्यक्ष जागेवर काम चालू आहे.
  - *निवारण झाले (Resolved):* अधिकाऱ्यांनी कामाचे छायाचित्र आणि शेरा जोडून काम पूर्ण केले आहे.
• **वरिष्ठांकडे दाद (Appeal):** ठरवून दिलेल्या मुदतीनंतरही (SLA) काम न झाल्यास आपण ट्रॅकिंग पानावरून थेट **'वरिष्ठांकडे दाद मागा'** बटण दाबून प्रशासकीय पुनरावलोकनाची मागणी करू शकता.`,
        sources: [
          "पुणे सेतू ट्रॅकिंग आणि जीवनचक्र प्रणाली",
          "पुणे महानगरपालिका तक्रार निवारण मार्गदर्शक",
        ],
        suggestedFollowups: [
          "नमुना तक्रार PS-PUN-2026-004128 ट्रॅक करा",
          "नागरिक सनदेतील मुदत मानके पहा",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else if (lang === "hi") {
      return {
        answer: `**शिकायत ट्रैकिंग और प्रशासनिक अपील (Tracking & Appeals):**
• **ट्रैक करने हेतु:** मुख्य पृष्ठ पर स्थित ट्रैकिंग बॉक्स में या /track पर अपना टोकन (जैसे PS-PUN-2026-004128) दर्ज करें।
• **स्थिति विवरण:**
  - *दर्ज (Submitted):* शिकायत निगम के रिकॉर्ड में पंजीकृत हो गई है।
  - *अग्रसारित (Assigned):* संबंधित वार्ड इंजीनियर को प्रभारित।
  - *प्रगति पर (Work in Progress):* मौके पर कार्य चालू है।
  - *निवारित (Resolved):* फोटो व रिपोर्ट के साथ कार्य संपन्न।
• **अपील दर्ज करना:** यदि निर्धारित समय सीमा बीत जाती है, तो ट्रैकिंग पृष्ठ पर **'वरिष्ठ अधिकारी को अपील करें'** बटन द्वारा समीक्षा का अनुरोध कर सकते हैं।`,
        sources: [
          "पुणे सेतू केस ट्रैकिंग व जीवनचक्र प्रणाली",
          "पुणे नगर निगम नागरिक सेवा दिशानिर्देश",
        ],
        suggestedFollowups: [
          "नमुना टोकन PS-PUN-2026-004128 ट्रैक करें",
          "नागरिक सनद में समय सीमा देखें",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    } else {
      return {
        answer: `**Complaint Tracking & Escalations on PuneSetu:**
• **To Track a Complaint:** Enter your tracking token (e.g. \`PS-PUN-2026-004128\`) in the tracking box on the homepage or at \`/track\`.
• **Status Meanings:**
  - *Submitted:* Received in the municipal queue.
  - *Assigned:* Forwarded to jurisdictional ward engineer.
  - *Work in Progress:* Field crew dispatched or works underway.
  - *Resolved:* Completed with mandatory photograph evidence and closing remarks.
• **Requesting Escalation:** If an issue breaches its designated SLA target deadline, an **'Request Escalation'** button appears on the case dossier, allowing you to submit formal appeal remarks for central administrator review.`,
        sources: [
          "PuneSetu Case Dossier & Lifecycle Specification",
          "PMC Redressal Service Level Agreement Guidelines",
        ],
        suggestedFollowups: [
          "Track demo token PS-PUN-2026-004128",
          "Inspect Citizen Charter & SLAs",
        ],
        mode: "GROUNDED_CIVIC_CORPUS",
      };
    }
  }

  // 6. DEFAULT GENERAL HELPFUL GUIDANCE GROUNDED IN CIVIC CORPUS
  if (lang === "mr") {
    return {
      answer: `मी पुणे सेतूचा अधिकृत नागरी माहिती सहाय्यक आहे. मी खालील विषयांवर आपली मदत करू शकतो:
1. **नागरी समस्या नोंदवणे:** खड्डे, कचरा, पाणीपुरवठा, सांडपाणी, पथदिवे यांविषयी तक्रार कशी करावी.
2. **प्रभाग कार्यालये:** पुणे मनपाच्या १५ क्षेत्रीय कार्यालयांचे पत्ते, फोन नंबर आणि संपर्क वेळ.
3. **आपत्कालीन संपर्क:** आपत्ती व्यवस्थापन (020-25501269), पोलीस (100/112), अग्निशामक (101), रुग्णवाहिका (108).
4. **नागरिक सनद (RTS Act):** महाराष्ट्र लोकसेवा हक्क अधिनियमांतर्गत सेवांची मुदत आणि पुणे सेतूची सेवा मानके.
5. **ई-टपाल माहिती:** महापालिकेतील पत्रव्यवहार ट्रॅकिंग कार्यपद्धती.

कृपया आपला प्रश्न विचारताना समस्येचा प्रकार किंवा प्रभागाचे नाव नमूद करा.`,
      sources: [
        "पुणे सेतू अधिकृत माहिती संग्रह (PuneSetu Verified Civic Corpus)",
        "पुणे महानगरपालिका (pmc.gov.in)",
      ],
      suggestedFollowups: [
        "आपत्कालीन संपर्क क्रमांक कोणते आहेत?",
        "औंध क्षेत्रीय कार्यालय कुठे आहे?",
        "नागरी समस्या कशी नोंदवावी?",
      ],
      mode: "GROUNDED_CIVIC_CORPUS",
    };
  } else if (lang === "hi") {
    return {
      answer: `मैं पुणे सेतू का आधिकारिक नागरिक ज्ञान सहायक हूँ। मैं निम्नलिखित विषयों में आपकी सहायता कर सकता हूँ:
1. **समस्या पंजीकरण:** सड़क, गड्ढे, कचरा, पानी, सीवरेज व स्ट्रीट लाइट संबंधी शिकायत कैसे दर्ज करें।
2. **वार्ड कार्यालय:** पुणे मनपा के सभी १५ क्षेत्रीय कार्यालयों के पते, फोन नंबर व समय।
3. **आपातकालीन नंबर:** आपदा नियंत्रण (020-25501269), पुलिस (100/112), अग्निशमन (101), एम्बुलेंस (108)।
4. **नागरिक अधिकार सनद (RTS Act):** लोकसेवा गारंटी कानून के तहत समय सीमा एवं पुणे सेतू के आंतरिक लक्ष्य।
5. **ई-टपाल:** नगर निगम की आधिकारिक पत्रावली व फाइल ट्रैकिंग की जानकारी।

कृपया अपना प्रश्न पूछें अथवा अपने वार्ड का नाम या समस्या का प्रकार लिखें।`,
      sources: [
        "पुणे सेतू सत्यापित नागरिक ज्ञान कोष",
        "पुणे नगर निगम (pmc.gov.in)",
      ],
      suggestedFollowups: [
        "पुणे के आपातकालीन नंबर क्या हैं?",
        "औंध वार्ड कार्यालय का पता क्या है?",
        "शिकायत कैसे दर्ज करें?",
      ],
      mode: "GROUNDED_CIVIC_CORPUS",
    };
  } else {
    return {
      answer: `I am the PuneSetu Civic Knowledge Assistant. I can assist you with verified information on:
1. **Reporting Civic Issues:** How to report potholes, waste, water leaks, or broken streetlights with evidence.
2. **Ward Directories:** Office locations, phone numbers, and visiting hours for all 15 PMC Prabhag Wards.
3. **Emergency Numbers:** Disaster management (020-25501269), Police (100/112), Fire (101), Ambulance (108).
4. **Citizen Charter (RTS Act):** Maharashtra Right to Public Services timelines vs PuneSetu grievance SLAs.
5. **E-Tapaal Guidance:** Understanding municipal correspondence and file movement.

Please ask a specific question or mention your ward name or civic issue category.`,
      sources: [
        "PuneSetu Verified Civic Knowledge Corpus",
        "Pune Municipal Corporation Official Portal (pmc.gov.in)",
        "Maharashtra State Commission for Right to Public Services",
      ],
      suggestedFollowups: [
        "What are the emergency numbers for Pune?",
        "Where is the Aundh Ward Office?",
        "How do I submit a civic grievance?",
      ],
      mode: "GROUNDED_CIVIC_CORPUS",
    };
  }
}
