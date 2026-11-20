'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { Pool } = require('pg');
const app = express();
app.disable('x-powered-by');
app.use(express.json({limit:'100kb'}));
const origin = process.env.CORS_ORIGIN || `http://localhost:${process.env.PORT || 3000}`;
app.use((req,res,next)=>{
  res.set('Vary','Origin');
  if (req.headers.origin === origin) {
    res.set('Access-Control-Allow-Origin',origin);
    res.set('Access-Control-Allow-Headers','Content-Type');
    res.set('Access-Control-Allow-Methods','GET,POST,PUT,OPTIONS');
  }
  if(req.method === 'OPTIONS') return res.sendStatus(req.headers.origin === origin ? 204 : 403);
  next();
});
if (!process.env.DATABASE_URL) console.warn('Falta DATABASE_URL: configure api/.env');
const pool = new Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.DATABASE_URL?.includes('localhost') ? false : {rejectUnauthorized:true}});
const query = (sql,args=[]) => pool.query(sql,args);
const fail = (status, message) => Object.assign(new Error(message),{status});
const validId = s => typeof s==='string' && /^[a-zA-Z0-9_-]{1,50}$/.test(s);
const positiveInt = n => Number.isSafeInteger(n) && n>0;
const allowed = (v, options) => options.includes(v);

async function cargarContexto(db) {
  const [productos,kits,items,clientes] = await Promise.all([
    db.query('SELECT cod,nombre,categoria,precio,stock FROM productos ORDER BY cod'),
    db.query('SELECT cod,nombre FROM kits ORDER BY cod'),
    db.query('SELECT kit_cod,item_cod FROM kit_items ORDER BY kit_cod,item_cod'),
    db.query('SELECT id,nombre,tipo,nivel FROM clientes ORDER BY id')
  ]);
  return {productos:productos.rows, clientes:clientes.rows,
    kits:kits.rows.map(k=>({cod:k.cod,items:items.rows.filter(i=>i.kit_cod===k.cod).map(i=>i.item_cod)}))};
}
function motor(factura, contexto) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.env.SWIPL_BIN||'swipl',['-q','-f',path.resolve(__dirname,'../reglas/cli.pl')],{stdio:['pipe','pipe','pipe']});
    let stdout='',stderr='';
    const timer=setTimeout(()=>child.kill(),5000);
    child.stdout.on('data',b=>stdout+=b);
    child.stderr.on('data',b=>stderr+=b);
    child.on('error',e=>{clearTimeout(timer);reject(e)});
    child.on('close',code=>{
      clearTimeout(timer);
      try {const result=JSON.parse(stdout);if(code!==0 || result.error) throw Error(result.error||stderr||'Error de Prolog');resolve(result)}
      catch(e){reject(new Error('Fallo en el motor Prolog: '+e.message+' '+stderr.slice(0,300)))}
    });
    child.stdin.end(JSON.stringify({...contexto,factura}));
  });
}
function revisarLineas(lineas) {
  if(!Array.isArray(lineas)||lineas.length>20) throw fail(400,'Debe enviar un arreglo de hasta 20 líneas');
  for(const l of lineas) if(!l || !validId(l.codigo) || !Number.isSafeInteger(l.cantidad)) throw fail(400,'Cada línea necesita código válido y cantidad entera');
}

