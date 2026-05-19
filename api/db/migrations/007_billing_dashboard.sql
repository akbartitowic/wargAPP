-- Template rincian per periode + pengeluaran IPL per bulan

ALTER TABLE billing_periods
  ADD COLUMN IF NOT EXISTS line_template JSONB;

COMMENT ON COLUMN billing_periods.line_template IS
  'Template rincian tagihan [{ "item_name": "...", "amount": 123 }]';

CREATE TABLE IF NOT EXISTS ipl_expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_complex_id  UUID NOT NULL REFERENCES housing_complexes (id) ON DELETE CASCADE,
  period_year         SMALLINT NOT NULL,
  period_month        SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  title               VARCHAR(120) NOT NULL,
  amount              NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  category            VARCHAR(40) NOT NULL DEFAULT 'Umum',
  notes               TEXT,
  spent_at            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by          UUID REFERENCES admins (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipl_expenses_housing_period
  ON ipl_expenses (housing_complex_id, period_year DESC, period_month DESC);
