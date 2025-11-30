/**
 * Intent-specific handlers
 * Each handler processes a specific intent and generates appropriate response
 */

import { IntentType, IntentSlots, KalkulatorSlots, EstimasiBiayaSlots, PermintaanSurveiSlots, KeluhanSlots } from '@/types/intent';
import { getGeminiLLM } from '@/llm/gemini';

export interface HandlerResponse {
  message: string;
  action?: 'calculate' | 'create_ticket' | 'schedule_survey' | 'handoff' | 'provide_info';
  data?: any;
}

export class IntentHandlers {
  private llm = getGeminiLLM();

  /**
   * Route intent to appropriate handler
   */
  async handleIntent(
    intent: IntentType,
    slots: IntentSlots,
    userMessage: string
  ): Promise<HandlerResponse> {
    console.log(`🎯 Handling intent: ${intent}`);
    console.log(`📦 Slots:`, slots);

    switch (intent) {
      case 'kalkulator_kebutuhan_atap':
        return this.handleKalkulator(slots as KalkulatorSlots);

      case 'estimasi_biaya':
        return this.handleEstimasiBiaya(slots as EstimasiBiayaSlots);

      case 'permintaan_survei':
        return this.handlePermintaanSurvei(slots as PermintaanSurveiSlots);

      case 'keluhan_kebocoran':
      case 'keluhan_karat':
      case 'keluhan_panas':
      case 'keluhan_berisik':
        return this.handleKeluhan(intent, slots as KeluhanSlots, userMessage);

      case 'pertanyaan_garansi':
        return this.handlePertanyaanGaransi(slots);

      case 'pertanyaan_amc':
        return this.handlePertanyaanAMC(slots);

      case 'pertanyaan_struktur':
        return this.handlePertanyaanStruktur(slots, userMessage);

      case 'pertanyaan_k3':
        return this.handlePertanyaanK3();

      case 'permintaan_kontak':
        return this.handlePermintaanKontak(slots);

      case 'greeting':
        return this.handleGreeting();

      case 'pertanyaan_produk':
      case 'general_question':
      default:
        // These will be handled by RAG system
        return {
          message: '', // Empty, will be filled by RAG
          action: 'provide_info'
        };
    }
  }