app.get('/api/salud',(_,res)=>res.json({status:'ok'}));
app.get('/api/productos',asyncHandler(async(req,res)=>{const c=await cargarContexto(pool);res.json([...c.productos,...c.kits.map(k=>({cod:k.cod,nombre:k.cod,categoria:'general',precio:null,stock:null,kit:true}))]);}));
app.post('/api/productos',asyncHandler(async(req,res)=>{
  const {cod,nombre,categoria,precio,stock}=req.body;
  if(!validId(cod)||typeof nombre!=='string'||!nombre.trim()||!allowed(categoria,['general','medicamento','canasta','exento'])||!positiveInt(precio)||!Number.isSafeInteger(stock)||stock<0) throw fail(400,'Datos de producto inválidos: precio mayor que 0, stock no negativo');
  const r=await query('INSERT INTO productos(cod,nombre,categoria,precio,stock) VALUES($1,$2,$3,$4,$5) RETURNING *',[cod,nombre.trim(),categoria,precio,stock]);res.status(201).json(r.rows[0]);
}));
app.put('/api/productos/:cod',asyncHandler(async(req,res)=>{
  const {nombre,categoria,precio,stock}=req.body;
  if(!validId(req.params.cod)||typeof nombre!=='string'||!nombre.trim()||!allowed(categoria,['general','medicamento','canasta','exento'])||!positiveInt(precio)||!Number.isSafeInteger(stock)||stock<0) throw fail(400,'Datos de producto inválidos');
  const r=await query('UPDATE productos SET nombre=$1,categoria=$2,precio=$3,stock=$4 WHERE cod=$5 RETURNING *',[nombre.trim(),categoria,precio,stock,req.params.cod]);if(!r.rowCount) throw fail(404,'Producto no encontrado');res.json(r.rows[0]);
}));
app.get('/api/clientes',asyncHandler(async(req,res)=>res.json((await query('SELECT * FROM clientes ORDER BY id')).rows)));
app.post('/api/clientes',asyncHandler(async(req,res)=>{
  const {id,nombre,tipo,nivel}=req.body;
  if(!validId(id)||typeof nombre!=='string'||!nombre.trim()||!allowed(tipo,['contribuyente','consumidor_final','exonerado'])||!allowed(nivel,['oro','plata','regular'])) throw fail(400,'Datos de cliente inválidos');
  const r=await query('INSERT INTO clientes(id,nombre,tipo,nivel) VALUES($1,$2,$3,$4) RETURNING *',[id,nombre.trim(),tipo,nivel]);res.status(201).json(r.rows[0]);
}));
app.get('/api/facturas',asyncHandler(async(req,res)=>{
  let sql='SELECT f.*,c.nombre AS cliente_nombre FROM facturas f JOIN clientes c ON c.id=f.cliente_id WHERE 1=1';const args=[];
  if(req.query.estado){if(!allowed(req.query.estado,['emitida','rechazada','anulada','pendiente']))throw fail(400,'Estado inválido');args.push(req.query.estado);sql+=` AND COALESCE(f.estado,'pendiente')=$${args.length}`;}
  if(req.query.cliente){args.push(req.query.cliente);sql+=` AND f.cliente_id=$${args.length}`;}
  res.json((await query(sql+' ORDER BY f.id DESC',args)).rows);
}));
app.get('/api/facturas/:id',asyncHandler(async(req,res)=>{
  const f=await query('SELECT * FROM facturas WHERE id=$1',[req.params.id]);if(!f.rowCount)throw fail(404,'Factura no encontrada');
  const lineas=await query('SELECT producto_cod AS codigo,cantidad,detalle FROM lineas WHERE factura_id=$1 ORDER BY id',[req.params.id]);res.json({...f.rows[0],lineas:lineas.rows});
}));
app.post('/api/facturas',asyncHandler(async(req,res)=>{
  const {cliente_id,forma_pago,lineas}=req.body;
  if(!validId(cliente_id)||!allowed(forma_pago,['contado','credito']))throw fail(400,'Cliente o forma de pago inválida');
  revisarLineas(lineas);
  const db=await pool.connect();
  try {await db.query('BEGIN');
    if(!(await db.query('SELECT 1 FROM clientes WHERE id=$1',[cliente_id])).rowCount)throw fail(400,'Cliente no existe');
    const disponibles=await cargarContexto(db);
    for(const l of lineas) if(!disponibles.productos.some(p=>p.cod===l.codigo)&&!disponibles.kits.some(k=>k.cod===l.codigo))throw fail(400,`Producto o kit ${l.codigo} no existe`);
    const f=(await db.query('INSERT INTO facturas(cliente_id,forma_pago) VALUES($1,$2) RETURNING id',[cliente_id,forma_pago])).rows[0];
    for(const l of lineas)await db.query('INSERT INTO lineas(factura_id,producto_cod,cantidad) VALUES($1,$2,$3)',[f.id,l.codigo,l.cantidad]);
    await db.query('COMMIT');res.status(201).json({id:f.id,estado:'pendiente'});
  }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}
}));

