/* ==========================================================
   Shell, router, actions
   ========================================================== */
const S = { route: 'home', id: null, tab: 'overview', casesView: 'list', casesSaved: 'all', casesQ: '', cf: {}, calView: 'week', calAnchor: D(9, 10), calLaw: new Set(TEAM.map((t) => t.id)), calCourt: '', tasksView: 'kanban', tasksScope: 'mine', clientId: 'k1', clientF: 'all', finTab: 'all', anPeriod: 'month', svcCat: 'marketing', docType: 'all', dismissed: new Set(), visited: new Set() };
const A = {}; // action handlers

const NAV = [
  { r: 'home', l: 'اليوم', ic: 'home' },
  { r: 'cases', l: 'القضايا', ic: 'cases', cnt: () => CASES.length },
  { r: 'calendar', l: 'الجلسات', ic: 'cal', cnt: () => SESSIONS.filter((s) => sameDay(s.at, TODAY)).length || '' },
  { r: 'tasks', l: 'المهام', ic: 'tasks', cnt: () => { const n = TASKS.filter((t) => t.who === 'u1' && isLate(t)).length; return n ? { n, hot: true } : ''; } },
  { r: 'clients', l: 'العملاء', ic: 'users' },
  { r: 'docs', l: 'المستندات', ic: 'file' },
  '-',
  { r: 'team', l: 'الفريق', ic: 'team' },
  { r: 'finance', l: 'المالية', ic: 'wallet' },
  { r: 'analytics', l: 'التحليلات', ic: 'chart' },
  '-',
  { r: 'services', l: 'خدمات أعراف', ic: 'sparkle', cls: 'services' },
];
const TITLES = { home: 'اليوم', cases: 'القضايا', calendar: 'الجلسات', tasks: 'المهام', clients: 'العملاء', docs: 'المستندات', team: 'الفريق', finance: 'المالية', analytics: 'التحليلات', services: 'خدمات أعراف' };

function shell() {
  const unread = NOTIFS.filter((n) => n.unread).length;
  document.body.innerHTML = `
  <div class="app" id="app">
    <aside class="side">
      <div class="brand"><div class="brand-mark">${LOGO}</div><div class="brand-txt"><b>أعراف</b><small>للمحامين</small></div></div>
      <nav class="nav-group" id="nav"></nav>
      <div class="side-foot">
        <button class="nav-i" data-a="notifs">${ic('bell')}<span>الإشعارات</span><span class="cnt hot" id="navNotif">${unread}</span></button>
        <button class="nav-i" data-a="settings">${ic('sliders')}<span>الإعدادات</span></button>
        <button class="me" data-a="meMenu">${av('u1', '', true)}<div class="who"><b>أ. خالد</b><small>مكتب خالد للمحاماة</small></div></button>
      </div>
    </aside>
    <main class="main"><div class="sheet">
      <header class="topbar">
        <button class="icon-btn" data-a="toggleSide" data-tip="طي القائمة">${ic('menu')}</button>
        <div class="crumbs" id="crumbs"></div>
        <button class="searchbtn" data-a="cmd">${ic('search')}<span>ابحث عن قضية أو عميل، أو نفّذ أمرًا</span><span class="kbd">Ctrl K</span></button>
        <div class="today-chip"><b>${wd(TODAY)}، ${dm(TODAY)}</b><span>${hijri(TODAY)}</span></div>
        <button class="icon-btn" data-a="notifs" data-tip="الإشعارات">${ic('bell')}<span class="dot" id="bellDot">${unread}</span></button>
      </header>
      <div class="scroll" id="scroll"><div class="view" id="view"></div></div>
    </div></main>
  </div>
  <nav class="mobile-nav" id="mnav"></nav>
  <div class="fab" id="fab"><div class="fab-menu" id="fabMenu"></div><button class="fab-btn" data-a="fab" aria-label="إضافة سريعة">${ic('plus')}</button></div>
  <div class="scrim" id="scrim" data-a="drClose"></div><aside class="drawer" id="drawer"></aside>
  <div class="modal-wrap" id="modal"></div>
  <div class="cmd-wrap" id="cmd"></div>
  <div class="toasts" id="toasts"></div>
  <div class="tip" id="tip"></div>
  <div class="global-drop" id="gdrop"><div>${ic('upload', 'width="40" height="40" style="margin:0 auto;color:var(--gold)"')}<b>أفلت الملفات لرفعها</b><span>ستُضاف إلى مركز المستندات${''}</span></div></div>`;
  tipEl = $('#tip');
  paintNav();
}
function paintNav() {
  $('#nav').innerHTML = NAV.map((n) => {
    if (n === '-') return '<div class="nav-sep"></div>';
    const c = n.cnt ? n.cnt() : ''; const on = S.route === n.r || (n.r === 'cases' && S.route === 'case');
    const cnt = c ? (typeof c === 'object' ? `<span class="cnt hot">${c.n}</span>` : `<span class="cnt">${c}</span>`) : '';
    return `<button class="nav-i ${n.cls || ''} ${on ? 'on' : ''}" data-a="nav" data-to="${n.r}">${ic(n.ic)}<span>${n.l}</span>${cnt}</button>`;
  }).join('');
  const mob = [['home', 'اليوم', 'home'], ['calendar', 'الجلسات', 'cal'], ['tasks', 'المهام', 'tasks'], ['cases', 'القضايا', 'cases'], ['more', 'المزيد', 'menu']];
  const late = TASKS.filter((t) => t.who === 'u1' && isLate(t)).length;
  $('#mnav').innerHTML = mob.map(([r, l, i]) => `<button class="${S.route === r || (r === 'cases' && S.route === 'case') ? 'on' : ''}" data-a="${r === 'more' ? 'mobMore' : 'nav'}" data-to="${r}">${ic(i)}${l}${r === 'tasks' && late ? `<span class="cnt">${late}</span>` : ''}</button>`).join('');
  const un = NOTIFS.filter((n) => n.unread).length;
  $('#bellDot').textContent = un; $('#bellDot').style.display = un ? '' : 'none'; $('#navNotif').textContent = un; $('#navNotif').style.display = un ? '' : 'none';
}
function crumbs() {
  let h = '';
  if (S.route === 'case') { const c = CS(S.id); h = `<button data-a="nav" data-to="cases">القضايا</button>${ic('chevL')}<b>${c.title}</b>`; }
  else h = `<b>${TITLES[S.route]}</b>`;
  $('#crumbs').innerHTML = h;
}

