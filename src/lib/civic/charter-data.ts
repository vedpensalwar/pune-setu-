export interface StatutoryService {
  id: string;
  name: string;
  nameMr: string;
  nameHi: string;
  department: string;
  departmentMr: string;
  timelineDays: number;
  designatedOfficer: string;
  firstAppellateAuthority: string;
  secondAppellateAuthority: string;
  requiredDocuments: string[];
}

export interface SLABenchmark {
  priority: "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
  targetHours: number;
  label: string;
  labelMr: string;
  labelHi: string;
  examples: string;
  examplesMr: string;
  examplesHi: string;
}

export const STATUTORY_NOTIFIED_SERVICES: StatutoryService[] = [
  {
    id: "rts-birth-cert",
    name: "Issuance of Birth Certificate",
    nameMr: "जन्म प्रमाणपत्र देणे",
    nameHi: "जन्म प्रमाण पत्र जारी करना",
    department: "Health & Sanitation",
    departmentMr: "आरोग्य व स्वच्छता विभाग",
    timelineDays: 7,
    designatedOfficer: "Medical Officer of Health (Ward)",
    firstAppellateAuthority: "Assistant Municipal Commissioner (Ward)",
    secondAppellateAuthority: "Deputy Municipal Commissioner (Health)",
    requiredDocuments: ["Hospital discharge card / institutional birth slip", "Parents' Aadhaar Card copy", "Residence proof"],
  },
  {
    id: "rts-death-cert",
    name: "Issuance of Death Certificate",
    nameMr: "मृत्यू प्रमाणपत्र देणे",
    nameHi: "मृत्यु प्रमाण पत्र जारी करना",
    department: "Health & Sanitation",
    departmentMr: "आरोग्य व स्वच्छता विभाग",
    timelineDays: 7,
    designatedOfficer: "Medical Officer of Health (Ward)",
    firstAppellateAuthority: "Assistant Municipal Commissioner (Ward)",
    secondAppellateAuthority: "Deputy Municipal Commissioner (Health)",
    requiredDocuments: ["Hospital death summary / Crematorium receipt", "Deceased Aadhaar Card copy", "Applicant ID proof"],
  },
  {
    id: "rts-water-noc",
    name: "Sanction / NOC for New Drinking Water Connection",
    nameMr: "नवीन पिण्याच्या पाण्याचे नळजोड मंजुरी / हरकत नाही प्रमाणपत्र",
    nameHi: "नए पेयजल कनेक्शन की स्वीकृति / अनापत्ति प्रमाण पत्र",
    department: "Water Supply & Pumping",
    departmentMr: "पाणी पुरवठा विभाग",
    timelineDays: 21,
    designatedOfficer: "Junior Engineer (Water Supply)",
    firstAppellateAuthority: "Executive Engineer (Water Supply)",
    secondAppellateAuthority: "Chief Engineer (Water Supply)",
    requiredDocuments: ["Property tax paid receipt", "Sanctioned building plan / Index II", "Plumber completion certificate"],
  },
  {
    id: "rts-drainage-noc",
    name: "Sanction for Sewer / Drainage Connection",
    nameMr: "सांडपाणी / ड्रेनेज लाईन जोडणी मंजुरी",
    nameHi: "सीवरेज / ड्रेनेज लाइन कनेक्शन की स्वीकृति",
    department: "Drainage & Sewerage Maintenance",
    departmentMr: "मलनिःसारण देखभाल विभाग",
    timelineDays: 21,
    designatedOfficer: "Junior Engineer (Drainage)",
    firstAppellateAuthority: "Executive Engineer (Drainage)",
    secondAppellateAuthority: "Chief Engineer (Drainage)",
    requiredDocuments: ["Sanctioned building layout", "Property tax clearance", "Licensed drainage contractor certificate"],
  },
  {
    id: "rts-trade-license",
    name: "Trade License (Shops & Establishments / Health Trade)",
    nameMr: "व्यवसाय / आरोग्य व्यापार परवाना (नवीन / नूतनीकरण)",
    nameHi: "व्यापार लाइसेंस (दुकान एवं स्थापना / स्वास्थ्य व्यापार)",
    department: "Encroachment Removal & Licensing",
    departmentMr: "परवाना व अतिक्रमण निर्मूलन विभाग",
    timelineDays: 30,
    designatedOfficer: "Ward License Inspector",
    firstAppellateAuthority: "Assistant Municipal Commissioner (Ward)",
    secondAppellateAuthority: "Deputy Municipal Commissioner (Special)",
    requiredDocuments: ["Rent agreement / ownership proof", "Shop establishment Form A", "Fire safety clearance (if applicable)"],
  },
  {
    id: "rts-property-extract",
    name: "Property Tax Assessment Extract (Form 8A / No Due Certificate)",
    nameMr: "मालमत्ता कर आकारणी उतारा / थकबाकी नसलेला दाखला",
    nameHi: "संपत्ति कर निर्धारण विवरण / बकाया न होने का प्रमाण पत्र",
    department: "Revenue & Property Tax",
    departmentMr: "आकारणी व कर संकलन विभाग",
    timelineDays: 7,
    designatedOfficer: "Tax Inspector (Ward)",
    firstAppellateAuthority: "Administrative Officer (Tax)",
    secondAppellateAuthority: "Assessor & Collector of Taxes",
    requiredDocuments: ["Property tax bill number", "Previous paid receipt", "Applicant identity proof"],
  },
  {
    id: "rts-tree-pruning",
    name: "Permission for Hazardous Tree Branch Pruning / Trimming",
    nameMr: "धोकादायक झाडांच्या फांद्या छाटण्याची परवानगी",
    nameHi: "खतरनाक पेड़ की शाखाएं छांटने की अनुमति",
    department: "Garden & Tree Authority",
    departmentMr: "उद्यान व वृक्ष प्राधिकरण विभाग",
    timelineDays: 15,
    designatedOfficer: "Tree Officer (Ward)",
    firstAppellateAuthority: "Superintendent of Gardens",
    secondAppellateAuthority: "Additional Municipal Commissioner",
    requiredDocuments: ["Application with site photograph", "Society NOC / owner consent", "Reason for hazard"],
  },
];

