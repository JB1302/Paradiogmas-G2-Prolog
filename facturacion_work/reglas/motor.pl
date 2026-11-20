:- use_module(library(http/json)).
:- use_module(library(lists)).
:- dynamic producto/5, kit/2, cliente/4.

% El archivo original contiene solamente hechos; este motor agrega las reglas.
tarifa(general, 0.13).
tarifa(medicamento, 0.02).
tarifa(canasta, 0.01).
tarifa(exento, 0).
descuento_nivel(oro, 0.10).
descuento_nivel(plata, 0.05).
descuento_nivel(regular, 0).
descuento_volumen(C, 0.10) :- C >= 50, !.
descuento_volumen(C, 0.05) :- C >= 10, !.
descuento_volumen(_, 0).

% Recursion con deteccion de ciclos: el precio del kit incluye descuento del 5%.
precio_item(Cod, Precio, Categoria) :- precio_item(Cod, [], Precio, Categoria).
precio_item(Cod, _, Precio, Categoria) :- producto(Cod, _, Categoria, Precio, _), !.
precio_item(Cod, Vistos, Precio, general) :-
    \+ memberchk(Cod, Vistos), kit(Cod, Componentes), !,
    maplist(precio_componente([Cod|Vistos]), Componentes, Precios),
    sum_list(Precios, Suma), Precio is Suma * 0.95.
precio_componente(Vistos, Cod, Precio) :- precio_item(Cod, Vistos, Precio, _).

% Redondeo comercial (al colon) y descuentos secuenciales.
redondear(Valor, Redondeado) :- Redondeado is floor(Valor + 0.5).
calcular_linea(Nivel, Tipo, Cod, Cantidad, Resultado) :-
    precio_item(Cod, Precio, Categoria),
    descuento_volumen(Cantidad, DV), descuento_nivel(Nivel, DN),
    Bruto is Precio * Cantidad,
    DespuesVolumen is Bruto * (1-DV),
    BaseSinRedondear is DespuesVolumen * (1-DN),
    redondear(BaseSinRedondear, Base),
    ( Tipo == exonerado -> Tasa = 0 ; tarifa(Categoria, Tasa) ),
    redondear(Base * Tasa, IVA), Total is Base + IVA,
    redondear(Bruto-BaseSinRedondear, Descuento),
    Resultado = _{codigo:Cod,cantidad:Cantidad,precio_unitario:Precio,bruto:Bruto,
                  descuento_volumen:DV,descuento_cliente:DN,descuento:Descuento,
                  base:Base,tasa_iva:Tasa,iva:IVA,total:Total,
                  explicacion:"Se aplica primero el descuento por volumen y luego el descuento por nivel de cliente"}.

componentes(Cod, Cantidad, Componentes) :- componentes(Cod, Cantidad, [], Componentes).
componentes(Cod, Cantidad, _, [Cod-Cantidad]) :- producto(Cod,_,_,_,_), !.
componentes(Cod, Cantidad, Vistos, Resultado) :-
    \+ memberchk(Cod, Vistos), kit(Cod, Items), !,
    maplist(componentes_con_cantidad(Cantidad,[Cod|Vistos]), Items, Listas),
    append(Listas, Resultado).
componentes_con_cantidad(Cantidad,Vistos,Cod,Componentes) :- componentes(Cod,Cantidad,Vistos,Componentes).

validar_linea(L, Error) :-
    Cod = L.codigo, Cant = L.cantidad,
    ( \+ integer(Cant) ; Cant =< 0 ), !,
    format(string(Error), "Cantidad invalida para ~w: debe ser un entero mayor que cero", [Cod]).
validar_linea(L, Error) :-
    Cod = L.codigo, \+ precio_item(Cod,_,_), !,
    format(string(Error), "El producto o kit ~w no existe o contiene un ciclo", [Cod]).
validar_linea(_, _) :- fail.

stock_error(Cod-Cant, Error) :-
    producto(Cod, Nombre, _, _, Stock), Cant > Stock,
    format(string(Error), "Stock insuficiente para ~w (~w): disponibles ~w, solicitados ~w", [Cod,Nombre,Stock,Cant]).

