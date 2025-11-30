-- Migration: Q&A Knowledge Base
-- Purpose: Store manual Q&A pairs and AI behavior settings for the chatbot

-- Table for AI behavior settings
CREATE TABLE IF NOT EXISTS ai_behavior (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for Q&A knowledge pairs
CREATE TABLE IF NOT EXISTS qa_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- Array of keywords for matching
  priority INTEGER DEFAULT 0, -- Higher priority = checked first
  requires_image BOOLEAN DEFAULT FALSE, -- If true, this Q&A needs image analysis
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qa_category ON qa_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_qa_keywords ON qa_knowledge USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_qa_active ON qa_knowledge(is_active);
CREATE INDEX IF NOT EXISTS idx_qa_priority ON qa_knowledge(priority DESC);

-- Insert default AI behavior settings
INSERT INTO ai_behavior (setting_key, setting_value, description)
VALUES
  ('tone', 'casual_friendly', 'Tone suara AI: casual_friendly, professional, atau technical'),
  ('response_style', 'Aku adalah BARI, asisten virtual untuk Bajaringan. Aku akan bantu kamu dengan ramah dan santai.', 'Style dasar respons AI'),
  ('max_response_length', '500', 'Maksimal panjang karakter untuk respons AI'),
  ('use_emoji', 'true', 'Boleh pakai emoji atau tidak (true/false)')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample Q&A knowledge
INSERT INTO qa_knowledge (category, question, answer, keywords, priority, requires_image)
VALUES
  -- General questions
  ('umum', 'Apa itu Bajaringan?', 'Bajaringan adalah perusahaan yang fokus pada penyediaan material dan jasa pemasangan atap baja ringan berkualitas tinggi. Kita udah berpengalaman bertahun-tahun melayani proyek residential dan komersial.', ARRAY['bajaringan', 'perusahaan', 'tentang'], 10, false),

  ('umum', 'Berapa lama garansi atap baja ringan?', 'Garansi atap baja ringan tergantung jenis material:\n- Rangka baja ringan: 10-15 tahun\n- Genteng metal: 5-10 tahun\n- Spandek/Zincalume: 10-25 tahun\n\nGaransi ini cover karat dan kerusakan struktural. Untuk detail lengkap, hubungi sales kita ya!', ARRAY['garansi', 'berapa lama', 'warranty'], 8, false),

  -- Installation questions
  ('pemasangan', 'Berapa lama waktu pemasangan atap?', 'Waktu pemasangan tergantung luas atap:\n- Rumah kecil (50-100m²): 3-5 hari\n- Rumah sedang (100-200m²): 5-10 hari\n- Rumah besar (>200m²): 10-20 hari\n\nIni estimasi untuk kondisi normal. Bisa lebih cepat atau lambat tergantung cuaca dan kompleksitas desain.', ARRAY['waktu', 'lama pemasangan', 'berapa hari'], 7, false),

  -- Material questions
  ('material', 'Apa bedanya genteng metal dan spandek?', 'Perbedaan genteng metal vs spandek:\n\nGenteng Metal:\n✓ Bentuk seperti genteng keramik\n✓ Lebih estetik, cocok untuk rumah\n✓ Peredam panas lebih baik\n✓ Harga lebih mahal\n\nSpandek:\n✓ Bentuk gelombang/rata\n✓ Lebih ekonomis\n✓ Cocok untuk gudang/pabrik\n✓ Pemasangan lebih cepat\n\nPilih sesuai kebutuhan dan budget ya!', ARRAY['genteng', 'spandek', 'perbedaan', 'beda'], 9, false),

  -- Image analysis examples
  ('visual', 'Bagaimana cara mendeteksi atap bocor dari foto?', 'Untuk analisis kebocoran atap lewat foto, pastikan foto menunjukkan:\n1. Noda air/bekas rembesan di plafon\n2. Kondisi genteng/atap dari luar\n3. Area sekitar talang air\n4. Detail sambungan/nok atap\n\nKirim fotonya dan aku akan bantu analisa penyebab dan solusinya!', ARRAY['bocor', 'foto', 'gambar', 'analisa visual'], 8, true),

  ('visual', 'Bisa lihat kondisi atap dari foto?', 'Tentu! Kirim foto atap kamu dan aku akan analisa:\n- Kondisi material (karat, pecah, dll)\n- Pemasangan (miring, longgar, dll)\n- Potensi masalah\n- Rekomendasi perbaikan\n\nPastikan foto jelas dan dari beberapa sudut ya!', ARRAY['foto', 'lihat', 'cek kondisi', 'gambar'], 7, true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER qa_knowledge_updated_at
  BEFORE UPDATE ON qa_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_updated_at();

CREATE TRIGGER ai_behavior_updated_at
  BEFORE UPDATE ON ai_behavior
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_updated_at();
