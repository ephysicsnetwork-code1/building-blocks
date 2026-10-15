import { normalizeName } from "./school-constants";
export { GRADES, STREAM_GRADES, normalizeName, HANDLE_RE, normalizeHandle } from "./school-constants";
// Embedded official roster for Burka Harbu Special Secondary School.
export const SCHOOL_DATABASE = {
  teachers: [
    "Girmaa Gaaddisaa Korsaa",
    "Dajanee Ejersaa Reebaa",
    "Xi'umalissan Dinbaru Birhaan",
    "Amaanu'el Abarraa Oljirraa",
    "Biraanuu Tufaa Garbaa",
    "Tasammaa Tufaa Ayyala",
    "Kuusaa Faaliqaa Dubbiiwaaf",
    "Fiqaaduu Gadaa Gabree",
    "Masfin Tarrafa Daggafaa",
    "Taaffasaa Maracii Xuqanii",
    "Guutaa Lataa Kafanii",
    "Minda Delelegn Gebretsadiq",
    "Galataaw Tashooma Hailemasqal",
    "Lammaa Raggaasaa Damee",
    "Addamuu Fiixee Dhiinsaa",
    "Caalaa Dibaabaa Bulii",
    "Isheetuu Dirribaa Bayyanaa",
    "Tigisti Fiqaad Mollaa",
    "Toomaas Tsaggaa Sirnaa",
    "Taarraqany Abdisaa Guutaa",
    "Alamayyoo Dheeressaa Fufaa",
    "Alamaayyoo Tasfaaye Anagaagraw",
    "Dirribee Bayeechaa Daadhii",
    "Yeshii Woldeyohannis",
    "Xibabuu Alaayyuu Gebretsadiq",
    "Xilaahun Dinquu Lammaa",
    "Ermiyaas Zagayyee Bayechaa",
  ],
  students: {
    "9": {
      A: [
        "Abdi Dadi Tolesa", "Abel Argachew Abebe", "Amayu Amsalu Hundesa", "Baimnat Alamayo Daribe",
        "Bekam Tesfaye Kebebew", "Bikiltu Chala Dida", "Birhanu Tashome Diro", "Birtukan Galana Benti",
        "Bontu Tadese Hayilu", "Bontu Tesfaye Megersa", "Eldana Mekonin Kifilu", "Firaol Nuguse Gonfa",
        "Gediyon Tibabu Girma", "Hachalu Abdisa Gonfa", "Hachalu Kasahun Demise", "Hawera Kebede Oljira",
        "Helen Zerhun Tekile", "Hundaol Tesfaye Beyecha", "Kaleb Fikiru Hajilu", "Lalise Ayele Damena",
        "Lalise Ketama Bedada", "Lami Gudina Mosisa", "Megersa Chanyalew Lema", "Merson Bacha Gemechu",
        "Nahile Nasir Abshir", "Nahili Birhanu Debele", "Nahom Mekonin Merigiya", "Naol Tafa Bekele",
        "Nati Hirpasa Kabeta", "Piromis Getu Dejene", "Rehobot Leta Melka", "Robel Birhanu Bekele",
        "Shumi Sagni Bedada", "Sifan Girma Mekonin", "Sifen Tadese Tafa", "Simbo Temsgen Tafese",
        "Sinan Mulugeta Araga", "Tinbite Mikiyas Mamo", "Yared G/Yesus Guday",
      ],
      B: [
        "Abenezar Kebede Shifera", "Abigiya Phawlos Teshoma", "Adisu Damise Tsige", "Alazar Admasu Birhanu",
        "Amesiyas Tediros Hayilu", "Ayentu Kasahe Kumsa", "Betel Eliyas Tesfaye", "Birtukan Zenebe Tafa",
        "Bona Wayesa Warkina", "Chala Dadi Dabale", "Eliyana Yared Semahegn", "Eyuel Tilahun Dinku",
        "Firaol Legesse Diriba", "Gemechis Muleta Bali", "Hanan Mifta Nasiru", "Hawi Fikadu Dejene",
        "Kebek Demise Mengesha", "Kena Getachew Chibsa", "Kenaol Dereje Adunga", "Kiya Tamiru Dekeba",
        "Koket Fikadu Zegeye", "Lelistu Gedefa Beyecha", "Milki Desisa Ireso", "Mosisa Dereje Bekele",
        "Nanati Fitsumi Getahun", "Nanati Temesgen Jambere", "Naol Gizachew Gonfa", "Samu'el Getacho Dinqu",
        "Sena Tariku Feyisa", "Sena Habtamu Chala", "Shibiru Diriba Moa", "Simbo Fikadu Galan",
        "Sinbone Hayilu Ayela", "Sisay Birhanu Aklilu", "Takelign Dejene Ambesa", "Tilahun Ketama Tolera",
        "Yeabsira Gezehagn Zewude", "Yerosan Abera Amsalu",
      ],
      C: [
        "Abel Tewodros Guta", "Alemeyehu Zewudu Ashetu", "Bachu Inahu Amante", "Biftu Bekele Tulu",
        "Bilise Kumela Duguma", "Bilisuma Mekonnin Goshu", "Biruk Dagne Kuma", "Boniyas Abdi Fufa",
        "Bontu Gutema Abera", "Bontu Abdisa Dembelu", "Dejene Getu Tafa", "Desta Wogene Mekonin",
        "Dureti Dereje Beyana", "Ebasa Getachew Dagne", "Efrata Abreham Asfew", "Fenet Bekele Alemu",
        "Fenet Mekonin Jatama", "Hawinet Faye Kebebe", "Jitu Adisu Gidma", "Jitu Gebisa Buchana",
        "Lidiya Guluma Ketema", "Lidiya Dereje Getahun", "Makdas Birku Bedada", "Milki Dechasa Kuma",
        "Moti Deksisa Gadisa", "Nimona Kaba File", "Nuguse Merechi Bayi", "Obsa Leta Melka",
        "Obse Biranu Teka", "Oromiya Bayecha Seboka", "Semiyad Girma Gudisa", "Sifen Temesgen Bekele",
        "Sinbone Hayilu Tasfaye", "Sonan Mikael Merga", "Sura Shifera Million", "Tsion Behigu Geza",
        "Yerosan Mokonen Duki",
      ],
    },
    "10": {
      A: [
        "Abdi Dejene Daba", "Amanuel Tadesse Tajeba", "Asanti Welkite Kore", "Bekele Nuguse Barsisa",
        "Bethelhem Terefe Asefa", "Bonsa Asfaw Alemu", "Diriba Dida Sori", "Ebise Dejene Terefe",
        "Eyasu Anbesa Dabale", "Eyuel Gezahegn Zawude", "Firaol Hirpa Kebebe", "Firaol Mekonnin Dadi",
        "Gadisa Temesgen Tafese", "Gemechu Urgesa Negesa", "Jitu Tesfaye Belay", "Kenenisa Mesfin Abera",
        "Lemi Girma Guta", "Lensa Belachew Abera", "Meron Tamiru Hailesilase", "Meyad Zerihun Dekeba",
        "Natan Simeneh Gudeta", "Robsen Dejene Lema", "Sifan Dejene Tiki", "Siriyan Tadesse Letera",
        "Solane Takele Hirpha", "Soresa Bayisa Mirkane", "Tariku Admasu Geremew", "Tilahun Teshome Asheti",
        "Tsiyon Mulawu Asmare", "Yosef Birhanu Tolesa",
      ],
      B: [
        "Amanuel Abdissa serda", "Balayi Gamachu Nagasa", "Beka Bedo Kabeda", "Bereket Yilma Tadese",
        "Birhanu Gemechu Hailemariyam", "Bona Tajabe Kelbessa", "Chala Beyecha Geda", "Dereje Bekele Ararsa",
        "Ebisa Shasho Bedasa", "Ebise Merid Guta", "Elias Geletu Tolesa", "Ermias Mekonnin Wami",
        "Esrael Legese Fanta", "Fenet Haile Diriba", "Firaol Ketema Guluma", "Gadisa Rebuma Diba",
        "Hachaltu Mesfin Abera", "Hana Alemu Sholecho", "Koket Wondu Ayele", "Lelo Boki Soboka",
        "Meklit Alemeyehu Nanessa", "Millinium Teketel Gaguro", "Mohamed Seid Ali", "Naol Ijara Bayisa",
        "Naol Jaleta Kelbesa", "Nuguse Kefeni Berecha", "Rebira Ayele Dera", "Samuel Asefa Muleta",
        "Sena Zerihun Bashana", "Sena Adugna Bayisa", "Taye Tolesa Regasa", "Yerosen Benti Haileyesus",
      ],
    },
    "11": {
      A: [
        "Abdata Adane Debeli", "Abdi Fufa Dorsis", "Aboma Gedefa Wakjira", "Alsen Gemechu Lemecha",
        "Ashenafi Daba Debele", "Biniyam Abdisa Lenjisa", "Bonsa Belachew Merzo", "Bontu Gadefa Beyecha",
        "Chala Dajane Niguse", "Daniel Guta Regane", "Dereje Teferi Mekonnen", "Eden Ashenafi Ejersa",
        "Emiru Tolesa Chala", "Ermias Benti Haileyesus", "Fufa Ararsa", "Getu Damisse Bedada",
        "Hana Fikadu Mekonnen", "Hundaol Deressa Dandena", "Iftiyom Gutema Bayi", "Kena Mesfin Terefe",
        "Mekilit Legese Dadi", "Meron Tadesse Gemechu", "Milkesa Fufi Dufera", "Nafnat Gemeda Hasan",
        "Natinael Abu Mekonnen", "Olantu Tamayes Hirko", "Rediet Dagne Yadete", "Robera Kasahun Hurisa",
        "Segni Fituma Lemessa", "Sena Tasama Worku", "Simbo Deksisa Guta", "Tokuma Bayisa Leta",
        "Yanet Girma Takele", "Yanet Bayisa Chala", "Yididiya Tesfaye Dida", "Yoseph Debele Geda",
      ],
      B: [
        "Abebe Ayele Zawude", "Abel Daraje Siyyum", "Abriham Mulaw Asmare", "Adoniyas Biruk Asirat",
        "Arsema Getachew Bitaw", "Besufekad Manaye Nuri", "Betelihem Negash Lema", "Betesfa Sahilu Kassa",
        "Bilisuma Bedada Dorsisa", "Bonsa Wolde Debela", "Dawit Mekonnen Amenu", "Ebise Tolesa Diriba",
        "Firaol Hacalu Bekele", "Gezu Diriba Feyisa", "Hawera Mesfin Abera", "Hayu Diriba Deressa",
        "Ifanol Habtamu Taaddasaa", "Ketoran Girma Jima", "Mekdes Tadese Sharew", "Meti Getahun Alamu",
        "Monera Tafese Merechi", "Nafkod Lelisa Belema", "Nafra Taklu Abdi", "Nanati Degu Teresa",
        "Rebira Ketema", "Rediet Fantahun Nega", "Ruth Manyazehal Shegaw", "Samirawit Teketel Bekele",
        "Selamawit Abraham Jaleta", "Sifen Bonsa Merga", "Singiten Tafesse Merechi", "Tadese Dessu Hurise",
        "Webi Taressa Regasa", "Yeabsira Dana Desta", "Yeron Gonfa Anbessa", "Yordanos Dawit Wesene",
      ],
      C: [
        "Abenezer Girma Dadi", "Abdisa Naga Gadafa", "Degu Teshoma Abera", "Hamdi Mohamed Edris",
        "Henok Kenea Eticha", "Katama Diriba Mo'a", "Moti Gizachew Aseffa", "Nardos Abreham Temesgen",
        "Sifen Shumiye Shega", "weyinishet Fikiru Tekle", "Jitu Bizuayehu Debebe", "Sintayehu Zinabu Fikadu",
      ],
    },
    "12": {
      A: [
        "Abdi Alemu Merga", "Abel Minda Delelegn", "Abreham Worku Asfaw", "Amen Menbere Sheferaw",
        "Arsema Simeneh Gudeta", "Ashenafi Teklu Girma", "Ashenafi Ayele Gurmu", "Barnabas Tilahun Negeho",
        "Biruk Getachew Tsegaye", "Degaga Dereje Teshome", "Dejene Gebisa Mirkena", "Etsegenet Meles Asefa",
        "Eyob Zinaye Abe", "Fenet Bekele Dida", "Fenet Merga Gutu", "Gemechis Abdeta Daba",
        "Habtamu Shifera Dida", "Hana Mersha Zemene", "Hana Worku Wolde", "Hasena Seid Mohamed",
        "Hiwot Alemayehu Belay", "Hundaol Teshome Megersa", "Hunduma Shifera Dida", "Kenean Addisu Diba",
        "Lemi Lelisa Megnata", "Letu Keba File", "Mekidelawit Tilahun Dinku", "Melkam Amberbir Tamire",
        "Melkamu Abera Debelo", "Monet Cherinet Mamo", "Nanati Muleta Asefa", "Peniel Amsalu Gila",
        "Rebira Fufa Dorsis", "Rediet Teshome Muzo", "Sena Zewdu Ararso", "Sifan Garedew Tafesse",
        "Sifan Getahun H/Mikael", "Simale Dejene Tiki", "Simbone Tadese Teklemariyam", "Sophonias Zewdie Wendatir",
        "Yigermal Aimero Mose", "Yohanis Yimam Hasen", "Yohanis kefiyalewu Beyene",
      ],
      B: [
        "Abdi Bekele Geremew", "Abdi Ejeta Gedefa", "Abdi Morka Bacha", "Abdisa Dibaba Seglen",
        "Abenezer Tamene Tekile", "Abreham Fufa Debu", "Amayu Kassaye Deti", "Amen Mekonnen Hurisa",
        "Ayantu Dereje Fanta", "Ayantu Tolesa Tufa", "Bikiltu Girma Muleta", "Biniyam Tadese Hailu",
        "Bontu Deressa Amose", "Dawit Fikiru Hajilu", "Diriba Alemu Ashetu", "Elsabet Gedefa Chuko",
        "Fenet Dereje Inki", "Firaol Teshome Gutema", "Gemechu Tiku Birhanu", "Getu Gelasa Angos",
        "Habtamu workineh Merga", "Hawi Chala Tujuba", "Hawinet Temam Imam", "Hundaol Mokonnin Gudisa",
        "Ifa Berecha Negasa", "Kirubel Mekonnen Dinsa", "Malato Melkamu Deksa", "Nafirom Tadesse Zewude",
        "Naol Desta Adaba", "Nimona Asmera Gari", "Olira Ibsa Fite", "Rabira Demelash Dechasa",
        "Rebira Tsegaye Tadese", "Roba Getachew Gutu", "Roman Deme Dekeba", "Sagni Gudina Mosisa",
        "Simbone Regasa Tafese", "Tamirat Adugna Angessa", "Tsiyon Asfawu Negash", "Wondimu Mengistu Negash",
        "Yoseph Adugna Seboka",
      ],
      C: [
        "Ananiya Chanyalew Mulugeta", "Aynalem Kebede Magarsa", "Fenan Tadesse Letera", "Feven Damtew Birhanu",
        "Firomse Daro Feyisa", "Habtamu Tolesa Keneni", "Hana Diriba Dida", "Hawi Girma Dadi",
        "koriche Guta Regane", "Mehiretab Fikadu Kebede", "Meti Regasa Tafese", "Naja Shamsu Teshome",
        "Nightlight Fikadu Hirko", "Rediet Fikadu Kebede", "Selom Lemma Regasa", "Sena Hailu Jifar",
        "Sinan Arega Sufa", "Situnaf Chala Keneni", "Tsion Fikadu Bedada", "Yeabsira Mesfin Tena",
        "Yerosen Abiyot Kumsa",
      ],
    },
  } as Record<string, Record<string, string[]>>,
};



export function findStudent(grade: string, section: string, name: string) {
  const list = SCHOOL_DATABASE.students[grade]?.[section];
  const n = normalizeName(name);
  return list?.find((x) => normalizeName(x) === n) ?? null;
}

export function findTeacher(input: string) {
  const n = normalizeName(input);
  return SCHOOL_DATABASE.teachers.find((t) => normalizeName(t) === n) ?? null;
}

export function allStudents() {
  const out: { name: string; grade: string; section: string }[] = [];
  for (const [grade, secs] of Object.entries(SCHOOL_DATABASE.students))
    for (const [section, names] of Object.entries(secs))
      for (const name of names) out.push({ name, grade, section });
  return out;
}


export function findStudentAnywhere(name: string) {
  const n = normalizeName(name);
  return allStudents().find((s) => normalizeName(s.name) === n) ?? null;
}

export function sectionsByGrade() {
  const out: Record<string, string[]> = {};
  for (const [g, secs] of Object.entries(SCHOOL_DATABASE.students)) out[g] = Object.keys(secs);
  return out;
}
