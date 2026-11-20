# Comprobación manual de las facturas semilla

Tarifas del ejercicio: general 13 %, medicamento 2 %, canasta 1 %, exento 0 %. Descuento por volumen: desde 10 unidades 5 %, desde 50 unidades 10 %. Por cliente: oro 10 %, plata 5 %. Los descuentos se aplican en ese orden. Se redondean base e IVA al colón por línea.

## Factura 1: cliente c1, nivel oro, contado

- p2: 2 × 450 000 = 900 000; descuento oro 10 % → base 810 000; IVA 13 % → 105 300.
- p4: 12 × 8 500 = 102 000; volumen 5 % → 96 900; oro 10 % → base 87 210; IVA 13 % → 11 337.
- p5: 3 × 25 000 = 75 000; oro 10 % → base 67 500; IVA 13 % → 8 775.
- **Subtotal 964 710; IVA 125 412; total 1 090 122**.

## Factura 2: cliente c2, regular, contado (control del profesor)

- p1: 10 × 1 200 = 12 000; volumen 5 % → base 11 400; IVA 1 % → 114.
- p3: 2 × 1 500 = 3 000; base 3 000; IVA 2 % → 60.
- p6: base 12 000; IVA 0 % → 0.
- **Subtotal 26 400; IVA 174; total 26 574**.

## Factura 3: cliente c3, nivel plata, exonerado (control del profesor)

- p2: 1 × 450 000; plata 5 % → base 427 500; IVA 0.
- p7: 10 × 18 000 = 180 000; volumen 5 % → 171 000; plata 5 % → base 162 450; IVA 0.
- **Subtotal 589 950; IVA 0; total 589 950**.

## Factura 4: cliente c4, regular, crédito

**Rechazada:** el nivel regular no puede comprar a crédito. No descuenta stock ni recibe consecutivo.

## Factura 5: cliente c2, regular, contado

**Rechazada:** solicita 20 laptops p2, pero el stock inicial es 15. No descuenta stock ni recibe consecutivo.

## Factura 6: cliente c1, oro, crédito, kit k2

- k1: (450 000 + 8 500 + 18 000) × 0,95 = 452 675.
- k2: (452 675 + 25 000) × 0,95 = 453 791,25.
- 1 kit k2; oro 10 % → base redondeada **408 412**.
- IVA general 13 % sobre base 408 412 → **53 094**.
- **Subtotal 408 412; IVA 53 094; total 461 506**.

Nota: las facturas de control deben ejecutarse **sobre los datos semilla sin emisiones previas**. Si se emite la factura 1 y luego se intenta emitir la factura 3, el stock de laptop baja de 15 a 13 y aún permite la venta. Las cifras de reportes dependen de qué facturas realmente se emitan.