/* ---------- Router ---------- */
const VIEWS = {};
function parseHash() {
  const p = location.hash.replace(/^#\/?/, '').split('/');
  const r = p[0] || 'home';
  if (r === 'case' && CS(p[1])) { S.route = 'case'; S.id = p[1]; S.tab = p[2] || 'overview'; }
  else if (VIEWS[r]) { S.route = r; }
  else S.route = 'home';
}
function go(route, id, tab) {
  const h = '#/' + route + (id ? '/' + id : '') + (tab ? '/' + tab : '');
  if (location.hash === h) render(true); else location.hash = h;
}
function render(anim = true) {
  closePop(); $('#peek')?.remove(); tipEl?.classList.remove('show');
  const v = $('#view'); const key = S.route;
  const first = !S.visited.has(key) && key !== 'home';
  S.visited.add(key);
  const paint = () => {
    v.innerHTML = VIEWS[S.route]();
    if (anim) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
    after(v);
  };
  if (first) { v.innerHTML = skeleton(); v.classList.remove('enter'); setTimeout(paint, 260); } else paint();
  paintNav(); crumbs();
  if (anim) $('#scroll').scrollTop = 0;
}
function rerender() { const sc = $('#scroll').scrollTop; $('#view').innerHTML = VIEWS[S.route](); after($('#view')); $('#scroll').scrollTop = sc; paintNav(); }
function after(root) { runCounters(root); runRings(root); syncIndicators(root); HOOKS.forEach((f) => f(root)); }
const HOOKS = [];
function skeleton() {
  return `<div style="display:flex;flex-direction:column;gap:18px"><div class="sk" style="height:40px;width:260px"></div><div class="sk" style="height:36px;width:60%"></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><div class="sk" style="height:120px"></div><div class="sk" style="height:120px"></div><div class="sk" style="height:120px"></div></div>
  ${'<div class="sk" style="height:54px"></div>'.repeat(5)}</div>`;
}
window.addEventListener('hashchange', () => { parseHash(); render(true); });

/* ---------- Event delegation ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!$('#pop')?.contains(e.target) && !e.target.closest('[data-a="fab"]')) closePop();
  if (!el) { if (!e.target.closest('#fab')) closeFab(); return; }
  const fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
  if (el.dataset.a !== 'fab' && !el.closest('#fabMenu')) closeFab();
});
document.addEventListener('contextmenu', (e) => {
  const row = e.target.closest('[data-ctx]'); if (!row) return; e.preventDefault();
  const [kind, id] = row.dataset.ctx.split(':'); CTX[kind] && openPop({ x: e.clientX + 200, y: e.clientY }, CTX[kind](id));
});
document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); openCmd(); return; }
  if (e.key === 'Escape') { if ($('#cmd').classList.contains('show')) return closeCmd(); if ($('#modal').classList.contains('show')) return closeModal(); if ($('#pop')) return closePop(); if ($('#fab').classList.contains('open')) return closeFab(); closeDrawer(); return; }
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === '/') { e.preventDefault(); openCmd(); }
  if (e.key === 'n' || e.key === 'ى') { e.preventDefault(); A.fab(); }
  if (e.shiftKey && e.key === 'T') { quickAdd('task'); }
});

A.nav = (el) => go(el.dataset.to);
A.openCase = (el, e) => { e?.stopPropagation(); go('case', el.dataset.id, el.dataset.tab); closeDrawer(); closeModal(); };
A.drClose = closeDrawer; A.drBack = drawerBack; A.mClose = closeModal;
A.toggleSide = () => { const a = $('#app'); if (innerWidth <= 1280) a.classList.toggle('expanded'); else a.classList.toggle('collapsed'); setTimeout(() => syncIndicators(), 360); };
A.seg = (el) => { S[el.dataset.k] = el.dataset.v; rerender(); };
A.stop = (el, e) => e.stopPropagation();
A.copy = (el, e) => { e.stopPropagation(); navigator.clipboard?.writeText(el.dataset.v); toast(`نُسخ الرقم ${'<span class="ltr num">' + el.dataset.v + '</span>'}`); };
A.meMenu = (el) => openPop(el, [{ h: 'أ. خالد — الشريك المؤسس' }, { l: 'صفحتي', ic: 'user', f: () => openMember('u1') }, { l: 'تجربة البداية', ic: 'sparkle', f: onboarding }, { l: 'اختصارات لوحة المفاتيح', ic: 'keyboard', f: shortcuts }, '-', { l: 'تسجيل الخروج', ic: 'logout', red: true, f: () => toast('هذه نسخة تجريبية؛ تسجيل الخروج غير مفعّل', { info: true }) }], { alignStart: true });
A.settings = () => toast('الإعدادات خارج نطاق هذه النسخة التجريبية', { info: true });
A.mobMore = (el) => openPop(el, [['clients', 'العملاء', 'users'], ['docs', 'المستندات', 'file'], ['team', 'الفريق', 'team'], ['finance', 'المالية', 'wallet'], ['analytics', 'التحليلات', 'chart'], ['services', 'خدمات أعراف', 'sparkle']].map(([r, l, i]) => ({ l, ic: i, f: () => go(r) })).concat(['-', { l: 'الإشعارات', ic: 'bell', f: openNotifs }]));
window.addEventListener('resize', () => syncIndicators());

/* ==========================================================
   HOME — Command Center
   ========================================================== */
function todayItems() {
  const items = [];
  SESSIONS.filter((s) => sameDay(s.at, TODAY) && s.by === 'u1').forEach((s) => { const c = CS(s.case); items.push({ kind: 'session', at: s.at, dur: s.dur, t: c.court.replace(' بالرياض', ''), m: K(c.client).name.replace(/^(شركة|مؤسسة|مجموعة)\s+/, ''), id: s.id, case: c.id, remote: s.kind === 'عن بعد' }); });
  TASKS.filter((t) => t.who === 'u1' && sameDay(t.due, TODAY) && hasTime(t.due) && !(t.due.getHours() === 16 && t.due.getMinutes() === 30)).forEach((t) => items.push({ kind: t.meet ? 'meet' : 'task', at: t.due, dur: t.dur || 45, t: t.t, m: t.case ? CS(t.case).title : '', id: t.id, done: t.st === 'done' }));
  return items.sort((a, b) => a.at - b.at);
}
function attention() {
  const L = [];
  const c3 = CS('c3'); L.push({ id: 'a1', sev: 'crit', ic: 'alert', t: `مهلة الاعتراض في قضية شركة نماء تنتهي ${rel(c3.dl.d)}`, m: 'لائحة الاعتراض في الإصدار 3 لدى سارة، وتنتظر اعتمادك', acts: [['اعتماد اللائحة', 'openDoc', 'd7', 'p'], ['القضية', 'openCase', 'c3']] });
  L.push({ id: 'a2', sev: 'crit', ic: 'clock', t: 'مذكرة التعقيب في قضية الأفق تُقدَّم اليوم قبل 4:30 م', m: 'المسودة النهائية جاهزة — الإصدار 4', acts: [['فتح المهمة', 'openTask', 't2', 'p'], ['المسودة', 'openDoc', 'd1']] });
  L.push({ id: 'a3', sev: 'high', ic: 'pen', t: 'مسودة مذكرة الحضانة تنتظر اعتمادك', m: 'رفعتها سارة القحطاني أمس 4:45 م', acts: [['معاينة', 'openDoc', 'd8'], ['اعتماد', 'approveTask', 't19', 'p']] });
  const c8 = CS('c8'); L.push({ id: 'a4', sev: 'high', ic: 'activity', t: `قضية المطيري ضد الديار بلا أي إجراء منذ ${pDays(staleDays(c8))}`, m: 'بانتظار عقد البيع الأصلي من العميل', acts: [['تذكير العميل', 'remindClient', 'k8', 'p'], ['القضية', 'openCase', 'c8']] });
  L.push({ id: 'a5', sev: 'med', ic: 'msg', t: 'العميل محمد الغامدي بانتظار ردك منذ يومين', m: 'يسأل عن جاهزية جلسة اليوم', acts: [['الرد', 'openClient', 'k2', 'p']] });
  L.push({ id: 'a6', sev: 'med', ic: 'cal', t: 'جلسة الأحد في قضية موظف الأفق دون محضر تحضير', m: 'المسؤول: فيصل الدوسري', acts: [['تحضير', 'prep', 's9', 'p']] });
  L.push({ id: 'a7', sev: 'low', ic: 'receipt', t: 'فاتورتان متأخرتان بقيمة 46,500 ريال', m: 'شركة الأفق وشركة سدير', acts: [['المالية', 'nav', 'finance']] });
  return L.filter((x) => !S.dismissed.has(x.id));
}
function deadlines() {
  const L = [];
  CASES.filter((c) => c.dl).forEach((c) => L.push({ at: c.dl.d, t: c.dl.t, m: c.title, case: c.id, total: 30 }));
  L.push({ at: D(9, 14), t: 'مهلة الرد على مذكرة المدعى عليه', m: 'شركة مسار ضد موظف سابق', case: 'c14', total: 10 });
  L.push({ at: D(9, 19), t: 'انتهاء وكالة شركة سدير', m: 'تجديد الوكالة قبل الجلسات القادمة', case: 'c5', total: 30 });
  L.push({ at: D(9, 24, 10), t: 'النطق بالحكم', m: 'شركة الأفق ضد الشريك السابق', case: 'c9', total: 24 });
  return L.sort((a, b) => a.at - b.at);
}
const cd = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }; };

