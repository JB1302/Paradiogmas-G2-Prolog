# FacturaLog — Sistema de facturación con Prolog

**Proyecto académico · SC-250 Paradigmas de Programación · Universidad Fidélitas · Grupo 2**

Sistema web de facturación desarrollado para aplicar el **paradigma de programación lógica**. Su componente central es un motor de reglas en **SWI-Prolog** encargado de validar y calcular las facturas. La API en Node.js, la base de datos PostgreSQL de Neon y la interfaz web funcionan como componentes de soporte.

> **Aviso:** es una simulación educativa. **No genera facturas electrónicas válidas ante el Ministerio de Hacienda de Costa Rica** ni está preparada para utilizarse como sistema comercial en producción.

## Funcionalidades

- **Productos y clientes:** consultar, registrar y editar productos; crear clientes con tipo y nivel de descuento.
- **Facturación:** construir facturas con varios productos o kits y pago de contado o crédito.
- **Motor Prolog:** validar cantidades, existencia de artículos, condiciones de crédito y disponibilidad de inventario; calcular descuentos, bases imponibles, IVA y totales.
- **Kits anidados:** calcular precios mediante reglas recursivas, aplicar un descuento del 5 % al valor de cada kit y detectar referencias circulares.
- **Emisión:** pasar de pendiente a emitida o rechazada, guardar el resultado, asignar consecutivo y actualizar el inventario mediante una transacción.
- **Anulación:** registrar una nota de crédito con motivo, cambiar el estado a anulada y devolver existencias.
- **Historial y reportes:** filtrar facturas por cliente o estado; visualizar ventas, impuestos, unidades y productos más vendidos.

## Reglas de negocio implementadas en Prolog

| Regla | Comportamiento |
| --- | --- |
| IVA general | 13 % |
| IVA medicamentos | 2 % |
| IVA canasta | 1 % |
| Productos exentos | 0 % |
| Cliente oro | 10 % de descuento |
| Cliente plata | 5 % de descuento |
| Cliente regular | Sin descuento por nivel |
| Compra de 10 a 49 unidades | 5 % de descuento por volumen |
| Compra de 50 o más unidades | 10 % de descuento por volumen |
| Kits | Descuento del 5 % en su composición recursiva |
| Exoneración | IVA del 0 % para clientes de tipo exonerado |
| Crédito | Restringido para consumidores finales y clientes de nivel regular |

Los descuentos por volumen y por nivel se aplican **secuencialmente**; la base y el IVA se redondean al colón por línea. Estas reglas corresponden al ejercicio académico y no pretenden representar toda la normativa tributaria vigente.

## Tecnologías y arquitectura

| Componente | Tecnología | Responsabilidad |
| --- | --- | --- |
| Motor de negocio | **SWI-Prolog** | Reglas, validaciones, recursión, descuentos e impuestos |
| API REST | Node.js + Express | Comunicación entre interfaz, Prolog y PostgreSQL |
| Base de datos | PostgreSQL en Neon | Clientes, productos, facturas, detalle, consecutivos e inventario |
| Interfaz | HTML, CSS y JavaScript | Formularios, historial y visualización de resultados |
| Pruebas | plunit y colección Postman | Verificación de reglas y endpoints |

```text
Navegador (HTML / CSS / JavaScript)
                 |
                 | HTTP / JSON
                 v
          API Node.js / Express
            |              |
            |              +----> PostgreSQL (Neon)
            |
            +----> SWI-Prolog (motor.pl)
                   valida y calcula
```

**Principio del diseño:** la API orquesta el proceso, maneja las transacciones y persiste los resultados; **Prolog concentra el cálculo y las reglas comerciales**. Los descuentos y el IVA no se recalculan en JavaScript.

## Estructura del repositorio

```text
Paradiogmas-G2-Prolog/
├── README.md
└── facturacion_work/
    ├── api/
    │   ├── server.js                 # API REST y comunicación con Prolog
    │   ├── package.json
    │   └── .env.example
    ├── reglas/
    │   ├── motor.pl                  # Motor de reglas y cálculos
    │   ├── cli.pl                    # Entrada de ejecución del motor
    │   └── facturacion_datos.pl      # Hechos y datos de ejemplo
    ├── sql/
    │   ├── facturacion_neon.sql      # Esquema y registros iniciales
    │   └── migracion.sql            # Consecutivos y notas de crédito
    ├── web/
    │   ├── index.html
    │   ├── styles.css
    │   └── app.js
    ├── tests/
    │   ├── motor_tests.pl            # 21 pruebas unitarias Prolog
    │   └── Facturacion.postman_collection.json
    ├── docs/                         # Arquitectura, backlog y cálculos
    ├── BITACORA_IA.md
    ├── LEEME.txt
    └── README.md                     # Documentación técnica adicional
```

## Instalación y ejecución

### 1. Requisitos

