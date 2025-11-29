/**
 * Intent Classification & Slot Extraction Types
 * Based on Monte Carlo simulation research for BARI chatbot
 */

export type IntentType =
  | 'kalkulator_kebutuhan_atap'
  | 'estimasi_biaya'
  | 'permintaan_survei'
  | 'keluhan_kebocoran'
  | 'keluhan_karat'
  | 'keluhan_panas'
  | 'keluhan_berisik'
  | 'pertanyaan_struktur'
  | 'pertanyaan_garansi'
  | 'pertanyaan_amc'
  | 'pertanyaan_k3'
  | 'pertanyaan_produk'
  | 'permintaan_kontak'
  | 'general_question'
  | 'greeting';

export interface IntentClassification {
  intent: IntentType;
  confidence: number; // 0-1
  reasoning?: string; // Why this intent was chosen
}

// Generic slot type
export interface Slot {
  name: string;
  value: string | number | boolean;
  confidence?: number;
  unit?: string;
}

// Specific slot interfaces for each intent
export interface KalkulatorSlots {
  dimensi_panjang?: number; // meters
  dimensi_lebar?: number; // meters
  luas_atap?: number; // m²
  tipe_atap?: 'Pelana' | 'Limas' | 'Datar';
  tipe_bangunan?: 'Residential' | 'Industrial';
  overstek?: number; // meters
  sudut?: number; // degrees
  jenis_penutup?: 'Genteng Metal' | 'Spandek' | 'uPVC';
}

export interface EstimasiBiayaSlots {
  luas_atap?: number; // m²
  tipe_atap?: string;
  spesifikasi?: string;
  lokasi_proyek?: string;
  kontak?: string;
}

export interface PermintaanSurveiSlots {
  alamat_lokasi?: string;
  waktu_survei?: string;
  kontak_person?: string;
  no_telepon?: string;
}

export interface KeluhanSlots {
  lokasi_masalah?: string; // Area specific location
  tingkat_keparahan?: 'ringan' | 'sedang' | 'parah';
  usia_atap?: number; // years
  jenis_material?: string;
  detail_masalah?: string;
  kontak?: string;
}

export interface PertanyaanStrukturSlots {
  jenis_struktur?: string; // baja ringan, baja WF, etc
  beban_tambahan?: string; // panel surya, HVAC, etc
  bentang_ukuran?: number;
  usia_bangunan?: number;
  kondisi_bangunan?: string;
}

export interface PertanyaanGaransiSlots {
  jenis_garansi?: 'struktur' | 'kebocoran' | 'material';
  nomor_kontrak?: string;
  tanggal_pemasangan?: string;
  detail_masalah?: string;
}

export interface PertanyaanAMCSlots {
  luas_atap?: number;
  jenis_atap?: string;
  frekuensi_perawatan?: string; // bulanan, tahunan
  lokasi_fasilitas?: string;
}

export interface PertanyaanProdukSlots {
  nama_produk?: string;
  kriteria_khusus?: string[]; // anti panas, tahan karat, etc
}

export interface PermintaanKontakSlots {
  mode_kontak?: 'telepon' | 'whatsapp' | 'email';
  kontak_pengguna?: string;
  topik?: string;
  urgensi?: 'rendah' | 'sedang' | 'tinggi';
}

// Union type for all possible slots
export type IntentSlots =
  | KalkulatorSlots
  | EstimasiBiayaSlots
  | PermintaanSurveiSlots
  | KeluhanSlots
  | PertanyaanStrukturSlots
  | PertanyaanGaransiSlots
  | PertanyaanAMCSlots
  | PertanyaanProdukSlots
  | PermintaanKontakSlots
  | Record<string, never>; // Empty object for intents without slots

export interface IntentDetectionResult {
  classification: IntentClassification;
  slots: IntentSlots;
  missing_slots: string[]; // List of required slots that are missing
  is_complete: boolean; // Whether all required slots are filled
  next_question?: string; // Suggested question to ask user for missing slots
}

// Intent-specific required slots mapping
export const REQUIRED_SLOTS: Record<IntentType, string[]> = {
  kalkulator_kebutuhan_atap: ['dimensi_panjang', 'dimensi_lebar', 'tipe_atap', 'tipe_bangunan', 'overstek', 'sudut', 'jenis_penutup'],
  estimasi_biaya: ['luas_atap', 'tipe_atap', 'lokasi_proyek'],
  permintaan_survei: ['alamat_lokasi', 'kontak_person', 'no_telepon'],
  keluhan_kebocoran: ['lokasi_masalah', 'tingkat_keparahan'],
  keluhan_karat: ['lokasi_masalah', 'tingkat_keparahan'],
  keluhan_panas: ['jenis_atap'],
  keluhan_berisik: ['jenis_atap'],
  pertanyaan_struktur: ['jenis_struktur', 'beban_tambahan'],
  pertanyaan_garansi: [],
  pertanyaan_amc: ['luas_atap', 'lokasi_fasilitas'],
  pertanyaan_k3: [],
  pertanyaan_produk: [],
  permintaan_kontak: ['mode_kontak'],
  general_question: [],
  greeting: []
};