  /**
   * Handle calculator intent
   */
  private async handleKalkulator(slots: KalkulatorSlots): Promise<HandlerResponse> {
    // Build calculator request
    const calculatorInput = {
      modelAtap: slots.tipe_atap || 'Pelana',
      buildingType: slots.tipe_bangunan || 'Residential',
      panjang: slots.dimensi_panjang || 0,
      lebar: slots.dimensi_lebar || 0,
      overstek: slots.overstek || 0.6,
      sudut: slots.sudut || 30,
      jenisAtap: slots.jenis_penutup || 'Genteng Metal'
    };

    try {
      // Call calculator API
      const calcResponse = await fetch('http://localhost:3000/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculatorInput)
      });

      if (!calcResponse.ok) {
        throw new Error('Calculator API failed');
      }

      const calcResult = await calcResponse.json();

      // Format response tanpa markdown
      const message = `Berikut estimasi material untuk atap ${calculatorInput.modelAtap} ${calculatorInput.buildingType} ${calculatorInput.panjang}×${calculatorInput.lebar}m:

LUAS ATAP
- Geometrik: ${calcResult.results.area.geometric.formatted}
- Material (dengan waste factor): ${calcResult.results.area.material.formatted}

MATERIAL RANGKA
- ${calcResult.results.materials.mainFrame.name}: ${calcResult.results.materials.mainFrame.count} batang
- ${calcResult.results.materials.secondaryFrame.name}: ${calcResult.results.materials.secondaryFrame.count} batang

PENUTUP ATAP
- ${calcResult.results.materials.cover.name}: ${calcResult.results.materials.cover.count} lembar

SEKRUP
- Sekrup Atap: ${calcResult.results.materials.screws.roofing.count} buah
- Sekrup Rangka: ${calcResult.results.materials.screws.frame.count} buah
- Total: ${calcResult.results.materials.screws.total.count} buah

💡 Catatan: Ini estimasi material dasar. Buat akurasi maksimal, konsultasi sama kontraktor buat detail lapangannya ya.`;

      return {
        message,
        action: 'calculate',
        data: calcResult
      };
    } catch (error) {
      console.error('❌ Calculator error:', error);
      return {
        message: `Waduh, ada masalah teknis pas hitung materialnya. Coba lagi nanti ya, atau hubungi tim kita langsung buat bantuan.`,
        action: 'provide_info'
      };
    }
  }

  /**
   * Handle cost estimation request
   */
  private async handleEstimasiBiaya(slots: EstimasiBiayaSlots): Promise<HandlerResponse> {
    const message = `Oke, untuk atap ${slots.luas_atap || ''}m² di ${slots.lokasi_proyek || 'tempat kamu'}, ini kira-kira biayanya:

Material: Rp ${this.estimateMaterialCost(slots.luas_atap || 0).toLocaleString('id-ID')}
Pasang: Rp ${this.estimateInstallationCost(slots.luas_atap || 0).toLocaleString('id-ID')}
Total sekitar: Rp ${(this.estimateMaterialCost(slots.luas_atap || 0) + this.estimateInstallationCost(slots.luas_atap || 0)).toLocaleString('id-ID')}

Tapi ini masih estimasi kasar ya. Biar pasti, mending kita survei dulu ke lokasi (gratis kok). Nanti kamu dapet penawaran lengkap yang udah detail.

Gimana, mau aku jadwalkan survei sekalian?`;

    return {
      message,
      action: 'provide_info',
      data: { estimated_cost: this.estimateMaterialCost(slots.luas_atap || 0) + this.estimateInstallationCost(slots.luas_atap || 0) }
    };
  }

  /**
   * Handle survey request
   */
  private async handlePermintaanSurvei(slots: PermintaanSurveiSlots): Promise<HandlerResponse> {
    const message = `Siap! Aku udah catat nih:

📍 Lokasi: ${slots.alamat_lokasi}
👤 Kontak: ${slots.kontak_person}
📞 Nomor: ${slots.no_telepon}
${slots.waktu_survei ? `🕐 Waktu: ${slots.waktu_survei}` : ''}

Tim kita bakal hubungi kamu dalam 1x24 jam buat konfirmasi jadwal ya.

Ada yang perlu aku tambahin? Misalnya ada area tertentu yang mau dicek khusus, atau hal lain yang perlu tim kita tau dulu?`;

    return {
      message,
      action: 'schedule_survey',
      data: slots
    };
  }

  /**
   * Handle complaint (kebocoran, karat, panas, berisik)
   */
  private async handleKeluhan(intent: IntentType, slots: KeluhanSlots, userMessage: string): Promise<HandlerResponse> {
    const problemTypeMap: Record<string, string> = {
      keluhan_kebocoran: 'kebocoran',
      keluhan_karat: 'korosi/karat',
      keluhan_panas: 'panas berlebih',
      keluhan_berisik: 'kebisingan saat hujan'
    };

    const problemType = problemTypeMap[intent] || 'masalah atap';

    // Generate contextual solution using LLM
    const solutionPrompt = `You are BARI, a friendly roofing expert chatting with a customer. User has a problem: ${problemType}.

Details: ${JSON.stringify(slots)}
User message: "${userMessage}"

Provide a SHORT, casual response (max 150 words) with:
1. Likely cause (1 sentence, natural language)
2. 2-3 solution options (conversational, not bullet points)
3. What you'll do to help

Respond in Indonesian, very casual and friendly tone like talking to a friend. Use "kamu" not "Anda". Be warm and helpful.`;

    try {
      const solution = await this.llm.complete(solutionPrompt);

      const message = `${solution}

---
Oke, aku udah bikinin tiket buat tim teknis kita ya. Mereka bakal hubungi kamu buat:
- Cek langsung ke lokasi
- Kasih solusi yang paling cocok
- Atur jadwal kalo mau perbaikan

Ada yang perlu aku tambahin di catatannya?`;

      return {
        message,
        action: 'create_ticket',
        data: { problem_type: problemType, slots }
      };
    } catch (error) {
      return {
        message: `Oke aku catat masalah ${problemType} di ${slots.lokasi_masalah || 'lokasi kamu'} ya. Tim teknis kita bakal segera hubungi buat bantu selesaiin.`,
        action: 'create_ticket',
        data: { problem_type: problemType, slots }
      };
    }
  }

  /**
   * Handle warranty questions
   */
  private async handlePertanyaanGaransi(slots: any): Promise<HandlerResponse> {
    const message = `Oke, soal garansi nih ya:

🔧 Struktur: 10 tahun
Cover keretakan, lendutan, atau masalah struktural lainnya. Tapi kalo kerusakan gara-gara bencana alam atau salah pake, nggak termasuk ya.

💧 Kebocoran: 5 tahun
Kalo bocor di sambungan atau masalah pemasangan, kita cover. Tapi kalo rusak fisik atau ada modifikasi tanpa izin, itu di luar garansi.

📋 Mau klaim?
Gampang kok prosesnya:
1. Hubungi CS kita di 0812-XXXX-XXXX
2. Siapin nomor kontrak, tanggal pasang, sama foto kerusakannya
3. Tim bakal jadwalin inspeksi (paling lama 3 hari kerja)
4. Kalo memenuhi syarat, langsung kita benerin

Ini lagi mau klaim garansi ya? Kalo iya, kasih tau nomor kontrak atau kapan atapnya dipasang.`;

    return { message, action: 'provide_info' };
  }

  /**
   * Handle AMC (maintenance contract) questions
   */
  private async handlePertanyaanAMC(slots: any): Promise<HandlerResponse> {
    const message = `Oh iya, kita ada paket perawatan rutin (AMC) nih!

📋 Yang kamu dapet:
✅ Cek atap berkala (bisa 3 bulan, 6 bulan, atau setahun sekali)
✅ Bersihin talang sama saluran air
✅ Cek semua sekrup dan sambungan
✅ Ganti komponen kecil yang rusak
✅ Laporan kondisi atap lengkap

💰 Harganya (untuk atap ${slots.luas_atap || 'X'}m²):
- Paket Basic: Rp ${this.estimateAMCCost(slots.luas_atap, 'basic').toLocaleString('id-ID')}/tahun
- Paket Premium: Rp ${this.estimateAMCCost(slots.luas_atap, 'premium').toLocaleString('id-ID')}/tahun

Mau aku hubungin tim sales buat penawaran lengkapnya? Mereka bisa bikinin paket yang pas sama kebutuhan kamu.`;

    return { message, action: 'provide_info' };
  }

  /**
   * Handle structural questions
   */
  private async handlePertanyaanStruktur(slots: any, userMessage: string): Promise<HandlerResponse> {
    const message = `Wah, pertanyaan ini agak teknis nih. Aku perlu bantuannya engineer kita buat jawab yang akurat ya.

📋 Yang aku tau sejauh ini:
- Jenis struktur: ${slots.jenis_struktur || '(belum tau)'}
- Beban tambahan: ${slots.beban_tambahan || '(belum tau)'}
- Bentang/ukuran: ${slots.bentang_ukuran || '(belum tau)'}

Kenapa harus engineer? Soalnya ini menyangkut perhitungan beban, momen, safety factor, harus sesuai SNI segala. Aku sebagai chatbot belum bisa bantu yang sedetail itu.

Gimana lanjutannya:
1. Engineer kita bakal hubungi kamu (paling lama 1x24 jam)
2. Diskusi teknis, cek gambar kalo ada
3. Kamu dapet rekomendasi tertulis yang lengkap

Mau aku sambungin ke engineer? Kalo iya, kasih nomor WA yang bisa dihubungi ya.`;

    return { message, action: 'handoff' };
  }

  /**
   * Handle K3/safety questions
   */
  private async handlePertanyaanK3(): Promise<HandlerResponse> {
    const message = `Tenang, soal keselamatan kerja kita serius banget kok!

✅ Sertifikasi kita:
- ISO 45001:2018 (standar internasional K3)
- Sertifikat Ahli K3 Konstruksi dari Kemnaker

🛡️ Yang kita lakuin:
- Tim pake APD lengkap: helmet, harness, safety shoes
- Semua udah dilatih kerja di ketinggian
- Ada toolbox meeting tiap hari sebelum kerja
- JSA (analisa keselamatan kerja) sebelum mulai
- Ada emergency response plan jaga-jaga

📋 Dokumen K3 yang bisa kita siapin:
- Risk Assessment
- Method Statement
- Lifting Plan (kalo pake crane)
- Permit to Work

Lagi butuh dokumen K3 buat tender atau audit? Aku bisa hubungin tim QHSE kita buat bantuin.`;

    return { message, action: 'provide_info' };
  }

  /**
   * Handle contact/handoff request
   */
  private async handlePermintaanKontak(slots: any): Promise<HandlerResponse> {
    // Fetch contact settings from database
    let waCS = '6281234567890';
    let waSales = '6289876543210';
    let emailCS = 'cs@bajaringan.com';
    let operatingHours = 'Senin-Jumat, 08:00-17:00';

    try {
      const response = await fetch('http://localhost:3000/api/admin/contacts');
      const data = await response.json();

      if (data.success && data.contacts) {
        const contacts = data.contacts;
        waCS = contacts.find((c: any) => c.setting_key === 'wa_cs')?.setting_value || waCS;
        waSales = contacts.find((c: any) => c.setting_key === 'wa_sales')?.setting_value || waSales;
        emailCS = contacts.find((c: any) => c.setting_key === 'email_cs')?.setting_value || emailCS;
        operatingHours = contacts.find((c: any) => c.setting_key === 'operating_hours')?.setting_value || operatingHours;
      }
    } catch (error) {
      console.error('❌ Error fetching contact settings:', error);
      // Use default values if fetch fails
    }

    const message = `Siap! Ini kontak kita ya:

📞 Customer Service:
Klik buat chat langsung: https://wa.me/${waCS}
Email: ${emailCS}
Jam buka: ${operatingHours}

📲 Sales (buat penawaran):
Klik buat chat langsung: https://wa.me/${waSales}

${slots.kontak_pengguna ? `\nOke, aku udah catat kontak kamu: ${slots.kontak_pengguna}\nTim kita bakal segera hubungi ya!` : '\nAtau kalo mau, kasih nomor WA kamu aja, nanti aku minta tim yang hubungi balik deh.'}`;

    return {
      message,
      action: 'handoff',
      data: slots
    };
  }

  /**
   * Handle greeting
   */
  private async handleGreeting(): Promise<HandlerResponse> {
    return {
      message: 'Halo! Aku BARI, asisten virtual dari Bajaringan.com. Aku spesialis atap buat pabrik sama gudang.\n\nAda yang bisa aku bantu? Mau tanya produk, hitung material, atau konsultasi masalah atap?',
      action: 'provide_info'
    };
  }

  // Helper: Estimate material cost
  private estimateMaterialCost(luas: number): number {
    // Rough estimate: Rp 150,000/m² for material
    return luas * 150000;
  }

  // Helper: Estimate installation cost
  private estimateInstallationCost(luas: number): number {
    // Rough estimate: Rp 75,000/m² for installation
    return luas * 75000;
  }

  // Helper: Estimate AMC cost
  private estimateAMCCost(luas: number | undefined, type: 'basic' | 'premium'): number {
    const area = luas || 1000;
    if (type === 'basic') {
      return area * 15000; // Rp 15,000/m²/year
    }
    return area * 25000; // Rp 25,000/m²/year for premium
  }
}

// Singleton
let handlerInstance: IntentHandlers | null = null;

export function getIntentHandlers(): IntentHandlers {
  if (!handlerInstance) {
    handlerInstance = new IntentHandlers();
  }
  return handlerInstance;
}
