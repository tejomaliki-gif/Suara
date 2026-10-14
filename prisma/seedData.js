/**
 * Data seed SuaraNusantara GIS Nasional.
 * - 38 Provinsi Indonesia (kode Kemendagri) + koordinat tengah provinsi
 * - Kabupaten/Kota utama tiap provinsi (+ seluruh 42 Kab/Kota di 6 provinsi Tanah Papua)
 * - Kecamatan & Desa/Kelurahan awal di beberapa kota utama
 * - 16 kategori aspirasi
 * - 24 aspirasi dummy yang tersebar dari Sumatera hingga Papua
 *
 * Kab/Kota yang belum ada di sini akan dilengkapi otomatis oleh regionSyncService
 * (auto-fetch dari dataset terbuka emsifa/api-wilayah-indonesia lalu di-cache ke SQLite).
 * Kode wilayah seed non-Papua diawali "S" (sementara) dan akan diganti otomatis dengan
 * kode resmi saat sinkronisasi (dicocokkan berdasarkan nama).
 */

// [kode, nama, lat, lng, jumlahKabKotaResmi]
const provinces = [
  ['11', 'Aceh', 4.6951, 96.7494, 23],
  ['12', 'Sumatera Utara', 2.1154, 99.5451, 33],
  ['13', 'Sumatera Barat', -0.7399, 100.8, 19],
  ['14', 'Riau', 0.2933, 101.7068, 12],
  ['15', 'Jambi', -1.6101, 103.6131, 11],
  ['16', 'Sumatera Selatan', -3.3194, 103.9144, 17],
  ['17', 'Bengkulu', -3.5778, 102.3464, 10],
  ['18', 'Lampung', -4.5586, 105.4068, 15],
  ['19', 'Kepulauan Bangka Belitung', -2.7411, 106.4406, 7],
  ['21', 'Kepulauan Riau', 3.9457, 108.1429, 7],
  ['31', 'DKI Jakarta', -6.2088, 106.8456, 6],
  ['32', 'Jawa Barat', -6.9175, 107.6191, 27],
  ['33', 'Jawa Tengah', -7.151, 110.1403, 35],
  ['34', 'DI Yogyakarta', -7.8754, 110.4262, 5],
  ['35', 'Jawa Timur', -7.5361, 112.2384, 38],
  ['36', 'Banten', -6.4058, 106.064, 8],
  ['51', 'Bali', -8.4095, 115.1889, 9],
  ['52', 'Nusa Tenggara Barat', -8.6529, 117.3616, 10],
  ['53', 'Nusa Tenggara Timur', -8.6574, 121.0794, 22],
  ['61', 'Kalimantan Barat', -0.2788, 111.4753, 14],
  ['62', 'Kalimantan Tengah', -1.6815, 113.3824, 14],
  ['63', 'Kalimantan Selatan', -3.0926, 115.2838, 13],
  ['64', 'Kalimantan Timur', 0.5387, 116.4194, 10],
  ['65', 'Kalimantan Utara', 3.0731, 116.0414, 5],
  ['71', 'Sulawesi Utara', 0.6247, 123.975, 15],
  ['72', 'Sulawesi Tengah', -1.43, 121.4456, 13],
  ['73', 'Sulawesi Selatan', -3.6688, 119.9741, 24],
  ['74', 'Sulawesi Tenggara', -4.1449, 122.1746, 17],
  ['75', 'Gorontalo', 0.6999, 122.4467, 6],
  ['76', 'Sulawesi Barat', -2.8441, 119.2321, 6],
  ['81', 'Maluku', -3.2385, 130.1453, 11],
  ['82', 'Maluku Utara', 1.5709, 127.8088, 10],
  ['94', 'Papua', -2.2, 138.4, 9],
  ['91', 'Papua Barat', -2.3, 133.4, 7],
  ['95', 'Papua Selatan', -6.8, 139.6, 4],
  ['96', 'Papua Tengah', -3.8, 136.4, 8],
  ['97', 'Papua Pegunungan', -4.1, 139.0, 8],
  ['92', 'Papua Barat Daya', -1.2, 131.8, 6],
];

// Provinsi Tanah Papua hasil pemekaran 2022 — daftar Kab/Kota di bawah ini sudah LENGKAP.
const PAPUA_GROUP = ['91', '92', '94', '95', '96', '97'];

