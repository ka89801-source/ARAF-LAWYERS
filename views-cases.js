/* ==========================================================
   CASES — list / cards / kanban / timeline
   ========================================================== */
S.casesSort = 'next';
const SAVED = [
  ['all', 'كل القضايا', () => CASES],
  ['mine', 'قضاياي', () => CASES.filter((c) => c.lead === 'u1' || c.team.includes('u1'))],
  ['attention', 'تحتاج انتباهًا', () => CASES.filter((c) => caseFlags(c).length)],
  ['week', 'جلسات خلال 7 أيام', () => CASES.filter((c) => { const n = nextSession(c.id); return n && dayDiff(n.at) <= 7; })],
  ['high', 'أولوية عالية', () => CASES.filter((c) => c.pri === 'high')],
];
function filteredCases() {
  let L = SAVED.find((s) => s[0] === S.casesSaved)[2]().slice();
  Object.entries(S.cf).forEach(([k, v]) => { if (!v) return; if (k === 'lawyer') L = L.filter((c) => c.lead === v || c.team.includes(v)); else L = L.filter((c) => c[k] === v); });
  if (S.casesQ) { const q = norm(S.casesQ); L = L.filter((c) => norm([c.title, c.subj, c.no, K(c.client).name, c.opp, c.court, c.type].join(' ')).includes(q)); }
  const nx = (c) => nextSession(c.id)?.at?.getTime() ?? 9e15;
  const pr = { high: 0, med: 1, low: 2 };
  const sorters = { next: (a, b) => nx(a) - nx(b), pri: (a, b) => pr[a.pri] - pr[b.pri] || nx(a) - nx(b), claim: (a, b) => b.claim - a.claim, stale: (a, b) => staleDays(b) - staleDays(a) };
  return L.sort(sorters[S.casesSort]);
}
const CF_DEF = {
  type: { l: 'النوع', opts: () => Object.keys(TYPES).map((t) => [t, t]) },
  status: { l: 'الحالة', opts: () => Object.entries(STATUS).map(([k, v]) => [k, v.l]) },
  lawyer: { l: 'المحامي', opts: () => TEAM.filter((t) => t.id !== 'u6').map((t) => [t.id, t.name]) },
  court: { l: 'المحكمة', opts: () => [...new Set(CASES.map((c) => c.court))].map((c) => [c, c]) },
  pri: { l: 'الأولوية', opts: () => Object.entries(PRI).map(([k, v]) => [k, v.l]) },
};
function cfLabel(k) { const v = S.cf[k]; if (!v) return CF_DEF[k].l; const o = CF_DEF[k].opts().find((x) => x[0] === v); return o ? o[1] : v; }

