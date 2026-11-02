import { firebaseConfig, OWNER_UID, EMAIL_DOMAIN } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, updateDoc, onSnapshot, collection, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ========== Firebase ========== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }

/* ========== constants ========== */
const S = { in: 540, b1: 720, b2: 960, out: 1260, grace: 15 };
const W = { in: [510, 719], out1: [720, 780], in2: [930, 1259], out: [1260, 1439] };
const FIELDS = ['in', 'out1', 'in2', 'out'];
const FMAP = { in: 'p1', out1: 'p2', in2: 'p3', out: 'p4' };
const FL = { in: 'الحضور', out1: 'خروج البريك', in2: 'العودة', out: 'الانصراف' };
const ACT = { in: 'تسجيل حضور', out1: 'خروج للبريك', in2: 'عودة من البريك', out: 'تسجيل انصراف' };
const STL = { present: 'حاضر', late: 'متأخر', half: 'نصف يوم', absent: 'غائب', missing: 'لم يسجّل', pending: 'بانتظار الحضور', off: 'إجازة', future: '', none: '', break: 'في البريك', done: 'انصرف', inactive: 'موقوف' };
const I = {
  check: "M5 12l5 5L20 7",
  face: "M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0",
  finger: "M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6M12 11v2a14 14 0 0 0 2.5 8M8 15a18 18 0 0 0 1.8 6M4.9 19a22 22 0 0 1-.9-7v-1a8 8 0 0 1 12-6.95",
  bell: "M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1",
  clock: "M12 7v5l3 3M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0",
  coffee: "M3 10h14v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM16.75 12a2.5 2.5 0 0 1 0 5M8 3a2.4 2.4 0 0 0-1 2a2.4 2.4 0 0 0 1 2M12 3a2.4 2.4 0 0 0-1 2a2.4 2.4 0 0 0 1 2",
  login: "M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M21 12H8l3-3M11 15l-3-3",
  logout: "M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12l-3-3M18 15l3-3",
  alert: "M12 9v4M12 16h.01M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0",
  userplus: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M16 19h6M19 16v6M6 21v-2a4 4 0 0 1 4-4h4",
  x: "M18 6L6 18M6 6l12 12",
  right: "M9 6l6 6-6 6", left: "M15 6l-6 6 6 6",
  camera: "M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0",
  pin: "M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0M17.66 16.66L13.41 20.9a2 2 0 0 1-2.83 0l-4.24-4.24a8 8 0 1 1 11.32 0",
  lock: "M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM8 11V7a4 4 0 1 1 8 0v4",
  device: "M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM11 4h2M12 17v.01"
};
const ic = (n, s = 20, w = 1.8) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]}"/></svg>`;
const MI = { face: ['face', 'الوجه'], finger: ['finger', 'البصمة'] };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);

/* ========== formatting + Riyadh time ========== */
const nf = new Intl.NumberFormat('ar-SA'), nf2 = new Intl.NumberFormat('ar-SA', { minimumIntegerDigits: 2 });
const ar = n => nf.format(n);
const tm = m => { if (m == null) return '—'; m = Math.floor(m); const h = Math.floor(m / 60), mm = m % 60; return ar(h % 12 || 12) + ':' + nf2.format(mm) + ' ' + (h < 12 ? 'ص' : 'م'); };
const dur = m => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), x = m % 60; return h ? ar(h) + ' س ' + ar(x) + ' د' : ar(x) + ' د'; };
const pad = n => String(n).padStart(2, '0');
const OFF = 10800000, DAY = 86400000;
const dayIdx = ms => Math.floor((ms + OFF) / DAY);
const riyMin = ms => Math.floor(((ms + OFF) % DAY) / 60000);
const nowMin = () => ((Date.now() + OFF) % DAY) / 60000;
const keyOfIdx = i => { const d = new Date(i * DAY); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
const idxOfKey = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / DAY; };
const todayIdx = () => dayIdx(Date.now());
const todayKey = () => keyOfIdx(todayIdx());
const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const today0 = () => fromKey(todayKey());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const isToday = k => k === todayKey();
const RZ = { timeZone: 'Asia/Riyadh' };
const gNow = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', ...RZ });
const hNow = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric', ...RZ });
const mFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { month: 'long', year: 'numeric' });
const msFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { month: 'short' });
const hmFmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { month: 'long', year: 'numeric' });
const dFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { weekday: 'long', day: 'numeric', month: 'long' });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = n => String(n || '؟').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join(' ');

/* ========== state ========== */
let me = null, meEmp = null, isOwner = false, view = null, busy = false;
let emps = [];
let recs = {};
let settings = {};
let unsubs = [];
let firstDays = true;
const notified = new Set();

const empById = id => emps.find(e => e.id === id) || (meEmp && meEmp.id === id ? meEmp : null);
const getRec = (emp, key) => (recs[emp.id] && recs[emp.id][key]) || null;

function docToRec(d) {
  const r = { m: {}, ph: {}, geo: {} };
  for (const f of FIELDS) {
    const k = FMAP[f], v = d[k];
    if (v && v.toMillis) { r[f] = riyMin(v.toMillis()); r.m[f] = d[k + '_m']; if (d[k + '_ph']) r.ph[f] = d[k + '_ph']; if (d[k + '_geo']) r.geo[f] = d[k + '_geo']; }
  }
  return (r.in == null && r.in2 == null) ? null : r;
}
function empFromDoc(s) {
  const d = s.data();
  const created = d.createdAt && d.createdAt.toMillis ? keyOfIdx(dayIdx(d.createdAt.toMillis())) : todayKey();
  return { id: s.id, name: d.name || '', num: d.num || '', active: d.active !== false, cred: d.cred || null, mustChange: !!d.mustChange, start: d.start || created };
}