VIEWS.home = () => {
  const now = nowDate(); const hr = now.getHours();
  const greet = hr < 12 ? 'صباح الخير' : 'مساء الخير';
  const tItems = todayItems(); const sessToday = tItems.filter((x) => x.kind === 'session').length;
  const att = attention(); const attN = att.filter((a) => a.sev === 'crit' || a.sev === 'high').length;
  const tasksToday = TASKS.filter((t) => t.who === 'u1' && t.st !== 'done' && dayDiff(t.due) <= 0).length;
  const dl = deadlines(); const d0 = dl[0];
  const nearDl = dl.find((x) => x.case === 'c3');
  const line = `لديك اليوم <b>${sessToday === 2 ? 'جلستان' : sessToday + ' جلسات'}</b> و<b>${attN} ${attN <= 10 && attN >= 3 ? 'أمور' : 'أمرًا'}</b> تستحق انتباهك، أولها ${d0.t.replace('آخر موعد ل', '')} قبل ${hm(d0.at)}.`;
  return `
  <section class="hello">
    <div><h1 class="h-disp">${greet}، أ. خالد</h1><p class="line">${line}</p></div>
    <div class="brief" data-a="brief" role="button" tabindex="0">
      <div class="bh">${ic('sun')}موجز اليوم<span class="d">${wd(TODAY)} ${dm(TODAY)}</span></div>
      <div class="counts"><div><b>${counter(sessToday)}</b><span>جلسات</span></div><div><b>${counter(tasksToday)}</b><span>مهام مستحقة</span></div><div><b>${counter(2)}</b><span>مهل حرجة</span></div><div><b>${counter(3)}</b><span>تحديثات</span></div></div>
      <div class="key">${ic('alert')}<span>أهم شيء اليوم: تنتهي مهلة الاعتراض في قضية شركة نماء ${rel(nearDl.at)}.</span></div>
    </div>
  </section>

  <section class="ribbon">
    <div class="rb-h"><div class="sec-t">يومك<small>من 8 صباحًا حتى 6 مساءً</small></div>
      <div class="rb-legend"><span><i style="background:var(--navy)"></i>جلسة</span><span><i style="background:#fff;box-shadow:inset 0 0 0 1px var(--line-2)"></i>مهمة</span><span><i style="background:var(--gold-bg);box-shadow:inset 0 0 0 1px var(--gold)"></i>اجتماع</span><span><i style="background:var(--red)"></i>موعد نهائي</span></div>
      <button class="btn btn-sm btn-q" data-a="nav" data-to="calendar">التقويم${ic('chevL')}</button></div>
    ${ribbon(tItems)}
  </section>

  <div class="grid g12" style="margin-bottom:30px">
    <section class="s7">
      <div class="sec-h"><div class="sec-t">يتطلب انتباهك<small id="attCount">${att.length} ${att.length > 10 ? 'أمرًا' : 'أمور'}</small></div><div class="act"><button class="btn btn-sm btn-q" data-a="notifs">كل الإشعارات</button></div></div>
      <div class="att-list" id="attList">${att.length ? att.map(attRow).join('') : empty('لا شيء عاجل الآن', 'أنجزت كل ما يحتاج انتباهك. ستظهر هنا المهل والطلبات فور وصولها.')}</div>
    </section>
    <section class="s5"><div class="dl-panel">
      <div class="sec-h" style="margin-bottom:0"><div class="sec-t">المهل والمواعيد النظامية<small>${dl.length} خلال 14 يومًا</small></div></div>
      <div class="dl-hero" data-a="openCase" data-id="${nearDl.case}"><div class="lbl">الأقرب من حيث الخطورة</div><div class="ttl">${nearDl.t} — ${CS(nearDl.case).title}</div><div class="cd" id="cdHero" data-at="${nearDl.at.getTime()}"></div></div>
      ${dl.filter((x) => x !== nearDl).slice(0, 4).map(dlRow).join('')}
    </div></section>
  </div>

  <div class="grid g12" style="margin-bottom:30px">
    <section class="s8">
      <div class="sec-h"><div class="sec-t">نبض القضايا<small>${CASES.length} قضية نشطة</small></div><div class="act"><button class="btn btn-sm btn-q" data-a="nav" data-to="cases">كل القضايا${ic('chevL')}</button></div></div>
      ${caseFlow()}
      <div class="divider"></div>
      <div class="waffle-wrap">${waffle()}</div>
    </section>
    <section class="s4">
      <div class="sec-h"><div class="sec-t">ملاحظات من بيانات مكتبك</div></div>
      ${insights()}
    </section>
  </div>

  <div class="grid g12">
    <section class="s5">
      <div class="sec-h"><div class="sec-t">النشاط الأخير <span class="live"><i></i>مباشر</span></div><div class="act">${TEAM.slice(0, 5).map((t) => av(t.id, 'sm', true)).join('')}</div></div>
      <div class="feed" id="feed">${ACTIVITY.slice().sort((a, b) => b.at - a.at).slice(0, 6).map(feedItem).join('')}</div>
    </section>
    <section class="s4">
      <div class="sec-h"><div class="sec-t">مراجعة الأسبوع<small>مقارنة بالأسبوع السابق</small></div><div class="act"><button class="btn btn-sm btn-q" data-a="weekly">التفاصيل</button></div></div>
      <div class="wk">
        <div><b>${counter(6)}</b><span>جلسات حضرها الفريق</span><div>${delta(6, 4)}</div></div>
        <div><b>${counter(12)}</b><span>مهمة مكتملة</span><div>${delta(12, 10)}</div></div>
        <div><b>${counter(2)}</b><span>قضايا جديدة</span><div>${delta(2, 3)}</div></div>
        <div><b>${counter(3)}</b><span>عملاء جدد</span><div>${delta(3, 1)}</div></div>
        <div><b>${counter(32500)}</b><span>ريال محصّلة</span><div>${delta(32500, 27800)}</div></div>
        <div><b>${counter(9)}</b><span>مستندات جديدة</span><div>${delta(9, 11)}</div></div>
      </div>
    </section>
    <section class="s3">
      <div class="sec-h"><div class="sec-t">التحصيل هذا الشهر</div></div>
      <div class="money"><div class="big"><small>SAR</small>${counter(71200)}</div><div class="muted" style="font-size:12.5px">من أصل ${sar(86400)} مفوترة ${delta(71200, 64100)}</div>
        <div style="margin:10px 0 4px">${spark([102, 118, 120, 131, 126, 118, 110, 139, 71], 240, 54, 'var(--gold-dk)')}</div>
        <div class="row" style="font-size:12.5px"><span class="muted grow">مستحقات متأخرة</span><b style="color:var(--red)">${sar(INVOICES.filter((i) => i.st === 'overdue').reduce((a, b) => a + b.amt, 0))}</b></div>
        <button class="btn-link" data-a="nav" data-to="finance" style="margin-top:6px">المركز المالي${ic('chevL')}</button></div>
    </section>
  </div>`;
};

