// Thêm vào dự án dashboard đã có readBranch_ và BRANCH.
// Các hàm kết thúc bằng "_" chỉ chạy phía máy chủ.
function pushSaleSnapshot_() {
  const cfg = PropertiesService.getScriptProperties().getProperties();
  const url = String(cfg.SALE_SYNC_URL || '').trim();
  const key = cfg.SALE_SYNC_SECRET || '';
  if (!/^https:\/\/[^\s?#@]+\/api\/internal\/sale-pipeline\/sync$/.test(url) || key.length < 32)
    throw Error('Kiểm tra SALE_SYNC_URL và SALE_SYNC_SECRET của cơ sở.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const data = readBranch_('detail');
    const body = JSON.stringify(data);
    const stamp = String(Math.floor(Date.now()/1000));
    const message = BRANCH + '\n' + stamp + '\n' + body;
    const signature = Utilities.computeHmacSha256Signature(message,key,Utilities.Charset.UTF_8)
      .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    const response = UrlFetchApp.fetch(url,{method:'post',contentType:'application/json; charset=utf-8',
      headers:{'X-Sale-Branch':BRANCH,'X-Sale-Time':stamp,'X-Sale-Signature':signature},
      payload:body,muteHttpExceptions:true,followRedirects:false});
    if (response.getResponseCode()!==200) throw Error('Máy chủ trả HTTP '+response.getResponseCode()+'. Kiểm tra route, khóa hoặc cấu hình lưu trữ.');
    let ack;
    try { ack=JSON.parse(response.getContentText()); } catch (_) {}
    if (!ack || ack.ok!==true || ack.branch!==BRANCH) throw Error('Website chưa xác nhận nhận dữ liệu.');
  } finally { lock.releaseLock(); }
}

function enableSaleSync_() {
  pushSaleSnapshot_();
  if (!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='pushSaleSnapshot_'))
    ScriptApp.newTrigger('pushSaleSnapshot_').timeBased().everyMinutes(5).create();
}

function disableSaleSync_() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='pushSaleSnapshot_')
    .forEach(t=>ScriptApp.deleteTrigger(t));
}