/* ========== day logic ========== */
function status(emp, key) {
  const d = fromKey(key), t = today0();
  if (key < emp.start) return 'none';
  if (d > t) return 'future';
  if (d.getDay() === 5) return 'off';
  const r = getRec(emp, key), isT = isToday(key), n = nowMin();
  if (!r) { if (isT) return n > S.in + S.grace ? 'missing' : 'pending'; return 'absent'; }
  if (r.in == null) return 'half';
  if (!isT && r.in2 == null) return 'half';
  const late = r.in > S.in + S.grace || (r.in2 != null && r.in2 > S.b2 + S.grace);
  return late ? 'late' : 'present';
}
function liveStatus(emp) {
  if (!emp.active) return 'inactive';
  const key = todayKey(), st = status(emp, key);
  if (['off', 'missing', 'pending', 'none'].includes(st)) return st === 'none' ? 'pending' : st;
  const r = getRec(emp, key);
  if (r.out != null) return 'done';
  if (r.out1 != null && r.in2 == null) return 'break';
  return st;
}
function worked(r, key) {
  if (!r) return 0; const isT = isToday(key), n = nowMin();
  let a = 0, b = 0;
  if (r.in != null) a = (r.out1 != null ? r.out1 : (isT ? Math.min(n, S.b1) : S.b1)) - r.in;
  if (r.in2 != null) b = (r.out != null ? r.out : (isT ? Math.min(n, S.out) : S.out)) - r.in2;
  return Math.max(0, a) + Math.max(0, b);
}
function nextField(r) { if (!r) return 'in'; for (const f of FIELDS) if (r[f] == null) return f; return null; }
function nextTxt(r, n) { for (const f of FIELDS) { if (W[f][0] > n && !(r && r[f] != null)) return FL[f] + ' يفتح الساعة ' + tm(W[f][0]); } return ''; }
function allowed(r, n) {
  n = Math.floor(n); const nx = nextTxt(r, n);
  for (const f of FIELDS) {
    if (n < W[f][0] || n > W[f][1]) continue;
    if (r && r[f] != null) return { f: null, msg: 'تم ' + FL[f] + ' الساعة ' + tm(r[f]), sub: 'لا يمكن تسجيل ' + FL[f] + ' مرة أخرى' + (nx ? ' · ' + nx : '') };
    if (f === 'out1' && !(r && r.in != null)) return { f: null, msg: 'لا يوجد حضور مسجّل اليوم', sub: 'خروج البريك يحتاج حضوراً مسجّلاً' + (nx ? ' · ' + nx : '') };
    if (f === 'out' && !(r && (r.in != null || r.in2 != null))) return { f: null, msg: 'لا يوجد حضور مسجّل اليوم', sub: 'لا يمكن الانصراف بدون حضور' };
    return { f };
  }
  return { f: null, msg: 'التسجيل مغلق الآن', sub: nx || 'انتهت أوقات التسجيل لليوم' };
}
function stats(emp, from, to) {
  const t = today0(), end = to < t ? to : t; const o = { att: 0, abs: 0, late: 0, half: 0, hrs: 0, days: 0 };
  for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
    const k = keyOf(d), s = status(emp, k);
    if (s === 'present' || s === 'late' || s === 'half') { o.att++; o.hrs += worked(getRec(emp, k), k); }
    if (s === 'late') o.late++; if (s === 'half') o.half++;
    if (s === 'absent' || s === 'missing') o.abs++;
    if (['present', 'late', 'half', 'absent', 'missing'].includes(s)) o.days++;
  }
  o.pct = o.days ? Math.round(o.att / o.days * 100) : 0; o.hrs = Math.round(o.hrs / 60); return o;
}
function periodRange(p) {
  const t = today0();
  if (p === 'week') { const s = addDays(t, -t.getDay()); return [s, addDays(s, 6), 'الأسبوع الحالي · من ' + dFmt.format(s)]; }
  if (p === 'month') return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 0), mFmt.format(t) + ' · ' + hmFmt.format(t)];
  return [new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31), 'سنة ' + String(t.getFullYear()).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[x]) + ' حتى اليوم'];
}

/* ========== motion helpers ========== */
function countTo(el, to, fmt = ar, d0 = 900) {
  if (!el) return; const from = +(el.dataset.v || 0); el.dataset.v = to;
  if (RM) { el.textContent = fmt(to); return; }
  const s = performance.now();
  (function f(t) { const k = Math.min((t - s) / d0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); })(s);
}
function movePill(seg) { const p = seg && seg.querySelector('.pill'), b = seg && seg.querySelector('[aria-pressed="true"]'); if (!p || !b) return; p.style.width = b.offsetWidth + 'px'; p.style.left = b.offsetLeft + 'px'; }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }

/* ========== toasts + system notifications ========== */
function toast(kind, title, body, who) {
  const box = $('toasts'); const el = document.createElement('div'); el.className = 'toast';
  const icn = { ok: 'check', bad: 'alert', warn: 'bell', info: 'coffee', gold: 'bell' }[kind] || 'bell';
  el.innerHTML = `<div class="ico i-${kind}">${ic(icn, 18)}</div><div class="tx"><small>أساس العارض · ${esc(who || 'الآن')}</small><b>${esc(title)}</b>${body ? esc(body) : ''}</div>`;
  box.prepend(el); vibrate(kind === 'bad' ? [60, 40, 60] : 40);
  while (box.children.length > 3) box.lastChild.remove();
  setTimeout(() => { el.classList.add('leave'); setTimeout(() => el.remove(), 400); }, 5200);
}
async function sysNotify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) reg.showNotification(title, { body, icon: 'logo-192.png', badge: 'logo-192.png', lang: 'ar', dir: 'rtl', tag: title + body });
    else new Notification(title, { body, icon: 'logo-192.png' });
  } catch (e) { }
}
function alertBoth(kind, title, body, who) { toast(kind, title, body, who); if (document.hidden || isOwner) sysNotify(title, body); }

/* ========== clock ========== */
function tickClock() { $('bigClock').textContent = new Date().toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', second: '2-digit', ...RZ }); }
function setDates() { const d = new Date(); $('gDate').textContent = gNow.format(d); $('hDate').textContent = hNow.format(d) + ' هـ'; }

/* ========== views ========== */
function show(id) {
  ['vLogin', 'vPass', 'vMsg', 'vEmp', 'vOwn'].forEach(v => { $(v).hidden = v !== id; });
  view = id;
  $('chrome').hidden = id === 'vLogin';
}

/* ----- login ----- */
function renderLogin() {
  show('vLogin');
  const f = $('loginForm'), u = $('lgUser'), p = $('lgPass'), er = $('lgErr'), b = $('lgBtn');
  u.oninput = p.oninput = () => er.textContent = '';
  f.onsubmit = async e => {
    e.preventDefault();
    const user = u.value.trim(), pass = p.value;
    if (!user) { er.textContent = 'اكتب رقمك الوظيفي أو إيميلك'; u.focus(); return; }
    if (!pass) { er.textContent = 'اكتب كلمة السر'; p.focus(); return; }
    const email = user.includes('@') ? user : toEmail(user);
    b.disabled = true; b.textContent = 'جارٍ الدخول…';
    try { await signInWithEmailAndPassword(auth, email, pass); p.value = ''; }
    catch (err) { er.textContent = authMsg(err); }
    finally { b.disabled = false; b.textContent = 'دخول'; }
  };
}
const toEmail = num => String(num).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g, '').toLowerCase() + '@' + EMAIL_DOMAIN;
function authMsg(e) {
  const c = e && e.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'الرقم أو كلمة السر غير صحيحة';
  if (c.includes('too-many-requests')) return 'محاولات كثيرة، انتظر دقائق ثم حاول مرة أخرى';
  if (c.includes('network')) return 'لا يوجد اتصال بالإنترنت';
  if (c.includes('weak-password')) return 'كلمة السر لازم تكون ٦ حروف أو أرقام على الأقل';
  if (c.includes('email-already-in-use')) return 'هذا الرقم الوظيفي مستخدم بالفعل';
  if (c.includes('requires-recent-login')) return 'سجّل خروج وادخل مرة أخرى ثم غيّر كلمة السر';
  return 'حدث خطأ، حاول مرة أخرى';
}

/* ----- first-login password change ----- */
function renderPass() {
  show('vPass');
  $('psName').textContent = meEmp.name;
  const f = $('passForm'), a = $('psNew'), b = $('psNew2'), er = $('psErr'), btn = $('psBtn');
  a.oninput = b.oninput = () => er.textContent = '';
  f.onsubmit = async e => {
    e.preventDefault();
    if (a.value.length < 6) { er.textContent = 'كلمة السر لازم تكون ٦ حروف أو أرقام على الأقل'; a.focus(); return; }
    if (a.value !== b.value) { er.textContent = 'كلمتا السر غير متطابقتين'; b.focus(); return; }
    btn.disabled = true;
    try { await updatePassword(auth.currentUser, a.value); await updateDoc(doc(db, 'employees', me.uid), { mustChange: false }); toast('ok', 'تم حفظ كلمة السر الجديدة', '', 'حسابك'); }
    catch (err) { er.textContent = authMsg(err); }
    finally { btn.disabled = false; }
  };
}
function renderMsg(title, body) { show('vMsg'); $('msgTitle').textContent = title; $('msgBody').textContent = body; document.querySelector('#vMsg .loader').hidden = !title.startsWith('جارٍ'); }