function ribbon(items) {
  const H0 = 8, H1 = 18; const pos = (d) => ((d.getHours() + d.getMinutes() / 60 - H0) / (H1 - H0)) * 100;
  let hours = ''; for (let h = H0; h <= H1; h++) { const lbl = h > 12 ? h - 12 : h; hours += `<div class="rb-hr" style="right:${((h - H0) / (H1 - H0)) * 100}%"><span>${lbl}</span></div>`; }
  const now = nowDate(); const np = Math.max(0, Math.min(100, pos(now)));
  const evs = items.map((it, i) => {
    const r = pos(it.at), w = (it.dur / 60 / (H1 - H0)) * 100;
    const a = it.kind === 'session' ? `data-a="openSession" data-id="${it.id}"` : `data-a="openTask" data-id="${it.id}"`;
    const past = new Date(it.at.getTime() + it.dur * 6e4) < now;
    return `<div class="rb-ev ${it.kind} ${past ? 'done' : ''}" style="right:${r}%;width:max(${w}%,150px);animation-delay:${i * 70}ms" ${a} data-tip="${esc(hm24(it.at) + ' — ' + it.t + (it.m ? '<br><b>' + it.m + '</b>' : ''))}">
      <b>${it.kind === 'session' && it.remote ? ic('video', 'width="12" height="12" style="display:inline;vertical-align:-1px;margin-inline-end:4px"') : ''}${it.t}</b><small><span class="ltr num">${hm24(it.at)}</span> — ${it.m || 'مهمة داخلية'}</small></div>`;
  }).join('');
  const dl = CS('c1').dl.d;
  const dlm = `<div class="rb-dl" style="right:${pos(dl)}%" data-a="openTask" data-id="t2"><div class="flag"><b>4:30 م — موعد نهائي</b>تقديم مذكرة التعقيب</div></div>`;
  const list = items.concat([{ kind: 'dl', at: dl, t: 'تقديم مذكرة التعقيب — موعد نهائي', m: 'شركة الأفق ضد مؤسسة المدار' }]).sort((a, b) => a.at - b.at)
    .map((it) => `<div class="ag" ${it.kind === 'session' ? `data-a="openSession" data-id="${it.id}"` : it.id ? `data-a="openTask" data-id="${it.id}"` : `data-a="openTask" data-id="t2"`}><time>${hm24(it.at)}</time><div><b style="${it.kind === 'dl' ? 'color:var(--red)' : ''}">${it.t}</b><small>${it.m || ''}</small></div></div>`).join('');
  return `<div class="rb-track" id="rbTrack"><div class="rb-past" id="rbPast" style="width:${np}%"></div>${hours}${evs}${dlm}<div class="rb-now" id="rbNow" style="right:${np}%"><span>${hm24(now)}</span></div></div><div class="rb-list">${list}</div>`;
}
function attRow(a) {
  return `<div class="att sev-${a.sev}" data-att="${a.id}"><div class="ic">${ic(a.ic)}</div><div><div class="t">${a.t}</div><div class="m">${a.m}</div></div>
   <div class="acts">${a.acts.map(([l, f, id, p]) => `<button class="btn btn-sm ${p ? 'btn-p' : 'btn-s'}" data-a="${f}" data-id="${id}" data-to="${id}">${l}</button>`).join('')}<button class="btn btn-sm btn-q" data-a="dismissAtt" data-id="${a.id}" data-tip="تم — إخفاء">${ic('check')}</button></div></div>`;
}
function dlRow(x) {
  const ms = x.at - nowDate(); const days = Math.max(0, Math.ceil(ms / DAY)); const pct = Math.max(4, Math.min(100, (1 - days / x.total) * 100));
  const dd = dayDiff(x.at); const hot = dd <= 3; const left = dd <= 0 ? 'اليوم ' + hm(x.at) : dd === 1 ? 'غدًا' : `متبقٍ ${pDays(dd)}`;
  return `<div class="dl-row" data-a="openCase" data-id="${x.case}">${ring(pct, 40, 4, hot ? '#F0A08C' : 'var(--gold)', 'rgba(255,255,255,.08)', `<span style="font-size:11px;font-weight:700;color:#fff">${dd}</span>`)}<div><div class="t">${x.t}</div><div class="m">${x.m} — ${dm(x.at)}</div></div><div class="left ${hot ? 'hot' : ''}">${left}</div></div>`;
}
function caseFlow() {
  const keys = Object.keys(STATUS); const tot = CASES.length;
  const cnt = (k) => CASES.filter((c) => c.status === k).length;
  return `<div class="flow">${keys.map((k, i) => `<div style="flex-grow:${cnt(k)};background:${STATUS[k].c};${k === 'prep' ? 'color:var(--navy-xdk)' : ''};animation-delay:${i * 60}ms" data-a="casesBy" data-k="status" data-v="${k}" data-tip="${STATUS[k].l}: ${cnt(k)} من ${tot}">${cnt(k)}</div>`).join('')}</div>
  <div class="flow-leg">${keys.map((k) => `<button data-a="casesBy" data-k="status" data-v="${k}"><i style="background:${STATUS[k].c}"></i>${STATUS[k].l}<b>${cnt(k)}</b></button>`).join('')}</div>`;
}
function waffle() {
  const types = Object.keys(TYPES); const sorted = CASES.slice().sort((a, b) => types.indexOf(a.type) - types.indexOf(b.type));
  const cells = sorted.map((c, i) => `<i style="background:${TYPES[c.type]};animation-delay:${i * 18}ms" data-type="${c.type}" data-a="openCase" data-id="${c.id}" data-tip="${esc(c.title + '<br><b>' + c.type + '</b>')}"></i>`).join('');
  const rows = types.map((t) => { const n = CASES.filter((c) => c.type === t).length; const prev = { 'تجارية': 5, 'عمالية': 5, 'عقارية': 4, 'أحوال شخصية': 3, 'تنفيذ': 2, 'إدارية': 2, 'أخرى': 1 }[t];
    return `<button data-a="casesBy" data-k="type" data-v="${t}" data-hl="${t}"><i style="background:${TYPES[t]}"></i>${t}<b class="num">${n}</b><span>${n !== prev ? delta(n, prev) : '<span class="delta flat">—</span>'}</span></button>`; }).join('');
  return `<div><div class="muted" style="font-size:12px;margin-bottom:10px">كل مربع قضية؛ مرّر للاسم واضغط للفتح</div><div class="waffle" id="waffle">${cells}</div></div><div><div class="muted" style="font-size:12px;margin-bottom:6px">حسب النوع، مقارنة بالربع السابق</div><div class="tlist">${rows}</div></div>`;
}
function insights() {
  const I = [
    ['trend', 'ازدادت <b>القضايا التجارية</b> لديك 22% خلال آخر 3 أشهر، وأصبحت الأعلى قيمة في مكتبك.', ['تحليل الأنواع', 'nav', 'analytics']],
    ['cal', 'الأسبوع القادم هو الأكثر ازدحامًا هذا الشهر بـ <b>9 جلسات</b>، منها 4 لسارة وحدها.', ['عرض الأسبوع', 'calNext', '']],
    ['users', 'لديك <b>4 عملاء نشطين</b> لم يحدث معهم تواصل منذ 14 يومًا أو أكثر.', ['عرض العملاء', 'clientsStale', '']],
    ['wallet', '<b>42%</b> من إيرادات هذا الشهر جاءت من 3 عملاء فقط.', ['التفاصيل', 'nav', 'finance']],
    ['check', 'متوسط مدة إغلاق مهامك تحسن بمقدار <b>18%</b> مقارنة بالشهر الماضي.', null],
  ];
  return I.map(([i, t, a]) => `<div class="ins"><div class="ic">${ic(i)}</div><div><p>${t}</p>${a ? `<button class="btn-link" data-a="${a[1]}" data-to="${a[2]}">${a[0]}${ic('chevL')}</button>` : ''}</div></div>`).join('');
}
function feedItem(f, isNew) {
  const u = f.who === 'sys' ? null : U(f.who);
  const who = u ? `<b>${u.short}</b> ` : '';
  const avh = u ? av(f.who) : `<span class="av" style="--c:var(--gold-dk)">${ic('bell', 'width="14" height="14"')}</span>`;
  return `<div class="fi ${isNew ? 'new' : ''}">${avh}<div><p>${who}${f.t} <a data-a="openCase" data-id="${f.case}">${f.obj}</a></p><time>${ago(f.at)}</time></div></div>`;
}

