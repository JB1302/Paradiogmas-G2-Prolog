# Sistema de facturación · Prolog + Neon + Node.js

Proyecto académico SC-250 Paradigmas de Programación, Universidad Fidélitas. **Simulación didáctica, no genera facturas electrónicas válidas ante Hacienda.**

## Requisitos

- Node.js 20 o superior; npm; SWI-Prolog instalado y disponible mediante `swipl` en PATH.
- Una cuenta Neon PostgreSQL y su URL de conexión secreta.
- Navegador web actualizado. Git para gestión del repositorio.

## Instalación paso a paso

1. Cree una base PostgreSQL en Neon. En **SQL Editor**, ejecute `sql/facturacion_neon.sql`, luego `sql/migracion.sql`, en ese orden. El segundo script añade consecutivos, detalle y notas de crédito. Para pruebas reproducibles, use una base nueva.
2. Abra una terminal en `api/`. Ejecute `npm install`.
3. Copie `api/.env.example` a `api/.env` y reemplace `DATABASE_URL` con la cadena real de Neon (nunca comparta esta clave ni la suba al repositorio).
4. Ejecute `npm start` desde `api/`. Abra `http://localhost:3000`.
5. En la web podrá ver productos, crear clientes, elaborar facturas, emitir, revisar historial, anular facturas emitidas y consultar reportes.

Ejemplo de configuración local en `api/.env`:

```dotenv
DATABASE_URL=postgresql://USUARIO:CLAVE@SERVIDOR/neondb?sslmode=require
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

**Windows:** instale SWI-Prolog e incluya la carpeta `bin` en PATH. Compruebe con `swipl --version`. Si no está en PATH, defina `SWIPL_BIN` con la ruta al ejecutable.

## Ejecutar las pruebas de Prolog

Desde `tests/` ejecute:

```bash
swipl -q -s motor_tests.pl -g run_tests -t halt
```

Hay 21 pruebas automatizadas para tarifas, descuentos, kits, validaciones y facturas de control. Ver también `docs/CALCULOS_MANUALES.md`.

## Endpoints REST

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/salud` | Estado de la API |
| GET | `/api/productos` | Catálogo de productos y kits |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:cod` | Editar producto |
| GET | `/api/clientes` | Lista de clientes |
| POST | `/api/clientes` | Crear cliente |
| GET | `/api/facturas?estado=&cliente=` | Historial filtrado |
| GET | `/api/facturas/:id` | Detalle y resultados de factura |
| POST | `/api/facturas` | Crear factura pendiente con líneas |
| POST | `/api/facturas/:id/emitir` | Validar, calcular, emitir o rechazar |
| POST | `/api/facturas/:id/anular` | Nota de crédito y devolución de stock |
| GET | `/api/reportes` | Ventas, IVA, productos y consecutivo |

**Ejemplo de creación:** `POST /api/facturas` con JSON:

```json
{"cliente_id":"c2","forma_pago":"contado","lineas":[{"codigo":"p1","cantidad":10},{"codigo":"p3","cantidad":2},{"codigo":"p6","cantidad":1}]}
```

**Ejemplo de anulación:** `POST /api/facturas/7/anular` con `{"motivo":"Corrección de venta"}`. Solo acepta facturas emitidas.

## Funcionalidades y alcance

- **RF-01 a RF-08:** catálogo editable, alta de clientes, facturas, descuentos/IVA y kits anidados en Prolog, validaciones, emisión transaccional con consecutivo, filtros y reportes.
- **RF-09 (reto):** anulación con nota de crédito, devolución de inventario y trazabilidad histórica.
- **Retos adicionales:** 21 casos plunit, GitHub Actions, explicación del descuento e IVA desglosado por tarifa.
- **Tres historias extra:** HU-15 búsqueda de facturas por cliente (filtro); HU-16 salud de API para diagnóstico; HU-17 anulación con motivo obligatorio. Vea `docs/BACKLOG.md`.
- Errores en español; interfaz móvil; indicadores de carga durante emisión.

## Seguridad y limitaciones

- Consultas SQL parametrizadas; secretos en `.env` ignorado por Git; política CORS configurable; revalidación del servidor; transacciones y bloqueo durante emisión.
- Este ejemplo **no tiene autenticación ni permisos por roles**; por ello las operaciones administrativas no están protegidas. No debe desplegarse públicamente con acceso de escritura irrestricto. Se requiere autenticación/autorización antes de producción.
- El descuento de kits es recursivo. Los stocks de componentes se verifican en Prolog y se actualizan de forma atómica en PostgreSQL.
- `GET /api/reportes` cuenta solo emitidas; facturas anuladas se excluyen. El consecutivo de facturas emitidas queda registrado aun cuando se anulan.
- El estado inicial del archivo SQL contiene **seis facturas pendientes**; para ver resultados se deben emitir desde la API. En la interfaz se crean nuevas facturas.
- RNF-05 (<3 s): **pendiente de medir** en equipo con conexión real a Neon; no se afirma haber cumplido sin medición.

## Pruebas de API

Importe `tests/Facturacion.postman_collection.json` en Postman; configure `baseUrl=http://localhost:3000`. Incluye peticiones positivas/negativas y aserciones automatizadas. Algunas pruebas modifican inventario o generan facturas: use base de pruebas limpia.

## Organización, evidencias y presentación

- Guía original: `Proyecto_Facturacion_Prolog_GUIA_ESTUDIANTES.pdf`.
- Arquitectura: `docs/ARQUITECTURA.md`.
- Cálculos de control: `docs/CALCULOS_MANUALES.md`.
- Backlog e historias: `docs/BACKLOG.md`.
- Registro de trabajo con IA: `BITACORA_IA.md`.
- Presentación: `docs/PRESENTACION.md`.

**Evidencias por verificar con el equipo:** asignación de Issues, Pull Requests revisados, commits por integrante, Release `v1.0`, capturas de pantalla, medición de tiempos, prueba extremo a extremo con Neon y dificultades documentadas. El código del repositorio no constituye por sí solo evidencia de estas actividades.

## Integrantes y colaboradores

- **Jonathan Steven Barrantes Jiménez**
- **María Fernanda Fajardo Torres**
- **Aarón de la Cruz Azofeifa Abarca**
- **María Laura Brenes Herrera**
- **Allan Alberto Azofeifa Ampié**

Las responsabilidades individuales pueden detallarse cuando el grupo las confirme.

## Definición de hecho

Historia completada = código revisado por otra persona mediante Pull Request + prueba positiva y negativa + documentación actualizada + sin secretos en Git.