- Node.js 20 o superior y npm.
- [SWI-Prolog](https://www.swi-prolog.org/Download.html), con el comando `swipl` disponible en `PATH`.
- Una base de datos PostgreSQL en [Neon](https://neon.tech/).
- Git y un navegador actualizado.

### 2. Clonar el proyecto

```bash
git clone https://github.com/JB1302/Paradiogmas-G2-Prolog.git
cd Paradiogmas-G2-Prolog/facturacion_work
```

### 3. Configurar la base de datos

En el editor SQL de Neon, ejecutar los siguientes scripts **en este orden**:

1. `sql/facturacion_neon.sql`
2. `sql/migracion.sql`

El primer archivo crea el esquema y los datos de ejemplo; el segundo incorpora consecutivos, detalle de facturación y notas de crédito. Se recomienda usar una base nueva para las pruebas.

### 4. Configurar la API

Desde `facturacion_work/api`:

```bash
npm install
```

Copiar `.env.example` como `.env` y completar las variables:

```dotenv
DATABASE_URL=postgresql://USUARIO:CLAVE@HOST/neondb?sslmode=require
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

**No subir el archivo `.env` a GitHub.** Si `swipl` no está en el `PATH`, configurar también `SWIPL_BIN` con la ruta del ejecutable.

### 5. Iniciar el sistema

Desde `facturacion_work/api`:

```bash
npm run dev
```

Para ejecutarlo sin modo de observación de archivos:

```bash
npm start
```

Abrir **http://localhost:3000**. La API también sirve la interfaz web.

## API REST

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/salud` | Verificar que responde el servidor |
| GET / POST | `/api/productos` | Consultar o registrar productos |
| PUT | `/api/productos/:cod` | Editar un producto |
| GET / POST | `/api/clientes` | Consultar o registrar clientes |
| GET | `/api/facturas` | Listar facturas (admite `estado` y `cliente`) |
| GET | `/api/facturas/:id` | Obtener el detalle de una factura |
| POST | `/api/facturas` | Crear una factura pendiente |
| POST | `/api/facturas/:id/emitir` | Validar y emitir o rechazar |
| POST | `/api/facturas/:id/anular` | Anular con motivo y generar nota de crédito |
| GET | `/api/reportes` | Consultar indicadores de ventas e IVA |

Ejemplo de solicitud a `POST /api/facturas`:

```json
{
  "cliente_id": "c2",
  "forma_pago": "contado",
  "lineas": [
    { "codigo": "p1", "cantidad": 10 },
    { "codigo": "p3", "cantidad": 2 },
    { "codigo": "p6", "cantidad": 1 }
  ]
}
```

Después de crearla, emitirla mediante `POST /api/facturas/:id/emitir`.

## Pruebas

Desde `facturacion_work/tests`:

```bash
swipl -q -s motor_tests.pl -g run_tests -t halt
```

Se incluyen **21 pruebas unitarias** para tarifas, descuentos, kits, validaciones, crédito, existencias y facturas de control. También hay una colección de Postman en `tests/Facturacion.postman_collection.json`. Algunas pruebas de API modifican registros o inventario: realizarlas sobre una base de pruebas.

> **Nota de integración continua:** hay un archivo `facturacion_work/.github/workflows/prolog-tests.yml`, pero GitHub Actions solo detecta workflows en `.github/workflows/` de la **raíz del repositorio**. Para activarlo es necesario moverlo y ajustar sus rutas de ejecución.

## Integrantes del Grupo 2

| Integrante | Participación |
| --- | --- |
| **Jonathan Steven Barrantes Jiménez** | Integrante del proyecto |
| **María Fernanda Fajardo Torres** | Integrante del proyecto |
| **Aarón de la Cruz Azofeifa Abarca** | Integrante del proyecto |
| **María Laura Brenes Herrera** | Integrante del proyecto |
| **Allan Alberto Azofeifa Ampié** | Integrante del proyecto |

## Documentación adicional

- [README técnico](facturacion_work/README.md)
- [Arquitectura](facturacion_work/docs/ARQUITECTURA.md)
- [Backlog e historias](facturacion_work/docs/BACKLOG.md)
- [Cálculos manuales de control](facturacion_work/docs/CALCULOS_MANUALES.md)
- [Bitácora de uso de IA](facturacion_work/BITACORA_IA.md)
- [Guía del proyecto](facturacion_work/Proyecto_Facturacion_Prolog_GUIA_ESTUDIANTES.pdf)

## Limitaciones

Es un prototipo académico **sin autenticación ni gestión de permisos por roles**. No debe exponerse públicamente con operaciones de escritura habilitadas sin controles adicionales. El cumplimiento de objetivos de rendimiento requiere mediciones en el ambiente real con Neon. El repositorio contiene código y pruebas, pero su ejecución correcta debe verificarse localmente.

---

Desarrollado con fines académicos para **SC-250 · Paradigmas de Programación**, Universidad Fidélitas.
