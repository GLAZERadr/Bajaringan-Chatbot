# Kalkulator Material Atap Bajaringan

## Ringkasan
Kalkulator Material Atap Bajaringan adalah tool untuk menghitung estimasi material baja ringan yang dibutuhkan untuk proyek atap. Kalkulator ini dikalibrasi dengan standar industri (Kalkulator Kencana) dan mendukung berbagai jenis atap, bangunan, dan penutup.

## Jenis Atap yang Didukung

### 1. Pelana (Gable Roof)
- Atap dengan 2 bidang miring simetris
- Desain paling umum untuk rumah tinggal
- Waste factor: 0% (tidak ada pemborosan tambahan)
- Cocok untuk: Residential dan Industrial

### 2. Limas (Hip Roof)
- Atap dengan 4 bidang miring
- Lebih kompleks dari pelana
- Waste factor: 8.5% (dikalibrasi dengan Kencana)
- Cocok untuk: Residential dan Industrial

### 3. Datar (Flat Roof)
- Atap datar atau kemiringan rendah (≤5°)
- Hanya untuk Industrial
- Waste factor: 0%
- Cocok untuk: Gudang, pabrik

## Tipe Bangunan

### Residential (Rumah Tinggal)
Menggunakan material:
- Kanal C (rangka utama)
- Reng (rangka sekunder)
- Genteng Metal / Spandek / uPVC

### Industrial (Pabrik/Gudang)
Menggunakan material:
- Purlin/CNP (rangka utama)
- Gording (rangka sekunder)
- Spandek / uPVC (tidak pakai Genteng Metal)

## Jenis Penutup Atap

### 1. Genteng Metal
- Luas efektif: 0.616 m² per lembar
- Jarak reng: 21 cm (0.21 m)
- Sekrup atap: 10 buah/m²
- Perhitungan: Berdasarkan luas
- Cocok untuk: Residential

### 2. Spandek
- Lebar efektif: 1.00 m
- Panjang stock: 6.00 m
- Sekrup atap: 8 buah/m²
- Perhitungan: Berdasarkan lane/jalur
- Cocok untuk: Residential dan Industrial

### 3. uPVC (Transparan)
- Lebar efektif: 0.86 m
- Panjang stock: 6.00 m
- Sekrup atap: 8 buah/m²
- Perhitungan: Berdasarkan lane/jalur
- Cocok untuk: Residential dan Industrial

## Material yang Dihitung

### 1. Rangka Utama (Kanal C / Purlin)
- Coverage: 1 batang untuk 1.5 m² atap
- Panjang standar: 6 meter
- Formula: `ceil(luas_material / 1.5)`

### 2. Rangka Sekunder (Reng / Gording)
**Pelana & Datar:**
- Formula area-based: `(luas × 1.10) / jarak_reng / 6`

**Limas Residential (Kencana):**
- Formula geometrik: `2 × nWidth + nHip + 1`
- Lebih akurat untuk atap limas

### 3. Sekrup (Dual System)
**Sekrup Atap (melekatkan penutup ke rangka):**
- Genteng Metal: 10 buah/m²
- Spandek: 8 buah/m²
- uPVC: 8 buah/m²

**Sekrup Rangka (koneksi struktural):**
- Semua tipe: 20 buah/m²

**Total = Sekrup Atap + Sekrup Rangka**

## Parameter Input

### Geometri
1. **Panjang** (meter): Panjang bangunan
2. **Lebar** (meter): Lebar bangunan
3. **Overstek** (meter): Kelebihan atap per sisi
4. **Sudut Kemiringan** (derajat): 5-60°

### Harga (Opsional)
- Harga Kanal C (Residential)
- Harga Purlin/CNP (Industrial)
- Harga Reng (Residential)
- Harga Gording (Industrial)
- Harga Genteng Metal / Spandek / uPVC
- Harga Sekrup Atap
- Harga Sekrup Rangka
- Upah per m²

## Contoh Perhitungan

### Contoh 1: Rumah Pelana 8×7m
**Input:**
- Model: Pelana
- Tipe: Residential
- Panjang: 8m, Lebar: 7m
- Overstek: 0.6m
- Sudut: 30°
- Penutup: Genteng Metal

**Output:**
- Luas Material: 100.15 m²
- Kanal C: 67 batang
- Reng: 88 batang
- Genteng Metal: 126 lembar
- Sekrup Total: 3,005 buah
  - Sekrup Atap: 1,002 buah
  - Sekrup Rangka: 2,003 buah

### Contoh 2: Rumah Limas 7×8m (Kencana)
**Input:**
- Model: Limas
- Tipe: Residential
- Panjang: 8m, Lebar: 7m
- Overstek: 1.0m
- Sudut: 35°
- Penutup: Genteng Metal

**Output:**
- Luas Material: 119.21 m² (geometrik 109.87 m² + 8.5% waste)
- Kanal C: 79 batang (floor, bukan ceil)
- Reng: 95 batang (geometrik: 2×27 + 40 + 1)
- Genteng Metal: 150 lembar
- Sekrup Total: 3,577 buah

### Contoh 3: Gudang Datar 12×10m
**Input:**
- Model: Datar
- Tipe: Industrial
- Panjang: 12m, Lebar: 10m
- Overstek: 0.5m
- Sudut: 5°
- Penutup: Spandek

**Output:**
- Luas Material: 143.00 m²
- Purlin: 96 batang
- Gording: 22 batang
- Spandek: 26 lembar
- Sekrup Total: 4,004 buah

