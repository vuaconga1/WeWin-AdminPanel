// Node server only. Apps Script push sync; same GET contract for admin UI.
import "server-only";
import { createHmac, timingSafeEqual } from 'node:crypto';
import pg from 'pg';
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
const branches=['NTL','XVNT'];
const metrics=['revenue','registered','renewed','totalLead','current','mkt','missingDate','dated'];
const summaryKeys=['branch',...metrics,'readAt','today','weeks'];
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie, Authorization'}});
const maxBytes=4*1024*1024;

async function readBody(request){
  const reader=request.body?.getReader();
  if(!reader) return '';
  const chunks=[];let size=0;
  try {
    while(true){
      const {value,done}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>maxBytes){await reader.cancel();return null;}
      chunks.push(value);
    }
    return Buffer.concat(chunks,size).toString('utf8');
  } finally {reader.releaseLock();}
}

export async function receiveSaleSnapshot(request){
  if(request.method!=='POST')return reply({error:'POST required'},405);
  const branch=request.headers.get('x-sale-branch'), stamp=request.headers.get('x-sale-time')||'';
  const supplied=request.headers.get('x-sale-signature')||'';
  if(!branches.includes(branch)||!/^\d{10}$/.test(stamp)||!/^\w{64}$/.test(supplied)||Math.abs(Date.now()/1000-Number(stamp))>300)
    return reply({error:'Invalid signature'},403);
  const secret=process.env['SALE_SYNC_SECRET_'+branch];
  if(!secret || secret.length<32)return reply({error:'Missing server configuration'},503);
  const body=await readBody(request);
  if(body===null)return reply({error:'Payload too large'},413);
  const expected=createHmac('sha256',secret).update(branch+'\n'+stamp+'\n'+body).digest('hex');
  if(!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return reply({error:'Invalid signature'},403);
  let data;try {data=JSON.parse(body);} catch{return reply({error:'Invalid JSON'},400);}
  if(data?.branch!==branch || !Number.isFinite(Date.parse(data.readAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(data.today)
    || !metrics.every(k=>Number.isFinite(data[k])) || !['weeks','students','groups','staff','staffMix'].every(k=>Array.isArray(data[k])))
    return reply({error:'Invalid snapshot'},400);
  const snapshot=Object.fromEntries([...summaryKeys,'students','groups','staff','staffMix'].map(k=>[k,data[k]]));
  try {
    await pool.query(`INSERT INTO wewin_sale_snapshot (branch,read_at,payload) VALUES ($1,$2,$3::jsonb)
      ON CONFLICT (branch) DO UPDATE SET read_at=EXCLUDED.read_at,payload=EXCLUDED.payload
      WHERE wewin_sale_snapshot.read_at<EXCLUDED.read_at`,[branch,data.readAt,JSON.stringify(snapshot)]);
    return reply({ok:true,branch});
  } catch {return reply({error:'Snapshot store unavailable'},503);}
}

export function createSalePipelineHandler(isAdmin){
  if(typeof isAdmin!=='function')throw Error('Admin session check required');
  return async request=>{
    try {
      if(await isAdmin(request)!==true)return reply({error:'Admin access required'},403);
      if(request.method!=='GET')return reply({error:'GET required'},405);
      const args=new URL(request.url).searchParams, branch=args.get('branch'),mode=args.get('mode');
      if(!branches.includes(branch)||!['summary','detail'].includes(mode))return reply({error:'Invalid request'},400);
      const result=await pool.query('SELECT payload FROM wewin_sale_snapshot WHERE branch=$1',[branch]);
      if(!result.rowCount)return reply({error:'Chưa nhận dữ liệu của '+branch},503);
      const d=result.rows[0].payload;
      return reply(mode==='detail'?d:Object.fromEntries(summaryKeys.map(k=>[k,d[k]])));
    } catch {return reply({error:'Snapshot store unavailable'},503);}
  };
}
