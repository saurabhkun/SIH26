import { IssueDomain } from "./domains";

export interface VisualChallengeOption {
  id: string;
  hindiTitle: string;
  title: string;
  englishSubtitle: string;
  iconName:
    | "droplets"
    | "sprout"
    | "pickaxe"
    | "heart-pulse"
    | "graduation-cap"
    | "trees"
    | "baby"
    | "tractor";
  domain: IssueDomain;
  defaultSeverity: number;
  badge: string;
  color: string;
  borderColor: string;
  bgLight: string;
  description: string;
  audioPrompt: string;
  exampleTitle: string;
}

export const VISUAL_CHALLENGES: VisualChallengeOption[] = [
  {
    id: "water-contamination",
    hindiTitle: "पीने का पानी / नल / चापाकल",
    title: "पीने का पानी / नल / चापाकल",
    englishSubtitle: "Drinking Water & Handpumps",
    iconName: "droplets",
    domain: "Water Resources",
    defaultSeverity: 4,
    badge: "बुनियादी ज़रूरत",
    color: "#0284c7",
    borderColor: "#38bdf8",
    bgLight: "#f0f9ff",
    description: "चापाकल खराब, नलों में गंदा/पीला पानी, पाइपलाइन टूटी",
    audioPrompt: "पीने का पानी, चापाकल या पाइपलाइन की समस्या के लिए यहाँ दबाएँ",
    exampleTitle: "चापाकल खराब एवं नलों में दूषित पानी की समस्या",
  },
  {
    id: "drought-irrigation",
    hindiTitle: "खेत की सिंचाई / सूखा",
    title: "खेत की सिंचाई / सूखा",
    englishSubtitle: "Farm Water & Irrigation",
    iconName: "sprout",
    domain: "Agriculture",
    defaultSeverity: 3,
    badge: "खेती-बाड़ी",
    color: "#15803d",
    borderColor: "#4ade80",
    bgLight: "#f0fdf4",
    description: "नहर टूटी, कुआं सूखा, फसल को पानी नहीं मिल रहा",
    audioPrompt: "खेत की सिंचाई, टूटी नहर या सूखे की समस्या के लिए यहाँ दबाएँ",
    exampleTitle: "टूटी नहर व सूखे के कारण खेतों में सिंचाई का संकट",
  },
  {
    id: "mining-pollution",
    hindiTitle: "खदान का धुआं और काला कचरा",
    title: "खदान का धुआं और काला कचरा",
    englishSubtitle: "Mine Dust & Pollution",
    iconName: "pickaxe",
    domain: "Environment",
    defaultSeverity: 4,
    badge: "स्वास्थ्य खतरा",
    color: "#b45309",
    borderColor: "#fbbf24",
    bgLight: "#fffbeb",
    description: "कोयले की धूल, उड़ती राख, ज़हरीला धुआं, खुला गड्ढा",
    audioPrompt: "खदान की धूल, काले धुएं या प्रदूषण की शिकायत के लिए यहाँ दबाएँ",
    exampleTitle: "कोयला खदान से उड़ती धूल व विषाक्त धुएं का प्रकोप",
  },
  {
    id: "healthcare-delivery",
    hindiTitle: "दवाखाना / डॉक्टर / इलाज",
    title: "दवाखाना / डॉक्टर / इलाज",
    englishSubtitle: "Hospital, Clinic & Medicine",
    iconName: "heart-pulse",
    domain: "Healthcare",
    defaultSeverity: 4,
    badge: "इलाज & दवा",
    color: "#e11d48",
    borderColor: "#fb7185",
    bgLight: "#fff1f2",
    description: "डॉक्टर नहीं हैं, अस्पताल बंद है, दवा या टीका नहीं मिल रहा",
    audioPrompt: "अस्पताल, डॉक्टर या दवा न मिलने की शिकायत के लिए यहाँ दबाएँ",
    exampleTitle: "स्वास्थ्य केंद्र पर डॉक्टर व आवश्यक जीवनरक्षक दवाओं का अभाव",
  },
  {
    id: "school-infrastructure",
    hindiTitle: "स्कूल की छत, बिजली व शौचालय",
    title: "स्कूल की छत, बिजली व शौचालय",
    englishSubtitle: "School & Classroom Needs",
    iconName: "graduation-cap",
    domain: "Education",
    defaultSeverity: 3,
    badge: "बच्चों की पढ़ाई",
    color: "#4f46e5",
    borderColor: "#818cf8",
    bgLight: "#eef2ff",
    description: "टूटी छत, पीने का पानी नहीं, बालिकाओं का शौचालय बंद",
    audioPrompt: "स्कूल की टूटी छत, बिजली या शौचालय की समस्या के लिए यहाँ दबाएँ",
    exampleTitle: "सरकारी विद्यालय में जर्जर छत एवं बालिकाओं के शौचालय की कमी",
  },
  {
    id: "watershed-forest",
    hindiTitle: "जंगल कटाई और नाला सूखना",
    title: "जंगल कटाई और नाला सूखना",
    englishSubtitle: "Forest, Trees & Streams",
    iconName: "trees",
    domain: "Environment",
    defaultSeverity: 3,
    badge: "पर्यावरण",
    color: "#047857",
    borderColor: "#34d399",
    bgLight: "#ecfdf5",
    description: "पेड़ काटे जा रहे हैं, मिट्टी बह रही है, बरसाती नाला सूखा",
    audioPrompt: "जंगल कटाई, मिट्टी कटाव या सूखे नाले की शिकायत के लिए यहाँ दबाएँ",
    exampleTitle: "अवैध जंगल कटाई एवं बरसाती नाले के सूखने से भू-क्षरण",
  },
  {
    id: "child-malnutrition",
    hindiTitle: "आंगनवाड़ी / बच्चों का राशन",
    title: "आंगनवाड़ी / बच्चों का राशन",
    englishSubtitle: "Anganwadi & Child Nutrition",
    iconName: "baby",
    domain: "Healthcare",
    defaultSeverity: 4,
    badge: "आंगनवाड़ी",
    color: "#c026d3",
    borderColor: "#e879f9",
    bgLight: "#fdf4ff",
    description: "राशन नहीं मिला, बच्चों का पौष्टिक आहार बंद है",
    audioPrompt: "आंगनवाड़ी केंद्र बंद होने या बच्चों का राशन न मिलने पर यहाँ दबाएँ",
    exampleTitle: "आंगनवाड़ी केंद्र पर नियमित पोषाहार राशन वितरण में बाधा",
  },
  {
    id: "farmer-livelihoods",
    hindiTitle: "मजदूरी, बीज और पशुपालन",
    title: "मजदूरी, बीज और पशुपालन",
    englishSubtitle: "Work, Seeds & Income",
    iconName: "tractor",
    domain: "Rural Livelihoods",
    defaultSeverity: 3,
    badge: "रोज़गार",
    color: "#d97706",
    borderColor: "#fcd34d",
    bgLight: "#fffdf0",
    description: "काम के पैसे नहीं मिले, बीज नहीं मिला, पशु दवा की ज़रूरत",
    audioPrompt: "मजदूरी भुगतान, बीज या पशुओं की समस्या के लिए यहाँ दबाएँ",
    exampleTitle: "श्रमिकों के मजदूरी भुगतान में विलंब एवं उन्नत बीज की अनुपलब्धता",
  },
];
