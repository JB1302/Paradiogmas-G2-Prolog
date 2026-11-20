:- begin_tests(facturacion).
:- consult('../reglas/facturacion_datos.pl').
:- consult('../reglas/motor.pl').

test(tarifa_general) :- tarifa(general,0.13).
test(tarifa_medicamento) :- tarifa(medicamento,0.02).
test(tarifa_canasta) :- tarifa(canasta,0.01).
test(tarifa_exento) :- tarifa(exento,0).
test(volumen_menor_10) :- descuento_volumen(9,0).
test(volumen_10) :- descuento_volumen(10,0.05).
test(volumen_50) :- descuento_volumen(50,0.10).
test(nivel_oro) :- descuento_nivel(oro,0.10).
test(nivel_plata) :- descuento_nivel(plata,0.05).
test(nivel_regular) :- descuento_nivel(regular,0).
test(kit_simple) :- precio_item(k1,Precio,general), Precio =:= 452675.
test(kit_anidado) :- precio_item(k2,Precio,general), Precio =:= 453791.25.
test(factura2_control) :- calcular_factura(c2,contado,[_{codigo:p1,cantidad:10},_{codigo:p3,cantidad:2},_{codigo:p6,cantidad:1}],R),R.estado==emitida,R.subtotal=:=26400,R.iva=:=174,R.total=:=26574.
test(factura3_exonerada) :- calcular_factura(c3,contado,[_{codigo:p2,cantidad:1},_{codigo:p7,cantidad:10}],R),R.estado==emitida,R.iva=:=0,R.total=:=589950.
test(credito_rechazado) :- calcular_factura(c4,credito,[_{codigo:p4,cantidad:5}],R),R.estado==rechazada.
test(stock_insuficiente) :- calcular_factura(c2,contado,[_{codigo:p2,cantidad:20}],R),R.estado==rechazada.
test(sin_lineas) :- calcular_factura(c2,contado,[],R),R.estado==rechazada.
test(cantidad_cero) :- calcular_factura(c2,contado,[_{codigo:p1,cantidad:0}],R),R.estado==rechazada.
test(credito_consumidor) :- calcular_factura(c2,credito,[_{codigo:p1,cantidad:1}],R),R.estado==rechazada.
test(iva_cero_exento) :- calcular_linea(regular,contribuyente,p6,1,R),R.iva=:=0.
test(descuentos_secuenciales) :- calcular_linea(oro,contribuyente,p4,12,R),R.base=:=87210.
:- end_tests(facturacion).
