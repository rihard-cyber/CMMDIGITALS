const KATEGORI_TEMUAN = [
  {
    id: 'keamanan',
    nama: 'Temuan Keamanan (Security)',
    icon: 'Shield',
    items: [
      { kode: 'S001', nama: 'Orang mencurigakan' },
      { kode: 'S002', nama: 'Akses tanpa izin' },
      { kode: 'S003', nama: 'Kartu akses hilang' },
      { kode: 'S004', nama: 'Pintu tidak terkunci' },
      { kode: 'S005', nama: 'Percobaan pencurian' },
      { kode: 'S006', nama: 'Vandalisme/perusakan fasilitas' },
      { kode: 'S007', nama: 'Pelanggaran SOP keamanan' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'keselamatan',
    nama: 'Temuan Keselamatan (Safety)',
    icon: 'AlertOctagon',
    items: [
      { kode: 'A001', nama: 'Potensi kebakaran' },
      { kode: 'A002', nama: 'APAR rusak/kedaluwarsa' },
      { kode: 'A003', nama: 'Jalur evakuasi terhalang' },
      { kode: 'A004', nama: 'Lantai licin' },
      { kode: 'A005', nama: 'Kabel listrik terbuka' },
      { kode: 'A006', nama: 'Peralatan rusak yang berbahaya' },
      { kode: 'A007', nama: 'Tumpahan cairan' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'fasilitas',
    nama: 'Temuan Fasilitas & Gedung',
    icon: 'Settings',
    items: [
      { kode: 'F001', nama: 'Lampu mati' },
      { kode: 'F002', nama: 'AC tidak berfungsi' },
      { kode: 'F003', nama: 'Kebocoran air' },
      { kode: 'F004', nama: 'Kerusakan pintu/jendela' },
      { kode: 'F005', nama: 'Lift/Eskalator bermasalah' },
      { kode: 'F006', nama: 'Toilet rusak' },
      { kode: 'F007', nama: 'Kerusakan pagar atau gerbang' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'kebersihan',
    nama: 'Temuan Kebersihan (Housekeeping)',
    icon: 'Sparkles',
    items: [
      { kode: 'H001', nama: 'Sampah menumpuk' },
      { kode: 'H002', nama: 'Area kotor' },
      { kode: 'H003', nama: 'Bau tidak sedap' },
      { kode: 'H004', nama: 'Saluran air tersumbat' },
      { kode: 'H005', nama: 'Tumpahan sampah' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'parkir',
    nama: 'Temuan Parkir & Kendaraan',
    icon: 'MapPin',
    items: [
      { kode: 'P001', nama: 'Kendaraan parkir sembarangan' },
      { kode: 'P002', nama: 'Kendaraan tanpa identitas' },
      { kode: 'P003', nama: 'Kendaraan mogok' },
      { kode: 'P004', nama: 'Kemacetan area parkir' },
      { kode: 'P005', nama: 'Pelanggaran lalu lintas internal' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'operasional',
    nama: 'Temuan Operasional Tenant/Pengunjung',
    icon: 'Users',
    items: [
      { kode: 'T001', nama: 'Keributan pengunjung' },
      { kode: 'T002', nama: 'Kehilangan barang' },
      { kode: 'T003', nama: 'Penemuan barang tertinggal' },
      { kode: 'T004', nama: 'Keluhan pengunjung' },
      { kode: 'T005', nama: 'Pelanggaran jam operasional' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'k3',
    nama: 'Temuan K3 (Keselamatan dan Kesehatan Kerja)',
    icon: 'Activity',
    items: [
      { kode: 'K001', nama: 'Tidak menggunakan APD' },
      { kode: 'K002', nama: 'Area kerja tidak aman' },
      { kode: 'K003', nama: 'Material berbahaya tidak tersimpan baik' },
      { kode: 'K004', nama: 'Pekerjaan tanpa izin kerja (Work Permit)' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: '__lainnya__',
    nama: 'Lainnya (Ketik Manual)',
    icon: 'MoreHorizontal',
    items: [
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  }
];

export const KATEGORI_STANDALONE = [
  {
    id: 'sec',
    nama: 'SEC - Keamanan',
    icon: 'Shield',
    items: [
      { kode: 'SEC01', nama: 'Orang Mencurigakan' },
      { kode: 'SEC02', nama: 'Akses Tanpa Izin' },
      { kode: 'SEC03', nama: 'Pintu Terbuka' },
      { kode: 'SEC04', nama: 'Perkelahian' },
      { kode: 'SEC05', nama: 'Pencurian' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'fire',
    nama: 'FIRE - Kebakaran',
    icon: 'AlertOctagon',
    items: [
      { kode: 'FIRE01', nama: 'APAR Rusak' },
      { kode: 'FIRE02', nama: 'Hydrant Bermasalah' },
      { kode: 'FIRE03', nama: 'Fire Alarm Trouble' },
      { kode: 'FIRE04', nama: 'Jalur Evakuasi Terhalang' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'fac',
    nama: 'FAC - Fasilitas',
    icon: 'Settings',
    items: [
      { kode: 'FAC01', nama: 'Lampu Mati' },
      { kode: 'FAC02', nama: 'AC Rusak' },
      { kode: 'FAC03', nama: 'Pintu Rusak' },
      { kode: 'FAC04', nama: 'Kebocoran Air' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'park',
    nama: 'PARK - Parkir',
    icon: 'MapPin',
    items: [
      { kode: 'PARK01', nama: 'Parkir Liar' },
      { kode: 'PARK02', nama: 'Kendaraan Terbengkalai' },
      { kode: 'PARK03', nama: 'Kemacetan Area Parkir' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: 'it',
    nama: 'IT - Sistem',
    icon: 'Cpu',
    items: [
      { kode: 'IT01', nama: 'Komputer Rusak' },
      { kode: 'IT02', nama: 'Jaringan Internet Putus' },
      { kode: 'IT03', nama: 'Printer Bermasalah' },
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  },
  {
    id: '__lainnya__',
    nama: 'Lainnya (Ketik Manual)',
    icon: 'MoreHorizontal',
    items: [
      { kode: '__lainnya__', nama: 'Lainnya (Ketik Manual)' }
    ]
  }
];

export const STATUS_PATROLI = [
  { value: 'normal', label: 'Normal', color: '#10b981' },
  { value: 'temuan', label: 'Temuan', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

export default KATEGORI_TEMUAN;