// provinceCode: [[nama, tipe, lat, lng, kodeResmi?], ...]
const regencies = {
  '11': [
    ['Kota Banda Aceh', 'KOTA', 5.5483, 95.3238],
    ['Kabupaten Aceh Besar', 'KABUPATEN', 5.38, 95.52],
    ['Kota Lhokseumawe', 'KOTA', 5.1801, 97.1507],
    ['Kota Langsa', 'KOTA', 4.4683, 97.9683],
  ],
  '12': [
    ['Kota Medan', 'KOTA', 3.5952, 98.6722],
    ['Kabupaten Deli Serdang', 'KABUPATEN', 3.4202, 98.7041],
    ['Kota Pematangsiantar', 'KOTA', 2.9595, 99.0687],
    ['Kabupaten Karo', 'KABUPATEN', 3.1053, 98.2651],
    ['Kota Sibolga', 'KOTA', 1.7427, 98.7792],
  ],
  '13': [
    ['Kota Padang', 'KOTA', -0.9471, 100.4172],
    ['Kota Bukittinggi', 'KOTA', -0.3055, 100.3692],
    ['Kabupaten Agam', 'KABUPATEN', -0.2209, 100.1703],
  ],
  '14': [
    ['Kota Pekanbaru', 'KOTA', 0.5071, 101.4478],
    ['Kota Dumai', 'KOTA', 1.665, 101.447],
    ['Kabupaten Kampar', 'KABUPATEN', 0.33, 101.04],
  ],
  '15': [
    ['Kota Jambi', 'KOTA', -1.6101, 103.6131],
    ['Kabupaten Muaro Jambi', 'KABUPATEN', -1.55, 103.82],
    ['Kabupaten Kerinci', 'KABUPATEN', -1.872, 101.4339],
  ],
  '16': [
    ['Kota Palembang', 'KOTA', -2.9761, 104.7754],
    ['Kota Prabumulih', 'KOTA', -3.4328, 104.2353],
    ['Kabupaten Ogan Komering Ilir', 'KABUPATEN', -3.4, 105.4],
  ],
  '17': [
    ['Kota Bengkulu', 'KOTA', -3.8004, 102.2655],
    ['Kabupaten Rejang Lebong', 'KABUPATEN', -3.45, 102.5333],
  ],
  '18': [
    ['Kota Bandar Lampung', 'KOTA', -5.3971, 105.2668],
    ['Kota Metro', 'KOTA', -5.1131, 105.3067],
    ['Kabupaten Lampung Selatan', 'KABUPATEN', -5.5623, 105.5474],
  ],
  '19': [
    ['Kota Pangkalpinang', 'KOTA', -2.1316, 106.1169],
    ['Kabupaten Belitung', 'KABUPATEN', -2.8708, 107.6385],
  ],
  '21': [
    ['Kota Batam', 'KOTA', 1.0456, 104.0305],
    ['Kota Tanjungpinang', 'KOTA', 0.9186, 104.4554],
    ['Kabupaten Natuna', 'KABUPATEN', 3.9333, 108.1833],
  ],
  '31': [
    ['Kota Jakarta Pusat', 'KOTA', -6.1865, 106.8343],
    ['Kota Jakarta Utara', 'KOTA', -6.1384, 106.8636],
    ['Kota Jakarta Barat', 'KOTA', -6.1674, 106.7637],
    ['Kota Jakarta Selatan', 'KOTA', -6.2615, 106.8106],
    ['Kota Jakarta Timur', 'KOTA', -6.225, 106.9004],
    ['Kabupaten Kepulauan Seribu', 'KABUPATEN', -5.7985, 106.5072],
  ],
  '32': [
    ['Kota Bandung', 'KOTA', -6.9175, 107.6191],
    ['Kabupaten Bogor', 'KABUPATEN', -6.4817, 106.854],
    ['Kota Bekasi', 'KOTA', -6.2383, 106.9756],
    ['Kota Depok', 'KOTA', -6.4025, 106.7942],
    ['Kabupaten Garut', 'KABUPATEN', -7.2279, 107.9087],
    ['Kota Cirebon', 'KOTA', -6.732, 108.5523],
  ],
  '33': [
    ['Kota Semarang', 'KOTA', -6.9667, 110.4167],
    ['Kota Surakarta', 'KOTA', -7.5755, 110.8243],
    ['Kabupaten Banyumas', 'KABUPATEN', -7.4832, 109.1404],
    ['Kabupaten Magelang', 'KABUPATEN', -7.5, 110.22],
    ['Kabupaten Klaten', 'KABUPATEN', -7.7056, 110.6069],
  ],
  '34': [
    ['Kabupaten Kulon Progo', 'KABUPATEN', -7.8267, 110.1641],
    ['Kabupaten Bantul', 'KABUPATEN', -7.8881, 110.3289],
    ['Kabupaten Gunungkidul', 'KABUPATEN', -7.9659, 110.6],
    ['Kabupaten Sleman', 'KABUPATEN', -7.716, 110.355],
    ['Kota Yogyakarta', 'KOTA', -7.7956, 110.3695],
  ],
  '35': [
    ['Kota Surabaya', 'KOTA', -7.2575, 112.7521],
    ['Kota Malang', 'KOTA', -7.9666, 112.6326],
    ['Kabupaten Banyuwangi', 'KABUPATEN', -8.2191, 114.3691],
    ['Kabupaten Sidoarjo', 'KABUPATEN', -7.4478, 112.7183],
    ['Kabupaten Jember', 'KABUPATEN', -8.1845, 113.6681],
  ],
  '36': [
    ['Kota Serang', 'KOTA', -6.12, 106.1503],
    ['Kota Tangerang', 'KOTA', -6.1783, 106.6319],
    ['Kota Tangerang Selatan', 'KOTA', -6.2886, 106.7179],
    ['Kabupaten Pandeglang', 'KABUPATEN', -6.3086, 106.1061],
  ],
  '51': [
    ['Kota Denpasar', 'KOTA', -8.6705, 115.2126],
    ['Kabupaten Badung', 'KABUPATEN', -8.5819, 115.1771],
    ['Kabupaten Gianyar', 'KABUPATEN', -8.5442, 115.3253],
    ['Kabupaten Buleleng', 'KABUPATEN', -8.112, 115.0882],
  ],
  '52': [
    ['Kota Mataram', 'KOTA', -8.5833, 116.1167],
    ['Kabupaten Lombok Tengah', 'KABUPATEN', -8.7, 116.27],
    ['Kota Bima', 'KOTA', -8.46, 118.7273],
    ['Kabupaten Sumbawa', 'KABUPATEN', -8.4932, 117.4202],
  ],
  '53': [
    ['Kota Kupang', 'KOTA', -10.1772, 123.607],
    ['Kabupaten Manggarai Barat', 'KABUPATEN', -8.4964, 119.8877],
    ['Kabupaten Sumba Timur', 'KABUPATEN', -9.65, 120.26],
    ['Kabupaten Sikka', 'KABUPATEN', -8.6213, 122.2108],
  ],
  '61': [
    ['Kota Pontianak', 'KOTA', -0.0263, 109.3425],
    ['Kota Singkawang', 'KOTA', 0.906, 108.9872],
    ['Kabupaten Kapuas Hulu', 'KABUPATEN', 0.8337, 112.93],
  ],
  '62': [
    ['Kota Palangka Raya', 'KOTA', -2.2161, 113.9135],
    ['Kabupaten Kotawaringin Timur', 'KABUPATEN', -2.5312, 112.9497],
    ['Kabupaten Kapuas', 'KABUPATEN', -3.0101, 114.3876],
  ],
  '63': [
    ['Kota Banjarmasin', 'KOTA', -3.3186, 114.5944],
    ['Kota Banjarbaru', 'KOTA', -3.4572, 114.8103],
    ['Kabupaten Tabalong', 'KABUPATEN', -2.15, 115.38],
  ],
  '64': [
    ['Kota Samarinda', 'KOTA', -0.5022, 117.1536],
    ['Kota Balikpapan', 'KOTA', -1.2379, 116.8529],
    ['Kabupaten Penajam Paser Utara', 'KABUPATEN', -1.2917, 116.7083],
    ['Kabupaten Kutai Kartanegara', 'KABUPATEN', -0.4219, 116.9876],
  ],
  '65': [
    ['Kota Tarakan', 'KOTA', 3.3, 117.6333],
    ['Kabupaten Bulungan', 'KABUPATEN', 2.8375, 117.3653],
    ['Kabupaten Nunukan', 'KABUPATEN', 4.1333, 117.6667],
  ],
  '71': [
    ['Kota Manado', 'KOTA', 1.4748, 124.8421],
    ['Kota Bitung', 'KOTA', 1.4404, 125.1217],
    ['Kabupaten Minahasa', 'KABUPATEN', 1.3054, 124.9126],
  ],
  '72': [
    ['Kota Palu', 'KOTA', -0.8917, 119.8707],
    ['Kabupaten Poso', 'KABUPATEN', -1.3959, 120.7524],
    ['Kabupaten Banggai', 'KABUPATEN', -0.9516, 122.7875],
  ],
  '73': [
    ['Kota Makassar', 'KOTA', -5.1477, 119.4327],
    ['Kabupaten Gowa', 'KABUPATEN', -5.205, 119.446],
    ['Kota Parepare', 'KOTA', -4.0135, 119.6255],
    ['Kabupaten Toraja Utara', 'KABUPATEN', -2.9701, 119.8987],
    ['Kabupaten Bone', 'KABUPATEN', -4.5386, 120.3279],
  ],
  '74': [
    ['Kota Kendari', 'KOTA', -3.9985, 122.513],
    ['Kota Baubau', 'KOTA', -5.47, 122.61],
    ['Kabupaten Konawe', 'KABUPATEN', -3.94, 122.06],
  ],
  '75': [
    ['Kota Gorontalo', 'KOTA', 0.5435, 123.0568],
    ['Kabupaten Gorontalo', 'KABUPATEN', 0.6239, 122.9895],
  ],
  '76': [
    ['Kabupaten Mamuju', 'KABUPATEN', -2.6748, 118.8885],
    ['Kabupaten Polewali Mandar', 'KABUPATEN', -3.4167, 119.3333],
    ['Kabupaten Majene', 'KABUPATEN', -3.5403, 118.9707],
  ],
  '81': [
    ['Kota Ambon', 'KOTA', -3.6954, 128.1814],
    ['Kota Tual', 'KOTA', -5.6367, 132.7517],
    ['Kabupaten Maluku Tengah', 'KABUPATEN', -3.2956, 128.9575],
  ],
  '82': [
    ['Kota Ternate', 'KOTA', 0.7893, 127.378],
    ['Kota Tidore Kepulauan', 'KOTA', 0.6833, 127.4],
    ['Kabupaten Halmahera Utara', 'KABUPATEN', 1.7284, 128.0095],
  ],
  // ===== TANAH PAPUA (LENGKAP, kode Kemendagri 2022) =====
  '94': [
    ['Kabupaten Jayapura', 'KABUPATEN', -2.5633, 140.5136, '9401'],
    ['Kabupaten Kepulauan Yapen', 'KABUPATEN', -1.8833, 136.2333, '9402'],
    ['Kabupaten Biak Numfor', 'KABUPATEN', -1.18, 136.08, '9403'],
    ['Kabupaten Sarmi', 'KABUPATEN', -1.85, 138.74, '9404'],
    ['Kabupaten Keerom', 'KABUPATEN', -2.95, 140.7833, '9405'],
    ['Kabupaten Waropen', 'KABUPATEN', -2.29, 136.67, '9406'],
    ['Kabupaten Supiori', 'KABUPATEN', -0.76, 135.6, '9407'],
    ['Kabupaten Mamberamo Raya', 'KABUPATEN', -2.2, 137.9, '9408'],
    ['Kota Jayapura', 'KOTA', -2.5337, 140.7181, '9471'],
  ],
  '91': [
    ['Kabupaten Fakfak', 'KABUPATEN', -2.9256, 132.2961, '9101'],
    ['Kabupaten Kaimana', 'KABUPATEN', -3.66, 133.77, '9102'],
    ['Kabupaten Teluk Wondama', 'KABUPATEN', -2.723, 134.5, '9103'],
    ['Kabupaten Teluk Bintuni', 'KABUPATEN', -2.1, 133.52, '9104'],
    ['Kabupaten Manokwari', 'KABUPATEN', -0.8615, 134.062, '9105'],
    ['Kabupaten Manokwari Selatan', 'KABUPATEN', -1.5, 134.1667, '9106'],
    ['Kabupaten Pegunungan Arfak', 'KABUPATEN', -1.16, 133.88, '9107'],
  ],
  '95': [
    ['Kabupaten Merauke', 'KABUPATEN', -8.4932, 140.4018, '9501'],
    ['Kabupaten Boven Digoel', 'KABUPATEN', -6.1094, 140.306, '9502'],
    ['Kabupaten Mappi', 'KABUPATEN', -6.55, 139.3333, '9503'],
    ['Kabupaten Asmat', 'KABUPATEN', -5.545, 138.134, '9504'],
  ],
  '96': [
    ['Kabupaten Nabire', 'KABUPATEN', -3.3667, 135.4833, '9601'],
    ['Kabupaten Puncak Jaya', 'KABUPATEN', -3.7228, 137.9787, '9602'],
    ['Kabupaten Paniai', 'KABUPATEN', -3.9264, 136.3814, '9603'],
    ['Kabupaten Mimika', 'KABUPATEN', -4.5469, 136.8833, '9604'],
    ['Kabupaten Puncak', 'KABUPATEN', -3.95, 137.62, '9605'],
    ['Kabupaten Dogiyai', 'KABUPATEN', -4.03, 135.95, '9606'],
    ['Kabupaten Intan Jaya', 'KABUPATEN', -3.73, 137.03, '9607'],
    ['Kabupaten Deiyai', 'KABUPATEN', -4.08, 136.42, '9608'],
  ],
  '97': [
    ['Kabupaten Jayawijaya', 'KABUPATEN', -4.096, 138.9445, '9701'],
    ['Kabupaten Pegunungan Bintang', 'KABUPATEN', -4.9, 140.62, '9702'],
    ['Kabupaten Yahukimo', 'KABUPATEN', -4.87, 139.48, '9703'],
    ['Kabupaten Tolikara', 'KABUPATEN', -3.68, 138.48, '9704'],
    ['Kabupaten Mamberamo Tengah', 'KABUPATEN', -3.68, 139.09, '9705'],
    ['Kabupaten Yalimo', 'KABUPATEN', -3.77, 139.37, '9706'],
    ['Kabupaten Lanny Jaya', 'KABUPATEN', -3.93, 138.38, '9707'],
    ['Kabupaten Nduga', 'KABUPATEN', -4.45, 138.22, '9708'],
  ],
  '92': [
    ['Kabupaten Sorong', 'KABUPATEN', -0.96, 131.3, '9201'],
    ['Kabupaten Sorong Selatan', 'KABUPATEN', -1.44, 132.02, '9202'],
    ['Kabupaten Raja Ampat', 'KABUPATEN', -0.4333, 130.8167, '9203'],
    ['Kabupaten Tambrauw', 'KABUPATEN', -0.8, 132.4, '9204'],
    ['Kabupaten Maybrat', 'KABUPATEN', -1.29, 132.38, '9205'],
    ['Kota Sorong', 'KOTA', -0.8762, 131.2558, '9271'],
  ],
};

