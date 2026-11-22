export interface BdDistrict {
  name: string;
  bn: string;
  upazilas: string[];
}

export interface BdDivision {
  name: string;
  bn: string;
  districts: BdDistrict[];
}

export const BD_DIVISIONS: BdDivision[] = [
  {
    name: "Dhaka",
    bn: "ঢাকা বিভাগ",
    districts: [
      {
        name: "Dhaka",
        bn: "ঢাকা",
        upazilas: [
          "Dhanmondi",
          "Gulshan",
          "Banani",
          "Baridhara",
          "Bashundhara R/A",
          "Uttara",
          "Mirpur",
          "Pallabi",
          "Mohammadpur",
          "Lalmatia",
          "Tejgaon",
          "Motijheel",
          "Ramna",
          "Shahbagh",
          "Badda",
          "Rampura",
          "Khilgaon",
          "Malibagh",
          "Moghbazar",
          "Paltan",
          "Wari",
          "Sutrapur",
          "Lalbagh",
          "Jatrabari",
          "Demra",
          "Khilkhet",
          "Cantonment",
          "Kafrul",
          "Adabor",
          "Hazaribagh",
          "Savar",
          "Dhamrai",
          "Keraniganj",
          "Nawabganj",
          "Dohar",
        ],
      },
      {
        name: "Gazipur",
        bn: "গাজীপুর",
        upazilas: ["Gazipur Sadar", "Tongi", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
      },
      {
        name: "Narayanganj",
        bn: "নারায়ণগঞ্জ",
        upazilas: ["Narayanganj Sadar", "Fatullah", "Siddhirganj", "Bandar", "Rupganj", "Sonargaon", "Araihazar"],
      },
      {
        name: "Narsingdi",
        bn: "নরসিংদী",
        upazilas: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
      },
      {
        name: "Tangail",
        bn: "টাঙ্গাইল",
        upazilas: ["Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"],
      },
      {
        name: "Munshiganj",
        bn: "মুন্সীগঞ্জ",
        upazilas: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"],
      },
      {
        name: "Manikganj",
        bn: "মানিকগঞ্জ",
        upazilas: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shivalaya", "Singair"],
      },
      {
        name: "Kishoreganj",
        bn: "কিশোরগঞ্জ",
        upazilas: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
      },
      {
        name: "Faridpur",
        bn: "ফরিদপুর",
        upazilas: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
      },
      {
        name: "Gopalganj",
        bn: "গোপালগঞ্জ",
        upazilas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
      },
      {
        name: "Madaripur",
        bn: "মাদারীপুর",
        upazilas: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar", "Dasar"],
      },
      {
        name: "Rajbari",
        bn: "রাজবাড়ী",
        upazilas: ["Rajbari Sadar", "Baliakandi", "Goalandaghat", "Kalukhali", "Pangsha"],
      },
      {
        name: "Shariatpur",
        bn: "শরীয়তপুর",
        upazilas: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira"],
      },
    ],
  },
  {
    name: "Chattogram",
    bn: "চট্টগ্রাম বিভাগ",
    districts: [
      {
        name: "Chattogram",
        bn: "চট্টগ্রাম",
        upazilas: [
          "Kotwali",
          "Panchlaish",
          "Khulshi",
          "Halishahar",
          "Agrabad / Double Mooring",
          "Pahartali",
          "Bayazid",
          "Chandgaon",
          "Patenga",
          "Anwara",
          "Banshkhali",
          "Boalkhali",
          "Chandanaish",
          "Fatikchhari",
          "Hathazari",
          "Lohagara",
          "Mirsharai",
          "Patiya",
          "Rangunia",
          "Raozan",
          "Sandwip",
          "Satkania",
          "Sitakunda",
          "Karnaphuli",
        ],
      },
      {
        name: "Cox's Bazar",
        bn: "কক্সবাজার",
        upazilas: ["Cox's Bazar Sadar", "Chakaria", "Eidgaon", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"],
      },
      {
        name: "Cumilla",
        bn: "কুমিল্লা",
        upazilas: ["Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Meghna", "Monohorgonj", "Muradnagar", "Nangalkot", "Titas"],
      },
      {
        name: "Brahmanbaria",
        bn: "ব্রাহ্মণবাড়িয়া",
        upazilas: ["Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
      },
      {
        name: "Chandpur",
        bn: "চাঁদপুর",
        upazilas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
      },
      {
        name: "Feni",
        bn: "ফেনী",
        upazilas: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi"],
      },
      {
        name: "Noakhali",
        bn: "নোয়াখালী",
        upazilas: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar"],
      },
      {
        name: "Lakshmipur",
        bn: "লক্ষ্মীপুর",
        upazilas: ["Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati"],
      },
      {
        name: "Rangamati",
        bn: "রাঙ্গামাটি",
        upazilas: ["Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali"],
      },
      {
        name: "Khagrachhari",
        bn: "খাগড়াছড়ি",
        upazilas: ["Khagrachhari Sadar", "Dighinala", "Guimara", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
      },
      {
        name: "Bandarban",
        bn: "বান্দরবান",
        upazilas: ["Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
      },
    ],
  },
  {
    name: "Sylhet",
    bn: "সিলেট বিভাগ",
    districts: [
      {
        name: "Sylhet",
        bn: "সিলেট",
        upazilas: ["Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Zakiganj"],
      },
      {
        name: "Moulvibazar",
        bn: "মৌলভীবাজার",
        upazilas: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"],
      },
      {
        name: "Habiganj",
        bn: "হবিগঞ্জ",
        upazilas: ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"],
      },
      {
        name: "Sunamganj",
        bn: "সুনামগঞ্জ",
        upazilas: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Dakshin Sunamganj", "Derai", "Dharmapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Tahirpur", "Madhyanagar"],
      },
    ],
  },
  {
    name: "Rajshahi",
    bn: "রাজশাহী বিভাগ",
    districts: [
      {
        name: "Rajshahi",
        bn: "রাজশাহী",
        upazilas: ["Boalia / Rajshahi Metro", "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"],
      },
      {
        name: "Bogura",
        bn: "বগুড়া",
        upazilas: ["Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"],
      },
      {
        name: "Pabna",
        bn: "পাবনা",
        upazilas: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar"],
      },
      {
        name: "Sirajganj",
        bn: "সিরাজগঞ্জ",
        upazilas: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"],
      },
      {
        name: "Natore",
        bn: "নাটোর",
        upazilas: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Singra"],
      },
      {
        name: "Naogaon",
        bn: "নওগাঁ",
        upazilas: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
      },
      {
        name: "Chapainawabganj",
        bn: "চাঁপাইনবাবগঞ্জ",
        upazilas: ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"],
      },
      {
        name: "Joypurhat",
        bn: "জয়পুরহাট",
        upazilas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
      },
    ],
  },
  {
    name: "Khulna",
    bn: "খুলনা বিভাগ",
    districts: [
      {
        name: "Khulna",
        bn: "খুলনা",
        upazilas: ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur", "Batiaghata", "Dacope", "Dighalia", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada"],
      },
      {
        name: "Jashore",
        bn: "যশোর",
        upazilas: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
      },
      {
        name: "Satkhira",
        bn: "সাতক্ষীরা",
        upazilas: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"],
      },
      {
        name: "Bagerhat",
        bn: "বাগেরহাট",
        upazilas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
      },
      {
        name: "Kushtia",
        bn: "কুষ্টিয়া",
        upazilas: ["Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur"],
      },
      {
        name: "Jhenaidah",
        bn: "ঝিনাইদহ",
        upazilas: ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
      },
      {
        name: "Magura",
        bn: "মাগুরা",
        upazilas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
      },
      {
        name: "Narail",
        bn: "নড়াইল",
        upazilas: ["Narail Sadar", "Kalia", "Lohagara"],
      },
      {
        name: "Chuadanga",
        bn: "চুয়াডাঙ্গা",
        upazilas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
      },
      {
        name: "Meherpur",
        bn: "মেহেরপুর",
        upazilas: ["Meherpur Sadar", "Gangni", "Mujibnagar"],
      },
    ],
  },
  {
    name: "Barishal",
    bn: "বরিশাল বিভাগ",
    districts: [
      {
        name: "Barishal",
        bn: "বরিশাল",
        upazilas: ["Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
      },
      {
        name: "Patuakhali",
        bn: "পটুয়াখালী",
        upazilas: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"],
      },
      {
        name: "Bhola",
        bn: "ভোলা",
        upazilas: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
      },
      {
        name: "Pirojpur",
        bn: "পিরোজপুর",
        upazilas: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Indurkani"],
      },
      {
        name: "Barguna",
        bn: "বরগুনা",
        upazilas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
      },
      {
        name: "Jhalokati",
        bn: "ঝালকাঠি",
        upazilas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
      },
    ],
  },
  {
    name: "Rangpur",
    bn: "রংপুর বিভাগ",
    districts: [
      {
        name: "Rangpur",
        bn: "রংপুর",
        upazilas: ["Rangpur Sadar", "Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
      },
      {
        name: "Dinajpur",
        bn: "দিনাজপুর",
        upazilas: ["Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
      },
      {
        name: "Kurigram",
        bn: "কুড়িগ্রাম",
        upazilas: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Nageshwari", "Phulbari", "Rajarhat", "Raomari", "Ulipur"],
      },
      {
        name: "Gaibandha",
        bn: "গাইবান্ধা",
        upazilas: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
      },
      {
        name: "Nilphamari",
        bn: "নীলফামারী",
        upazilas: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"],
      },
      {
        name: "Lalmonirhat",
        bn: "লালমনিরহাট",
        upazilas: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"],
      },
      {
        name: "Thakurgaon",
        bn: "ঠাকুরগাঁও",
        upazilas: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"],
      },
      {
        name: "Panchagarh",
        bn: "পঞ্চগড়",
        upazilas: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
      },
    ],
  },
  {
    name: "Mymensingh",
    bn: "ময়মনসিংহ বিভাগ",
    districts: [
      {
        name: "Mymensingh",
        bn: "ময়মনসিংহ",
        upazilas: ["Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Tarakanda", "Trishal"],
      },
      {
        name: "Jamalpur",
        bn: "জামালপুর",
        upazilas: ["Jamalpur Sadar", "Baksiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"],
      },
      {
        name: "Netrokona",
        bn: "নেত্রকোণা",
        upazilas: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala"],
      },
      {
        name: "Sherpur",
        bn: "শেরপুর",
        upazilas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
      },
    ],
  },
];