/* ----- shift band ----- */
function bandHTML() {
  const pos = v => ((v - S.in) / (S.out - S.in) * 100);
  return `<div class="band"><div class="now" data-now><span></span></div>
   <div class="bar"><div class="w1" style="flex:3">الفترة الأولى</div><div class="bk" style="flex:4">${ic('coffee', 14)} بريك</div><div class="w2" style="flex:5">الفترة الثانية</div></div>
   <div class="ticks"><span style="right:0;transform:none">${tm(S.in)}</span><span style="right:${pos(S.b1)}%">${tm(S.b1)}</span><span style="right:${pos(S.b2)}%">${tm(S.b2)}</span><span style="right:auto;left:0;transform:none">${tm(S.out)}</span></div></div>`;
}
function updateBands() {
  const n = nowMin(), p = Math.min(Math.max((n - S.in) / (S.out - S.in), 0), 1) * 100;
  document.querySelectorAll('[data-now]').forEach(el => { el.style.right = p + '%'; el.querySelector('span').textContent = 'الآن ' + tm(n); });
}

/* ----- profile: stats + calendar + year ----- */
function mountProfile(root, emp, withPhotos) {
  const t = today0(); const st = { p: 'month', y: t.getFullYear(), m: t.getMonth(), sel: null };
  root.innerHTML = `
   <div class="tabs" role="group" aria-label="الفترة"><span class="pill"></span>
    <button data-p="week" aria-pressed="false">أسبوع</button><button data-p="month" aria-pressed="true">شهر</button><button data-p="year" aria-pressed="false">سنة</button></div>
   <div class="statrow">
    <div class="donut"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" pathLength="100"/></svg>
     <div class="c"><b class="num" data-k="pct">٠٪</b><span>الالتزام</span></div></div>
    <div class="kpis">
     <div class="kpi"><div class="l"><i style="background:var(--ok)"></i>أيام الحضور</div><b class="num" data-k="att">٠</b></div>
     <div class="kpi"><div class="l"><i style="background:var(--bad)"></i>أيام الغياب</div><b class="num" data-k="abs">٠</b></div>
     <div class="kpi"><div class="l"><i style="background:var(--warn)"></i>مرات التأخير</div><b class="num" data-k="late">٠</b></div>
     <div class="kpi"><div class="l">${ic('clock', 13)}ساعات العمل</div><b class="num" data-k="hrs">٠</b></div>
    </div></div>
   <div class="period" data-k="per"></div>
   <div class="calhead"><button class="navb" data-nav="1" aria-label="الشهر السابق">${ic('right', 16)}</button>
     <div style="text-align:center"><b data-k="mon"></b><span class="hj" data-k="hmon"></span></div>
     <button class="navb" data-nav="-1" aria-label="الشهر التالي">${ic('left', 16)}</button></div>
   <div class="cal" data-k="cal"></div>
   <div class="legend"><span><i style="background:var(--ok)"></i>حضور</span><span><i style="background:var(--warn)"></i>تأخير</span><span><i style="background:var(--half)"></i>نصف يوم</span><span><i style="background:var(--bad)"></i>غياب</span><span><i style="border:1px dashed var(--muted)"></i>إجازة</span></div>
   <div class="daydetail" data-k="det"><span class="muted">اضغط على أي يوم لعرض أوقات البصمة</span></div>
   <div class="calhead" style="margin-top:22px"><b>الالتزام خلال السنة</b><span class="muted small">نسبة الحضور لكل شهر</span></div>
   <div class="yearbars" data-k="year"></div>`;
  const q = k => root.querySelector(`[data-k="${k}"]`);
  const tabs = root.querySelector('.tabs');
  function renderStats() {
    const [a, b, label] = periodRange(st.p), o = stats(emp, a, b);
    countTo(q('att'), o.att); countTo(q('abs'), o.abs); countTo(q('late'), o.late); countTo(q('hrs'), o.hrs);
    countTo(q('pct'), o.pct, v => ar(v) + '٪');
    const fg = root.querySelector('.donut .fg'); fg.style.stroke = o.pct >= 90 ? 'var(--ok)' : o.pct >= 75 ? 'var(--warn)' : 'var(--bad)';
    fg.style.strokeDashoffset = 100; requestAnimationFrame(() => requestAnimationFrame(() => fg.style.strokeDashoffset = 100 - o.pct));
    q('per').textContent = label + (o.half ? ' · نصف يوم: ' + ar(o.half) : '');
    movePill(tabs);
  }
  function renderCal() {
    const first = new Date(st.y, st.m, 1), last = new Date(st.y, st.m + 1, 0);
    q('mon').textContent = mFmt.format(first);
    q('hmon').textContent = hmFmt.format(first) === hmFmt.format(last) ? hmFmt.format(first) : hmFmt.format(first).split(' ')[0] + ' – ' + hmFmt.format(last);
    let h = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(x => `<span class="wd">${x}</span>`).join('');
    for (let i = 0; i < first.getDay(); i++) h += '<span></span>';
    let k = 0;
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(st.y, st.m, d), key = keyOf(dt), s = status(emp, key);
      const cls = 'day ' + s + (isToday(key) ? ' today' : '') + (st.sel === key ? ' sel' : '');
      const tip = STL[s] ? `${dFmt.format(dt)} · ${STL[s]}` : dFmt.format(dt);
      h += `<button class="${cls}" data-day="${key}" aria-label="${tip}" style="animation-delay:${RM ? 0 : k++ * 22}ms">${ar(d)}</button>`;
    }
    q('cal').innerHTML = h;
    root.querySelector('[data-nav="1"]').disabled = keyOf(new Date(st.y, st.m, 0)) < emp.start;
    root.querySelector('[data-nav="-1"]').disabled = st.y === t.getFullYear() && st.m === t.getMonth();
  }
  function renderDet() {
    if (!st.sel) return; const s = status(emp, st.sel), r = getRec(emp, st.sel), d = fromKey(st.sel);
    let h = `<b>${dFmt.format(d)}</b> · <span class="chip c-${s}">${STL[s] || '—'}</span>`;
    if (r) {
      h += `<div class="muted small" style="margin-top:4px">` + FIELDS.map(f => `${FL[f]} ${tm(r[f])}`).join(' · ') + ` · صافي ${dur(worked(r, st.sel))}</div>`;
      if (withPhotos) {
        const ph = FIELDS.filter(f => r.ph[f]);
        if (ph.length) h += `<div class="photos">` + ph.map(f => `<figure><img src="${r.ph[f]}" alt="صورة ${FL[f]}"><figcaption>${FL[f]}</figcaption></figure>`).join('') + `</div>`;
      }
    }
    else if (s === 'off') h += `<div class="muted small">يوم الجمعة إجازة أسبوعية</div>`;
    else if (s === 'absent') h += `<div class="muted small">لا توجد بصمة في هذا اليوم</div>`;
    q('det').innerHTML = h;
  }
  function renderYear() {
    const y = t.getFullYear(); let h = '';
    for (let m = 0; m < 12; m++) {
      const a = new Date(y, m, 1), b = new Date(y, m + 1, 0);
      const fut = a > t || keyOf(b) < emp.start; const o = fut ? null : stats(emp, a, b);
      const has = o && o.days; const pct = has ? o.pct : 0; const hh = has ? Math.max(6, pct) : 6;
      const c = !has ? 'empty' : pct >= 90 ? '' : pct >= 75 ? 'mid' : 'low';
      h += `<div class="yb" title="${msFmt.format(a)}"><em>${has ? ar(pct) + '٪' : ''}</em><div class="b ${c}" style="height:${hh}%;animation-delay:${RM ? 0 : m * 60}ms"></div><span>${msFmt.format(a)}</span></div>`;
    }
    q('year').innerHTML = h;
  }
  root.onclick = e => {
    const pb = e.target.closest('[data-p]');
    if (pb) { tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === pb)); st.p = pb.dataset.p; renderStats(); return; }
    const nb = e.target.closest('[data-nav]');
    if (nb && !nb.disabled) { const d = new Date(st.y, st.m - (+nb.dataset.nav), 1); st.y = d.getFullYear(); st.m = d.getMonth(); renderCal(); return; }
    const db_ = e.target.closest('[data-day]');
    if (db_) { st.sel = db_.dataset.day; root.querySelectorAll('.day.sel').forEach(x => x.classList.remove('sel')); db_.classList.add('sel'); renderDet(); }
  };
  renderStats(); renderCal(); renderYear();
  root._refresh = () => { renderStats(); renderCal(); renderDet(); renderYear(); };
}