// Kecamatan & Desa/Kelurahan awal (sebagian; sisanya auto-sync)
// regencyName: { kecamatan: [desa/kelurahan...] }
const districts = {
  'Kota Yogyakarta': {
    Mantrijeron: ['Gedongkiwo', 'Suryodiningratan', 'Mantrijeron'],
    Kraton: ['Patehan', 'Panembahan', 'Kadipaten'],
    Mergangsan: ['Brontokusuman', 'Keparakan', 'Wirogunan'],
    Umbulharjo: ['Giwangan', 'Sorosutan', 'Pandeyan', 'Warungboto', 'Tahunan', 'Muja Muju', 'Semaki'],
    Kotagede: ['Prenggan', 'Purbayan', 'Rejowinangun'],
    Gondokusuman: ['Baciro', 'Demangan', 'Klitren', 'Kotabaru', 'Terban'],
    Danurejan: ['Suryatmajan', 'Tegal Panggung', 'Bausasran'],
    Pakualaman: ['Purwokinanti', 'Gunungketur'],
    Gondomanan: ['Prawirodirjan', 'Ngupasan'],
    Ngampilan: ['Notoprajan', 'Ngampilan'],
    Wirobrajan: ['Patangpuluhan', 'Wirobrajan', 'Pakuncen'],
    Gedongtengen: ['Pringgokusuman', 'Sosromenduran'],
    Jetis: ['Bumijo', 'Gowongan', 'Cokrodiningratan'],
    Tegalrejo: ['Tegalrejo', 'Bener', 'Kricak', 'Karangwaru'],
  },
  'Kabupaten Sleman': {
    Depok: ['Caturtunggal', 'Condongcatur', 'Maguwoharjo'],
    Mlati: ['Sinduadi', 'Sendangadi', 'Tlogoadi', 'Tirtoadi', 'Sumberadi'],
    Cangkringan: ['Argomulyo', 'Glagaharjo', 'Kepuharjo', 'Umbulharjo', 'Wukirsari'],
    Gamping: [], Godean: [], Moyudan: [], Minggir: [], Seyegan: [], Berbah: [],
    Prambanan: [], Kalasan: [], Ngemplak: [], Ngaglik: [], Sleman: [], Tempel: [],
    Turi: [], Pakem: [],
  },
  'Kota Jakarta Selatan': {
    Tebet: ['Tebet Barat', 'Tebet Timur', 'Kebon Baru', 'Bukit Duri', 'Manggarai', 'Manggarai Selatan', 'Menteng Dalam'],
    'Kebayoran Baru': ['Senayan', 'Selong', 'Gunung', 'Kramat Pela', 'Gandaria Utara', 'Cipete Utara', 'Pulo', 'Melawai', 'Petogogan', 'Rawa Barat'],
    'Kebayoran Lama': [], Pesanggrahan: [], Cilandak: [], 'Pasar Minggu': [], Jagakarsa: [],
    'Mampang Prapatan': [], Pancoran: [], Setiabudi: [],
  },
  'Kota Denpasar': {
    'Denpasar Selatan': ['Sanur', 'Renon', 'Panjer', 'Sesetan', 'Pedungan', 'Serangan', 'Sidakarya', 'Pemogan', 'Sanur Kauh', 'Sanur Kaja'],
    'Denpasar Timur': [], 'Denpasar Barat': [], 'Denpasar Utara': [],
  },
  'Kota Bandung': {
    Coblong: ['Dago', 'Lebak Siliwangi', 'Sekeloa', 'Lebakgede', 'Sadang Serang', 'Cipaganti'],
    Sukajadi: [], Cicendo: [], 'Bandung Wetan': [], 'Sumur Bandung': [], Lengkong: [],
  },
  'Kota Surabaya': {
    Gubeng: ['Airlangga', 'Baratajaya', 'Gubeng', 'Kertajaya', 'Mojo', 'Pucang Sewu'],
    Tegalsari: [], Genteng: [], Wonokromo: [], Sukolilo: [],
  },
  'Kota Makassar': {
    Panakkukang: [], Tamalate: [], Rappocini: [], Mariso: [], 'Ujung Pandang': [],
  },
  'Kota Medan': {
    'Medan Baru': [], 'Medan Kota': [], 'Medan Petisah': [], 'Medan Sunggal': [],
  },
};

