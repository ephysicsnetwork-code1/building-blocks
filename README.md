# Secure Glass Gate

Build a production-ready, highly secure, glassmorphism-styled Verification Web Application for Burka Harbu Special Secondary School.



---

### 🏫 1. UI & DESIGN REQUIREMENTS

- **Theme:** Dark Mode Glassmorphism with deep navy blue background (#0B132B / #1C2541), vibrant cyan accents (#00F5D4), subtle borders, glow effects, and responsive layout.

- **Header:** Center the official school logo placeholder at the top header.

- **Navigation Tabs:** Clear selection cards for 🎓 Students, 👨‍🏫 Teachers, 👪 Parents, and 🔐 Admin Dashboard.



---

### 🔐 2. STRICT ADMIN PANEL & AUTHENTICATION FIX

- **Manual Login Required:** Clicking "Admin" must open a secure login modal requiring manual entry. DO NOT auto-login.

  - **Username:** admin_burkaharbu

  - **Password:** Burka#Harbu2026!Secure

- **Editable System Settings in Admin UI:**

  1. **Telegram Group Invite Link (Pre-loaded):** https://t.me/+za9uD7CLuG5mOWM0

  2. **Admin Support Handle (Pre-loaded):** @Spaceanduniverse13 (All error/help buttons link dynamically to this handle).

- **Admin Features:** View roster tables for Students, Teachers, and Parents, approve/reject pending parent requests, and reset student join statuses.



---

### 🛡️ 3. STRICT ANTI-COPY, ANTI-DOWNLOAD & ANTI-SCREENSHOT SECURITY

- **Complete Content Protection on Success Screen:** When the Telegram invite link is successfully revealed to a student or teacher:

  1. **Disable Text Selection:** Apply CSS `user-select: none; -webkit-user-select: none;` across the entire link-reveal container so text cannot be highlighted or copied.

  2. **Disable Right-Click & Inspect:** Implement event listeners to completely block right-click context menus (`contextmenu` event) and keyboard shortcuts for saving or inspecting (`Ctrl+S`, `Ctrl+Shift+I`, `Ctrl+U`, `F12`).

  3. **Dynamic Watermarking:** Render a faint, repeating background watermark across the link container displaying the verified user's official name and Telegram handle so that if any photo is taken externally, it holds them accountable.

  4. **Blur on Window Blur:** If the user switches tabs or backgrounds away from the browser, blur or hide the link container immediately to prevent background screen recording or capture tools.



---

### 👤 4. PORTAL FLOWS & TELEGRAM BOT CONFIGURATION

- **Student Verification:** 

  - Multi-step selection: Grade (9, 10, 11, 12) -> Stream (Natural/Social for 11 & 12) -> Section (A, B, C) -> Official Name from embedded school database.

  - One-Time Access Enforcement: Once verified, set `has_joined = true`. Subsequent attempts show an error screen with a button linking to @Spaceanduniverse13.

- **Teacher Verification:** Match input against the 27 official staff roster members for instant access.

- **Parent Verification:** Submit parent name and Telegram handle linked to a student; routes to "Pending Parent Requests" for admin approval (no direct link access).

- **Telegram Bot Integration Ready:** Integrate Telegram Bot Token `8664667586:AAE1fxL5ePeZVAGou1ju5Hnrx2HZs4w-y_Y` in the backend service configuration for dispatching group links and notifications.



---

### 💾 5. EMBEDDED SYSTEM ROSTER DATABASE

Include the complete JavaScript data structure containing all student sections (Grades 9-12) and the 27 official teachers directly in the code to prevent any file-reading or parsing errors.





const SCHOOL_DATABASE = {

  "teachers": [

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

    "Ermiyaas Zagayyee Bayechaa"

  ],

  "students": {

    "9": {

      "A": [

        "Abdi Dadi Tolesa",

        "Abel Argachew Abebe",

        "Amayu Amsalu Hundesa",

        "Baimnat Alamayo Daribe",

        "Bekam Tesfaye Kebebew",

        "Bikiltu Chala Dida",

        "Birhanu Tashome Diro",

        "Birtukan Galana Benti",

        "Bontu Tadese Hayilu",

        "Bontu Tesfaye Megersa",

        "Eldana Mekonin Kifilu",

        "Firaol Nuguse Gonfa",

        "Gediyon Tibabu Girma",

        "Hachalu Abdisa Gonfa",

        "Hachalu Kasahun Demise",

        "Hawera Kebede Oljira",

        "Helen Zerhun Tekile",

        "Hundaol Tesfaye Beyecha",

        "Kaleb Fikiru Hajilu",

        "Lalise Ayele Damena",

        "Lalise Ketama Bedada",

        "Lami Gudina Mosisa",

        "Megersa Chanyalew Lema",

        "Merson Bacha Gemechu",

        "Nahile Nasir Abshir",

        "Nahili Birhanu Debele",

        "Nahom Mekonin Merigiya",

        "Naol Tafa Bekele",

        "Nati Hirpasa Kabeta",

        "Piromis Getu Dejene",

        "Rehobot Leta Melka",

        "Robel Birhanu Bekele",

        "Shumi Sagni Bedada",

        "Sifan Girma Mekonin",

        "Sifen Tadese Tafa",

        "Simbo Temsgen Tafese",

        "Sinan Mulugeta Araga",

        "Tinbite Mikiyas Mamo",

        "Yared G/Yesus Guday"

      ],

      "B": [

        "Abenezar Kebede Shifera",

        "Abigiya Phawlos Teshoma",

        "Adisu Damise Tsige",

        "Alazar Admasu Birhanu",

        "Amesiyas Tediros Hayilu",

        "Ayentu Kasahe Kumsa",

        "Betel Eliyas Tesfaye",

        "Birtukan Zenebe Tafa",

        "Bona Wayesa Warkina",

        "Chala Dadi Dabale",

        "Eliyana Yared Semahegn",

        "Eyuel Tilahun Dinku",

        "Firaol Legesse Diriba",

        "Gemechis Muleta Bali",

        "Hanan Mifta Nasiru",

        "Hawi Fikadu Dejene",

        "Kebek Demise Mengesha",

        "Kena Getachew Chibsa",

        "Kenaol Dereje Adunga",

        "Kiya Tamiru Dekeba",

        "Koket Fikadu Zegeye",

        "Lelistu Gedefa Beyecha",

        "Milki Desisa Ireso",

        "Mosisa Dereje Bekele",

        "Nanati Fitsumi Getahun",

        "Nanati Temesgen Jambere",

        "Naol Gizachew Gonfa",

        "Samu'el Getacho Dinqu",

        "Sena Tariku Feyisa",

        "Sena Habtamu Chala",

        "Shibiru Diriba Moa",

        "Simbo Fikadu Galan",

        "Sinbone Hayilu Ayela",

        "Sisay Birhanu Aklilu",

        "Takelign Dejene Ambesa",

        "Tilahun Ketama Tolera",

        "Yeabsira Gezehagn Zewude",

        "Yerosan Abera Amsalu"

      ],

      "C": [

        "Abel Tewodros Guta",

        "Alemeyehu Zewudu Ashetu",

        "Bachu Inahu Amante",

        "Biftu Bekele Tulu",

        "Bilise Kumela Duguma",

        "Bilisuma Mekonnin Goshu",

        "Biruk Dagne Kuma",

        "Boniyas Abdi Fufa",

        "Bontu Gutema Abera",

        "Bontu Abdisa Dembelu",

        "Dejene Getu Tafa",

        "Desta Wogene Mekonin",

        "Dureti Dereje Beyana",

        "Ebasa Getachew Dagne",

        "Efrata Abreham Asfew",

        "Fenet Bekele Alemu",

        "Fenet Mekonin Jatama",

        "Hawinet Faye Kebebe",

        "Jitu Adisu Gidma",

        "Jitu Gebisa Buchana",

        "Lidiya Guluma Ketema",

        "Lidiya Dereje Getahun",

        "Makdas Birku Bedada",

        "Milki Dechasa Kuma",

        "Moti Deksisa Gadisa",

        "Nimona Kaba File",

        "Nuguse Merechi Bayi",

        "Obsa Leta Melka",

        "Obse Biranu Teka",

        "Oromiya Bayecha Seboka",

        "Semiyad Girma Gudisa",

        "Sifen Temesgen Bekele",

        "Sinbone Hayilu Tasfaye",

        "Sonan Mikael Merga",

        "Sura Shifera Million",

        "Tsion Behigu Geza",

        "Yerosan Mokonen Duki"

      ]

    },

    "10": {

      "A": [

        "Abdi Dejene Daba",

        "Amanuel Tadesse Tajeba",

        "Asanti Welkite Kore",

        "Bekele Nuguse Barsisa",

        "Bethelhem Terefe Asefa",

        "Bonsa Asfaw Alemu",

        "Diriba Dida Sori",

        "Ebise Dejene Terefe",

        "Eyasu Anbesa Dabale",

        "Eyuel Gezahegn Zawude",

        "Firaol Hirpa Kebebe",

        "Firaol Mekonnin Dadi",

        "Gadisa Temesgen Tafese",

        "Gemechu Urgesa Negesa",

        "Jitu Tesfaye Belay",

        "Kenenisa Mesfin Abera",

        "Lemi Girma Guta",

        "Lensa Belachew Abera",

        "Meron Tamiru Hailesilase",

        "Meyad Zerihun Dekeba",

        "Natan Simeneh Gudeta",

        "Robsen Dejene Lema",

        "Sifan Dejene Tiki",

        "Siriyan Tadesse Letera",

        "Solane Takele Hirpha",

        "Soresa Bayisa Mirkane",

        "Tariku Admasu Geremew",

        "Tilahun Teshome Asheti",

        "Tsiyon Mulawu Asmare",

        "Yosef Birhanu Tolesa"

      ],

      "B": [

        "Amanuel Abdissa serda",

        "Balayi Gamachu Nagasa",

        "Beka Bedo Kabeda",

        "Bereket Yilma Tadese",

        "Birhanu Gemechu Hailemariyam",

        "Bona Tajabe Kelbessa",

        "Chala Beyecha Geda",

        "Dereje Bekele Ararsa",

        "Ebisa Shasho Bedasa",

        "Ebise Merid Guta",

        "Elias Geletu Tolesa",

        "Ermias Mekonnin Wami",

        "Esrael Legese Fanta",

        "Fenet Haile Diriba",

        "Firaol Ketema Guluma",

        "Gadisa Rebuma Diba",

        "Hachaltu Mesfin Abera",

        "Hana Alemu Sholecho",

        "Koket Wondu Ayele",

        "Lelo Boki Soboka",

        "Meklit Alemeyehu Nanessa",

        "Millinium Teketel Gaguro",

        "Mohamed Seid Ali",

        "Naol Ijara Bayisa",

        "Naol Jaleta Kelbesa",

        "Nuguse Kefeni Berecha",

        "Rebira Ayele Dera",

        "Samuel Asefa Muleta",

        "Sena Zerihun Bashana",

        "Sena Adugna Bayisa",

        "Taye Tolesa Regasa",

        "Yerosen Benti Haileyesus"

      ]

    },

    "11": {

      "A": [

        "Abdata Adane Debeli",

        "Abdi Fufa Dorsis",

        "Aboma Gedefa Wakjira",

        "Alsen Gemechu Lemecha",

        "Ashenafi Daba Debele",

        "Biniyam Abdisa Lenjisa",

        "Bonsa Belachew Merzo",

        "Bontu Gadefa Beyecha",

        "Chala Dajane Niguse",

        "Daniel Guta Regane",

        "Dereje Teferi Mekonnen",

        "Eden Ashenafi Ejersa",

        "Emiru Tolesa Chala",

        "Ermias Benti Haileyesus",

        "Fufa Ararsa",

        "Getu Damisse Bedada",

        "Hana Fikadu Mekonnen",

        "Hundaol Deressa Dandena",

        "Iftiyom Gutema Bayi",

        "Kena Mesfin Terefe",

        "Mekilit Legese Dadi",

        "Meron Tadesse Gemechu",

        "Milkesa Fufi Dufera",

        "Nafnat Gemeda Hasan",

        "Natinael Abu Mekonnen",

        "Olantu Tamayes Hirko",

        "Rediet Dagne Yadete",

        "Robera Kasahun Hurisa",

        "Segni Fituma Lemessa",

        "Sena Tasama Worku",

        "Simbo Deksisa Guta",

        "Tokuma Bayisa Leta",

        "Yanet Girma Takele",

        "Yanet Bayisa Chala",

        "Yididiya Tesfaye Dida",

        "Yoseph Debele Geda"

      ],

      "B": [

        "Abebe Ayele Zawude",

        "Abel Daraje Siyyum",

        "Abriham Mulaw Asmare",

        "Adoniyas Biruk Asirat",

        "Arsema Getachew Bitaw",

        "Besufekad Manaye Nuri",

        "Betelihem Negash Lema",

        "Betesfa Sahilu Kassa",

        "Bilisuma Bedada Dorsisa",

        "Bonsa Wolde Debela",

        "Dawit Mekonnen Amenu",

        "Ebise Tolesa Diriba",

        "Firaol Hacalu Bekele",

        "Gezu Diriba Feyisa",

        "Hawera Mesfin Abera",

        "Hayu Diriba Deressa",

        "Ifanol Habtamu Taaddasaa",

        "Ketoran Girma Jima",

        "Mekdes Tadese Sharew",

        "Meti Getahun Alamu",

        "Monera Tafese Merechi",

        "Nafkod Lelisa Belema",

        "Nafra Taklu Abdi",

        "Nanati Degu Teresa",

        "Rebira Ketema",

        "Rediet Fantahun Nega",

        "Ruth Manyazehal Shegaw",

        "Samirawit Teketel Bekele",

        "Selamawit Abraham Jaleta",

        "Sifen Bonsa Merga",

        "Singiten Tafesse Merechi",

        "Tadese Dessu Hurise",

        "Webi Taressa Regasa",

        "Yeabsira Dana Desta",

        "Yeron Gonfa Anbessa",

        "Yordanos Dawit Wesene"

      ],

      "C": [

        "Abenezer Girma Dadi",

        "Abdisa Naga Gadafa",

        "Degu Teshoma Abera",

        "Hamdi Mohamed Edris",

        "Henok Kenea Eticha",

        "Katama Diriba Mo'a",

        "Moti Gizachew Aseffa",

        "Nardos Abreham Temesgen",

        "Sifen Shumiye Shega",

        "weyinishet Fikiru Tekle",

        "Jitu Bizuayehu Debebe",

        "Sintayehu Zinabu Fikadu"

      ]

    },

    "12": {

      "A": [

        "Abdi Alemu Merga",

        "Abel Minda Delelegn",

        "Abreham Worku Asfaw",

        "Amen Menbere Sheferaw",

        "Arsema Simeneh Gudeta",

        "Ashenafi Teklu Girma",

        "Ashenafi Ayele Gurmu",

        "Barnabas Tilahun Negeho",

        "Biruk Getachew Tsegaye",

        "Degaga Dereje Teshome",

        "Dejene Gebisa Mirkena",

        "Etsegenet Meles Asefa",

        "Eyob Zinaye Abe",

        "Fenet Bekele Dida",

        "Fenet Merga Gutu",

        "Gemechis Abdeta Daba",

        "Habtamu Shifera Dida",

        "Hana Mersha Zemene",

        "Hana Worku Wolde",

        "Hasena Seid Mohamed",

        "Hiwot Alemayehu Belay",

        "Hundaol Teshome Megersa",

        "Hunduma Shifera Dida",

        "Kenean Addisu Diba",

        "Lemi Lelisa Megnata",

        "Letu Keba File",

        "Mekidelawit Tilahun Dinku",

        "Melkam Amberbir Tamire",

        "Melkamu Abera Debelo",

        "Monet Cherinet Mamo",

        "Nanati Muleta Asefa",

        "Peniel Amsalu Gila",

        "Rebira Fufa Dorsis",

        "Rediet Teshome Muzo",

        "Sena Zewdu Ararso",

        "Sifan Garedew Tafesse",

        "Sifan Getahun H/Mikael",

        "Simale Dejene Tiki",

        "Simbone Tadese Teklemariyam",

        "Sophonias Zewdie Wendatir",

        "Yigermal Aimero Mose",

        "Yohanis Yimam Hasen",

        "Yohanis kefiyalewu Beyene"

      ],

      "B": [

        "Abdi Bekele Geremew",

        "Abdi Ejeta Gedefa",

        "Abdi Morka Bacha",

        "Abdisa Dibaba Seglen",

        "Abenezer Tamene Tekile",

        "Abreham Fufa Debu",

        "Amayu Kassaye Deti",

        "Amen Mekonnen Hurisa",

        "Ayantu Dereje Fanta",

        "Ayantu Tolesa Tufa",

        "Bikiltu Girma Muleta",

        "Biniyam Tadese Hailu",

        "Bontu Deressa Amose",

        "Dawit Fikiru Hajilu",

        "Diriba Alemu Ashetu",

        "Elsabet Gedefa Chuko",

        "Fenet Dereje Inki",

        "Firaol Teshome Gutema",

        "Gemechu Tiku Birhanu",

        "Getu Gelasa Angos",

        "Habtamu workineh Merga",

        "Hawi Chala Tujuba",

        "Hawinet Temam Imam",

        "Hundaol Mokonnin Gudisa",

        "Ifa Berecha Negasa",

        "Kirubel Mekonnen Dinsa",

        "Malato Melkamu Deksa",

        "Nafirom Tadesse Zewude",

        "Naol Desta Adaba",

        "Nimona Asmera Gari",

        "Olira Ibsa Fite",

        "Rabira Demelash Dechasa",

        "Rebira Tsegaye Tadese",

        "Roba Getachew Gutu",

        "Roman Deme Dekeba",

        "Sagni Gudina Mosisa",

        "Simbone Regasa Tafese",

        "Tamirat Adugna Angessa",

        "Tsiyon Asfawu Negash",

        "Wondimu Mengistu Negash",

        "Yoseph Adugna Seboka"

      ],

      "C": [

        "Ananiya Chanyalew Mulugeta",

        "Aynalem Kebede Magarsa",

        "Fenan Tadesse Letera",

        "Feven Damtew Birhanu",

        "Firomse Daro Feyisa",

        "Habtamu Tolesa Keneni",

        "Hana Diriba Dida",

        "Hawi Girma Dadi",

        "koriche Guta Regane",

        "Mehiretab Fikadu Kebede",

        "Meti Regasa Tafese",

        "Naja Shamsu Teshome",

        "Nightlight Fikadu Hirko",

        "Rediet Fikadu Kebede",

        "Selom Lemma Regasa",

        "Sena Hailu Jifar",

        "Sinan Arega Sufa",

        "Situnaf Chala Keneni",

        "Tsion Fikadu Bedada",

        "Yeabsira Mesfin Tena",

        "Yerosen Abiyot Kumsa"

      ]

    }

  }

};

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://secure-glass-gate.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e164f60-6671-4fa5-97a6-119b840ab09e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