/* Home live behaviours */
let homeTimers = [];
HOOKS.push((root) => {
  homeTimers.forEach(clearInterval); homeTimers = [];
  const hero = $('#cdHero', root);
  if (hero) {
    const at = +hero.dataset.at;
    const tick = () => { const t = cd(at - nowDate()); hero.innerHTML = [['d', 'يوم'], ['h', 'ساعة'], ['m', 'دقيقة'], ['s', 'ثانية']].map(([k, l]) => `<div><b>${String(t[k]).padStart(2, '0')}</b><span>${l}</span></div>`).join(''); };
    tick(); homeTimers.push(setInterval(tick, 1000));
  }
  if ($('#rbNow', root)) {
    homeTimers.push(setInterval(() => { const n = nowDate(); const p = Math.max(0, Math.min(100, ((n.getHours() + n.getMinutes() / 60 - 8) / 10) * 100)); const el = $('#rbNow'); if (!el) return; el.style.right = p + '%'; el.querySelector('span').textContent = hm24(n); $('#rbPast').style.width = p + '%'; }, 30000));
    let li = 0;
    homeTimers.push(setInterval(() => {
      const f = $('#feed'); if (!f || li >= LIVE_EVENTS.length) return;
      const ev = { ...LIVE_EVENTS[li++], at: nowDate() }; ACTIVITY.push(ev);
      f.insertAdjacentHTML('afterbegin', feedItem(ev, true)); if (f.children.length > 6) f.lastElementChild.remove();
    }, 38000));
  }
  const w = $('#waffle', root);
  if (w) $$('[data-hl]', root).forEach((b) => { b.onmouseenter = () => { w.classList.add('dim'); $$('i', w).forEach((i) => i.classList.toggle('hl', i.dataset.type === b.dataset.hl)); }; b.onmouseleave = () => w.classList.remove('dim'); });
});