// [nama, slug, deskripsi, warna, ikon(lucide), kritis]
const categories = [
  ['Infrastruktur Jalan & Jembatan', 'infrastruktur-jalan-jembatan', 'Jalan rusak, jembatan putus, drainase, dan fasilitas umum fisik.', '#DC2626', 'Construction', true],
  ['Kesehatan', 'kesehatan', 'Layanan puskesmas, rumah sakit, tenaga kesehatan, gizi, dan BPJS.', '#E11D48', 'HeartPulse', true],
  ['Air Bersih & Sanitasi', 'air-bersih-sanitasi', 'Ketersediaan air bersih, PDAM, MCK, dan sanitasi lingkungan.', '#0284C7', 'Droplets', true],
  ['Keamanan & Ketertiban', 'keamanan-ketertiban', 'Kriminalitas, penerangan jalan, ketertiban umum, dan konflik sosial.', '#7C3AED', 'ShieldAlert', true],
  ['Bencana Alam', 'bencana-alam', 'Banjir, longsor, gempa, erupsi, kebakaran hutan, dan mitigasi bencana.', '#EA580C', 'Siren', true],
  ['Pendidikan', 'pendidikan', 'Sekolah, guru, beasiswa, dan sarana prasarana pendidikan.', '#2563EB', 'GraduationCap', false],
  ['Lingkungan Hidup & Persampahan', 'lingkungan-hidup', 'Sampah, pencemaran, penghijauan, dan kerusakan lingkungan.', '#16A34A', 'Leaf', false],
  ['Pertanian & Ketahanan Pangan', 'pertanian-pangan', 'Pupuk, irigasi, harga panen, nelayan, dan ketersediaan pangan.', '#65A30D', 'Wheat', false],
  ['Ekonomi & UMKM', 'ekonomi-umkm', 'Permodalan, pasar rakyat, perizinan usaha, dan UMKM.', '#D97706', 'Store', false],
  ['Ketenagakerjaan', 'ketenagakerjaan', 'Lapangan kerja, pelatihan, upah, dan perlindungan pekerja.', '#CA8A04', 'Briefcase', false],
  ['Sosial & Bantuan Masyarakat', 'sosial-bantuan', 'Bansos, disabilitas, lansia, anak terlantar, dan kesejahteraan sosial.', '#DB2777', 'HeartHandshake', false],
  ['Transportasi Umum', 'transportasi-umum', 'Angkutan umum, terminal, halte, dan aksesibilitas transportasi.', '#0891B2', 'Bus', false],
  ['Listrik & Energi', 'listrik-energi', 'Pemadaman listrik, desa belum teraliri listrik, dan BBM/LPG.', '#F59E0B', 'Zap', false],
  ['Pelayanan Publik & Birokrasi', 'pelayanan-publik', 'Administrasi kependudukan, perizinan, dan kualitas layanan instansi.', '#475569', 'Landmark', false],
  ['Digital & Telekomunikasi', 'digital-telekomunikasi', 'Sinyal seluler, internet desa, dan transformasi digital layanan.', '#4F46E5', 'Wifi', false],
  ['Pariwisata, Seni & Budaya', 'pariwisata-budaya', 'Destinasi wisata, cagar budaya, dan pelestarian seni tradisi.', '#0D9488', 'Palmtree', false],
];