export const PUNESETU_SLA_BENCHMARKS: SLABenchmark[] = [
  {
    priority: "EMERGENCY",
    targetHours: 24,
    label: "Emergency Priority",
    labelMr: "तातडीचे / आणीबाणी प्राधान्य",
    labelHi: "आपातकालीन प्राथमिकता",
    examples: "Open or collapsed manhole, live fallen electric cable, major water pipeline burst flooding public street.",
    examplesMr: "उघडे किंवा तुटलेले मॅनहोल, पडलेली जिवंत विजेची तार, मुख्य जलवाहिनी फुटून रस्त्यावर आलेले पाणी.",
    examplesHi: "खुला या टूटा हुआ मैनहोल, बिजली का चालू तार गिरना, मुख्य पाइपलाइन टूटने से सड़क पर जलभराव।",
  },
  {
    priority: "HIGH",
    targetHours: 48,
    label: "High Priority",
    labelMr: "उच्च प्राधान्य",
    labelHi: "उच्च प्राथमिकता",
    examples: "Dangerous pothole cluster on arterial road, blocked primary stormwater drain during monsoon, overflowing community waste depot.",
    examplesMr: "मुख्य रस्त्यावरील धोकादायक खड्डे, पावसाळ्यात तुंबलेला मुख्य पावसाळी नाला, कचरा कुंडी ओसंडून वाहणे.",
    examplesHi: "मुख्य सड़क पर खतरनाक गड्ढे, मानसून में बंद हुआ मुख्य नाला, कचरा डिपो ओवरफ्लो होना।",
  },
  {
    priority: "MEDIUM",
    targetHours: 72,
    label: "Medium Priority",
    labelMr: "मध्यम प्राधान्य",
    labelHi: "मध्यम प्राथमिकता",
    examples: "Non-functional streetlight line (feeder pillar fault), turbid tap water report, footpath vendor encroachment.",
    examplesMr: "पथदिव्यांची बंद पडलेली लाईन, गढूळ पाणी येणे, पदपथावरील बेकायदेशीर फेरीवाले.",
    examplesHi: "स्ट्रीट लाइट बंद होना, दूषित पानी की आपूर्ति, फुटपाथ पर अतिक्रमण।",
  },
  {
    priority: "LOW",
    targetHours: 168, // 7 days
    label: "Low Priority",
    labelMr: "कमी प्राधान्य",
    labelHi: "कम प्राथमिकता",
    examples: "Public garden bench repair, overgrown grass in municipal median, non-hazardous tree branch shaping.",
    examplesMr: "सार्वजनिक बागेतील तुटलेला बाकडा, दुभाजकातील गवत वाढणे, झाडांचे सौंदर्यीकरण.",
    examplesHi: "सार्वजनिक पार्क की बेंच मरम्मत, डिवाइडर पर घास कटना, पेड़ों की छंटाई।",
  },
];
