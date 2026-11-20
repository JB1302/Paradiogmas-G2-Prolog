# Backlog · Issues sugeridos

Las historias de la guía HU-01 a HU-14 deben crearse como Issues reales en GitHub, asignarse y revisarse en Pull Request. Las historias siguientes son propuestas nuevas del grupo que deben validar y adaptar:

| ID | Prioridad | Historia | Criterio Dado / Cuando / Entonces |
|---|---|---|---|
| HU-15 | Debería | Como contadora, quiero filtrar facturas por cliente, para revisar sus compras. | Dado un cliente con facturas, cuando selecciono el cliente en Historial, entonces solo aparecen sus facturas. |
| HU-16 | Podría | Como persona desarrolladora, quiero consultar la salud de la API, para diagnosticar la conexión al servidor. | Dado que la API está activa, cuando consulto `/api/salud`, entonces recibo código 200 y `status=ok`. |
| HU-17 | Debería | Como contadora, quiero indicar un motivo en cada nota de crédito, para justificar la anulación. | Dada una factura emitida, cuando intento anular sin motivo, entonces la API responde 400; con motivo, registra nota y devuelve inventario. |

## Issues por implementación

- HU-01 / RF-01 catálogo y mantenimiento productos.
- HU-02, HU-09 / RF-03, RF-06 creación y emisión de facturas.
- HU-03, HU-04, HU-05 / RF-04 descuentos e IVA en Prolog.
- HU-06, HU-07, HU-08 / RF-05 crédito, stock y mensajes.
- HU-10 / RF-04 kits anidados.
- HU-11 / RF-01, RF-02 administrar productos y clientes.
- HU-12 / RF-07 historial y detalle.
- HU-13 / RF-08 reportes.
- HU-14 / RF-09 anulación y nota de crédito.
- HU-15, HU-16, HU-17 historias nuevas.

**Responsables, fechas, enlaces de Issues y Pull Requests:** completar con el equipo. No declarar tareas revisadas o aprobadas sin evidencia real.