A.dismissAtt = (el, e) => {
  e.stopPropagation(); const id = el.dataset.id; const row = el.closest('.att'); S.dismissed.add(id);
  row.classList.add('collapse-out'); setTimeout(() => { row.remove(); const n = attention().length; $('#attCount') && ($('#attCount').textContent = `${n} ${n > 10 ? 'أمرًا' : 'أمور'}`); if (!n) $('#attList').innerHTML = empty('لا شيء عاجل الآن', 'أنجزت كل ما يحتاج انتباهك. ستظهر هنا المهل والطلبات فور وصولها.'); }, 450);
  toast('أُخفي من قائمة الانتباه', { undo: () => { S.dismissed.delete(id); rerender(); } });
};
A.casesBy = (el) => { S.cf = { [el.dataset.k]: el.dataset.v }; S.casesSaved = 'all'; go('cases'); };
A.calNext = () => { S.calView = 'week'; S.calAnchor = D(9, 14); go('calendar'); };
A.clientsStale = () => { S.clientF = 'stale'; S.clientId = 'k8'; go('clients'); };
A.remindClient = (el) => { const c = K(el.dataset.id); c.last = nowDate(); toast(`أُرسل تذكير إلى ${c.name} عبر الرسائل النصية`); };
A.openClient = (el) => { S.clientId = el.dataset.id || el.dataset.to; closeDrawer(); go('clients'); };

