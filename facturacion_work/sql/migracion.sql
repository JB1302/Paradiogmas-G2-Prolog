-- Ejecutar DESPUES de facturacion_neon.sql. Idempotente.
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS consecutivo INTEGER UNIQUE;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS anulada_en TIMESTAMPTZ;
ALTER TABLE lineas ADD COLUMN IF NOT EXISTS detalle JSONB;
CREATE TABLE IF NOT EXISTS consecutivos (id INTEGER PRIMARY KEY CHECK (id=1), ultimo INTEGER NOT NULL DEFAULT 0);
INSERT INTO consecutivos(id, ultimo) VALUES (1,0) ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS notas_credito (
 id BIGSERIAL PRIMARY KEY, factura_id INTEGER NOT NULL UNIQUE REFERENCES facturas(id),
 motivo TEXT NOT NULL, creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