VIEWS.cases = () => {
  const views = [['list', 'قائمة', 'list'], ['cards', 'بطاقات', 'grid'], ['kanban', 'مراحل', 'kanban'], ['gantt', 'خط زمني', 'gantt']];
  const att = CASES.filter((c) => caseFlags(c).length).length;
  const pipeline = CASES.reduce((a, c) => a + c.claim, 0);
  return `
  <div class="page-h"><div><h1 class="h-disp h1">القضايا</h1><div class="sub">${CASES.length} قضية نشطة، منها <b style="color:var(--red)">${att}</b> تحتاج انتباهًا، وإجمالي المطالبات ${sarK(pipeline)}</div></div>
    <div class="tools"><div class="seg">${views.map(([v, l, i]) => `<button class="${S.casesView === v ? 'on' : ''}" data-a="seg" data-k="casesView" data-v="${v}">${ic(i)}${l}</button>`).join('')}</div>
    <button class="btn btn-p" data-a="quick" data-k="case">${ic('plus')}قضية جديدة</button></div></div>
  <div class="saved">${SAVED.map(([k, l, f]) => `<button class="${S.casesSaved === k ? 'on' : ''}" data-a="casesSaved" data-v="${k}">${l}<span class="n">${f().length}</span></button>`).join('')}</div>
  <div class="toolbar">
    <div class="inp-ico">${ic('search')}<input class="inp" id="casesQ" placeholder="ابحث بالاسم أو رقم القضية أو الخصم" value="${esc(S.casesQ)}"></div>
    ${Object.keys(CF_DEF).map((k) => `<button class="chip ${S.cf[k] ? 'on' : ''}" data-a="cfPick" data-k="${k}">${cfLabel(k)}${S.cf[k] ? `<span class="x" data-a="cfClear" data-k="${k}">${ic('x')}</span>` : ic('chevD')}</button>`).join('')}
    ${Object.values(S.cf).some(Boolean) ? `<button class="btn btn-sm btn-q" data-a="cfReset">مسح الفلاتر</button>` : ''}
    <div class="end"><button class="btn btn-sm btn-q" data-a="casesSortPick">${ic('filter')}الترتيب: ${{ next: 'الجلسة القادمة', pri: 'الأولوية', claim: 'قيمة المطالبة', stale: 'الأطول ركودًا' }[S.casesSort]}</button></div>
  </div>
  <div id="casesBody">${casesBody()}</div>`;
};
function casesBody() {
  const L = filteredCases();
  if (!L.length) return empty('لا توجد قضايا مطابقة', 'جرّب إزالة أحد الفلاتر أو تغيير كلمات البحث. البحث يشمل رقم القضية واسم الخصم والمحكمة.', 'مسح الفلاتر', 'cfReset');
  return { list: caseList, cards: caseCards, kanban: caseKanban, gantt: caseGantt }[S.casesView](L);
}
function nextCell(c) {
  const n = nextSession(c.id);
  if (!n) return `<span class="muted">لا جلسة محددة</span>`;
  const d = dayDiff(n.at);
  return `<b style="font-weight:600;${d <= 1 ? 'color:var(--red)' : d <= 7 ? 'color:var(--navy)' : ''}">${rel(n.at)}</b><small>${dm(n.at)} — ${hm(n.at)}</small>`;
}
function caseList(L) {
  return `<div class="clist"><div class="chead"><span></span><button data-a="casesSort" data-v="pri">القضية</button><span>النوع</span><span>الحالة</span><button data-a="casesSort" data-v="next">الجلسة القادمة${ic('chevD', 'width="12" height="12"')}</button><span class="c-dl">المهلة / آخر إجراء</span><span>الفريق</span><button class="c-claim" data-a="casesSort" data-v="claim">المطالبة</button><span></span></div>
  ${L.map((c) => { const f = caseFlags(c); return `<div class="crow" data-a="openCase" data-id="${c.id}" data-ctx="case:${c.id}" data-peek="${c.id}">
    <span class="pri p-${c.pri}"></span>
    <div style="min-width:0"><div class="ttl ell">${c.title}${f.length ? `<span class="flagi" data-tip="${esc(f.map((x) => x.t).join('<br>'))}">${ic('alert')}</span>` : ''}</div><div class="par ell">${c.subj} — <span class="ltr num">${c.no}</span></div></div>
    <div class="cell">${typeTag(c.type)}</div>
    <div class="cell">${stBadge(c.status)}<small>${c.court.replace('المحكمة ', '').replace('محكمة ', '')}</small></div>
    <div class="cell c-next">${nextCell(c)}</div>
    <div class="cell c-dl">${c.dl ? `<span style="color:var(--red);font-weight:600">${rel(c.dl.d)}</span><small class="ell">${c.dl.t}</small>` : `<span class="${staleDays(c) >= 14 ? '' : ''}">${rel(c.last.d)}</span><small class="ell">${c.last.t}</small>`}</div>
    ${avs([c.lead, ...c.team.slice(0, 2)])}
    <div class="cell c-claim num">${c.claim ? sarK(c.claim) : '<span class="muted">—</span>'}</div>
    <button class="icon-btn more" data-a="caseMenu" data-id="${c.id}">${ic('more')}</button>
  </div>`; }).join('')}</div>`;
}
function caseCards(L) {
  return `<div class="cards">${L.map((c, i) => { const h = caseHealth(c); const n = nextSession(c.id); const f = caseFlags(c);
    return `<div class="ccard" style="animation:rbIn .5s var(--ease-out) ${i * 30}ms both" data-a="openCase" data-id="${c.id}" data-ctx="case:${c.id}">
    <div class="row">${typeTag(c.type)}<span style="margin-inline-start:auto">${stBadge(c.status)}</span></div>
    <div><div class="ttl">${c.title}</div><div class="muted" style="font-size:12.5px">${c.subj}</div></div>
    ${f.length ? `<div class="badge b-red" style="align-self:flex-start">${ic('alert', 'width="12" height="12"')}${f[0].t}</div>` : `<div class="muted" style="font-size:12px">آخر إجراء: ${c.last.t}</div>`}
    <div class="row gap8"><div class="hbar grow"><i style="width:${caseProgress(c)}%;background:${h >= 75 ? 'var(--green)' : h >= 55 ? 'var(--gold)' : 'var(--red)'}"></i></div><span class="muted num" style="font-size:11.5px">صحة ${h}</span></div>
    <div class="foot">${ic('cal', 'width="14" height="14"')}<span class="grow">${n ? `${rel(n.at)} — ${hm(n.at)}` : 'لا جلسة محددة'}</span>${avs([c.lead, ...c.team.slice(0, 2)])}</div></div>`; }).join('')}</div>`;
}
function caseKanban(L) {
  return `<div class="kanban">${Object.entries(STATUS).map(([k, s]) => { const cs = L.filter((c) => c.status === k);
    return `<div class="kcol" data-drop="case" data-v="${k}"><div class="kcol-h"><i style="background:${s.c}"></i>${s.l}<span class="n">${cs.length}</span></div><div class="kcards">${cs.map((c) => { const n = nextSession(c.id); const f = caseFlags(c);
      return `<div class="kcard" draggable="true" data-drag="${c.id}" data-a="openCase" data-id="${c.id}" data-ctx="case:${c.id}"><div class="row" style="margin-bottom:6px"><span class="pri-dot" style="background:${PRI[c.pri].c}"></span><span class="m grow">${c.type}</span>${f.length ? `<span style="color:var(--red)" data-tip="${esc(f.map((x) => x.t).join('<br>'))}">${ic('alert', 'width="14" height="14"')}</span>` : ''}</div><div class="ttl">${c.title}</div><div class="row" style="margin-top:10px"><span class="m grow">${n ? ic('cal', 'width="12" height="12" style="display:inline;vertical-align:-1px"') + ' ' + rel(n.at) : c.last.t}</span>${avs([c.lead, ...c.team.slice(0, 1)])}</div></div>`; }).join('') || '<div class="muted" style="font-size:12px;text-align:center;padding:18px 0">اسحب قضية إلى هنا</div>'}</div></div>`; }).join('')}</div>`;
}
function caseGantt(L) {
  const start = D(8, 1), end = D(10, 31); const span = (end - start) / DAY;
  const x = (d) => Math.max(0, Math.min(100, ((d - start) / DAY / span) * 100));
  const months = [['أغسطس', D(8, 16)], ['سبتمبر', D(9, 15)], ['أكتوبر', D(10, 16)]];
  const grid = [D(9, 1), D(10, 1)].map((d) => `<div class="g-grid" style="right:${x(d)}%"></div>`).join('');
  return `<div class="gantt"><div class="g-axis"><div style="padding:9px 16px">القضية</div><div class="months">${months.map(([l, d]) => `<span style="right:${x(d)}%">${l} 2026</span>`).join('')}</div></div>
  <div style="position:relative">${L.map((c) => {
    const ss = caseSessions(c.id).filter((s) => s.at >= start && s.at <= end);
    const pts = [c.last.d, ...ss.map((s) => s.at), c.dl?.d].filter(Boolean);
    const a = Math.min(...pts.map((p) => +p)), b = Math.max(...pts.map((p) => +p));
    return `<div class="g-row" data-a="openCase" data-id="${c.id}"><div class="nm ell">${c.title}<small>${STATUS[c.status].l}</small></div><div class="lane">${grid}
      <div class="g-bar" style="--c:${TYPES[c.type]};right:${x(new Date(a))}%;width:${Math.max(1, x(new Date(b)) - x(new Date(a)))}%"></div>
      ${ss.map((s) => `<div class="g-mk ${s.note ? 'vd' : ''}" style="right:${x(s.at)}%;background:${s.note ? '' : TYPES[c.type]}" data-tip="${esc((s.note || 'جلسة') + ' — ' + dm(s.at) + '<br><b>' + U(s.by).name + '</b>')}"></div>`).join('')}
      ${c.dl ? `<div class="g-mk dl" style="right:${x(c.dl.d)}%" data-tip="${esc(c.dl.t + '<br><b>' + dm(c.dl.d) + '</b>')}"></div>` : ''}</div></div>`; }).join('')}
    <div class="g-today" style="right:calc(260px + (100% - 260px) * ${x(TODAY) / 100})"></div></div>
  <div class="legend" style="padding:12px 16px 2px"><span><i style="--c:var(--navy);border-radius:50%"></i>جلسة</span><span><i style="--c:var(--gold);border-radius:50%"></i>نطق بالحكم</span><span><i style="--c:var(--red)"></i>مهلة نظامية</span><span><i class="ln" style="--c:var(--gold);width:14px"></i>اليوم</span></div></div>`;
}
/* The today-line position uses a calc that depends on grid; place it via hook for accuracy */
HOOKS.push((root) => {
  const t = $('.g-today', root); if (!t) return; const lane = $('.g-row .lane', root); if (!lane) return t.remove();
  const g = $('.gantt', root).getBoundingClientRect(), l = lane.getBoundingClientRect();
  const start = D(8, 1), end = D(10, 31); const p = (TODAY - start) / (end - start);
  t.style.right = (g.right - l.right + l.width * p) + 'px';
});