A.brief = () => openDrawer(() => {
  const items = todayItems(); const dl = deadlines().slice(0, 3);
  return {
    head: `<div class="muted" style="font-size:12px">${wd(TODAY)}، ${dmy(TODAY)} — ${hijri(TODAY)}</div><h2 class="h-disp h2">موجز اليوم</h2>`,
    body: `<div class="next-step" style="margin-bottom:18px"><div class="ic">${ic('alert')}</div><div><div class="lbl">أهم شيء اليوم</div><div class="t">تنتهي مهلة الاعتراض في قضية شركة نماء بعد يومين</div><div class="m">اللائحة جاهزة للاعتماد، واليوم آخر يوم عمل قبل انتهاء المهلة.</div></div></div>
    <div class="dsec" style="margin-top:0"><h4>${ic('clock', 'width="15" height="15"')}جدولك</h4>${items.map((it) => `<div class="ag" data-a="${it.kind === 'session' ? 'openSession' : 'openTask'}" data-id="${it.id}"><time>${hm24(it.at)}</time><div><b>${it.t}</b><small>${it.m}</small></div></div>`).join('')}<div class="ag" data-a="openTask" data-id="t2"><time style="color:var(--red)">16:30</time><div><b style="color:var(--red)">موعد نهائي: تقديم مذكرة التعقيب</b><small>شركة الأفق ضد مؤسسة المدار</small></div></div></div>
    <div class="dsec"><h4>${ic('flag', 'width="15" height="15"')}المهل القريبة</h4>${dl.map((x) => `<div class="li" data-a="openCase" data-id="${x.case}"><div class="ic">${ic('clock')}</div><div class="grow"><div class="t">${x.t}</div><div class="m">${x.m}</div></div><span class="badge ${dayDiff(x.at) <= 2 ? 'b-red' : 'b-gold'}">${rel(x.at)}</span></div>`).join('')}</div>
    <div class="dsec"><h4>${ic('activity', 'width="15" height="15"')}تحديثات القضايا منذ أمس</h4>${ACTIVITY.filter((a) => a.kind === 'doc').slice(0, 3).map((f) => `<div class="li" data-a="openCase" data-id="${f.case}">${av(f.who)}<div class="grow"><div class="t">${U(f.who).short} ${f.t} ${f.obj}</div><div class="m">${CS(f.case).title}</div></div></div>`).join('')}</div>
    <div class="dsec"><h4>${ic('team', 'width="15" height="15"')}فريقك اليوم</h4>${TEAM.map((t) => `<div class="li" data-a="member" data-id="${t.id}">${av(t.id, '', true)}<div class="grow"><div class="t">${t.name}</div><div class="m">${t.status}</div></div></div>`).join('')}</div>`,
    foot: `<button class="btn btn-p" data-a="drClose">ابدأ يومك</button><span class="muted" style="font-size:12px;margin-inline-start:auto">يُحدَّث الموجز كل صباح في 7:00</span>`,
  };
});
A.weekly = () => openDrawer(() => {
  const rows = [['جلسات', 6, 4], ['مهام مكتملة', 12, 10], ['قضايا جديدة', 2, 3], ['عملاء جدد', 3, 1], ['تحصيل (ريال)', 32500, 27800], ['مستندات جديدة', 9, 11], ['ساعات مسجلة', 118, 109]];
  const days = [['الأحد', 3, 5], ['الاثنين', 2, 3], ['الثلاثاء', 4, 2], ['الأربعاء', 1, 3], ['الخميس', 2, 1]];
  return {
    head: `<div class="muted" style="font-size:12px">6 – 10 سبتمبر 2026</div><h2 class="h-disp h2">مراجعة الأسبوع</h2>`,
    body: `${rows.map(([l, a, b]) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="grow">${l}</span><span class="muted num" style="font-size:12px">${fmt(b)}</span><span style="width:18px;text-align:center;color:var(--faint)">←</span><b class="num" style="min-width:60px;text-align:end">${fmt(a)}</b><span style="min-width:54px;text-align:end">${delta(a, b)}</span></div>`).join('')}
    <div class="dsec"><h4>الإنجاز اليومي للفريق</h4>${lineChart({ labels: days.map((d) => d[0]), series: [{ name: 'مهام مكتملة', values: days.map((d) => d[1]), color: 'var(--navy)', area: true }, { name: 'جلسات', values: days.map((d) => d[2]), color: 'var(--gold)' }], w: 440, h: 180 })}<div class="legend" style="margin-top:6px"><span><i style="--c:var(--navy)"></i>مهام مكتملة</span><span><i style="--c:var(--gold)"></i>جلسات</span></div></div>
    <div class="dsec"><h4>ما يستحق التوقف عنده</h4><div class="ins"><div class="ic">${ic('bulb')}</div><p>قلّت المستندات الجديدة هذا الأسبوع رغم ارتفاع الجلسات؛ راجع حوافظ جلسات الأسبوع القادم مبكرًا.</p></div><div class="ins"><div class="ic">${ic('bulb')}</div><p>تحسن التحصيل 17%، ومعظمه من تسوية فاتورة شركة الأفق للشراكة.</p></div></div>`,
    foot: `<button class="btn btn-s" data-a="drClose">إغلاق</button><button class="btn btn-q" data-a="stub" data-m="سيُرسل ملخص الأسبوع إلى بريدك كل خميس">${ic('mail')}إرساله إلى بريدي</button>`,
  };
});
A.stub = (el) => toast(el.dataset.m, { info: true });
