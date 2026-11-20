# Guion sugerido · 10 minutos (ajustar a los resultados reales)

1. **0:00–1:00. Contexto.** Explicar qué se factura y por qué Prolog contiene la lógica del negocio. Aclarar que es una simulación educativa.
2. **1:00–2:15. Arquitectura.** Mostrar diagrama `ARQUITECTURA.md`, flujo web → API → Neon / Prolog.
3. **2:15–4:30. Demo de factura válida.** Abrir navegador, seleccionar c2, agregar 10 p1, 2 p3 y 1 p6, emitir; cotejar subtotal 26 400, IVA 174, total 26 574. **Hacer sobre datos que no hayan gastado inventario relevante.**
4. **4:30–5:45. Demo rechazada.** Crear factura c4 crédito p4 cantidad 5; explicar rechazo y comprobar que no se altera stock.
5. **5:45–6:45. Kits y descuentos.** Explicar el kit k2, recursión y aplicación ordenada de descuentos con p7 y cliente c3.
6. **6:45–7:45. Reportes y retos.** Mostrar historia, IVA y nota de crédito.
7. **7:45–9:00. Tres retos reales.** Completar SOLO con problemas realmente encontrados y corregidos, incluyendo evidencias (por ejemplo, si sucedieron: entorno de SWI, conexión Neon, redondeo).
8. **9:00–9:40. IA y verificación.** Presentar bitácora real de prompts, desaciertos y comparación contra cálculo manual.
9. **9:40–10:00. Equipo y mejoras.** Mostrar Issues, PR y commits reales por integrante; mencionar como mejora autenticación y roles.

**Preguntas (3 min):** defender orden de descuentos, por qué el IVA se redondea por línea, por qué las transacciones evitan inconsistencias y qué hace `precio_item` cuando hay un kit dentro de otro.

**Pendiente:** convertir este esquema en diapositivas con capturas reales; no completar pruebas o experiencias ficticias.