/**
 * Aspirasi dummy.
 * provinceCode, regencyName, (districtName, villageName opsional), lat, lng,
 * kategori slug, status, upvotes, daysAgo
 */
const aspirations = [
  {
    title: 'Jalan lintas kabupaten berlubang parah di Aceh Besar',
    content: 'Ruas jalan penghubung antar kecamatan rusak dengan lubang besar sepanjang ±2 km. Saat hujan tergenang dan sudah beberapa kali terjadi kecelakaan pengendara motor.',
    category: 'infrastruktur-jalan-jembatan', province: '11', regency: 'Kabupaten Aceh Besar',
    lat: 5.4321, lng: 95.4789, status: 'DIPROSES', upvotes: 47, daysAgo: 40, sender: 'Teuku Rizal', phone: '081234567890',
    address: 'Jl. Lintas Aceh Besar, dekat simpang pasar', adminNote: 'Sudah diteruskan ke Dinas PUPR untuk dianggarkan perbaikan.',
  },
  {
    title: 'Banjir rob rutin merendam permukiman di Medan Utara',
    content: 'Setiap air pasang, ratusan rumah warga terendam hingga lutut orang dewasa. Mohon normalisasi drainase dan pembangunan tanggul.',
    category: 'bencana-alam', province: '12', regency: 'Kota Medan', district: 'Medan Kota',
    lat: 3.5781, lng: 98.6869, status: 'TERVERIFIKASI', upvotes: 63, daysAgo: 25, sender: 'Butet Siregar', phone: '085261234567',
    address: 'Lingkungan IV, dekat sungai',
  },
  {
    title: 'Puskesmas kekurangan tenaga dokter di Agam',
    content: 'Puskesmas hanya memiliki 1 dokter untuk melayani 5 nagari. Antrean pasien sangat panjang dan banyak warga pulang tanpa dilayani.',
    category: 'kesehatan', province: '13', regency: 'Kabupaten Agam',
    lat: -0.2634, lng: 100.1251, status: 'MENUNGGU_VERIFIKASI', upvotes: 21, daysAgo: 6, sender: 'Rahmat Hidayat', phone: '082170001234',
  },
  {
    title: 'Kabut asap karhutla mengganggu sekolah di Kampar',
    content: 'Kebakaran lahan gambut menyebabkan kabut asap tebal. Kualitas udara berbahaya dan siswa harus belajar dengan masker seadanya.',
    category: 'bencana-alam', province: '14', regency: 'Kabupaten Kampar',
    lat: 0.3512, lng: 101.0123, status: 'SELESAI', upvotes: 88, daysAgo: 120, sender: 'Siti Aminah', phone: '081378889900',
    adminNote: 'Titik api telah dipadamkan bersama BPBD dan Manggala Agni. Dibagikan 5.000 masker N95 ke sekolah.',
  },
  {
    title: 'Air PDAM tidak mengalir selama dua minggu di Palembang',
    content: 'Warga kompleks harus membeli air galon untuk mandi dan memasak. Mohon kejelasan jadwal perbaikan pipa induk.',
    category: 'air-bersih-sanitasi', province: '16', regency: 'Kota Palembang',
    lat: -2.9905, lng: 104.7562, status: 'DIPROSES', upvotes: 39, daysAgo: 15, sender: 'Andi Saputra', phone: '6281277112233',
  },
  {
    title: 'Lampu penerangan jalan mati di kawasan rawan begal Bandar Lampung',
    content: 'Sepanjang 800 meter jalan gelap total pada malam hari. Sudah terjadi 3 kasus pembegalan dalam sebulan terakhir.',
    category: 'keamanan-ketertiban', province: '18', regency: 'Kota Bandar Lampung',
    lat: -5.4201, lng: 105.2589, status: 'TERVERIFIKASI', upvotes: 52, daysAgo: 12, sender: 'Wayan Sutrisno', phone: '082185556677',
  },
  {
    title: 'Banjir kiriman rutin di bantaran Kali Ciliwung, Tebet',
    content: 'Setiap hujan deras di hulu, rumah warga di bantaran kali terendam. Mohon percepatan normalisasi dan peringatan dini banjir.',
    category: 'bencana-alam', province: '31', regency: 'Kota Jakarta Selatan', district: 'Tebet', village: 'Bukit Duri',
    lat: -6.2215, lng: 106.8576, status: 'DIPROSES', upvotes: 112, daysAgo: 55, sender: 'Rina Kartika', phone: '081311223344',
    address: 'RW 10 Bukit Duri, bantaran Kali Ciliwung', adminNote: 'Koordinasi dengan BBWS Ciliwung-Cisadane untuk normalisasi tahap lanjutan.',
  },
  {
    title: 'Transportasi umum belum menjangkau perumahan di Bekasi',
    content: 'Tidak ada angkutan feeder dari perumahan ke stasiun terdekat. Warga terpaksa menggunakan ojek dengan biaya tinggi setiap hari.',
    category: 'transportasi-umum', province: '32', regency: 'Kota Bekasi',
    lat: -6.2615, lng: 106.9921, status: 'MENUNGGU_VERIFIKASI', upvotes: 34, daysAgo: 3, sender: 'Dedi Kurniawan', phone: '087788990011',
  },
  {
    title: 'Sampah menumpuk di Sungai Cikapundung, Coblong',
    content: 'Tumpukan sampah plastik menyumbat aliran sungai dan menimbulkan bau. Perlu jadwal pengangkutan rutin dan edukasi warga.',
    category: 'lingkungan-hidup', province: '32', regency: 'Kota Bandung', district: 'Coblong', village: 'Dago',
    lat: -6.8857, lng: 107.6131, status: 'SELESAI', upvotes: 45, daysAgo: 90, sender: 'Asep Gunawan', phone: '081322334455',
    adminNote: 'Pembersihan massal bersama DLH dan komunitas peduli sungai telah dilakukan. Dipasang trash boom.',
  },
  {
    title: 'Ruang kelas SD rusak berat di Banyumas',
    content: 'Atap dua ruang kelas sudah jebol dan plafon nyaris runtuh. Siswa terpaksa belajar bergantian di ruang guru.',
    category: 'pendidikan', province: '33', regency: 'Kabupaten Banyumas',
    lat: -7.4211, lng: 109.2349, status: 'TERVERIFIKASI', upvotes: 58, daysAgo: 20, sender: 'Sri Lestari', phone: '085640001122',
  },
  {
    title: 'Jalur evakuasi erupsi Merapi perlu perbaikan di Cangkringan',
    content: 'Jalur evakuasi di lereng Merapi banyak yang retak dan rambu evakuasi hilang. Mohon segera diperbaiki sebelum musim hujan.',
    category: 'bencana-alam', province: '34', regency: 'Kabupaten Sleman', district: 'Cangkringan', village: 'Glagaharjo',
    lat: -7.6003, lng: 110.4639, status: 'DIPROSES', upvotes: 76, daysAgo: 30, sender: 'Bambang Wibowo', phone: '081227654321',
    adminNote: 'BPBD Sleman telah melakukan survei lapangan; perbaikan dijadwalkan bulan depan.',
  },
  {
    title: 'Parkir liar di kawasan Kotabaru Yogyakarta',
    content: 'Parkir liar memakan badan jalan dan trotoar sehingga pejalan kaki terpaksa berjalan di jalan raya.',
    category: 'keamanan-ketertiban', province: '34', regency: 'Kota Yogyakarta', district: 'Gondokusuman', village: 'Kotabaru',
    lat: -7.7863, lng: 110.3725, status: 'SELESAI', upvotes: 29, daysAgo: 70, sender: 'Nur Hidayah', phone: '082134567812',
    adminNote: 'Penertiban rutin oleh Dishub dan pemasangan rambu larangan parkir telah dilaksanakan.',
  },
  {
    title: 'Saluran irigasi jebol, sawah gagal tanam di Jember',
    content: 'Saluran irigasi tersier jebol sejak 2 bulan lalu sehingga 40 hektare sawah tidak mendapat air.',
    category: 'pertanian-pangan', province: '35', regency: 'Kabupaten Jember',
    lat: -8.1722, lng: 113.7004, status: 'TERVERIFIKASI', upvotes: 41, daysAgo: 18, sender: 'Slamet Riyadi', phone: '085236547890',
  },
  {
    title: 'Pelayanan e-KTP lambat di Surabaya',
    content: 'Proses pencetakan KTP elektronik memakan waktu lebih dari 1 bulan dengan alasan blanko habis.',
    category: 'pelayanan-publik', province: '35', regency: 'Kota Surabaya', district: 'Gubeng', village: 'Airlangga',
    lat: -7.2697, lng: 112.7612, status: 'DITOLAK', upvotes: 8, daysAgo: 45, sender: 'Yuliana', phone: '081330998877',
    adminNote: 'Laporan duplikat — sudah ditangani pada tiket lain.',
  },
  {
    title: 'Abrasi pantai mengancam pura dan permukiman di Sanur',
    content: 'Abrasi pantai semakin parah dan mulai menggerus area pura serta rumah warga di pesisir.',
    category: 'lingkungan-hidup', province: '51', regency: 'Kota Denpasar', district: 'Denpasar Selatan', village: 'Sanur',
    lat: -8.6783, lng: 115.2633, status: 'DIPROSES', upvotes: 54, daysAgo: 35, sender: 'I Made Sudarsana', phone: '081999112233',
  },
  {
    title: 'Krisis air bersih saat kemarau di Lombok Tengah',
    content: 'Sumur warga kering, warga harus berjalan 3 km untuk mengambil air. Mohon bantuan droping air dan pembangunan sumur bor.',
    category: 'air-bersih-sanitasi', province: '52', regency: 'Kabupaten Lombok Tengah',
    lat: -8.7712, lng: 116.2768, status: 'SELESAI', upvotes: 97, daysAgo: 150, sender: 'Lalu Muhammad', phone: '087865432109',
    adminNote: 'Sumur bor komunal telah dibangun dan diresmikan bersama PDAM.',
  },
  {
    title: 'Desa belum teraliri listrik di Sumba Timur',
    content: 'Tiga dusun masih belum menikmati listrik PLN. Anak-anak belajar menggunakan pelita minyak tanah.',
    category: 'listrik-energi', province: '53', regency: 'Kabupaten Sumba Timur',
    lat: -9.7012, lng: 120.2123, status: 'TERVERIFIKASI', upvotes: 69, daysAgo: 22, sender: 'Umbu Ndakularak', phone: '082145678901',
  },
  {
    title: 'Jembatan gantung putus di Kapuas Hulu',
    content: 'Jembatan gantung penghubung dua desa putus akibat banjir. Siswa harus menyeberang sungai menggunakan perahu kecil.',
    category: 'infrastruktur-jalan-jembatan', province: '61', regency: 'Kabupaten Kapuas Hulu',
    lat: 0.8712, lng: 112.8611, status: 'MENUNGGU_VERIFIKASI', upvotes: 33, daysAgo: 4, sender: 'Yohanes Apui', phone: '085245671234',
  },
  {
    title: 'Pelatihan kerja untuk warga sekitar IKN Nusantara',
    content: 'Warga lokal berharap ada pelatihan keterampilan konstruksi dan jasa agar bisa terserap kerja di proyek IKN.',
    category: 'ketenagakerjaan', province: '64', regency: 'Kabupaten Penajam Paser Utara',
    lat: -1.0123, lng: 116.7012, status: 'DIPROSES', upvotes: 48, daysAgo: 28, sender: 'Hendra Saputra', phone: '081250987654',
  },
  {
    title: 'Sinyal internet lemah di sekolah perbatasan Nunukan',
    content: 'Siswa kesulitan mengikuti asesmen berbasis komputer karena sinyal internet sangat lemah di wilayah perbatasan.',
    category: 'digital-telekomunikasi', province: '65', regency: 'Kabupaten Nunukan',
    lat: 4.0789, lng: 117.5933, status: 'TERVERIFIKASI', upvotes: 27, daysAgo: 16, sender: 'Maria Ulfa', phone: '082255443322',
  },
  {
    title: 'Hunian tetap korban gempa Palu belum selesai',
    content: 'Masih ada keluarga penyintas gempa dan likuefaksi yang tinggal di hunian sementara. Mohon percepatan pembangunan huntap.',
    category: 'sosial-bantuan', province: '72', regency: 'Kota Palu',
    lat: -0.9012, lng: 119.8512, status: 'DIPROSES', upvotes: 84, daysAgo: 60, sender: 'Andi Mappanyukki', phone: '081341234567',
  },
  {
    title: 'Kemacetan parah di simpang Panakkukang Makassar',
    content: 'Lampu lalu lintas sering mati dan tidak ada petugas, menyebabkan kemacetan panjang pada jam sibuk.',
    category: 'transportasi-umum', province: '73', regency: 'Kota Makassar', district: 'Panakkukang',
    lat: -5.1567, lng: 119.4456, status: 'SELESAI', upvotes: 38, daysAgo: 80, sender: 'Muhammad Arif', phone: '085299887766',
    adminNote: 'Traffic light sudah diperbaiki dan ditambah sistem ATCS oleh Dishub.',
  },
  {
    title: 'Pasar ikan tradisional perlu revitalisasi di Ambon',
    content: 'Lapak pedagang ikan becek, atap bocor, dan tidak ada sistem pembuangan limbah yang layak.',
    category: 'ekonomi-umkm', province: '81', regency: 'Kota Ambon',
    lat: -3.6912, lng: 128.1789, status: 'MENUNGGU_VERIFIKASI', upvotes: 19, daysAgo: 2, sender: 'Johanis Latuconsina', phone: '081247001122',
  },
  {
    title: 'Pelestarian situs benteng bersejarah di Ternate',
    content: 'Dinding benteng peninggalan kolonial mulai retak dan ditumbuhi tanaman liar. Perlu perawatan rutin agar tetap menjadi destinasi wisata sejarah.',
    category: 'pariwisata-budaya', province: '82', regency: 'Kota Ternate',
    lat: 0.7812, lng: 127.3801, status: 'TERVERIFIKASI', upvotes: 23, daysAgo: 14, sender: 'Rusdi Bahar', phone: '082188223344',
  },
  {
    title: 'Kekurangan obat di puskesmas distrik Wamena',
    content: 'Stok obat-obatan esensial sering kosong, terutama obat malaria dan antibiotik. Warga harus menempuh perjalanan jauh ke kota.',
    category: 'kesehatan', province: '97', regency: 'Kabupaten Jayawijaya',
    lat: -4.0912, lng: 138.9512, status: 'DIPROSES', upvotes: 71, daysAgo: 26, sender: 'Yosias Wenda', phone: '081344556677',
    adminNote: 'Dinas Kesehatan telah mengirim distribusi obat tahap pertama melalui jalur udara.',
  },
  {
    title: 'Jalan Trans Papua ruas Merauke rusak saat musim hujan',
    content: 'Ruas jalan berlumpur dan tidak bisa dilewati kendaraan logistik ketika hujan, harga bahan pokok di kampung melonjak.',
    category: 'infrastruktur-jalan-jembatan', province: '95', regency: 'Kabupaten Merauke',
    lat: -8.3512, lng: 140.5123, status: 'TERVERIFIKASI', upvotes: 44, daysAgo: 10, sender: 'Paulus Gebze', phone: '085244332211',
  },
  {
    title: 'Pengelolaan sampah di destinasi wisata Raja Ampat',
    content: 'Sampah plastik dari kapal wisata mulai terlihat di beberapa pantai. Perlu fasilitas pengelolaan sampah dan aturan tegas bagi operator wisata.',
    category: 'lingkungan-hidup', province: '92', regency: 'Kabupaten Raja Ampat',
    lat: -0.4312, lng: 130.8212, status: 'MENUNGGU_VERIFIKASI', upvotes: 36, daysAgo: 1, sender: 'Mesak Mambraku', phone: '082199887766',
  },
];

module.exports = { provinces, PAPUA_GROUP, regencies, districts, categories, aspirations };