/* ========== employee ========== */
function renderEmp() {
  show('vEmp');
  const emp = meEmp; const v = $('vEmp');
  v.innerHTML = `<div class="grid two">
   <section class="card reveal">
    <div class="greet" id="greet"></div>
    <div class="phase" id="phase"></div>
    ${bandHTML()}
    <div class="stage" style="margin-top:22px">
     <div class="scan" id="scan">
      <svg class="ring" viewBox="0 0 208 208"><circle class="track" cx="104" cy="104" r="98"/><circle class="orbit" cx="104" cy="104" r="98" pathLength="100"/><circle class="prog" id="prog" cx="104" cy="104" r="98" pathLength="100"/></svg>
      <div class="core" id="core"><span class="face">${ic('face', 70, 1.2)}</span></div>
      <div class="laser"></div>
      <div class="tick"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path pathLength="30" d="M5 12l5 5L20 7"/></svg></div>
     </div>
     <div class="next-label" id="nextLbl"></div>
     <div class="hint" id="hint"></div>
     <div class="actions">
      <button class="btn primary" id="bFace">${ic('camera', 18)} بصمة الوجه</button>
      <button class="btn ghost" id="bFp"${window.__bio ? '' : ' hidden'}>${ic('finger', 18)} بصمة الإصبع</button>
     </div>
     <div class="devline" id="devline"></div>
     <div class="slots" id="slots"></div>
     <div class="timer"><span class="muted small">مدة العمل اليوم</span><b class="num" id="wt">٠٠:٠٠:٠٠</b></div>
    </div>
   </section>
   <section class="card reveal" style="animation-delay:.12s">
    <h2>سجلّي <span class="muted small" style="font-family:var(--f-body)">${esc(emp.name)} · ${esc(emp.num)}</span></h2>
    <div id="myProf"></div>
   </section></div>`;
  mountProfile($('myProf'), emp, false);
  bindScan(); updateEmpLive(true); updateBands();
}
const myRec = () => getRec(meEmp, todayKey());
function updateEmpLive(full) {
  if (view !== 'vEmp' || !meEmp) return;
  const emp = meEmp, r = myRec(), n = nowMin(), key = todayKey();
  const hr = Math.floor(n / 60);
  const g = $('greet'); if (!g) return;
  g.textContent = (hr < 12 ? 'صباح الخير' : 'مساء الخير') + '، ' + emp.name.split(' ')[0];
  const nf0 = nextField(r), off = fromKey(key).getDay() === 5;
  let txt, col; const left = x => dur(x - n);
  if (off) { txt = 'اليوم إجازة أسبوعية'; col = 'var(--muted)'; }
  else if (!r) { if (n < S.in) { txt = 'الدوام يبدأ بعد ' + left(S.in); col = 'var(--muted)'; } else if (n < W.in[1]) { txt = 'متأخر عن الحضور منذ ' + dur(n - S.in); col = 'var(--bad)'; } else if (n < S.b2) { txt = 'فاتك تسجيل الحضور · العودة تفتح ' + tm(W.in2[0]); col = 'var(--bad)'; } else { txt = 'لم تسجّل اليوم'; col = 'var(--bad)'; } }
  else if (r.in != null && r.out1 == null && r.in2 == null) { txt = 'أنت في الفترة الأولى · البريك بعد ' + left(S.b1); col = 'var(--ok)'; if (n >= S.b1) { txt = 'حان وقت البريك'; col = 'var(--warn)'; } }
  else if (r.in2 == null) { if (n < S.b2) { txt = 'أنت في البريك · العودة بعد ' + left(S.b2); col = 'var(--info)'; } else { txt = 'متأخر عن العودة منذ ' + dur(n - S.b2); col = 'var(--bad)'; } }
  else if (r.out == null) { txt = n < S.out ? 'الفترة الثانية · الانصراف بعد ' + left(S.out) : 'انتهى وقت الدوام · سجّل انصرافك'; col = n < S.out ? 'var(--ok)' : 'var(--warn)'; }
  else { txt = 'انتهى دوامك · صافي ' + dur(worked(r, key)); col = 'var(--gold)'; }
  const ph = $('phase'); ph.style.color = col; ph.innerHTML = `<span class="dot"></span><span>${txt}</span>`;
  if (full && !busy) {
    const A = off ? { f: null } : allowed(r, n), all = !nf0;
    $('nextLbl').textContent = off ? 'لا يوجد دوام اليوم' : all ? 'اكتمل تسجيل اليوم' : A.f ? ACT[A.f] : A.msg;
    $('hint').textContent = off ? '' : all ? 'تم تسجيل البصمات الأربع' : A.f ? ACT[A.f] + ' متاح حتى ' + tm(W[A.f][1]) : A.sub;
    ['bFace', 'bFp'].forEach(id => $(id).disabled = !A.f);
    $('scan').classList.toggle('locked', !A.f);
    $('devline').innerHTML = window.__bio ? (emp.cred ? `${ic('device', 13)} بصمة جهازك مربوطة بحسابك` : `${ic('device', 13)} أول بصمة إصبع هتربط هذا الجوال بحسابك`) : `${ic('device', 13)} بصمة الإصبع غير متاحة على هذا الجهاز`;
    $('slots').innerHTML = FIELDS.map(f => {
      const v = r && r[f] != null; const late = v && ((f === 'in' && r.in > S.in + S.grace) || (f === 'in2' && r.in2 > S.b2 + S.grace));
      const missed = !v && !off && n > W[f][1];
      const m = v && r.m[f] ? MI[r.m[f]] : null;
      const cls = v ? (late ? 'late' : 'done') : missed ? 'missed' : (f === A.f ? 'next' : '');
      return `<div class="slot ${cls}" data-slot="${f}"><div class="l">${FL[f]}</div><div class="v num">${v ? tm(r[f]) : missed ? 'فات' : '—'}</div><div class="m">${m ? ic(m[0], 11) + m[1] : v ? '' : 'من ' + tm(W[f][0])}</div></div>`;
    }).join('');
  }
  const wtEl = $('wt');
  if (wtEl) { let s = Math.max(0, Math.floor(worked(r, key) * 60)); wtEl.textContent = nf2.format(Math.floor(s / 3600)) + ':' + nf2.format(Math.floor(s % 3600 / 60)) + ':' + nf2.format(s % 60); }
}

