export interface ETapaalMovementStep {
  stepIndex: number;
  deskName: string;
  deskNameMr: string;
  deskNameHi: string;
  officerDesignation: string;
  officerDesignationMr: string;
  officerDesignationHi: string;
  actionTaken: string;
  actionTakenMr: string;
  actionTakenHi: string;
  actionDate: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
}

export interface ETapaalRecord {
  inwardNumber: string;
  subject: string;
  subjectMr: string;
  subjectHi: string;
  department: string;
  departmentMr: string;
  departmentHi: string;
  wardName: string;
  wardNameMr: string;
  wardNameHi: string;
  applicantType: "Citizen" | "Registered Society" | "Govt Department" | "Public Representative";
  applicantTypeMr: string;
  applicantTypeHi: string;
  inwardDate: string;
  currentDesk: string;
  currentDeskMr: string;
  currentDeskHi: string;
  currentStatus: "UNDER_SCRUTINY" | "FIELD_INSPECTION" | "APPROVAL_STAGE" | "DISPATCHED";
  currentStatusLabel: string;
  currentStatusLabelMr: string;
  currentStatusLabelHi: string;
  isDemonstration: true;
  movementSteps: ETapaalMovementStep[];
}

export const DEMO_ETAPAAL_RECORDS: ETapaalRecord[] = [
  {
    inwardNumber: "ET-PMC-2026-08912",
    subject: "Application for Road Widening and Footpath Kerb Realignment near Balgandharva",
    subjectMr: "बालगंधर्व रंगमंदिराजवळ रस्ता रुंदीकरण आणि पदपथ दुरुस्तीसाठी अर्ज",
    subjectHi: "बालगंधर्व रंगमंदिर के पास सड़क चौड़ीकरण और फुटपाथ मरम्मत के लिए आवेदन",
    department: "Roads & Traffic Maintenance",
    departmentMr: "रस्ते व वाहतूक देखभाल विभाग",
    departmentHi: "सड़क एवं यातायात रखरखाव विभाग",
    wardName: "Shivaji Nagar - Ghole Road (Ward 2)",
    wardNameMr: "शिवाजीनगर - घोले रोड (प्रभाग २)",
    wardNameHi: "शिवाजी नगर - घोले रोड (वार्ड २)",
    applicantType: "Registered Society",
    applicantTypeMr: "नोंदणीकृत गृहनिर्माण संस्था",
    applicantTypeHi: "पंजीकृत आवासीय सोसायटी",
    inwardDate: "2026-10-08",
    currentDesk: "Executive Engineer (Road Projects Central)",
    currentDeskMr: "कार्यकारी अभियंता (रस्ते प्रकल्प मध्यवर्ती)",
    currentDeskHi: "कार्यकारी अभियंता (सड़क परियोजना केंद्रीय)",
    currentStatus: "APPROVAL_STAGE",
    currentStatusLabel: "Under Executive Approval",
    currentStatusLabelMr: "कार्यकारी मंजुरीच्या टप्प्यावर",
    currentStatusLabelHi: "कार्यकारी स्वीकृति के अधीन",
    isDemonstration: true,
    movementSteps: [
      {
        stepIndex: 1,
        deskName: "Inward & Dispatch Clerk, Ghole Road Ward",
        deskNameMr: "आवक-जावक लिपिक, घोले रोड प्रभाग",
        deskNameHi: "आवक-जावक लिपिक, घोले रोड वार्ड",
        officerDesignation: "Junior Clerk (Inward)",
        officerDesignationMr: "कनिष्ठ लिपिक (आवक)",
        officerDesignationHi: "कनिष्ठ लिपिक (आवक)",
        actionTaken: "Inwarded paper application, scanned attachments, and assigned E-Tapaal barcode.",
        actionTakenMr: "कागदी अर्ज दाखल केला, कागदपत्रे स्कॅन केली आणि ई-टपाल बारकोड दिला.",
        actionTakenHi: "आवेदन प्राप्त किया, दस्तावेज स्कैन किए और ई-टपाल बारकोड आवंटित किया।",
        actionDate: "2026-10-08 10:45 AM",
        status: "COMPLETED",
      },
      {
        stepIndex: 2,
        deskName: "Assistant Municipal Commissioner Desk",
        deskNameMr: "सहाय्यक महापालिका आयुक्त टेबल",
        deskNameHi: "सहायक नगर आयुक्त टेबल",
        officerDesignation: "Assistant Municipal Commissioner",
        officerDesignationMr: "सहाय्यक महापालिका आयुक्त",
        officerDesignationHi: "सहायक नगर आयुक्त",
        actionTaken: "Reviewed citizen application and endorsed to Junior Engineer for physical site inspection.",
        actionTakenMr: "अर्जाची छाननी केली आणि प्रत्यक्ष जागेची पाहणी करण्यासाठी कनिष्ठ अभियंत्याकडे वर्ग केले.",
        actionTakenHi: "आवेदन की समीक्षा की और स्थल निरीक्षण के लिए कनिष्ठ अभियंता को अग्रेषित किया।",
        actionDate: "2026-10-10 03:15 PM",
        status: "COMPLETED",
      },
      {
        stepIndex: 3,
        deskName: "Junior Engineer (Roads Maintenance)",
        deskNameMr: "कनिष्ठ अभियंता (रस्ते देखभाल)",
        deskNameHi: "कनिष्ठ अभियंता (सड़क रखरखाव)",
        officerDesignation: "Junior Engineer (Civil)",
        officerDesignationMr: "कनिष्ठ अभियंता (स्थापत्य)",
        officerDesignationHi: "कनिष्ठ अभियंता (सिविल)",
        actionTaken: "Completed site measurement and prepared technical estimate for kerb stone replacement.",
        actionTakenMr: "जागेची मोजणी पूर्ण केली आणि पदपथ दगड बदलण्याचा तांत्रिक अंदाजपत्रक तयार केला.",
        actionTakenHi: "स्थल मापन पूर्ण किया और फुटपाथ मरम्मत का तकनीकी प्राक्कलन तैयार किया।",
        actionDate: "2026-10-15 11:30 AM",
        status: "COMPLETED",
      },
      {
        stepIndex: 4,
        deskName: "Executive Engineer (Road Projects Central)",
        deskNameMr: "कार्यकारी अभियंता (रस्ते प्रकल्प मध्यवर्ती)",
        deskNameHi: "कार्यकारी अभियंता (सड़क परियोजना केंद्रीय)",
        officerDesignation: "Executive Engineer",
        officerDesignationMr: "कार्यकारी अभियंता",
        officerDesignationHi: "कार्यकारी अभियंता",
        actionTaken: "Scrutinizing technical estimate and tender work package allocation.",
        actionTakenMr: "तांत्रिक अंदाजपत्रक आणि निविदा कामाच्या मंजुरीची तपासणी सुरू आहे.",
        actionTakenHi: "तकनीकी प्राक्कलन और कार्य आवंटन की समीक्षा जारी है।",
        actionDate: "2026-10-18 02:00 PM",
        status: "ACTIVE",
      },
    ],
  },
  {
    inwardNumber: "ET-PMC-2026-11420",
    subject: "Requisition for Municipal Community Hall Booking at Bibwewadi for Annual Cultural Event",
    subjectMr: "बिबवेवाडी येथील महापालिका समाज मंदिर वार्षिक सांस्कृतिक कार्यक्रमासाठी आरक्षित करणेबाबत",
    subjectHi: "बिबवेवाड़ी में नगर निगम सामुदायिक भवन वार्षिक सांस्कृतिक कार्यक्रम के लिए आरक्षित करने का अनुरोध",
    department: "Garden & Tree Authority",
    departmentMr: "उद्यान व समाज विकास विभाग",
    departmentHi: "उद्यान एवं सामुदायिक विकास विभाग",
    wardName: "Bibwewadi (Ward 7)",
    wardNameMr: "बिबवेवाडी (प्रभाग ७)",
    wardNameHi: "बिबवेवाड़ी (वार्ड ७)",
    applicantType: "Citizen",
    applicantTypeMr: "स्थानिक नागरिक",
    applicantTypeHi: "स्थानीय नागरिक",
    inwardDate: "2026-10-12",
    currentDesk: "Dispatched to Applicant",
    currentDeskMr: "अर्जदारास आदेश रवाना",
    currentDeskHi: "आवेदक को आदेश प्रेषित",
    currentStatus: "DISPATCHED",
    currentStatusLabel: "Permission Sanctioned & Dispatched",
    currentStatusLabelMr: "मंजुरी आदेश वितरित",
    currentStatusLabelHi: "अनुमति स्वीकृत एवं प्रेषित",
    isDemonstration: true,
    movementSteps: [
      {
        stepIndex: 1,
        deskName: "Inward Desk, Bibwewadi Ward Office",
        deskNameMr: "आवक टेबल, बिबवेवाडी प्रभाग कार्यालय",
        deskNameHi: "आवक टेबल, बिबवेवाड़ी वार्ड कार्यालय",
        officerDesignation: "Senior Clerk",
        officerDesignationMr: "वरिष्ठ लिपिक",
        officerDesignationHi: "वरिष्ठ लिपिक",
        actionTaken: "Received community hall booking requisition Form B with deposit challan.",
        actionTakenMr: "ठेव चलनासह समाज मंदिर आरक्षण अर्ज 'ब' स्वीकारला.",
        actionTakenHi: "जमा चालान के साथ सामुदायिक भवन बुकिंग फॉर्म प्राप्त किया।",
        actionDate: "2026-10-12 11:00 AM",
        status: "COMPLETED",
      },
      {
        stepIndex: 2,
        deskName: "Social Welfare Officer Desk",
        deskNameMr: "समाज कल्याण अधिकारी टेबल",
        deskNameHi: "समाज कल्याण अधिकारी टेबल",
        officerDesignation: "Ward Welfare Inspector",
        officerDesignationMr: "प्रभाग कल्याण निरीक्षक",
        officerDesignationHi: "वार्ड कल्याण निरीक्षक",
        actionTaken: "Verified schedule availability and issued payment receipt for rent charges.",
        actionTakenMr: "दिनांक उपलब्धता तपासली आणि भाडे पावती जारी केली.",
        actionTakenHi: "तिथि उपलब्धता की पुष्टि की और किराया भुगतान रसीद जारी की।",
        actionDate: "2026-10-14 04:20 PM",
        status: "COMPLETED",
      },
      {
        stepIndex: 3,
        deskName: "Outward Section",
        deskNameMr: "जावक विभाग",
        deskNameHi: "जावक अनुभाग",
        officerDesignation: "Dispatch Officer",
        officerDesignationMr: "जावक अधिकारी",
        officerDesignationHi: "प्रेषण अधिकारी",
        actionTaken: "Generated allotment order No. PMC/SW/2026/842 and sent SMS notification to applicant.",
        actionTakenMr: "वाटप आदेश क्र. मनपा/सक/२०२६/८४२ तयार केला आणि अर्जदारास एसएमएस पाठवला.",
        actionTakenHi: "आवंटन आदेश सं. मनपा/सक/२०२६/८४२ जारी किया और आवेदक को एसएमएस भेजा।",
        actionDate: "2026-10-16 12:15 PM",
        status: "COMPLETED",
      },
    ],
  },
  {
    inwardNumber: "ET-PMC-2026-04281",
    subject: "Drainage Desilting & Pre-Monsoon Stormwater Canal Inspection Work Order",
    subjectMr: "पावसाळ्यापूर्वी नाले सफाई आणि ड्रेनेज लाईन गाळ काढण्याचे कामाचे आदेश",
    subjectHi: "मानसून पूर्व नाला सफाई और जल निकासी लाइन गाद निकालने का कार्य आदेश",
    department: "Drainage & Sewerage Maintenance",
    departmentMr: "मलनिःसारण व ड्रेनेज देखभाल विभाग",
    departmentHi: "जल निकासी एवं सीवरेज रखरखाव विभाग",
    wardName: "Aundh - Baner (Ward 1)",
    wardNameMr: "औंध - बाणेर (प्रभाग १)",
    wardNameHi: "औंध - बानेर (वार्ड १)",
    applicantType: "Public Representative",
    applicantTypeMr: "लोकप्रतिनिधी / प्रभाग समिती",
    applicantTypeHi: "जनप्रतिनिधि / वार्ड समिति",
    inwardDate: "2026-09-28",
    currentDesk: "Junior Engineer (Drainage Maintenance)",
    currentDeskMr: "कनिष्ठ अभियंता (ड्रेनेज देखभाल)",
    currentDeskHi: "कनिष्ठ अभियंता (जल निकासी रखरखाव)",
    currentStatus: "FIELD_INSPECTION",
    currentStatusLabel: "Field Inspection in Progress",
    currentStatusLabelMr: "प्रत्यक्ष जागेवर पाहणी सुरू",
    currentStatusLabelHi: "स्थलीय निरीक्षण जारी",
    isDemonstration: true,
    movementSteps: [
      {
        stepIndex: 1,
        deskName: "Central Inward, PMC Main Building",
        deskNameMr: "मध्यवर्ती आवक, मनपा मुख्य इमारत",
        deskNameHi: "केंद्रीय आवक, मनपा मुख्य भवन",
        officerDesignation: "Head Inward Clerk",
        officerDesignationMr: "मुख्य आवक लिपिक",
        officerDesignationHi: "मुख्य आवक लिपिक",
        actionTaken: "Inwarded memorandum from Ward Committee and forwarded to Chief Engineer (Drainage).",
        actionTakenMr: "प्रभाग समितीचे पत्र स्वीकारून मुख्य अभियंत्यांकडे (मलनिःसारण) पाठवले.",
        actionTakenHi: "वार्ड समिति का पत्र प्राप्त कर मुख्य अभियंता (सीवरेज) को भेजा।",
        actionDate: "2026-09-28 02:00 PM",
        status: "COMPLETED",
      },
      {
        stepIndex: 2,
        deskName: "Aundh Ward Drainage Sub-Division",
        deskNameMr: "औंध प्रभाग ड्रेनेज उपविभाग",
        deskNameHi: "औंध वार्ड ड्रेनेज उपमंडल",
        officerDesignation: "Junior Engineer (Drainage)",
        officerDesignationMr: "कनिष्ठ अभियंता (ड्रेनेज)",
        officerDesignationHi: "कनिष्ठ अभियंता (ड्रेनेज)",
        actionTaken: "Deploying suction machines and desilting contractor crew along DP Road stretch.",
        actionTakenMr: "डीपी रोड पट्ट्यात सक्शन मशीन आणि गाळ काढणाऱ्या पथकाची प्रत्यक्ष पाहणी सुरू.",
        actionTakenHi: "डीपी रोड क्षेत्र में सक्शन मशीन और सफाई दल द्वारा निरीक्षण जारी।",
        actionDate: "2026-10-05 10:00 AM",
        status: "ACTIVE",
      },
    ],
  },
  {
    inwardNumber: "ET-PMC-2026-07753",
    subject: "Replacement of Overloaded Streetlight Feeder Pillar at Paud Road Kothrud",
    subjectMr: "पौड रोड कोथरूड येथील ओव्हरलोड पथदिवा फिडर पिलर बदलणेबाबत",
    subjectHi: "पौड रोड कोथरूड में ओवरलोडेड स्ट्रीट लाइट फीडर पिलर बदलने के संबंध में",
    department: "Electrical & Street Lighting",
    departmentMr: "विद्युत व पथदिवे विभाग",
    departmentHi: "विद्युत एवं पथ प्रकाश विभाग",
    wardName: "Kothrud - Bavdhan (Ward 3)",
    wardNameMr: "कोथरूड - बावधन (प्रभाग ३)",
    wardNameHi: "कोथरूड - बावधन (वार्ड ३)",
    applicantType: "Citizen",
    applicantTypeMr: "स्थानिक नागरिक",
    applicantTypeHi: "स्थानीय नागरिक",
    inwardDate: "2026-10-02",
    currentDesk: "Assistant Engineer (Electrical Zone 2)",
    currentDeskMr: "सहाय्यक अभियंता (विद्युत परिमंडळ २)",
    currentDeskHi: "सहायक अभियंता (विद्युत क्षेत्र २)",
    currentStatus: "UNDER_SCRUTINY",
    currentStatusLabel: "Load Assessment Underway",
    currentStatusLabelMr: "भार क्षमता तपासणी सुरू",
    currentStatusLabelHi: "लोड क्षमता परीक्षण जारी",
    isDemonstration: true,
    movementSteps: [
      {
        stepIndex: 1,
        deskName: "Kothrud Ward Inward Counter",
        deskNameMr: "कोथरूड प्रभाग आवक खिडकी",
        deskNameHi: "कोथरूड वार्ड आवक काउंटर",
        officerDesignation: "Inward Clerk",
        officerDesignationMr: "आवक लिपिक",
        officerDesignationHi: "आवक लिपिक",
        actionTaken: "Registered citizen complaint regarding frequent feeder tripping.",
        actionTakenMr: "फिडर पिलर वारंवार ट्रीप होत असल्याचा नागरिकांचा अर्ज नोंदवला.",
        actionTakenHi: "फीडर पिलर बार-बार ट्रिप होने की शिकायत दर्ज की।",
        actionDate: "2026-10-02 09:30 AM",
        status: "COMPLETED",
      },
      {
        stepIndex: 2,
        deskName: "Electrical Maintenance Section",
        deskNameMr: "विद्युत देखभाल शाखा",
        deskNameHi: "विद्युत रखरखाव शाखा",
        officerDesignation: "Junior Engineer (Electrical)",
        officerDesignationMr: "कनिष्ठ अभियंता (विद्युत)",
        officerDesignationHi: "कनिष्ठ अभियंता (विद्युत)",
        actionTaken: "Inspected wiring load and recommended 100A replacement feeder box.",
        actionTakenMr: "विद्युत भाराची पाहणी केली आणि १०० अँपिअरचा नवीन बॉक्स बसवण्याची शिफारस केली.",
        actionTakenHi: "वायरिंग लोड का निरीक्षण किया और १०० एंपियर बॉक्स की सिफारिश की।",
        actionDate: "2026-10-06 01:15 PM",
        status: "ACTIVE",
      },
    ],
  },
];

/**
 * Searches the demonstration E-Tapaal records by inward token.
 * Authentically returns matching record or null if not found.
 */
export function lookupETapaalRecord(query: string): ETapaalRecord | null {
  const clean = query.trim().toUpperCase();
  if (!clean) return null;
  return DEMO_ETAPAAL_RECORDS.find((rec) => rec.inwardNumber.toUpperCase() === clean) || null;
}
