# Bitácora del uso de IA

> Registro inicial de la construcción asistida. El grupo debe añadir las conversaciones que efectivamente tenga, sus comprobaciones propias y los cambios concretos realizados. No se atribuyen pruebas ni revisiones humanas no ejecutadas.

| Interacción | Solicitud a la IA | Propuesta | Riesgo/error detectado | Corrección/verificación prevista |
|---|---|---|---|---|
| 1 | «Haga lo que dice las indicaciones» sobre kit de estudiantes | Completar motor Prolog, API Node.js, web, scripts, pruebas y documentación | El kit inicial trae hechos Prolog y SQL, pero no reglas ni API implementadas | Se agregaron archivos separados `reglas/motor.pl`, `api/server.js`, `web/` y pruebas |
| 2 | Implementación del motor | Precio de kits recursivo y descuentos secuenciales | Podría aplicarse descuento solo al último componente, o en orden incorrecto | Separar `precio_item/3` de `calcular_linea/5`; comparar factura 2 y 3 con cuentas manuales |
| 3 | Validación de venta | Rechazar si cantidad inválida, stock insuficiente o crédito restringido | Sumar stock por línea por separado permitiría sobreventa repetida del mismo producto | Acumular cantidades por producto y componentes de kit antes de comparar inventario |
| 4 | Emisión en API | Transacción con stock y consecutivo | Concurrencia entre dos ventas puede dejar stock negativo | Bloqueo advisory de transacción, condiciones `stock >= cantidad` y rollback |
| 5 | Pruebas del entregable | Pruebas plunit y Postman | La ejecución real depende de SWI-Prolog y acceso a Neon | Ejecutar con el grupo y registrar capturas/logs; nunca inventar resultados |

## Evidencia pendiente

- Capturas de terminal con resultados plunit y pruebas Postman.
- Capturas de resultados reales de facturas 2 y 3.
- Tres errores reales observados durante ejecución en equipo y cómo se corrigieron.
- Confirmación de cada integrante de que puede explicar el código que aporta.