function bindScan() {
  const bFace = $('bFace'), bFp = $('bFp'), cam = $('cam');
  bFace.onclick = () => {
    if (busy) return; const A = allowed(myRec(), nowMin()); if (!A.f) { runFail(A.msg); return; }
    cam.value = ''; cam.click();
  };
  cam.onchange = async () => {
    const f = cam.files && cam.files[0]; if (!f) return;
    let thumb = null;
    try {
      const url = URL.createObjectURL(f); const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement('canvas'), s = 200; c.width = c.height = s; const x = c.getContext('2d');
      const k = Math.max(s / img.width, s / img.height), w = img.width * k, h = img.height * k; x.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      thumb = c.toDataURL('image/jpeg', .7); URL.revokeObjectURL(url);
    } catch (e) { runFail('تعذّر قراءة الصورة، حاول مرة أخرى'); return; }
    $('core').innerHTML = `<img src="${thumb}" alt="">`;
    doPunch('face', thumb, 'جارٍ التحقق من الوجه…');
  };
  bFp.onclick = async () => {
    if (busy || bFp.disabled) return;
    const A = allowed(myRec(), nowMin()); if (!A.f) { runFail(A.msg); return; }
    busy = true; $('scan').classList.add('busy'); $('hint').textContent = 'ضع إصبعك على حساس الجوال أو استخدم Face ID…';
    const ok = await bioVerify(); busy = false;
    if (ok === true) doPunch('finger', null, 'جارٍ التسجيل…');
    else { $('scan').classList.remove('busy'); runFail(ok === 'other' ? 'هذا الجهاز غير مسجّل لحسابك، تواصل مع المالك' : 'لم يتم التحقق من البصمة'); }
  };
}
async function doPunch(method, thumb, label) {
  busy = true; const scan = $('scan'), prog = $('prog');
  scan.classList.remove('ok', 'fail', 'locked'); scan.classList.add('busy'); $('hint').textContent = label;
  const t0 = performance.now(); let done = false;
  (function f(t) { if (done) return; const k = Math.min((t - t0) / 1600, .92); prog.style.strokeDashoffset = 100 - k * 100; requestAnimationFrame(f); })(t0);
  const [res] = await Promise.all([punch(method, thumb), new Promise(r => setTimeout(r, RM ? 0 : 1300))]);
  done = true;
  if (res.ok) {
    prog.style.strokeDashoffset = 0;
    scan.classList.remove('busy'); scan.classList.add('ok'); vibrate([30, 50, 90]);
    $('hint').textContent = `تم ${FL[res.f]} ${tm(res.t)}` + (res.late ? ' · تأخير ' + dur(res.t - (res.f === 'in' ? S.in : S.b2)) : '');
    toast(res.late ? 'warn' : 'ok', `${FL[res.f]} ${tm(res.t)}`, `تم التحقق ب${MI[method][1]} · وصل إشعار للمالك`, 'تسجيلك');
    setTimeout(() => { scan.classList.remove('ok'); prog.style.strokeDashoffset = 100; $('core').innerHTML = `<span class="face">${ic('face', 70, 1.2)}</span>`; busy = false; updateEmpLive(true); const sl = document.querySelector(`[data-slot="${res.f}"]`); sl && sl.classList.add('flash'); }, 1700);
  } else { busy = false; runFail(res.msg); setTimeout(() => { $('core').innerHTML = `<span class="face">${ic('face', 70, 1.2)}</span>`; updateEmpLive(true); }, 800); }
}
function runFail(msg) {
  const scan = $('scan'); if (!scan) return; scan.classList.remove('busy'); scan.classList.add('fail'); vibrate([60, 40, 60]);
  $('hint').textContent = msg;
  setTimeout(() => { scan.classList.remove('fail'); $('prog').style.strokeDashoffset = 100; }, 700);
}
function getGeo() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('nogeo'));
    navigator.geolocation.getCurrentPosition(p => res({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) }), rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  });
}
function distM(a, b) {
  const R = 6371000, t = x => x * Math.PI / 180; const dl = t(b.lat - a.lat), dg = t(b.lng - a.lng);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function punch(method, thumb) {
  const r = myRec(); const A = allowed(r, nowMin());
  if (!A.f) return { ok: false, msg: A.msg };
  if (!navigator.onLine) return { ok: false, msg: 'لا يوجد اتصال بالإنترنت' };
  let geo = null; const fence = settings.geo;
  try { geo = await getGeo(); } catch (e) { if (fence) return { ok: false, msg: 'فعّل الموقع (GPS) واسمح للتطبيق باستخدامه' }; }
  if (fence && geo) { const d = distM(geo, fence); if (d - Math.min(geo.acc, 100) > fence.r) return { ok: false, msg: 'أنت خارج نطاق موقع العمل · ' + ar(Math.round(d)) + ' م' }; }
  const k = FMAP[A.f]; const data = { [k]: serverTimestamp(), [k + '_m']: method };
  if (thumb) data[k + '_ph'] = thumb; if (geo) data[k + '_geo'] = geo;
  const ref = doc(db, 'days', me.uid + '_' + todayIdx());
  const timeout = new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 15000));
  try {
    if (r) await Promise.race([updateDoc(ref, data), timeout]);
    else await Promise.race([setDoc(ref, { uid: me.uid, day: todayIdx(), ...data }), timeout]);
  } catch (e) {
    const c = e && e.code || '';
    if (c.includes('permission-denied')) return { ok: false, msg: 'التسجيل غير مسموح الآن، تأكد من الوقت أو تواصل مع المالك' };
    if (c === 'timeout' || c.includes('unavailable')) return { ok: false, msg: 'الاتصال ضعيف، حاول مرة أخرى' };
    return { ok: false, msg: 'تعذّر الحفظ، حاول مرة أخرى' };
  }
  const t = Math.floor(nowMin());
  const late = (A.f === 'in' && t > S.in + S.grace) || (A.f === 'in2' && t > S.b2 + S.grace);
  return { ok: true, f: A.f, t, late };
}

/* ----- device biometrics (WebAuthn) ----- */
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function bioVerify() {
  const ch = crypto.getRandomValues(new Uint8Array(32));
  try {
    if (!meEmp.cred) {
      const c = await navigator.credentials.create({
        publicKey: {
          challenge: ch, rp: { name: 'أساس العارض' },
          user: { id: new TextEncoder().encode(me.uid), name: meEmp.num || me.uid, displayName: meEmp.name },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000
        }
      });
      await updateDoc(doc(db, 'employees', me.uid), { cred: b64(c.rawId) });
      toast('ok', 'تم ربط بصمتك بهذا الجوال', 'البصمات القادمة ستُطابق عليها', 'الأمان');
      return true;
    }
    await navigator.credentials.get({ publicKey: { challenge: ch, allowCredentials: [{ type: 'public-key', id: unb64(meEmp.cred) }], userVerification: 'required', timeout: 60000 } });
    return true;
  } catch (e) {
    if (e && (e.name === 'NotAllowedError' || e.name === 'AbortError')) return false;
    return meEmp.cred ? 'other' : false;
  }
}

/* employee reminders while app is open */
function checkEmpReminders() {
  if (!meEmp || isOwner) return;
  const key = todayKey(); if (fromKey(key).getDay() === 5) return;
  const n = nowMin(), r = myRec();
  const rule = (id, cond, fn) => { const k = key + id; if (cond && !notified.has(k)) { notified.add(k); fn(); } };
  const noIn = !r, noBack = r && r.out1 != null && r.in2 == null;
  rule('in5', noIn && n >= S.in + 5 && n < S.in + 10, () => alertBoth('warn', 'لم تسجّل حضورك بعد', 'الدوام بدأ ' + tm(S.in) + ' · سجّل الآن قبل احتساب التأخير', 'تنبيه لك'));
  rule('in10', noIn && n >= S.in + 10 && n < S.in + 15, () => alertBoth('bad', 'تذكير أخير', 'باقي ٥ دقائق على نهاية فترة السماح', 'تنبيه لك'));
  rule('b-5', noBack && n >= S.b2 - 5 && n < S.b2, () => alertBoth('info', 'العودة من البريك بعد ٥ دقائق', 'لا تنسَ تسجيل بصمة العودة', 'تنبيه لك'));
  rule('b5', noBack && n >= S.b2 + 5 && n < S.b2 + 15, () => alertBoth('warn', 'لم تسجّل عودتك من البريك', 'سجّل الآن قبل احتساب التأخير', 'تنبيه لك'));
}