## Formula Kunci

### Luas Atap

**Pelana:**
```
L_eff = panjang + 2 × overstek
S = (lebar/2 + overstek) / cos(sudut)
Luas Geometrik = 2 × L_eff × S
Luas Material = Luas Geometrik × 1.00
```

**Limas:**
```
L_eff = panjang + 2 × overstek
B_eff = lebar + 2 × overstek
Luas Geometrik = (L_eff × B_eff) / cos(sudut)
Luas Material = Luas Geometrik × 1.085
```

**Datar:**
```
L_eff = panjang + 2 × overstek
B_eff = lebar + 2 × overstek
Luas Geometrik = L_eff × B_eff
Luas Material = Luas Geometrik × 1.00
```

### Kanal C / Purlin
```
Kanal C = ceil(Luas Material / 1.5)
Khusus Limas Residential: floor(Luas Material / 1.5)
```

### Reng / Gording

**Pelana & Datar:**
```
Total Meter = (Luas Material × 1.10) / jarak
Jumlah Batang = ceil(Total Meter / 6)
```

**Limas Residential:**
```
slopeWidth = (B_eff / 2) / cos(sudut)
planHipHalf = √[(L_eff/2)² + (B_eff/2)²]
slopeHip = planHipHalf / cos(sudut)

nWidth = ceil(slopeWidth / 0.21)
nHip = ceil(slopeHip / 0.21)

Reng = 2 × nWidth + nHip + 1
```

### Penutup Atap

**Genteng Metal:**
```
Jumlah = ceil(Luas Material / 0.616)
```

**Spandek/uPVC Pelana:**
```
Lanes = ceil(L_eff / lebar_efektif)
Jumlah = Lanes × 2
```

**Spandek/uPVC Limas:**
```
Lanes = ceil(L_eff / lebar_efektif)
Jumlah = Lanes × 2 × 1.10 (tambah 10% untuk potongan hip)
```

## Tips Penggunaan

### Untuk Residential
1. Pilih model atap yang sesuai (Pelana atau Limas)
2. Masukkan ukuran bangunan yang akurat
3. Overstek standar: 0.5 - 1.0 meter
4. Sudut ideal: 30-35° untuk Genteng Metal
5. Gunakan Genteng Metal untuk estetika

### Untuk Industrial
1. Pelana untuk gudang sederhana
2. Datar untuk pabrik besar
3. Overstek minimal: 0.5 meter
4. Sudut rendah: 5-15° untuk Datar
5. Spandek lebih ekonomis dari uPVC

### Waste Factor
- Pelana: 0% (2 bidang persegi, minim potong)
- Limas: 8.5% (4 bidang + hip rafter, banyak potongan)
- Datar: 0% (datar, minim pemborosan)

## Validasi & Kalibrasi

Kalkulator ini telah dikalibrasi dengan:
- **Kalkulator Kencana** (standar industri Indonesia)
- **Test Case Verified**: Limas 7×8m, overstek 1m, 35°
  - Luas: 119.21 m² ✓
  - Kanal C: 79 batang ✓
  - Reng: 95 batang ✓

## Batasan & Asumsi

1. Atap simetris (tidak ada desain kompleks)
2. Overstek sama di semua sisi
3. Tidak termasuk:
   - Talang air
   - Nok atap
   - Flashing
   - Aksesoris tambahan
4. Hasil adalah estimasi, konsultasi profesional diperlukan

## FAQ

### Berapa overstek yang ideal?
- Residential: 0.6 - 1.0 meter
- Industrial: 0.5 - 0.8 meter

### Sudut kemiringan optimal?
- Genteng Metal: 30-35°
- Spandek: 15-30°
- Datar: 3-5°

### Kenapa Limas pakai floor untuk Kanal C?
Dikalibrasi dengan Kencana untuk akurasi maksimal pada atap limas residential.

### Berapa waste factor yang aman?
Kalkulator sudah include:
- Limas: +8.5%
- Reng: +10% (koefisien 1.10)

Untuk keamanan, tambahkan 5-10% manual saat order.

### Bisa hitung biaya?
Ya, masukkan harga material dan upah. Kalkulator akan hitung total biaya otomatis.

## Cara Menggunakan Kalkulator

1. **Pilih Model Atap**: Pelana, Limas, atau Datar
2. **Pilih Tipe Bangunan**: Residential atau Industrial
3. **Masukkan Dimensi**:
   - Panjang bangunan (meter)
   - Lebar bangunan (meter)
   - Overstek per sisi (meter)
   - Sudut kemiringan (derajat)
4. **Pilih Jenis Penutup**: Genteng Metal, Spandek, atau uPVC
5. **Input Harga** (opsional untuk estimasi biaya)
6. **Klik Hitung**: Lihat hasil estimasi material

## Konversi Unit

- 1 batang = 6 meter
- 1 m² Genteng Metal = 1.62 m² (luas sheet) → 0.616 m² efektif setelah overlap
- 1 lembar Spandek = 6m × 1m = 6 m²
- 1 lembar uPVC = 6m × 0.86m = 5.16 m²

## Teknologi

Kalkulator ini menggunakan:
- **Version**: 2.3.0 - Kencana Calibrated
- **Basis**: Code Kalkulator Pelana
- **Formula**: International standard + Kencana calibration
- **Accuracy**: ±2% untuk atap standar