reunir_componentes(Lineas, Agrupados) :-
    findall(Cod-Cant, (member(L,Lineas), integer(L.cantidad), L.cantidad>0,
                         componentes(L.codigo,L.cantidad,Partes), member(Cod-Cant,Partes)), Lista),
    findall(C-Suma, (setof(Cod, Cant^member(Cod-Cant,Lista), Codigos), member(C,Codigos),
                     findall(N,member(C-N,Lista), Cantidades),sum_list(Cantidades,Suma)), Agrupados), !.
reunir_componentes(_, []).

validar_factura(Cliente, Forma, Lineas, Errores) :-
    findall(E, (Lineas=[] , E="La factura no tiene lineas"), E0),
    findall(E, ( ( \+ cliente(Cliente,_,_,_) -> E="El cliente no existe" ; fail ) ), E1),
    findall(E, ((Forma \== contado, Forma \== credito), E="Forma de pago invalida"), E2),
    findall(E, (cliente(Cliente,_,Tipo,Nivel), Forma==credito,
                 (Tipo==consumidor_final ; Nivel==regular),
                 E="Credito no permitido para este tipo o nivel de cliente"), E3),
    findall(E, (member(L,Lineas),validar_linea(L,E)), E4),
    (E4=[] -> reunir_componentes(Lineas,Agrupados),findall(E,(member(P,Agrupados),stock_error(P,E)),E5) ; E5=[]),
    append([E0,E1,E2,E3,E4,E5], Errores).

% Los valores se obtienen siempre del motor, nunca se recalculan en JavaScript.
calcular_factura(Cliente, Forma, Lineas, Respuesta) :-
    validar_factura(Cliente,Forma,Lineas,Errores),
    (Errores \= [] ->
        Respuesta = _{estado:rechazada,errores:Errores,subtotal:0,iva:0,total:0,detalles:[]}
    ; cliente(Cliente,_,Tipo,Nivel),
      maplist(calcular_desde_dict(Nivel,Tipo),Lineas,Detalles),
      findall(B,(member(D,Detalles),B=D.base),Bases), sum_list(Bases,Subtotal),
      findall(I,(member(D,Detalles),I=D.iva),IVAs),sum_list(IVAs,IVA),
      Total is Subtotal+IVA,
      Respuesta = _{estado:emitida,errores:[],subtotal:Subtotal,iva:IVA,total:Total,detalles:Detalles} ).
calcular_desde_dict(Nivel,Tipo,L,D) :- calcular_linea(Nivel,Tipo,L.codigo,L.cantidad,D).

cargar_producto(P) :- atom_string(C,P.cod),atom_string(N,P.nombre),atom_string(T,P.categoria),assertz(producto(C,N,T,P.precio,P.stock)).
cargar_kit(K) :- atom_string(C,K.cod),maplist(atom_string,Kits,K.items),assertz(kit(C,Kits)).
cargar_cliente(C) :- atom_string(Id,C.id),atom_string(N,C.nombre),atom_string(T,C.tipo),atom_string(L,C.nivel),assertz(cliente(Id,N,T,L)).

normalizar_linea(L,_{codigo:Cod,cantidad:Cant}) :- atom_string(Cod,L.codigo),Cant=L.cantidad.

procesar :-
    read_string(user_input,_,Texto),
    atom_json_dict(Texto, Entrada, []),
    retractall(producto(_,_,_,_,_)),retractall(kit(_,_)),retractall(cliente(_,_,_,_)),
    maplist(cargar_producto,Entrada.productos),
    maplist(cargar_kit,Entrada.kits),
    maplist(cargar_cliente,Entrada.clientes),
    F=Entrada.factura,atom_string(Cliente,F.cliente_id),atom_string(Forma,F.forma_pago),
    maplist(normalizar_linea,F.lineas,Lineas),
    calcular_factura(Cliente,Forma,Lineas,Resultado),
    json_write_dict(current_output,Resultado),nl.

main :- catch(procesar, E, (message_to_string(E,Msg),json_write_dict(current_output,_{error:Msg}),nl,halt(1))),halt.
