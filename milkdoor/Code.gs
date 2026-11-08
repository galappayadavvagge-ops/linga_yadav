/**
 * MILKDOOR Google Sheets backend
 * 1) Open script.google.com and create a project.
 * 2) Paste this file, save, run setup() once, and approve permissions.
 * 3) Set ADMIN_KEY in Project Settings > Script Properties.
 * 4) Deploy > New deployment > Web app; Execute as Me; access Anyone.
 *
 * Public website can submit order requests. Customer/payment data is returned
 * only when the correct ADMIN_KEY is supplied.
 */
const PROP_SHEET_ID = 'MILKDOOR_SHEET_ID';
const PROP_ADMIN_KEY = 'ADMIN_KEY';
const SHEETS = {
  Orders: ['Created At','Order ID','Customer Name','Mobile','Area','Apartment','Flat','Milk','Quantity','Delivery Slot','Instructions','Status'],
  Customers: ['Customer ID','Name','Mobile','Area','Apartment','Flat','Milk','Quantity (L)','Delivery Slot','Status','Created At'],
  Deliveries: ['Date','Slot','Order ID','Customer Name','Apartment','Flat','Milk','Quantity','Delivered'],
  Payments: ['Month','Customer ID','Customer Name','Amount','Paid','Pending','Status','Updated At']
};

function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(PROP_SHEET_ID);
  let ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('MILKDOOR Business Records');
  props.setProperty(PROP_SHEET_ID, ss.getId());
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(SHEETS[name]);
      sh.setFrozenRows(1);
      sh.getRange(1,1,1,SHEETS[name].length).setFontWeight('bold');
    }
  });
  const first = ss.getSheets()[0];
  if (first.getName() === 'Sheet1' && first.getLastRow() === 0) ss.deleteSheet(first);
  Logger.log('MILKDOOR Sheet: ' + ss.getUrl());
  return ss.getUrl();
}

function doPost(e) {
  try {
    const data = parsePayload_(e);
    const action = String(data.action || 'order');
    const ss = getSheet_();
    if (action === 'order') {
      const required = ['name','phone','area','apartment','flat','milk','quantity','slot'];
      required.forEach(k => { if (!String(data[k] || '').trim()) throw new Error('Missing field: ' + k); });
      if (!/^\\d{10}$/.test(String(data.phone))) throw new Error('Invalid mobile number');
      const id = Utilities.getUuid();
      ss.getSheetByName('Orders').appendRow([
        new Date(), id, clean_(data.name), String(data.phone), clean_(data.area),
        clean_(data.apartment), clean_(data.flat), clean_(data.milk),
        clean_(data.quantity), clean_(data.slot), clean_(data.instructions), 'New'
      ]);
      return json_({ok:true, orderId:id});
    }
    requireAdmin_(data.adminKey);
    if (action === 'customer') {
      ss.getSheetByName('Customers').appendRow([
        Utilities.getUuid(), clean_(data.name), String(data.phone), clean_(data.area),
        clean_(data.apartment), clean_(data.flat), clean_(data.milk),
        Number(data.quantity || 1), clean_(data.slot), clean_(data.status || 'Active'), new Date()
      ]);
      return json_({ok:true});
    }
    if (action === 'payment') {
      ss.getSheetByName('Payments').appendRow([
        clean_(data.month), clean_(data.customerId), clean_(data.customerName),
        Number(data.amount || 0), Number(data.paid || 0), Number(data.pending || 0),
        clean_(data.status), new Date()
      ]);
      return json_({ok:true});
    }
    if (action === 'delivery') {
      ss.getSheetByName('Deliveries').appendRow([
        clean_(data.date), clean_(data.slot), clean_(data.orderId), clean_(data.customerName),
        clean_(data.apartment), clean_(data.flat), clean_(data.milk),
        Number(data.quantity || 0), clean_(data.delivered || 'No')
      ]);
      return json_({ok:true});
    }
    throw new Error('Unknown action');
  } catch (err) {
    return json_({ok:false, error:String(err.message || err)});
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    requireAdmin_(p.adminKey);
    const name = String(p.sheet || 'Orders');
    if (!SHEETS[name]) throw new Error('Unknown sheet');
    const values = getSheet_().getSheetByName(name).getDataRange().getDisplayValues();
    const rows = values.length > 1 ? values.slice(1).map(r => {
      const o = {};
      SHEETS[name].forEach((h,i) => o[h] = r[i] || '');
      return o;
    }) : [];
    const result = {ok:true, sheet:name, rows:rows};
    const callback = String(p.callback || '');
    if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return json_(result);
  } catch (err) {
    return json_({ok:false, error:String(err.message || err)});
  }
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
  if (!id) throw new Error('Run setup() first');
  return SpreadsheetApp.openById(id);
}
function requireAdmin_(key) {
  const saved = PropertiesService.getScriptProperties().getProperty(PROP_ADMIN_KEY);
  if (!saved || !key || String(key) !== saved) throw new Error('Admin access denied');
}
function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  return (e && e.parameter) || {};
}
function clean_(v) { return String(v == null ? '' : v).replace(/[\\r\\n]+/g,' ').trim(); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
