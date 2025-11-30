-- Contact Settings Table
CREATE TABLE IF NOT EXISTS contact_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default values
INSERT INTO contact_settings (setting_key, setting_value, description)
VALUES
  ('wa_cs', '6281234567890', 'WhatsApp Customer Service'),
  ('wa_sales', '6289876543210', 'WhatsApp Sales'),
  ('email_cs', 'cs@bajaringan.com', 'Email Customer Service'),
  ('operating_hours', 'Senin-Jumat, 08:00-17:00', 'Jam Operasional')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_settings_key ON contact_settings(setting_key);