// Bloqueo de transaccion: evita ventas simultaneas con stock insuficiente.
app.post('/api/facturas/:id/emitir',asyncHandler(async(req,res)=>{
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(827461)');
    const f=await db.query('SELECT * FROM facturas WHERE id=$1 FOR UPDATE',[req.params.id]);
    if(!f.rowCount)throw fail(404,'Factura no encontrada');
    if(f.rows[0].estado==='emitida'||f.rows[0].estado==='anulada')throw fail(409,'La factura ya fue emitida; no puede volver a emitirse');
    const lineas=(await db.query('SELECT producto_cod AS codigo,cantidad FROM lineas WHERE factura_id=$1 ORDER BY id',[req.params.id])).rows;
    const factura={cliente_id:f.rows[0].cliente_id,forma_pago:f.rows[0].forma_pago,lineas};
    const contexto=await cargarContexto(db);
    const result=await motor(factura,contexto);
    let consecutivo=null;
    if(result.estado==='emitida') {
      const cantidades=new Map();
      const kits=new Map(contexto.kits.map(k=>[k.cod,k.items]));
      const recorrer=(cod,cant,vistos=[])=>{
        if(vistos.includes(cod))throw fail(400,'Kit con referencia circular');
        if(kits.has(cod))kits.get(cod).forEach(c=>recorrer(c,cant,[...vistos,cod]));
        else cantidades.set(cod,(cantidades.get(cod)||0)+cant);
      };
      for(const l of lineas)recorrer(l.codigo,l.cantidad);
      for(const [cod,cant] of cantidades){
        const r=await db.query('UPDATE productos SET stock=stock-$1 WHERE cod=$2 AND stock >= $1 RETURNING cod',[cant,cod]);
        if(!r.rowCount)throw fail(409,`El stock cambió durante la emisión: ${cod}`);
      }
      consecutivo=(await db.query('UPDATE consecutivos SET ultimo=ultimo+1 WHERE id=1 RETURNING ultimo')).rows[0].ultimo;
    }
    await db.query('UPDATE facturas SET estado=$1,errores=$2,subtotal=$3,iva=$4,total=$5,consecutivo=$6 WHERE id=$7',[
      result.estado,JSON.stringify(result.errores),result.subtotal,result.iva,result.total,consecutivo,req.params.id]);
    for(let i=0;i<lineas.length;i++) if(result.detalles[i]) await db.query('UPDATE lineas SET detalle=$1 WHERE factura_id=$2 AND producto_cod=$3 AND cantidad=$4 AND id=(SELECT id FROM lineas WHERE factura_id=$2 AND producto_cod=$3 AND cantidad=$4 ORDER BY id OFFSET $5 LIMIT 1)',[JSON.stringify(result.detalles[i]),req.params.id,lineas[i].codigo,lineas[i].cantidad,lineas.slice(0,i).filter(x=>x.codigo===lineas[i].codigo&&x.cantidad===lineas[i].cantidad).length]);
    await db.query('COMMIT');res.json({...result,consecutivo});
  }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}
}));
app.post('/api/facturas/:id/anular',asyncHandler(async(req,res)=>{
  if(typeof req.body?.motivo !== 'string'||!req.body.motivo.trim())throw fail(400,'Indique el motivo de la nota de crédito');
  const db=await pool.connect();
  try{await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(827461)');
    const f=await db.query('SELECT * FROM facturas WHERE id=$1 FOR UPDATE',[req.params.id]);
    if(!f.rowCount)throw fail(404,'Factura no encontrada');
    if(f.rows[0].estado!=='emitida')throw fail(409,'Solo se puede anular una factura emitida');
    const lines=(await db.query('SELECT producto_cod AS codigo,cantidad FROM lineas WHERE factura_id=$1',[req.params.id])).rows;
    const c=await cargarContexto(db), kits=new Map(c.kits.map(k=>[k.cod,k.items]));
    const volver=(cod,cant,v=[])=>{if(v.includes(cod))throw fail(400,'Kit circular');return kits.has(cod)?kits.get(cod).flatMap(x=>volver(x,cant,[...v,cod])):[[cod,cant]]};
    for(const l of lines)for(const [cod,cant] of volver(l.codigo,l.cantidad))await db.query('UPDATE productos SET stock=stock+$1 WHERE cod=$2',[cant,cod]);
    await db.query("UPDATE facturas SET estado='anulada',anulada_en=now() WHERE id=$1",[req.params.id]);
    const nota=(await db.query('INSERT INTO notas_credito(factura_id,motivo) VALUES($1,$2) RETURNING *',[req.params.id,req.body.motivo.trim()])).rows[0];
    await db.query('COMMIT');res.status(201).json(nota);
  }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}
}));
app.get('/api/reportes',asyncHandler(async(req,res)=>{
  const sum=(await query("SELECT COALESCE(SUM(subtotal),0)::bigint AS ventas_netas,COALESCE(SUM(iva),0)::bigint AS iva_por_pagar,COALESCE(SUM(total),0)::bigint AS ventas_con_iva,COUNT(*)::int AS facturas_emitidas FROM facturas WHERE estado='emitida'")).rows[0];
  const cant=(await query("SELECT l.producto_cod AS codigo,SUM(l.cantidad)::int AS unidades FROM lineas l JOIN facturas f ON f.id=l.factura_id WHERE f.estado='emitida' GROUP BY l.producto_cod ORDER BY unidades DESC, codigo")).rows;
  const ivaTarifa=(await query("SELECT COALESCE(detalle->>'tasa_iva','0') AS tarifa,COALESCE(SUM((detalle->>'iva')::numeric),0) AS iva FROM lineas l JOIN facturas f ON f.id=l.factura_id WHERE f.estado='emitida' AND l.detalle IS NOT NULL GROUP BY detalle->>'tasa_iva' ORDER BY tarifa")).rows;
  const sec=(await query('SELECT ultimo+1 AS siguiente FROM consecutivos WHERE id=1')).rows[0];
  res.json({...sum,unidades_por_producto:cant,producto_mas_vendido:cant[0]||null,iva_por_tarifa:ivaTarifa,siguiente_consecutivo:sec.siguiente});
}));
app.use(express.static(path.resolve(__dirname,'../web')));
app.get('/',(_,res)=>res.sendFile(path.resolve(__dirname,'../web/index.html')));
function asyncHandler(fn){return(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
app.use((err,req,res,next)=>{
  if(err.code==='23505')return res.status(409).json({error:'Ya existe un registro con ese identificador'});
  if(err.code==='23503'||err.code==='23514'||err.code==='22P02')return res.status(400).json({error:'Datos inválidos o referencia inexistente'});
  console.error(err);res.status(err.status||500).json({error:err.status?err.message:'Error interno del servidor'});
});
const port=Number(process.env.PORT||3000);
if(require.main===module)app.listen(port,()=>console.log(`Facturación: http://localhost:${port}`));
module.exports=app;