A.casesSaved = (el) => { S.casesSaved = el.dataset.v; rerender(); };
A.casesSort = (el) => { S.casesSort = el.dataset.v; rerender(); };
A.casesSortPick = (el) => openPop(el, [['next', 'الجلسة القادمة'], ['pri', 'الأولوية'], ['claim', 'قيمة المطالبة'], ['stale', 'الأطول ركودًا']].map(([v, l]) => ({ l, on: S.casesSort === v, f: () => { S.casesSort = v; rerender(); } })));
A.cfPick = (el) => { const k = el.dataset.k; openPop(el, [{ h: CF_DEF[k].l }, ...CF_DEF[k].opts().map(([v, l]) => ({ l, on: S.cf[k] === v, f: () => { S.cf[k] = v; rerender(); } }))], { alignStart: true }); };
A.cfClear = (el, e) => { e.stopPropagation(); delete S.cf[el.dataset.k]; rerender(); };
A.cfReset = () => { S.cf = {}; S.casesQ = ''; S.casesSaved = 'all'; rerender(); };
A.caseMenu = (el, e) => { e.stopPropagation(); openPop(el, CTX.case(el.dataset.id)); };
HOOKS.push((root) => {
  const q = $('#casesQ', root); if (!q) return;
  q.oninput = () => { S.casesQ = q.value; $('#casesBody').innerHTML = casesBody(); after($('#casesBody')); };
});

/* ---------- Generic drag & drop (kanban for cases and tasks) ---------- */
HOOKS.push((root) => {
  let dragId = null;
  $$('[data-drag]', root).forEach((c) => {
    c.ondragstart = (e) => { dragId = c.dataset.drag; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); };
    c.ondragend = () => { c.classList.remove('dragging'); $$('.kcol.over').forEach((k) => k.classList.remove('over')); };
  });
  $$('[data-drop]', root).forEach((col) => {
    col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
    col.ondragleave = (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); };
    col.ondrop = (e) => {
      e.preventDefault(); col.classList.remove('over'); const id = e.dataTransfer.getData('text/plain') || dragId; if (!id) return;
      if (col.dataset.drop === 'case') moveCase(id, col.dataset.v); else moveTask(id, col.dataset.v);
    };
  });
});
function moveCase(id, st) {
  const c = CS(id); if (c.status === st) return; const prev = c.status; c.status = st;
  rerender(); const card = $(`[data-drag="${id}"]`); card?.classList.add('landed');
  toast(`نُقلت «${c.title}» إلى ${STATUS[st].l}`, { undo: () => { c.status = prev; rerender(); } });
}

/* ==========================================================
   CASE WORKSPACE
   ========================================================== */
const CTABS = [['overview', 'نظرة عامة'], ['timeline', 'الخط الزمني'], ['sessions', 'الجلسات'], ['tasks', 'المهام'], ['docs', 'المستندات'], ['memos', 'المذكرات'], ['notes', 'الملاحظات'], ['client', 'العميل'], ['invoices', 'الفواتير'], ['team', 'الفريق']];
function caseTimeline(c) {
  if (TIMELINES[c.id]) return TIMELINES[c.id];
  const L = [{ ph: 'القيد والتحضير', d: c.opened, t: 'فتح ملف القضية', p: `استلام التوكيل من ${K(c.client).name} وتحديد نطاق العمل.`, by: c.lead, st: 'done' }];
  if (c.no !== '—') L.push({ ph: 'القيد والتحضير', d: new Date(+c.opened + 6 * DAY), t: 'قيد الدعوى', p: `قُيدت لدى ${c.court} — ${c.circuit}.`, by: c.lead, st: 'done' });
  caseSessions(c.id).filter((s) => s.at < sod(TODAY)).forEach((s) => L.push({ ph: 'المرافعة', d: s.at, t: s.note || 'جلسة', p: s.result || '', by: s.by, st: 'done' }));
  if (!L.some((x) => sameDay(x.d, c.last.d))) L.push({ ph: c.status === 'prep' || c.status === 'client' ? 'القيد والتحضير' : 'المرافعة', d: c.last.d, t: c.last.t, p: '', by: c.lead, st: 'done' });
  if (c.dl) L.push({ ph: 'المرافعة', d: c.dl.d, t: c.dl.t, p: 'مهلة نظامية — لا تقبل التمديد.', st: 'now' });
  caseSessions(c.id).filter((s) => s.at >= sod(TODAY)).slice(0, 2).forEach((s) => L.push({ ph: s.note ? 'الحكم وما بعده' : 'المرافعة', d: s.at, t: s.note || 'جلسة قادمة', p: `${s.kind} — ${U(s.by).name}`, st: 'future' }));
  if (!['verdict', 'exec'].includes(c.status)) L.push({ ph: 'الحكم وما بعده', d: null, t: 'صدور الحكم', p: 'متوقع بحسب سير الجلسات.', st: 'future' });
  L.sort((a, b) => (a.d ? +a.d : 9e15) - (b.d ? +b.d : 9e15));
  const i = L.findIndex((x) => x.st === 'future'); if (!L.some((x) => x.st === 'now') && i > 0) L[i - 1].st = 'now';
  TIMELINES[c.id] = L; return L;
}
function caseDocs(id) { return DOCS.filter((d) => d.case === id).sort((a, b) => b.date - a.date); }
function tabCount(c, k) { return { sessions: caseSessions(c.id).length, tasks: openTasks(c.id).length, docs: caseDocs(c.id).length, memos: (MEMOS[c.id] || []).length, notes: (NOTES[c.id] || []).length, invoices: INVOICES.filter((i) => i.case === c.id).length }[k]; }