/* ========== owner ========== */
function ownerEvents() {
  const key = todayKey(), n = nowMin(), list = [];
  emps.filter(e => e.active).forEach(e => {
    const r = getRec(e, key);
    if (r) FIELDS.forEach(f => { if (r[f] != null) { const late = (f === 'in' && r.in > S.in + S.grace) || (f === 'in2' && r.in2 > S.b2 + S.grace); list.push({ emp: e.id, f, t: r[f], method: r.m[f], late }); } });
    if (fromKey(key).getDay() !== 5 && !r && n > S.in + S.grace) list.push({ emp: e.id, miss: 'in', t: S.in + S.grace });
    if (r && r.out1 != null && r.in2 == null && n > S.b2 + S.grace) list.push({ emp: e.id, miss: 'in2', t: S.b2 + S.grace });
  });
  return list.sort((a, b) => b.t - a.t);
}
function evHTML(x, isNew) {
  const e = empById(x.emp); if (!e) return '';
  if (x.miss) return `<div class="ev${isNew ? ' new' : ''}"><div class="ico i-bad">${ic('alert', 16)}</div><div class="tx">${esc(e.name)} ${x.miss === 'in' ? 'لم يسجّل حضور' : 'لم يعد من البريك'}<small>${tm(x.t)}</small></div></div>`;
  const kind = x.late ? 'warn' : x.f === 'out1' || x.f === 'in2' ? 'info' : x.f === 'out' ? 'gold' : 'ok';
  const icon = x.f === 'in' ? 'login' : x.f === 'out' ? 'logout' : 'coffee';
  const m = x.method ? MI[x.method][1] : '';
  return `<div class="ev${isNew ? ' new' : ''}"><div class="ico i-${kind}">${ic(icon, 16)}</div><div class="tx">${esc(e.name)} · ${FL[x.f]}${x.late ? ' متأخر' : ''}<small>${tm(x.t)}${m ? ' · بصمة ' + m : ''}</small></div></div>`;
}
function renderFeed(isNew) {
  const el = $('feed'); if (!el) return;
  const l = ownerEvents();
  el.innerHTML = l.length ? l.map((x, i) => evHTML(x, isNew && i === 0)).join('') : '<p class="muted">لا توجد إشعارات اليوم بعد.</p>';
}
function renderOwner() {
  show('vOwn');
  const v = $('vOwn'); const key = todayKey();
  const list = emps.slice().sort((a, b) => (b.active - a.active) || String(a.num).localeCompare(String(b.num), 'en', { numeric: true }));
  const act = list.filter(e => e.active); const ls = act.map(liveStatus);
  const cnt = s => ls.filter(x => s.includes(x)).length;
  const [ma, mb] = periodRange('month');
  const notif = ('Notification' in window) ? Notification.permission : 'unsupported';
  v.innerHTML = `
  <div class="okpis reveal">
   <div class="okpi g"><div class="l">${ic('login', 14)}حاضر الآن</div><b class="num" data-c="${cnt(['present', 'late'])}">٠</b></div>
   <div class="okpi r"><div class="l">${ic('alert', 14)}لم يسجّل</div><b class="num" data-c="${cnt(['missing'])}">٠</b></div>
   <div class="okpi a"><div class="l">${ic('clock', 14)}متأخر</div><b class="num" data-c="${cnt(['late'])}">٠</b></div>
   <div class="okpi i"><div class="l">${ic('coffee', 14)}في البريك</div><b class="num" data-c="${cnt(['break'])}">٠</b></div>
  </div>
  <div class="card reveal" style="margin-bottom:16px;animation-delay:.06s"><h2>دوام اليوم <span class="muted small" style="font-family:var(--f-body)">${ar(act.length)} موظف</span></h2>${bandHTML()}</div>
  <div class="grid two">
   <section class="card reveal" style="animation-delay:.1s">
    <h2>الموظفون <span class="muted small" style="font-family:var(--f-body)">التزام الشهر</span></h2>
    <div id="empList">${list.length ? list.map(e => {
      const s = liveStatus(e), r = getRec(e, key), o = stats(e, ma, mb);
      const line = !e.active ? 'الحساب موقوف' : r ? FIELDS.filter(f => r[f] != null).map(f => FL[f] + ' ' + tm(r[f])).join(' · ') : (s === 'off' ? 'إجازة أسبوعية' : 'لا توجد بصمة اليوم');
      const av = r && FIELDS.map(f => r.ph[f]).filter(Boolean).pop();
      return `<button class="emp" data-emp="${e.id}"><div class="av">${av ? `<img src="${av}" alt="">` : esc(initials(e.name))}</div><div class="info"><b>${esc(e.name)} <span class="muted small">#${esc(e.num)}</span></b><span>${line}</span></div><span class="chip c-${s}">${STL[s]}</span><div class="mini"><small class="num">${o.days ? ar(o.pct) + '٪' : '—'}</small><div class="t"><div data-w="${o.pct}" style="background:${o.pct >= 90 ? 'var(--ok)' : o.pct >= 75 ? 'var(--warn)' : 'var(--bad)'}"></div></div></div></button>`;
    }).join('') : `<div class="empty">${ic('userplus', 28, 1.4)}<b>أضف أول موظف</b><span>اكتب الاسم والرقم الوظيفي وكلمة سر مؤقتة، وابعتها للموظف مع رابط التطبيق.</span></div>`}</div>
    <form class="form addform" id="addForm" novalidate>
     <div class="fl"><label for="nName">اسم الموظف</label><input id="nName" autocomplete="off" placeholder="أحمد محمد"></div>
     <div class="fl"><label for="nNum">الرقم الوظيفي</label><input id="nNum" autocomplete="off" inputmode="numeric" placeholder="1001"></div>
     <div class="fl"><label for="nPass">كلمة سر مؤقتة</label><input id="nPass" autocomplete="new-password" placeholder="٦ أرقام على الأقل"></div>
     <button class="btn primary" type="submit" id="addBtn">${ic('userplus', 16)} إضافة موظف</button>
     <div class="err" id="addErr"></div>
    </form>
   </section>
   <section class="card reveal" style="animation-delay:.16s">
    <h2>الإشعارات <span style="color:var(--gold)">${ic('bell', 18)}</span></h2>
    <div class="feed" id="feed"></div>
    <div class="row-btns">${notif === 'default' ? `<button class="btn ghost" id="notifBtn">${ic('bell', 14)} تفعيل إشعارات الجوال</button>` : notif === 'granted' ? `<span class="muted small">${ic('check', 14)} إشعارات الجوال مفعّلة</span>` : notif === 'denied' ? `<span class="muted small">الإشعارات مرفوضة، فعّلها من إعدادات المتصفح</span>` : ''}</div>
   </section>
  </div>
  <section class="card reveal" style="margin-top:16px;animation-delay:.2s">
   <h2>موقع العمل</h2>
   <p class="muted small" style="margin:0 0 10px">${settings.geo ? `البصمة مسموحة داخل ${ar(settings.geo.r)} متر من الموقع المحدد فقط.` : 'لم يتم تحديد موقع، البصمة مسموحة من أي مكان ويُحفظ موقع الموظف مع كل تسجيل.'}</p>
   <div class="form">
    <div class="fl" style="flex:0 1 160px;min-width:120px"><label for="gR">النطاق بالمتر</label><input id="gR" inputmode="numeric" value="${settings.geo ? settings.geo.r : 150}"></div>
    <button class="btn ghost" id="gSet" type="button">${ic('pin', 16)} اجعل موقعي الحالي موقع العمل</button>
    ${settings.geo ? `<button class="btn ghost" id="gClear" type="button">إلغاء التحديد</button>` : ''}
    <div class="err" id="gErr"></div>
   </div>
  </section>
  <section class="card reveal" style="margin-top:16px;animation-delay:.24s">
   <h2>إعدادات الدوام</h2>
   <div class="rules">
    <div>الحضور<b>${tm(S.in)}</b></div><div>بداية البريك<b>${tm(S.b1)}</b></div><div>العودة<b>${tm(S.b2)}</b></div><div>الانصراف<b>${tm(S.out)}</b></div>
    <div>نافذة الحضور<b>${tm(W.in[0])} – ${tm(W.in[1])}</b></div><div>نافذة البريك<b>${tm(W.out1[0])} – ${tm(W.out1[1])}</b></div><div>نافذة العودة<b>${tm(W.in2[0])} – ${tm(W.in2[1])}</b></div><div>نافذة الانصراف<b>${tm(W.out[0])} – ${tm(W.out[1])}</b></div>
    <div>فترة السماح<b>${ar(S.grace)} دقيقة</b></div><div>الإجازة الأسبوعية<b>الجمعة</b></div>
   </div>
  </section>`;
  v.querySelectorAll('[data-c]').forEach(b => countTo(b, +b.dataset.c));
  requestAnimationFrame(() => requestAnimationFrame(() => v.querySelectorAll('[data-w]').forEach(d => d.style.transform = `scaleX(${d.dataset.w / 100})`)));
  renderFeed(false); updateBands();
  $('empList').onclick = e => { const b = e.target.closest('[data-emp]'); if (b) openSheet(b.dataset.emp); };
  const nb = $('notifBtn'); if (nb) nb.onclick = async () => { try { await Notification.requestPermission(); } catch (e) { } renderOwner(); };
  bindAdd(); bindGeo();
}
function bindAdd() {
  const n = $('nName'), u = $('nNum'), p = $('nPass'), er = $('addErr'), btn = $('addBtn');
  [n, u, p].forEach(x => x.oninput = () => er.textContent = '');
  $('addForm').onsubmit = async e => {
    e.preventDefault();
    const name = n.value.trim(), num = u.value.trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), pass = p.value;
    if (name.length < 2) { er.textContent = 'اكتب اسم الموظف'; n.focus(); return; }
    if (!/^[A-Za-z0-9]{2,20}$/.test(num)) { er.textContent = 'الرقم الوظيفي أرقام أو حروف إنجليزية فقط'; u.focus(); return; }
    if (emps.some(x => String(x.num) === num)) { er.textContent = 'هذا الرقم الوظيفي مستخدم بالفعل'; u.focus(); return; }
    if (pass.length < 6) { er.textContent = 'كلمة السر المؤقتة ٦ حروف أو أرقام على الأقل'; p.focus(); return; }
    btn.disabled = true; btn.textContent = 'جارٍ الإضافة…';
    try {
      const sec = getSecondary();
      const cred = await createUserWithEmailAndPassword(sec.auth, toEmail(num), pass);
      await setDoc(doc(db, 'employees', cred.user.uid), { name, num, active: true, mustChange: true, cred: null, createdAt: serverTimestamp(), start: todayKey() });
      await signOut(sec.auth);
      toast('ok', 'تمت إضافة ' + name, 'يدخل بالرقم ' + num + ' وكلمة السر المؤقتة', 'الإدارة');
      n.value = u.value = p.value = '';
    } catch (err) { er.textContent = authMsg(err); }
    finally { btn.disabled = false; btn.innerHTML = `${ic('userplus', 16)} إضافة موظف`; }
  };
}
let secondary = null;
function getSecondary() { if (!secondary) { const a = initializeApp(firebaseConfig, 'secondary'); secondary = { app: a, auth: getAuth(a) }; } return secondary; }
function bindGeo() {
  const er = $('gErr');
  $('gSet').onclick = async () => {
    const r = parseInt(String($('gR').value).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10);
    if (!(r >= 30 && r <= 5000)) { er.textContent = 'اكتب نطاقاً بين ٣٠ و٥٠٠٠ متر'; return; }
    er.textContent = 'جارٍ تحديد موقعك…';
    try { const g = await getGeo(); await setDoc(doc(db, 'settings', 'main'), { geo: { lat: g.lat, lng: g.lng, r } }, { merge: true }); er.textContent = ''; toast('ok', 'تم حفظ موقع العمل', 'دقة الموقع ' + ar(g.acc) + ' متر', 'الإعدادات'); }
    catch (e) { er.textContent = 'تعذّر تحديد الموقع، فعّل GPS واسمح للتطبيق'; }
  };
  const c = $('gClear'); if (c) c.onclick = async () => { try { await setDoc(doc(db, 'settings', 'main'), { geo: null }, { merge: true }); } catch (e) { er.textContent = 'تعذّر الحفظ'; } };
}
function checkOwnerAlerts() {
  if (!isOwner) return;
  const key = todayKey(); if (fromKey(key).getDay() === 5) return;
  const n = nowMin();
  emps.filter(e => e.active && e.start <= key).forEach(e => {
    const r = getRec(e, key);
    const k1 = key + e.id + 'miss-in', k2 = key + e.id + 'miss-back';
    if (!r && n >= S.in + S.grace && n < W.in[1] && !notified.has(k1)) { notified.add(k1); alertBoth('bad', e.name + ' لم يسجّل حضور', 'تجاوز ' + tm(S.in + S.grace), 'إشعار للمالك'); }
    if (r && r.out1 != null && r.in2 == null && n >= S.b2 + S.grace && n < W.in2[1] && !notified.has(k2)) { notified.add(k2); alertBoth('warn', e.name + ' لم يعد من البريك', 'تجاوز ' + tm(S.b2 + S.grace), 'إشعار للمالك'); }
  });
}

/* ----- owner: employee sheet ----- */
let sheetEmp = null;
function openSheet(id) {
  const emp = empById(id); if (!emp) return; sheetEmp = id;
  const sh = $('sheet'), sc = $('scrim'), inner = $('sheetInner');
  const r = getRec(emp, todayKey()); const av = r && FIELDS.map(f => r.ph[f]).filter(Boolean).pop();
  inner.innerHTML = `<div class="sh-head"><div class="av">${av ? `<img src="${av}" alt="">` : esc(initials(emp.name))}</div><b>${esc(emp.name)} <span class="muted small">#${esc(emp.num)}</span></b>
    <button class="navb" id="shClose" aria-label="إغلاق">${ic('x', 16)}</button></div>
    <div class="row-btns" style="margin:-4px 0 14px">
      <button class="btn ghost" id="shActive">${emp.active ? 'إيقاف الحساب' : 'تفعيل الحساب'}</button>
      ${emp.cred ? `<button class="btn ghost" id="shDev">${ic('device', 14)} إلغاء ربط الجهاز</button>` : `<span class="muted small" style="align-self:center">${ic('device', 13)} لم يربط جهازاً بعد</span>`}
    </div>
    <div class="err" id="shErr"></div>
    <div class="card" style="padding:16px"><div id="shProf"></div></div>`;
  sh.hidden = false; sc.hidden = false;
  requestAnimationFrame(() => { sh.classList.add('on'); sc.classList.add('on'); });
  mountProfile($('shProf'), emp, true);
  $('shClose').onclick = closeSheet; sc.onclick = closeSheet; $('shClose').focus();
  $('shActive').onclick = async () => { try { await updateDoc(doc(db, 'employees', emp.id), { active: !emp.active }); closeSheet(); toast('ok', emp.active ? 'تم إيقاف حساب ' + emp.name : 'تم تفعيل حساب ' + emp.name, '', 'الإدارة'); } catch (e) { $('shErr').textContent = 'تعذّر الحفظ'; } };
  const dv = $('shDev'); if (dv) dv.onclick = async () => { try { await updateDoc(doc(db, 'employees', emp.id), { cred: null }); toast('ok', 'تم إلغاء ربط جهاز ' + emp.name, 'أول بصمة قادمة ستربط جهازه الجديد', 'الإدارة'); closeSheet(); } catch (e) { $('shErr').textContent = 'تعذّر الحفظ'; } };
}
function closeSheet() {
  const sh = $('sheet'), sc = $('scrim'); sheetEmp = null;
  sh.classList.remove('on'); sc.classList.remove('on'); setTimeout(() => { sh.hidden = true; sc.hidden = true; }, 450);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });

/* ========== data wiring ========== */
function stopAll() { unsubs.forEach(f => { try { f(); } catch (e) { } }); unsubs = []; emps = []; recs = {}; meEmp = null; settings = {}; firstDays = true; }
function onDays(snap) {
  const changes = firstDays ? [] : snap.docChanges();
  const prev = {};
  changes.forEach(c => { const d = c.doc.data(); const k = keyOfIdx(d.day); prev[c.doc.id] = (recs[d.uid] && recs[d.uid][k]) || null; });
  snap.docChanges().forEach(c => {
    const d = c.doc.data(); const k = keyOfIdx(d.day);
    recs[d.uid] = recs[d.uid] || {};
    if (c.type === 'removed') delete recs[d.uid][k]; else recs[d.uid][k] = docToRec(d);
  });
  if (isOwner && !firstDays) {
    changes.forEach(c => {
      if (c.type === 'removed') return; const d = c.doc.data(); if (d.day !== todayIdx()) return;
      const now = recs[d.uid][keyOfIdx(d.day)], was = prev[c.doc.id], e = empById(d.uid); if (!now || !e) return;
      FIELDS.forEach(f => {
        if (now[f] != null && (!was || was[f] == null) && now[f] >= nowMin() - 10) {
          const late = (f === 'in' && now.in > S.in + S.grace) || (f === 'in2' && now.in2 > S.b2 + S.grace);
          alertBoth(late ? 'warn' : 'ok', `${e.name} · ${FL[f]}${late ? ' متأخر' : ''}`, `${tm(now[f])} · بصمة ${MI[now.m[f]] ? MI[now.m[f]][1] : ''}`, 'إشعار للمالك');
        }
      });
    });
  }
  firstDays = false;
  refresh();
}
let refreshT = null;
function refresh() {
  clearTimeout(refreshT);
  refreshT = setTimeout(() => {
    const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest('form,.form');
    if (view === 'vOwn') { if (typing) renderFeed(true); else renderOwner(); if (sheetEmp) { const p = $('shProf'); p && p._refresh && p._refresh(); } }
    else if (view === 'vEmp') { updateEmpLive(true); const p = $('myProf'); p && p._refresh && p._refresh(); }
  }, 120);
}

onAuthStateChanged(auth, u => {
  stopAll();
  if (!u) { me = null; isOwner = false; renderLogin(); return; }
  me = u; isOwner = u.uid === OWNER_UID;
  $('userChip').textContent = isOwner ? 'المالك' : '';
  unsubs.push(onSnapshot(doc(db, 'settings', 'main'), s => { settings = s.exists() ? s.data() : {}; if (view === 'vOwn') refresh(); }, () => { }));
  const yearStart = idxOfKey(today0().getFullYear() + '-01-01');
  if (isOwner) {
    renderMsg('جارٍ تحميل البيانات…', '');
    let gotEmps = false;
    unsubs.push(onSnapshot(collection(db, 'employees'), s => {
      emps = s.docs.map(empFromDoc); if (!gotEmps) { gotEmps = true; renderOwner(); } else refresh();
    }, err => renderMsg('تعذّر تحميل الموظفين', 'تأكد من لصق قواعد الحماية في Firebase وأن رقم المالك صحيح.')));
    unsubs.push(onSnapshot(query(collection(db, 'days'), where('day', '>=', yearStart)), onDays, () => { }));
  } else {
    renderMsg('جارٍ تحميل حسابك…', '');
    let first = true;
    unsubs.push(onSnapshot(doc(db, 'employees', u.uid), s => {
      if (!s.exists()) { renderMsg('حسابك غير مسجّل كموظف', 'تواصل مع المالك لتفعيل حسابك.'); return; }
      meEmp = empFromDoc(s); emps = [meEmp];
      $('userChip').textContent = meEmp.name;
      if (!meEmp.active) { renderMsg('حسابك موقوف', 'تواصل مع المالك لإعادة تفعيله.'); first = true; return; }
      if (meEmp.mustChange) { renderPass(); first = true; return; }
      if (first || view !== 'vEmp') { first = false; renderEmp(); } else updateEmpLive(true);
    }, () => renderMsg('تعذّر تحميل حسابك', 'تأكد من الاتصال بالإنترنت ثم أعد فتح التطبيق.')));
    unsubs.push(onSnapshot(query(collection(db, 'days'), where('uid', '==', u.uid)), onDays, () => { }));
  }
});
$('logoutBtn').onclick = async () => { closeSheetIfOpen(); await signOut(auth); };
function closeSheetIfOpen() { if (!$('sheet').hidden) closeSheet(); }
addEventListener('resize', () => document.querySelectorAll('.tabs').forEach(movePill));

/* ========== light / dark ========== */
const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 12h1M12 3v1M20 12h1M12 20v1M5.6 5.6l.7.7M18.4 5.6l-.7.7M17.7 17.7l.7.7M6.3 17.7l-.7.7"/></svg>';
const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3h.39a7.5 7.5 0 0 0 7.92 12.45A9 9 0 1 1 12 3z"/></svg>';
const curTheme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function paintThemeBtns() {
  const t = curTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.innerHTML = t === 'dark' ? SUN : MOON; b.setAttribute('aria-label', t === 'dark' ? 'التحويل للوضع الأبيض' : 'التحويل للوضع الأسود'); });
  const m = $('themeColor'); if (m) m.setAttribute('content', t === 'dark' ? '#121110' : '#f3f2ee');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-theme-toggle]'); if (!b) return;
  const next = curTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('basma-theme', next); } catch (err) { }
  paintThemeBtns(); vibrate(15);
});
paintThemeBtns();

/* ========== boot ========== */
(async () => { try { if (window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) { window.__bio = true; if (view === 'vEmp' && !busy) renderEmp(); } } catch (e) { } })();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
setDates(); tickClock();
setInterval(() => { tickClock(); if (view === 'vEmp') updateEmpLive(false); }, 1000);
setInterval(() => { setDates(); updateBands(); checkEmpReminders(); checkOwnerAlerts(); if (view === 'vEmp' && !busy) updateEmpLive(true); if (view === 'vOwn') renderFeed(false); }, 20000);
setTimeout(() => { const s = $('splash'); if (s) { s.classList.add('out'); setTimeout(() => s.remove(), 700); } checkEmpReminders(); checkOwnerAlerts(); }, RM ? 200 : 2600);