VIEWS.case = () => {
  const c = CS(S.id); const n = nextSession(c.id); const cl = K(c.client);
  const tab = CTABS.some((t) => t[0] === S.tab) ? S.tab : 'overview';
  return `<div class="cw-h">
    <div class="cw-top"><div class="grow">
      <div class="row gap8" style="margin-bottom:6px">${typeTag(c.type)}<span class="faint">|</span>${stBadge(c.status)}${c.pri === 'high' ? priBadge('high') : ''}</div>
      <h1 class="h-disp">${c.title}</h1>
      <div class="cw-parties"><span>${c.subj}</span><span class="faint">|</span><a data-a="openClient" data-id="${c.client}" style="font-weight:600;cursor:pointer">${cl.name}</a><small>(${c.role})</small><span class="x">ضد</span><span>${c.opp}</span></div>
    </div>
    <div class="cw-acts">${n ? `<button class="btn btn-g" data-a="prep" data-id="${n.id}">${ic('scale')}تحضير للجلسة</button>` : ''}<button class="btn btn-s" data-a="quick" data-k="task" data-case="${c.id}">${ic('plus')}مهمة</button><button class="btn btn-s" data-a="caseTab" data-v="notes" data-compose="1">${ic('pen')}ملاحظة</button><button class="icon-btn" data-a="caseMenu" data-id="${c.id}">${ic('more')}</button></div></div>
    <div class="meta-strip">
      <div><span>رقم القضية</span><b><span class="ltr num">${c.no}</span>${c.no !== '—' ? `<button class="copy" data-a="copy" data-v="${c.no}" data-tip="نسخ">${ic('copy')}</button>` : ''}</b></div>
      <div><span>المحكمة</span><b title="${c.court}">${c.court}</b></div>
      <div><span>الدائرة</span><b>${c.circuit}</b></div>
      <div><span>الجلسة القادمة</span><b>${n ? `${dm(n.at)} <small>${rel(n.at)}</small>` : '—'}</b></div>
      <div><span>المحامي المسؤول</span><b>${av(c.lead, 'sm')}${U(c.lead).name}</b></div>
      <div><span>قيمة المطالبة</span><b>${c.claim ? sar(c.claim) : '—'}</b></div>
    </div></div>
  <div class="cw-tabs"><div class="tabs" id="ctabs">${CTABS.map(([k, l]) => { const cnt = tabCount(c, k); return `<button class="${tab === k ? 'on' : ''}" data-a="caseTab" data-v="${k}">${l}${cnt ? `<span class="n">${cnt}</span>` : ''}</button>`; }).join('')}</div></div>
  <div class="cw-body"><div class="tab-body" id="tabBody">${CASE_TABS[tab](c)}</div></div>`;
};
A.caseTab = (el) => {
  const v = el.dataset.v; S.tab = v; history.replaceState(null, '', `#/case/${S.id}/${v}`);
  $$('#ctabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); syncIndicators($('.cw-tabs'));
  const b = $('#tabBody'); b.innerHTML = CASE_TABS[v](CS(S.id)); b.classList.remove('tab-body'); void b.offsetWidth; b.classList.add('tab-body'); after(b);
  if (el.dataset.compose) setTimeout(() => A.composer({ dataset: { k: 'note' } }), 50);
  const top = $('.cw-tabs'); if (top.getBoundingClientRect().top < 70) $('#scroll').scrollTo({ top: top.offsetTop - 2 });
};
function refreshTab() { const b = $('#tabBody'); if (b && S.route === 'case') { b.innerHTML = CASE_TABS[S.tab in CASE_TABS ? S.tab : 'overview'](CS(S.id)); after(b); $$('#ctabs button').forEach((x) => { const k = x.dataset.v; const cnt = tabCount(CS(S.id), k); const n = x.querySelector('.n'); if (cnt) { if (n) n.textContent = cnt; else x.insertAdjacentHTML('beforeend', `<span class="n">${cnt}</span>`); } }); } }

function taskLi(t, showCase = false) {
  const late = isLate(t);
  return `<div class="task-li" data-task="${t.id}"><button class="chk ${t.st === 'done' ? 'on' : ''}" data-a="toggleTask" data-id="${t.id}" aria-label="إكمال">${ic('check')}</button>
   <div class="t ${t.st === 'done' ? 'done-t' : ''}" data-a="openTask" data-id="${t.id}" style="cursor:pointer">${t.t}${showCase && t.case ? `<div class="muted" style="font-size:11.5px">${CS(t.case).title}</div>` : ''}</div>
   ${t.st === 'review' ? '<span class="badge b-gold">للمراجعة</span>' : ''}${av(t.who, 'sm')}<span class="due ${late ? 'late' : ''}">${late ? 'متأخرة — ' : ''}${rel(t.due)}${hasTime(t.due) && dayDiff(t.due) === 0 ? ' ' + hm(t.due) : ''}</span></div>`;
}
const docIcon = (d) => d.type === 'حكم' ? 'gavel' : d.type === 'عقد' ? 'pen' : d.type === 'مراسلة' ? 'mail' : 'file';
function docLi(d) { return `<div class="li" data-a="openDoc" data-id="${d.id}"><div class="ic">${ic(docIcon(d))}</div><div class="grow" style="min-width:0"><div class="t ell">${d.name}</div><div class="m">${d.type} — الإصدار ${d.ver} — ${U(d.by).short}، ${rel(d.date)}</div></div><span class="badge b-ghost ltr" style="font-size:10px">${d.ext.toUpperCase()}</span></div>`; }

const CASE_TABS = {
  overview(c) {
    const tl = caseTimeline(c); const done = tl.filter((x) => x.st === 'done');
    const nowI = tl.find((x) => x.st === 'now'); const n = nextSession(c.id); const h = caseHealth(c); const f = caseFlags(c);
    const tasks = openTasks(c.id); const docs = caseDocs(c.id).slice(0, 4);
    const facs = [['المهل النظامية', c.dl && dayDiff(c.dl.d) <= 3 ? 45 : 92], ['انتظام الإجراءات', Math.max(20, 100 - staleDays(c) * 4)], ['اكتمال المستندات', c.status === 'client' ? 40 : 84], ['المهام في وقتها', tasks.some(isLate) ? 50 : 95]];
    const ns = c.id === 'c1' ? { t: 'تقديم مذكرة التعقيب قبل 4:30 م اليوم', m: 'المسودة النهائية (الإصدار 4) جاهزة من سارة، وتحتاج مراجعتك الأخيرة.', a: `<button class="btn btn-p" data-a="openTask" data-id="t2">فتح المهمة</button><button class="btn btn-s" data-a="openDoc" data-id="d1">المسودة</button>` }
      : nowI ? { t: nowI.t, m: nowI.d ? `${rel(nowI.d)} — ${dm(nowI.d)}` : '', a: tasks[0] ? `<button class="btn btn-p" data-a="openTask" data-id="${tasks[0].id}">المهمة المرتبطة</button>` : '' }
      : tasks[0] ? { t: tasks[0].t, m: `مسندة إلى ${U(tasks[0].who).name} — ${rel(tasks[0].due)}`, a: `<button class="btn btn-p" data-a="openTask" data-id="${tasks[0].id}">فتح المهمة</button>` } : { t: 'لا توجد خطوة محددة', m: 'أضف مهمة لتحديد الإجراء القادم في القضية.', a: `<button class="btn btn-p" data-a="quick" data-k="task" data-case="${c.id}">إضافة مهمة</button>` };
    return `<div class="grid g12">
    <div class="s8">
      <div class="next-step"><div class="ic">${ic('flag')}</div><div class="grow"><div class="lbl">الخطوة القادمة</div><div class="t">${ns.t}</div><div class="m">${ns.m}</div></div><div class="row">${ns.a}</div></div>
      ${f.length ? `<div class="alert-bar" style="background:var(--red-bg);color:#7a2c1b">${ic('alert', 'style="color:var(--red)"')}<span>${f.map((x) => x.t).join('، ')}</span></div>` : ''}
      <div class="sec-h"><div class="sec-t">آخر التطورات</div><div class="act"><button class="btn btn-sm btn-q" data-a="caseTab" data-v="timeline">الخط الزمني كاملًا${ic('chevL')}</button></div></div>
      <div class="tl" style="--prog:100%;margin-bottom:26px">${done.slice(-3).reverse().map((e) => tlItem(e)).join('')}</div>
      <div class="grid two">
        <div><div class="sec-h"><div class="sec-t">المهام المفتوحة<small>${tasks.length}</small></div><div class="act"><button class="btn btn-sm btn-q" data-a="quick" data-k="task" data-case="${c.id}">${ic('plus')}</button></div></div>${tasks.length ? tasks.slice(0, 5).map((t) => taskLi(t)).join('') : '<p class="muted" style="font-size:13px;padding:8px">لا مهام مفتوحة في هذه القضية.</p>'}</div>
        <div><div class="sec-h"><div class="sec-t">أحدث المستندات</div><div class="act"><button class="btn btn-sm btn-q" data-a="caseTab" data-v="docs">الكل${ic('chevL')}</button></div></div>${docs.length ? docs.map(docLi).join('') : '<p class="muted" style="font-size:13px;padding:8px">لم تُرفع مستندات بعد.</p>'}</div>
      </div>
    </div>
    <aside class="s4" style="display:flex;flex-direction:column;gap:22px">
      <div class="sunk pad"><div class="sec-t" style="margin-bottom:12px">صحة القضية</div><div class="health">${gauge(h, 120)}<div class="hfac">${facs.map(([l, v]) => `<div>${l}<div class="hbar"><i style="width:${v}%;background:${v >= 75 ? 'var(--green)' : v >= 55 ? 'var(--gold)' : 'var(--red)'}"></i></div></div>`).join('')}</div></div></div>
      ${n ? `<div class="panel pad"><div class="sec-t" style="margin-bottom:10px">الجلسة القادمة</div><div style="font-size:24px;font-weight:600;color:var(--navy-xdk);line-height:1.2">${wd(n.at)} ${dm(n.at)}</div><div class="muted" style="font-size:13px;margin:4px 0 12px">${hm(n.at)} — ${n.kind} — ${c.circuit}</div><div class="row gap8"><button class="btn btn-sm btn-g" data-a="prep" data-id="${n.id}">تحضير للجلسة</button><button class="btn btn-sm btn-s" data-a="openSession" data-id="${n.id}">التفاصيل</button></div></div>` : ''}
      <div><div class="sec-t" style="margin-bottom:8px">تواريخ مهمة</div>
        ${[['فتح الملف', c.opened], c.dl ? [c.dl.t, c.dl.d] : null, n ? ['الجلسة القادمة', n.at] : null, ['آخر إجراء', c.last.d]].filter(Boolean).map(([l, d]) => `<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line);font-size:13px"><span class="grow muted">${l}</span><b style="font-weight:500">${dm(d)}</b></div>`).join('')}</div>
      <div><div class="sec-h" style="margin-bottom:6px"><div class="sec-t">الفريق</div><div class="act"><button class="btn btn-sm btn-q" data-a="caseTab" data-v="team">إدارة</button></div></div>
        ${[c.lead, ...c.team].map((id, i) => `<div class="li" data-a="member" data-id="${id}">${av(id, '', true)}<div class="grow"><div class="t">${U(id).name}</div><div class="m">${i === 0 ? 'المحامي المسؤول' : U(id).role}</div></div></div>`).join('')}</div>
    </aside></div>`;
  },
  timeline(c) {
    const tl = caseTimeline(c); const doneN = tl.filter((x) => x.st === 'done').length;
    let ph = ''; const items = tl.map((e, i) => { const head = e.ph !== ph ? `<div class="tl-phase">${e.ph}</div>` : ''; ph = e.ph; return head + tlItem(e, i); }).join('');
    return `<div class="grid g12"><div class="s8">
      <div class="sec-h"><div class="sec-t">مسار القضية<small>${doneN} حدثًا مكتملًا من ${tl.length}</small></div><div class="act"><button class="btn btn-sm btn-p" data-a="composer" data-k="event">${ic('plus')}إضافة حدث</button></div></div>
      <div class="composer" id="composer-event"><div class="form-grid"><div class="field"><label>الحدث</label><select class="inp" id="evT"><option>جلسة</option><option>تقديم مذكرة</option><option>استلام مذكرة الخصم</option><option>تأجيل</option><option>قرار الدائرة</option><option>تواصل مع العميل</option><option>حكم</option></select></div><div class="field"><label>التاريخ</label><input class="inp" id="evD" type="date" value="2026-09-10"></div><div class="field full"><label>التفاصيل</label><textarea class="inp" id="evP" placeholder="ماذا حدث؟ وما أثره على القضية؟"></textarea></div></div><div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn btn-q" data-a="composer" data-k="event">إلغاء</button><button class="btn btn-p" data-a="addEvent">إضافة إلى الخط الزمني</button></div></div>
      <div class="tl" id="tlList" style="--prog:${Math.round((doneN / tl.length) * 100)}%">${items}</div></div>
      <aside class="s4"><div class="sunk pad"><div class="sec-t" style="margin-bottom:12px">المرحلة الحالية</div>
        ${['القيد والتحضير', 'المرافعة', 'الحكم وما بعده'].map((p, i) => { const cur = (tl.find((x) => x.st === 'now') || tl[doneN - 1] || tl[0]).ph; const idx = ['القيد والتحضير', 'المرافعة', 'الحكم وما بعده'].indexOf(cur); return `<div class="row" style="padding:8px 0"><span class="chk ${i < idx ? 'on' : ''}" style="${i === idx ? 'box-shadow:inset 0 0 0 2px var(--gold);background:var(--gold-bg)' : ''}">${ic('check')}</span><span style="${i === idx ? 'font-weight:600' : i > idx ? 'color:var(--mute)' : ''}">${p}</span></div>`; }).join('')}
        <div class="divider"></div><p class="muted" style="font-size:12.5px;line-height:1.7">اضغط أي حدث لعرض المستندات والملاحظات المرتبطة به. الأحداث الباهتة متوقعة ولم تحدث بعد.</p></div></aside></div>`;
  },
  sessions(c) {
    const ss = caseSessions(c.id);
    if (!ss.length) return empty('لا جلسات مسجلة', 'لم تُقيد الدعوى بعد أو لم يُحدد موعد الجلسة الأولى.', 'إضافة جلسة', 'quickSession');
    return `<div class="sec-h"><div class="sec-t">جلسات القضية<small>${ss.length}</small></div><div class="act"><button class="btn btn-sm btn-s" data-a="quickSession">${ic('plus')}جلسة</button></div></div>
    ${ss.slice().reverse().map((s) => { const past = s.at < sod(TODAY); return `<div class="memo" style="${!past ? 'background:var(--gold-bg);box-shadow:none' : ''}"><div class="row gap16"><div style="text-align:center;min-width:56px;line-height:1.2"><b style="font-size:22px;font-weight:600;display:block">${s.at.getDate()}</b><small class="muted">${dm(s.at).split(' ')[1]}</small></div><div class="grow"><div style="font-weight:600">${s.note || (past ? 'جلسة منعقدة' : 'جلسة قادمة')} — ${hm(s.at)}</div><div class="muted" style="font-size:12.5px">${s.kind} — ${U(s.by).name}</div>${s.result ? `<p style="font-size:13px;margin-top:6px">${s.result}</p>` : ''}</div></div>
      <div class="row">${past ? (s.result ? '<span class="badge b-green">سُجلت النتيجة</span>' : `<button class="btn btn-sm btn-p" data-a="result" data-id="${s.id}">إضافة النتيجة</button>`) : `<button class="btn btn-sm btn-g" data-a="prep" data-id="${s.id}">تحضير</button><button class="btn btn-sm btn-s" data-a="result" data-id="${s.id}">النتيجة</button>`}<button class="btn btn-sm btn-q" data-a="openSession" data-id="${s.id}">${ic('eye')}</button></div></div>`; }).join('')}`;
  },
  tasks(c) {
    const all = TASKS.filter((t) => t.case === c.id); const open = all.filter((t) => t.st !== 'done'), done = all.filter((t) => t.st === 'done');
    return `<div class="quick-add"><span class="ph">${ic('plus')}</span><input id="caseQA" placeholder="أضف مهمة لهذه القضية واضغط Enter — مثال: طلب صورة الوكالة غدًا"><span class="kbd">Enter</span></div>
      <div id="caseTasks">${open.length ? open.map((t) => taskLi(t)).join('') : '<p class="muted" style="padding:8px">لا مهام مفتوحة.</p>'}</div>
      ${done.length ? `<div class="tgroup" style="margin-top:22px"><h5>مكتملة (${done.length})</h5>${done.map((t) => taskLi(t)).join('')}</div>` : ''}`;
  },
  docs(c) {
    const ds = caseDocs(c.id);
    return `<div class="dropzone" id="caseDrop" style="margin-bottom:18px">${ic('upload')}<b style="color:var(--ink);font-weight:600">اسحب الملفات هنا</b> أو <button class="btn-link" data-a="fakeUpload">اختر من جهازك</button><div style="font-size:12px;margin-top:2px">تُربط تلقائيًا بهذه القضية، ويُحفظ كل تعديل كإصدار جديد</div></div><div id="upList"></div>
    ${ds.length ? `<div class="dgrid">${ds.map(docTile).join('')}</div>` : empty('لا مستندات بعد', 'ارفع صحيفة الدعوى أو الوكالة لتبدأ ملف القضية الرقمي.')}`;
  },
  memos(c) {
    const ms = MEMOS[c.id] || caseDocs(c.id).filter((d) => d.type === 'مذكرة' || d.type === 'صحيفة دعوى').map((d) => ({ t: d.name, by: d.by, st: d.name.includes('مسودة') ? 1 : 4, d: d.date, doc: d.id }));
    const steps = ['مسودة', 'مراجعة', 'اعتماد', 'تقديم'];
    if (!ms.length) return empty('لا مذكرات بعد', 'أنشئ أول مذكرة في هذه القضية من قالب أو ارفعها مباشرة.', 'مذكرة جديدة', 'fakeUpload');
    return ms.map((m, i) => `<div class="memo"><div><div style="font-weight:600;font-size:14px">${m.t}</div><div class="muted" style="font-size:12px">${U(m.by).name} — ${rel(m.d)}</div>
      <div class="steps">${steps.map((s, j) => `${j ? '<em></em>' : ''}<span class="${j < m.st ? 'd' : j === m.st ? 'c' : ''}"><i>${j < m.st ? ic('check') : ''}</i>${s}</span>`).join('')}</div></div>
      <div class="row">${m.st === 2 ? `<button class="btn btn-sm btn-p" data-a="approveMemo" data-i="${i}">اعتماد</button>` : ''}<button class="btn btn-sm btn-s" data-a="openDoc" data-id="${m.doc}">فتح</button></div></div>`).join('');
  },
  notes(c) {
    const ns = NOTES[c.id] || (NOTES[c.id] = []);
    return `<div class="grid g12"><div class="s8"><button class="btn btn-s" data-a="composer" data-k="note" style="margin-bottom:14px">${ic('pen')}ملاحظة جديدة</button>
      <div class="composer" id="composer-note"><textarea class="inp" id="noteT" placeholder="اكتب ملاحظة داخلية لا تظهر للعميل…"></textarea><div class="row" style="margin-top:10px"><label class="row" style="font-size:13px;gap:6px"><input type="checkbox" id="notePin"> تثبيت أعلى الملاحظات</label><span class="grow"></span><button class="btn btn-q" data-a="composer" data-k="note">إلغاء</button><button class="btn btn-p" data-a="addNote">حفظ</button></div></div>
      <div id="notesList">${ns.length ? ns.slice().sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.at - a.at).map(noteHtml).join('') : empty('لا ملاحظات بعد', 'دوّن ما لا يُكتب في المذكرات: الموقف التفاوضي، انطباعات الجلسة، وتفاصيل التواصل.')}</div></div>
      <aside class="s4"><div class="sunk pad" style="font-size:13px;line-height:1.8"><div class="sec-t" style="margin-bottom:6px">${ic('lock', 'width="15" height="15"')}ملاحظات داخلية</div><span class="muted">تظهر لفريق القضية فقط، ولا تُضمَّن في أي تقرير يُرسل للعميل.</span></div></aside></div>`;
  },
  client(c) {
    const k = K(c.client); const others = CASES.filter((x) => x.client === k.id && x.id !== c.id); const inv = INVOICES.filter((i) => i.client === k.id);
    return `<div class="grid g12"><div class="s8"><div class="cl-hero">${clientAv(k.id, 'xl')}<div class="grow"><h2 class="h-disp h2">${k.name}</h2><div class="muted">${k.kind}${k.contact ? ' — ' + k.contact : ''} — عميل منذ ${dmy(k.since)}</div><div class="contact-chips"><span class="chip">${ic('phone')}<span class="ltr">${k.phone}</span></span><span class="chip">${ic('mail')}<span class="ltr">${k.email}</span></span></div></div><button class="btn btn-s" data-a="openClient" data-id="${k.id}">ملف العميل الكامل</button></div>
      <div class="kpi-strip"><div><span>قضايا نشطة</span><b>${others.length + 1}</b></div><div><span>إجمالي الفوترة</span><b>${sarK(inv.reduce((a, b) => a + b.amt, 0))}</b></div><div><span>مستحق</span><b style="color:var(--red)">${sarK(inv.filter((i) => i.st !== 'paid').reduce((a, b) => a + b.amt, 0))}</b></div><div><span>آخر تواصل</span><b style="font-size:16px">${rel(k.last)}</b></div></div>
      ${others.length ? `<div class="sec-t" style="margin-bottom:8px">قضايا أخرى لنفس العميل</div>${others.map((o) => `<div class="li" data-a="openCase" data-id="${o.id}"><div class="ic">${ic('cases')}</div><div class="grow"><div class="t">${o.title}</div><div class="m">${STATUS[o.status].l} — ${o.type}</div></div></div>`).join('')}` : ''}</div>
      <aside class="s4"><div class="sunk pad"><dl class="kv"><dt>المدينة</dt><dd>${k.city}</dd><dt>مصدر العميل</dt><dd>${k.source}</dd><dt>مسؤول العلاقة</dt><dd>${U(k.owner).name}</dd>${k.vat ? `<dt>الرقم الضريبي</dt><dd class="ltr num">${k.vat}</dd>` : ''}<dt>أتعاب القضية</dt><dd>${sar(c.fee)}</dd></dl></div></aside></div>`;
  },
  invoices(c) {
    const inv = INVOICES.filter((i) => i.case === c.id); const paid = inv.filter((i) => i.st === 'paid').reduce((a, b) => a + b.amt, 0);
    return `<div class="grid g12"><div class="s8">${inv.length ? `<div class="inv-row h"><span>الرقم</span><span>العميل</span><span>القيمة</span><span>الإصدار</span><span>الاستحقاق</span><span>الحالة</span><span></span></div>${inv.map(invRow).join('')}` : empty('لا فواتير لهذه القضية', 'أنشئ فاتورة مرحلية مرتبطة بأتعاب القضية.', 'فاتورة جديدة', 'quickInvoice')}</div>
    <aside class="s4"><div class="sunk pad"><div class="sec-t" style="margin-bottom:12px">الأتعاب</div><div class="row gap16">${ring(Math.round((paid / c.fee) * 100), 92, 8, 'var(--green)', 'var(--sunk-2)', `<b style="font-size:17px">${Math.round((paid / c.fee) * 100)}%</b>`)}<div style="font-size:13px;line-height:1.9"><div class="muted">المتفق عليه</div><b>${sar(c.fee)}</b><div class="muted">المحصّل</div><b style="color:var(--green)">${sar(paid)}</b></div></div></div></aside></div>`;
  },
  team(c) {
    const roles = [[c.lead, 'المحامي المسؤول', 'Lead Lawyer']].concat(c.team.map((id) => [id, U(id).role.includes('سكرتير') ? 'سكرتارية القضية' : U(id).role.includes('متدرب') ? 'متدرب مساند' : 'محامٍ مساند', '']));
    return `<div class="grid g12"><div class="s7">${roles.map(([id, r]) => { const u = U(id); const tk = TASKS.filter((t) => t.case === c.id && t.who === id && t.st !== 'done').length; return `<div class="role-row">${av(id, 'lg', true)}<div class="grow"><b>${u.name}</b><div class="muted" style="font-size:12.5px">${r} — ${u.status}</div></div><span class="badge">${tk} مهام مفتوحة</span>${id !== c.lead ? `<button class="icon-btn" data-a="removeMember" data-id="${id}" data-tip="إزالة من القضية">${ic('x')}</button>` : ''}</div>`; }).join('')}
      <button class="btn btn-s" data-a="addMember" style="margin-top:6px">${ic('plus')}إضافة عضو للقضية</button></div>
      <aside class="s5"><div class="sunk pad"><div class="sec-t" style="margin-bottom:10px">الصلاحيات</div><div style="font-size:13px;line-height:2">${[['المحامي المسؤول', 'كامل: اعتماد المذكرات، الفواتير، الإغلاق'], ['المحامي المساند', 'تعديل المستندات والمهام والجلسات'], ['المتدرب', 'مسودات ومهام تتطلب اعتمادًا'], ['السكرتارية', 'المواعيد والمستندات والتواصل']].map(([a, b]) => `<div><b style="font-weight:600">${a}</b> <span class="muted">— ${b}</span></div>`).join('')}</div></div></aside></div>`;
  },
};
function tlItem(e, i = 0) {
  const docs = (e.docs || []).map((id) => byId(DOCS, id)).filter(Boolean);
  const hasMore = docs.length || e.note || e.by;
  return `<div class="tl-i ${e.st}" ${hasMore ? 'data-a="tlToggle"' : ''} ${e._new ? 'style="animation:flashIn 1.4s var(--ease-out)"' : ''}>
    <div class="top"><b>${e.t}</b>${e.st === 'now' ? '<span class="badge b-gold">الآن</span>' : ''}<time>${e.d ? dm(e.d) + (hasTime(e.d) && e.st !== 'done' ? ' — ' + hm(e.d) : '') : 'متوقع'}</time></div>
    ${e.p ? `<p>${e.p}</p>` : ''}
    ${hasMore ? `<div class="tl-more"><div><div class="inner">${e.by ? `<div class="row gap8" style="font-size:12px;color:var(--mute)">${av(e.by, 'sm')}سجّله ${U(e.by).name}</div>` : ''}${e.note ? `<div class="note" style="margin:0;background:#fff"><p style="font-size:12.5px">${e.note}</p></div>` : ''}${docs.length ? `<div class="row gap6" style="flex-wrap:wrap">${docs.map((d) => `<button class="doc-pill" data-a="openDoc" data-id="${d.id}">${ic('file')}${d.name}</button>`).join('')}</div>` : ''}</div></div></div>` : ''}</div>`;
}
function docTile(d) {
  return `<div class="dtile" data-a="openDoc" data-id="${d.id}" data-ctx="doc:${d.id}"><div class="thumb"><span class="ext ${d.ext}">${d.ext.toUpperCase()}</span><div class="paper"><i class="h"></i><i></i><i style="width:90%"></i><i></i><i style="width:70%"></i><i></i><i style="width:80%"></i></div></div><div class="info"><b>${d.name}</b><small>${d.type} — v${d.ver} — ${rel(d.date)}</small></div></div>`;
}
function noteHtml(n) { return `<div class="note ${n.pin ? 'pin' : ''} ${n._new ? 'flash-in' : ''}"><div class="by">${av(n.by, 'sm')}<b style="color:var(--ink)">${U(n.by).name}</b><span>${ago(n.at)}</span>${n.pin ? `<span class="badge b-gold" style="margin-inline-start:auto">مثبتة</span>` : ''}</div><p>${esc(n.t)}</p></div>`; }
function invRow(i) {
  const k = K(i.client); const b = i.st === 'paid' ? '<span class="badge b-green">مدفوعة</span>' : i.st === 'overdue' ? `<span class="badge b-red">متأخرة ${pDays(-dayDiff(i.due))}</span>` : '<span class="badge b-blue">مستحقة</span>';
  return `<div class="inv-row" data-ctx="inv:${i.id}"><span class="ltr num" style="font-size:12px;color:var(--mute)">${i.id}</span><span class="ell" style="font-weight:500">${k.name}</span><b class="num" style="font-weight:600">${sar(i.amt)}</b><span class="muted">${dm(i.issued)}</span><span class="${i.st === 'overdue' ? '' : 'muted'}">${dm(i.due)}</span><span>${b}</span><button class="icon-btn" data-a="invMenu" data-id="${i.id}">${ic('more')}</button></div>`;
}

A.tlToggle = (el, e) => { if (e.target.closest('[data-a="openDoc"]')) return; el.classList.toggle('open'); };
A.composer = (el) => { const c = $('#composer-' + el.dataset.k); if (!c) return; c.classList.toggle('show'); if (c.classList.contains('show')) c.querySelector('textarea, select, input')?.focus(); };
A.addEvent = () => {
  const c = CS(S.id); const t = $('#evT').value, p = $('#evP').value.trim(); const [y, m, d] = $('#evD').value.split('-').map(Number);
  const ev = { ph: 'المرافعة', d: new Date(y, m - 1, d, 12), t, p: p || 'أُضيف يدويًا.', by: 'u1', st: 'done', _new: true };
  const tl = caseTimeline(c); const idx = tl.findIndex((x) => x.st !== 'done'); tl.splice(idx < 0 ? tl.length : idx, 0, ev);
  c.last = { t: t + (p ? ': ' + p.slice(0, 40) : ''), d: ev.d };
  refreshTab(); setTimeout(() => { ev._new = false; }, 1500);
  toast('أُضيف الحدث إلى الخط الزمني');
};
A.addNote = () => {
  const t = $('#noteT').value.trim(); if (!t) return $('#noteT').focus();
  const n = { by: 'u1', at: nowDate(), t, pin: $('#notePin').checked, _new: true };
  (NOTES[S.id] || (NOTES[S.id] = [])).push(n); refreshTab(); setTimeout(() => { n._new = false; }, 1500);
  toast('حُفظت الملاحظة', { undo: () => { NOTES[S.id].splice(NOTES[S.id].indexOf(n), 1); refreshTab(); } });
};
A.approveMemo = (el) => { const m = MEMOS[S.id][+el.dataset.i]; m.st = 3; refreshTab(); toast(`اعتُمدت «${m.t}» وأصبحت جاهزة للتقديم`); };
A.removeMember = (el) => { const c = CS(S.id); const id = el.dataset.id; const i = c.team.indexOf(id); c.team.splice(i, 1); refreshTab(); toast(`أُزيل ${U(id).name} من فريق القضية`, { undo: () => { c.team.splice(i, 0, id); refreshTab(); } }); };
A.addMember = (el) => { const c = CS(S.id); openPop(el, TEAM.filter((t) => t.id !== c.lead && !c.team.includes(t.id)).map((t) => ({ l: `${t.name} — ${t.role}`, ic: 'user', f: () => { c.team.push(t.id); refreshTab(); toast(`أُضيف ${t.name} إلى فريق القضية`); } })), { alignStart: true }); };
HOOKS.push((root) => {
  const q = $('#caseQA', root); if (!q) return;
  q.onkeydown = (e) => { if (e.key !== 'Enter' || !q.value.trim()) return; const t = { id: 't' + (++_tid), t: q.value.trim(), case: S.id, who: 'u1', pri: 'med', due: /غد/.test(q.value) ? D(9, 11) : D(9, 13), st: 'todo' };
    TASKS.push(t); q.value = ''; $('#caseTasks').insertAdjacentHTML('afterbegin', taskLi(t).replace('class="task-li"', 'class="task-li flash-in"')); toast('أُضيفت المهمة', { undo: () => { TASKS.splice(TASKS.indexOf(t), 1); refreshTab(); } }); };
});
