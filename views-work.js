/* ==========================================================
   CALENDAR / SESSIONS
   ========================================================== */
const WD_SHORT = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const weekStart = (d) => { const x = sod(d); x.setDate(x.getDate() - x.getDay()); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function calSessions() { return SESSIONS.filter((s) => S.calLaw.has(s.by) && (!S.calCourt || CS(s.case).court === S.calCourt)); }

VIEWS.calendar = () => {
  const a = S.calAnchor; const ws = weekStart(a);
  const title = S.calView === 'month' ? `${MONTHS[a.getMonth()]} ${a.getFullYear()}` : S.calView === 'day' ? `${wd(a)}، ${dmy(a)}` : `${ws.getDate()} – ${addDays(ws, 6).getDate()} ${MONTHS[addDays(ws, 6).getMonth()]} ${ws.getFullYear()}`;
  const weekN = calSessions().filter((s) => s.at >= ws && s.at < addDays(ws, 7)).length;
  return `<div class="page-h"><div><h1 class="h-disp h1">الجلسات</h1><div class="sub">${weekN} جلسات في الأسبوع المعروض، والجلسات عن بعد تُفتح مباشرة عبر ناجز</div></div>
    <div class="tools"><button class="btn btn-p" data-a="quickSession">${ic('plus')}جلسة جديدة</button></div></div>
  <div class="cal-bar">
    <div class="row gap4"><button class="icon-btn" data-a="calMove" data-d="-1" data-tip="السابق">${ic('chevR')}</button><button class="icon-btn" data-a="calMove" data-d="1" data-tip="التالي">${ic('chevL')}</button></div>
    <button class="btn btn-sm btn-s" data-a="calToday">اليوم</button><div class="title">${title}</div>
    <div class="seg">${[['day', 'يوم'], ['week', 'أسبوع'], ['month', 'شهر']].map(([v, l]) => `<button class="${S.calView === v ? 'on' : ''}" data-a="seg" data-k="calView" data-v="${v}">${l}</button>`).join('')}</div>
    <span class="grow"></span>
    <div class="lawyer-f">${TEAM.filter((t) => t.id !== 'u6').map((t) => `<button class="${S.calLaw.has(t.id) ? '' : 'off'}" data-a="calLaw" data-id="${t.id}">${av(t.id)}</button>`).join('')}</div>
    <button class="chip ${S.calCourt ? 'on' : ''}" data-a="calCourt">${S.calCourt || 'كل المحاكم'}${ic('chevD')}</button>
  </div>
  <div class="cal-wrap"><div>${S.calView === 'week' ? calWeek(ws) : S.calView === 'month' ? calMonth(a) : calDay(a)}</div>
  <aside class="cal-side">${calAgenda()}</aside></div>`;
};
function calWeek(ws) {
  const H0 = 8, H1 = 17, PX = 58; const now = nowDate();
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const head = `<div class="wk-h"></div>` + days.map((d, i) => `<div class="wk-h ${sameDay(d, TODAY) ? 'today' : ''} ${i >= 5 ? 'off' : ''}">${WD_SHORT[i]}<b>${d.getDate()}</b></div>`).join('');
  const times = `<div class="wk-times" style="height:${(H1 - H0) * PX}px">${[...Array(H1 - H0)].map((_, i) => `<span style="top:${i * PX}px">${i ? (H0 + i > 12 ? H0 + i - 12 : H0 + i) + ':00' : ''}</span>`).join('')}</div>`;
  const cols = days.map((d, i) => {
    const ss = calSessions().filter((s) => sameDay(s.at, d));
    const tasksM = TASKS.filter((t) => t.meet && sameDay(t.due, d));
    const lines = [...Array(H1 - H0)].map((_, k) => `<div class="hl" style="top:${k * PX}px"></div>`).join('');
    const ev = ss.map((s, j) => { const c = CS(s.case); const top = (s.at.getHours() + s.at.getMinutes() / 60 - H0) * PX; const h = Math.max(38, (s.dur / 60) * PX - 3);
      return `<div class="sess ${s.at < now && sameDay(s.at, TODAY) || dayDiff(s.at) < 0 ? 'past' : ''}" style="--c:${U(s.by).c};top:${top}px;height:${h}px;animation-delay:${j * 50}ms" data-a="openSession" data-id="${s.id}" data-tip="${esc(c.title + '<br><b>' + hm24(s.at) + ' — ' + U(s.by).name + '</b>')}"><b>${s.kind === 'عن بعد' ? `<span class="vid">${ic('video')}</span> ` : ''}${c.title.split(' ضد ')[0].replace('دعوى ', '')}</b><small>${hm24(s.at)} — ${c.court.replace('المحكمة ', '').replace('محكمة ', '')}</small></div>`; }).join('');
    const mt = tasksM.map((t) => { const top = (t.due.getHours() - H0) * PX; return `<div class="sess" style="--c:var(--gold);top:${top}px;height:${(t.dur / 60) * PX - 3}px;background:var(--gold-bg)" data-a="openTask" data-id="${t.id}"><b>${t.t}</b><small>${hm24(t.due)}</small></div>`; }).join('');
    const nl = sameDay(d, TODAY) ? `<div class="now-line" style="top:${(now.getHours() + now.getMinutes() / 60 - H0) * PX}px"></div>` : '';
    return `<div class="wk-col ${i >= 5 ? 'off' : ''} ${sameDay(d, TODAY) ? 'today' : ''}" style="height:${(H1 - H0) * PX}px">${lines}${ev}${mt}${nl}</div>`;
  }).join('');
  return `<div class="week">${head}${times}${cols}</div>`;
}
function calMonth(a) {
  const first = new Date(a.getFullYear(), a.getMonth(), 1); const st = weekStart(first);
  let cells = WD_SHORT.map((w) => `<div class="mh">${w}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = addDays(st, i); const ss = calSessions().filter((s) => sameDay(s.at, d));
    if (i >= 35 && d.getMonth() !== a.getMonth()) break;
    cells += `<div class="mcell ${d.getMonth() !== a.getMonth() ? 'out' : ''} ${sameDay(d, TODAY) ? 'today' : ''} ${d.getDay() >= 5 ? 'off' : ''}" data-a="calGoDay" data-t="${+d}"><span class="d">${d.getDate()}</span>${ss.slice(0, 3).map((s) => `<span class="mpill" style="--c:${U(s.by).c}" data-a="openSession" data-id="${s.id}">${hm24(s.at)} ${CS(s.case).title.split(' ضد ')[0]}</span>`).join('')}${ss.length > 3 ? `<span class="muted" style="font-size:11px">+${ss.length - 3} أخرى</span>` : ''}</div>`;
  }
  return `<div class="month">${cells}</div>`;
}
function calDay(a) {
  const ss = calSessions().filter((s) => sameDay(s.at, a)).sort((x, y) => x.at - y.at);
  if (!ss.length) return `<div class="panel">${empty('يوم خالٍ من الجلسات', a.getDay() >= 5 ? 'عطلة نهاية الأسبوع.' : 'لا جلسات في هذا اليوم للمحامين المحددين. وقت مناسب لإعداد المذكرات.', 'جلسة جديدة', 'quickSession')}</div>`;
  return ss.map((s) => { const c = CS(s.case); const n = s.at >= sod(TODAY); return `<div class="memo" style="grid-template-columns:auto 1fr auto"><div style="text-align:center;min-width:64px"><b style="font-size:20px;font-weight:600;display:block" class="ltr num">${hm24(s.at)}</b><small class="muted">${s.dur} دقيقة</small></div>
    <div><div style="font-weight:600;font-size:15px;cursor:pointer" data-a="openCase" data-id="${c.id}">${c.title}</div><div class="muted" style="font-size:12.5px">${c.court} — ${c.circuit}</div><div class="row gap8" style="margin-top:8px">${av(s.by, 'sm')}<span style="font-size:12.5px">${U(s.by).name}</span><span class="badge ${s.kind === 'عن بعد' ? 'b-blue' : ''}">${s.kind === 'عن بعد' ? ic('video', 'width="12" height="12"') : ic('pin', 'width="12" height="12"')}${s.kind}</span>${PREP[s.id] ? '<span class="badge b-green">محضر التحضير جاهز</span>' : ''}</div></div>
    <div class="row">${n ? `<button class="btn btn-sm btn-g" data-a="prep" data-id="${s.id}">تحضير</button>` : ''}<button class="btn btn-sm btn-s" data-a="result" data-id="${s.id}">النتيجة</button><button class="btn btn-sm btn-q" data-a="openSession" data-id="${s.id}">${ic('eye')}</button></div></div>`; }).join('');
}
function calAgenda() {
  const up = calSessions().filter((s) => s.at >= sod(TODAY)).sort((a, b) => a.at - b.at).slice(0, 9);
  const groups = {}; up.forEach((s) => { const k = sod(s.at).getTime(); (groups[k] = groups[k] || []).push(s); });
  const noPrep = up.filter((s) => !PREP[s.id] && dayDiff(s.at) <= 3 && dayDiff(s.at) > 0).length;
  return `<div class="sec-h"><div class="sec-t">القادمة</div></div>
  ${noPrep ? `<div class="alert-bar" style="font-size:12.5px;padding:10px 12px">${ic('alert')}<span>${noPrep === 1 ? 'جلسة قريبة' : noPrep + ' جلسات قريبة'} دون محضر تحضير</span></div>` : ''}
  ${Object.entries(groups).map(([k, ss]) => `<div class="agenda-d"><h5>${rel(new Date(+k))} — ${wd(new Date(+k))} ${dm(new Date(+k))}</h5>${ss.map((s) => `<div class="ag" data-a="openSession" data-id="${s.id}"><time>${hm24(s.at)}</time><div><b>${CS(s.case).title}</b><small>${U(s.by).short} — ${s.kind}${PREP[s.id] ? ' — محضر جاهز' : ''}</small></div></div>`).join('')}</div>`).join('')}`;
}
A.calMove = (el) => { const d = +el.dataset.d; const a = S.calAnchor; S.calAnchor = S.calView === 'month' ? new Date(a.getFullYear(), a.getMonth() + d, 1) : addDays(a, (S.calView === 'week' ? 7 : 1) * d); rerender(); };
A.calToday = () => { S.calAnchor = D(9, 10); rerender(); };
A.calGoDay = (el, e) => { if (e.target.closest('[data-a="openSession"]')) return; S.calAnchor = new Date(+el.dataset.t); S.calView = 'day'; rerender(); };
A.calLaw = (el) => { const id = el.dataset.id; S.calLaw.has(id) ? S.calLaw.delete(id) : S.calLaw.add(id); if (!S.calLaw.size) S.calLaw.add(id); rerender(); };
A.calCourt = (el) => openPop(el, [{ l: 'كل المحاكم', on: !S.calCourt, f: () => { S.calCourt = ''; rerender(); } }, ...[...new Set(CASES.map((c) => c.court))].map((c) => ({ l: c, on: S.calCourt === c, f: () => { S.calCourt = c; rerender(); } }))]);

/* ---------- Session panel, prep and result ---------- */
function sessionPanel(id) {
  const s = byId(SESSIONS, id); const c = CS(s.case); const past = s.at < nowDate() && !sameDay(s.at, TODAY) || s.result;
  const memo = caseDocs(c.id).find((d) => d.type === 'مذكرة'); const tl = caseTimeline(c).filter((x) => x.st === 'done').slice(-3).reverse();
  const tasks = openTasks(c.id).slice(0, 4); const ms = s.at - nowDate();
  return {
    head: `<div class="row gap8" style="margin-bottom:4px"><span class="badge ${s.kind === 'عن بعد' ? 'b-blue' : ''}">${s.kind}</span>${s.note ? `<span class="badge b-gold">${s.note}</span>` : ''}${!past && ms > 0 && ms < 3 * DAY ? `<span class="badge b-red">${ms < DAY ? 'بعد ' + pHours(Math.max(1, Math.round(ms / 36e5))) : rel(s.at)}</span>` : ''}</div><h2 class="h2" style="font-weight:600;line-height:1.35">${c.title}</h2><div class="muted" style="font-size:13px">${wd(s.at)} ${dm(s.at)} — ${hm(s.at)}</div>`,
    body: `${s.kind === 'عن بعد' && !past ? `<button class="btn btn-p" style="width:100%;margin-bottom:16px" data-a="stub" data-m="سيُفتح رابط الجلسة في ناجز قبل الموعد بـ 10 دقائق">${ic('video')}الدخول إلى الجلسة عبر ناجز</button>` : ''}
    <dl class="kv"><dt>المحكمة</dt><dd>${c.court}</dd><dt>الدائرة</dt><dd>${c.circuit}</dd><dt>رقم القضية</dt><dd class="ltr num">${c.no}</dd><dt>المحامي</dt><dd class="row gap6">${av(s.by, 'sm')}${U(s.by).name}</dd><dt>الموكل</dt><dd>${K(c.client).name}</dd></dl>
    ${s.result ? `<div class="dsec"><h4>${ic('check', 'width="15" height="15"')}نتيجة الجلسة</h4><div class="note"><p>${s.result}</p></div></div>` : ''}
    ${PREP[s.id] ? `<div class="dsec"><h4>${ic('scale', 'width="15" height="15"')}محضر التحضير</h4><div class="note pin"><p>${esc(PREP[s.id].points || 'تم إعداد المحضر')}</p></div></div>` : ''}
    ${memo ? `<div class="dsec"><h4>آخر مذكرة</h4>${docLi(memo)}</div>` : ''}
    <div class="dsec"><h4>آخر الأحداث</h4>${tl.map((e) => `<div class="row" style="padding:6px 0;font-size:13px;align-items:flex-start"><span class="muted" style="min-width:74px">${e.d ? dm(e.d) : ''}</span><span>${e.t}${e.p ? `<span class="muted"> — ${e.p}</span>` : ''}</span></div>`).join('')}</div>
    ${tasks.length ? `<div class="dsec"><h4>مهام قبل الجلسة</h4>${tasks.map((t) => taskLi(t)).join('')}</div>` : ''}`,
    foot: `${!s.result ? `<button class="btn btn-g" data-a="prep" data-id="${s.id}" data-push="1">${ic('scale')}تحضير للجلسة</button>` : ''}<button class="btn ${s.result ? 'btn-p' : 'btn-s'}" data-a="result" data-id="${s.id}" data-push="1">${s.result ? 'تعديل النتيجة' : 'إضافة نتيجة الجلسة'}</button><button class="btn btn-q" data-a="openCase" data-id="${c.id}" style="margin-inline-start:auto">القضية${ic('chevL')}</button>`,
  };
}
A.openSession = (el) => openDrawer(() => sessionPanel(el.dataset.id));
const openSession = (id) => openDrawer(() => sessionPanel(id));
A.prep = (el) => {
  const id = el.dataset.id; const s = byId(SESSIONS, id); const c = CS(s.case); const p = PREP[id] || (PREP[id] = { points: '', defenses: '', requests: '', questions: '', notes: '', docs: {} });
  const docs = caseDocs(c.id).slice(0, 5);
  const render = () => ({
    head: `<div class="muted" style="font-size:12px">تحضير للجلسة — ${wd(s.at)} ${dm(s.at)} ${hm(s.at)}</div><h2 class="h2" style="font-weight:600">${c.title}</h2>`,
    body: `${[['points', 'النقاط المطلوب إثارتها', 'مثال: الفواتير الموقعة تثبت الاستلام الكامل؛ الدفع بالتقادم لا ينطبق على فواتير 2025'], ['defenses', 'دفوع الخصم المتوقعة', 'ما الذي سيثيره الخصم، وكيف نرد عليه؟'], ['requests', 'الطلبات', 'ما الذي سنطلبه من الدائرة؟'], ['questions', 'أسئلة للدائرة أو الخصم', ''], ['notes', 'ملاحظات', '']].map(([k, l, ph]) => `<div class="prep-sec"><label><i></i>${l}</label><textarea class="inp" data-prep="${k}" placeholder="${ph}">${esc(p[k])}</textarea></div>`).join('')}
    <div class="prep-sec"><label><i></i>المستندات المطلوبة للجلسة</label>${docs.map((d) => `<div class="check-row"><button class="chk ${p.docs[d.id] ? 'on' : ''}" data-a="prepDoc" data-sid="${id}" data-id="${d.id}">${ic('check')}</button><span class="grow">${d.name}</span><span class="muted" style="font-size:11.5px">v${d.ver}</span></div>`).join('') || '<p class="muted" style="font-size:13px">لا مستندات مرفوعة في القضية.</p>'}</div>`,
    foot: `<span class="saved-ind" id="prepSaved">${ic('check')}حفظ تلقائي</span><button class="btn btn-s" data-a="stub" data-m="جُهّز ملف PDF لمحضر التحضير" style="margin-inline-start:auto">${ic('download')}تصدير</button><button class="btn btn-p" data-a="prepDone" data-id="${id}">اعتماد المحضر</button>`,
  });
  openDrawer(render, { push: !!el.dataset.push && $('#drawer').classList.contains('show') });
  setTimeout(() => $$('[data-prep]').forEach((t) => { t.oninput = () => { p[t.dataset.prep] = t.value; const ind = $('#prepSaved'); ind.innerHTML = 'جارٍ الحفظ…'; clearTimeout(t._t); t._t = setTimeout(() => { ind.innerHTML = ic('check') + 'حُفظ الآن'; }, 500); }; }), 50);
};
A.prepDoc = (el) => { const p = PREP[el.dataset.sid]; p.docs[el.dataset.id] = !p.docs[el.dataset.id]; el.classList.toggle('on'); el.classList.add('pop'); };
A.prepDone = (el) => { const s = byId(SESSIONS, el.dataset.id); PREP[s.id].points = PREP[s.id].points || 'محضر تحضير معتمد'; S.dismissed.add('a6'); closeDrawer(); toast(`اعتُمد محضر تحضير جلسة ${dm(s.at)}`, { action: ['عرض', () => openSession(s.id)] }); if (S.route === 'calendar' || S.route === 'home') rerender(); };
A.result = (el) => {
  const s = byId(SESSIONS, el.dataset.id); const c = CS(s.case);
  openDrawer(() => ({
    head: `<div class="muted" style="font-size:12px">نتيجة جلسة ${wd(s.at)} ${dm(s.at)}</div><h2 class="h2" style="font-weight:600">${c.title}</h2>`,
    body: `<div class="field" style="margin-bottom:14px"><label>ماذا حدث في الجلسة؟</label><textarea class="inp" id="rsWhat" placeholder="مثال: حضر الطرفان، وقدمنا مذكرة التعقيب، واستمعت الدائرة لدفوع الخصم.">${esc(s.result || '')}</textarea></div>
      <div class="field" style="margin-bottom:14px"><label>ما الذي طلبته الدائرة؟</label><textarea class="inp" id="rsReq" style="min-height:64px" placeholder="مثال: تقديم أصل الفواتير في الجلسة القادمة"></textarea></div>
      <div class="form-grid" style="margin-bottom:14px"><div class="field"><label>موعد الجلسة القادمة</label><input class="inp" type="date" id="rsNext" value="2026-10-06"></div><div class="field"><label>الوقت</label><input class="inp" type="time" id="rsTime" value="10:00"></div></div>
      <div class="field" style="margin-bottom:14px"><label>الإجراء المطلوب منا</label><input class="inp" id="rsAct" placeholder="سيُنشأ كمهمة تلقائيًا — مثال: إعداد مذكرة ختامية"></div>
      <div class="field"><label>ملاحظات داخلية</label><textarea class="inp" id="rsNote" style="min-height:64px"></textarea></div>
      <div class="sunk" style="padding:12px 14px;margin-top:16px;font-size:12.5px;color:var(--ink-2);line-height:1.8">${ic('sparkle', 'width="14" height="14" style="display:inline;vertical-align:-2px;color:var(--gold-dk)"')} عند الحفظ: تُضاف النتيجة إلى الخط الزمني للقضية، وتُجدول الجلسة القادمة في التقويم، ويُنشأ الإجراء المطلوب كمهمة مسندة إلى ${U(s.by).name}.</div>`,
    foot: `<button class="btn btn-q" data-a="drBack">إلغاء</button><button class="btn btn-p" data-a="saveResult" data-id="${s.id}" style="margin-inline-start:auto">حفظ النتيجة</button>`,
  }), { push: !!el.dataset.push && $('#drawer').classList.contains('show') });
  setTimeout(() => $('#rsWhat')?.focus(), 400);
};
A.saveResult = (el) => {
  const s = byId(SESSIONS, el.dataset.id); const c = CS(s.case);
  const what = $('#rsWhat').value.trim() || 'انعقدت الجلسة.'; const req = $('#rsReq').value.trim(); const act = $('#rsAct').value.trim(); const nx = $('#rsNext').value; const tm = $('#rsTime').value;
  s.result = what + (req ? ' — طلبت الدائرة: ' + req : '');
  const tl = caseTimeline(c); tl.forEach((x) => { if (x.st === 'now') x.st = 'done'; });
  const i = tl.findIndex((x) => x.st === 'future'); const ev = { ph: 'المرافعة', d: s.at, t: 'نتيجة الجلسة', p: s.result, by: 'u1', st: 'done', note: $('#rsNote').value.trim() || undefined, _new: true };
  tl.splice(i < 0 ? tl.length : i, 0, ev); c.last = { t: 'جلسة: ' + what.slice(0, 50), d: s.at };
  let added = [];
  if (nx) { const [y, m, d] = nx.split('-').map(Number); const [hh, mm] = (tm || '10:00').split(':').map(Number); const ns = { id: 's' + (++_sid), at: new Date(y, m - 1, d, hh, mm), case: c.id, by: s.by, kind: s.kind, dur: 45 }; SESSIONS.push(ns); tl.splice(tl.indexOf(ev) + 1, 0, { ph: 'المرافعة', d: ns.at, t: 'الجلسة القادمة', p: `${ns.kind} — ${U(ns.by).name}`, st: 'future' }); added.push('الجلسة القادمة'); }
  if (act) { TASKS.push({ id: 't' + (++_tid), t: act, case: c.id, who: s.by, pri: 'med', due: addDays(TODAY, 3), st: 'todo' }); added.push('مهمة'); }
  closeDrawer(); setTimeout(() => { ev._new = false; }, 1600);
  toast(`أُضيفت النتيجة إلى الخط الزمني${added.length ? ' مع ' + added.join(' و') : ''}`, { action: ['فتح القضية', () => go('case', c.id, 'timeline')] });
  if (S.route === 'case') refreshTab(); else rerender();
};

/* ==========================================================
   TASKS
   ========================================================== */
const TST = { todo: ['جديدة', 'var(--faint)'], doing: ['قيد التنفيذ', 'var(--blue)'], review: ['للمراجعة', 'var(--gold)'], done: ['مكتملة', 'var(--green)'] };
function scopedTasks() {
  const sc = S.tasksScope;
  let L = TASKS.slice();
  if (sc === 'mine') L = L.filter((t) => t.who === 'u1' || (t.st === 'review' && t.from));
  if (sc === 'upcoming') L = L.filter((t) => t.st !== 'done' && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 7);
  if (sc === 'late') L = L.filter(isLate);
  return L.sort((a, b) => a.due - b.due);
}
VIEWS.tasks = () => {
  const mine = TASKS.filter((t) => t.who === 'u1' && t.st !== 'done'); const late = TASKS.filter(isLate);
  const doneWeek = TASKS.filter((t) => t.st === 'done').length;
  const scopes = [['mine', 'مهامي', TASKS.filter((t) => (t.who === 'u1' || (t.st === 'review' && t.from)) && t.st !== 'done').length], ['team', 'مهام الفريق', TASKS.filter((t) => t.st !== 'done').length], ['upcoming', 'خلال 7 أيام', TASKS.filter((t) => t.st !== 'done' && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 7).length], ['late', 'المتأخرة', late.length]];
  return `<div class="page-h"><div><h1 class="h-disp h1">المهام</h1><div class="sub">${mine.length} مهام مفتوحة لك، و<b style="color:var(--red)">${late.length}</b> متأخرة على مستوى المكتب، و${doneWeek} مكتملة هذا الأسبوع</div></div>
    <div class="tools"><div class="seg">${[['kanban', 'لوحة', 'kanban'], ['list', 'قائمة', 'list']].map(([v, l, i]) => `<button class="${S.tasksView === v ? 'on' : ''}" data-a="seg" data-k="tasksView" data-v="${v}">${ic(i)}${l}</button>`).join('')}</div><button class="btn btn-p" data-a="quick" data-k="task">${ic('plus')}مهمة</button></div></div>
  <div class="saved">${scopes.map(([k, l, n]) => `<button class="${S.tasksScope === k ? 'on' : ''}" data-a="seg" data-k="tasksScope" data-v="${k}">${l}<span class="n" style="${k === 'late' && n ? 'color:var(--red);font-weight:600' : ''}">${n}</span></button>`).join('')}</div>
  <div class="quick-add"><span class="ph">${ic('plus')}</span><input id="taskQA" placeholder="أضف مهمة سريعة… اكتب «غدًا» أو «عاجل» وسنفهمها"><span class="kbd">Enter</span></div>
  <div id="tasksBody">${S.tasksView === 'kanban' ? taskKanban() : taskList()}</div>`;
};
function taskCard(t) {
  const late = isLate(t); const c = t.case && CS(t.case);
  return `<div class="kcard" draggable="true" data-drag="${t.id}" data-a="openTask" data-id="${t.id}" data-ctx="task:${t.id}"><div class="row" style="align-items:flex-start;gap:10px"><button class="chk ${t.st === 'done' ? 'on' : ''}" data-a="toggleTask" data-id="${t.id}">${ic('check')}</button><div class="grow"><div class="ttl ${t.st === 'done' ? 'done-t' : ''}">${t.t}</div><div class="m ell">${c ? c.title : t.client ? K(t.client).name : 'مهمة داخلية'}</div></div></div>
  <div class="row" style="margin-top:10px"><span class="pri-dot" style="background:${PRI[t.pri].c}" data-tip="أولوية ${PRI[t.pri].l}"></span><span class="m grow" style="${late ? 'color:var(--red);font-weight:600' : ''}">${ic('clock', 'width="12" height="12" style="display:inline;vertical-align:-1px"')} ${late ? 'متأخرة — ' : ''}${rel(t.due)}</span>${t.from ? `<span class="badge b-gold" style="height:20px">من ${U(t.from).short}</span>` : ''}${av(t.who, 'sm')}</div></div>`;
}
function taskKanban() {
  const L = scopedTasks();
  return `<div class="kanban">${Object.entries(TST).map(([k, [l, c]]) => { const ts = L.filter((t) => t.st === k); return `<div class="kcol" data-drop="task" data-v="${k}"><div class="kcol-h"><i style="background:${c}"></i>${l}<span class="n">${ts.length}</span></div><div class="kcards">${ts.map(taskCard).join('') || `<div class="muted" style="font-size:12px;text-align:center;padding:22px 0">${k === 'review' ? 'لا شيء ينتظر المراجعة' : k === 'done' ? 'اسحب المهام المنجزة إلى هنا' : 'لا مهام'}</div>`}</div></div>`; }).join('')}</div>`;
}
function taskList() {
  const L = scopedTasks().filter((t) => t.st !== 'done');
  if (!L.length) return empty(S.tasksScope === 'late' ? 'لا مهام متأخرة' : 'لا مهام هنا', S.tasksScope === 'late' ? 'كل المهام في وقتها. هذا ما يبدو عليه المكتب المنظم.' : 'أضف مهمة من الحقل أعلاه.');
  const g = [['متأخرة', (t) => isLate(t), 'late'], ['اليوم', (t) => !isLate(t) && dayDiff(t.due) === 0], ['غدًا وبعد غد', (t) => dayDiff(t.due) >= 1 && dayDiff(t.due) <= 2], ['هذا الأسبوع', (t) => dayDiff(t.due) > 2 && dayDiff(t.due) <= 7], ['لاحقًا', (t) => dayDiff(t.due) > 7]];
  return g.map(([l, f, cls]) => { const ts = L.filter(f); if (!ts.length) return ''; return `<div class="tgroup"><h5 class="${cls || ''}">${l}<span class="muted" style="font-weight:500">${ts.length}</span></h5>${ts.map((t) => `<div class="trow" data-a="openTask" data-id="${t.id}" data-ctx="task:${t.id}"><button class="chk" data-a="toggleTask" data-id="${t.id}">${ic('check')}</button><div><div class="t">${t.t}</div>${t.st === 'review' ? '<span class="badge b-gold" style="height:19px">للمراجعة</span>' : ''}</div><div class="ctx ell c-ctx">${t.case ? CS(t.case).title : t.client ? K(t.client).name : 'داخلية'}</div><div class="row gap6 c-as">${av(t.who, 'sm')}<span style="font-size:12px">${U(t.who).short}</span></div><div class="due ${isLate(t) ? 'late' : ''}">${rel(t.due)}</div><span class="pri-dot" style="background:${PRI[t.pri].c}"></span></div>`).join('')}</div>`; }).join('');
}
function moveTask(id, st) {
  const t = byId(TASKS, id); if (t.st === st) return; const prev = t.st; t.st = st; rerender(); $(`[data-drag="${id}"]`)?.classList.add('landed');
  toast(st === 'done' ? `أُنجزت «${t.t}»` : `نُقلت المهمة إلى ${TST[st][0]}`, { undo: () => { t.st = prev; rerender(); } });
}
A.toggleTask = (el, e) => {
  e.stopPropagation(); const t = byId(TASKS, el.dataset.id); const prev = t.st; const done = t.st !== 'done';
  t.st = done ? 'done' : 'todo'; el.classList.toggle('on', done); if (done) el.classList.add('pop');
  const row = el.closest('.task-li, .trow, .kcard'); row?.querySelector('.t, .ttl')?.classList.toggle('done-t', done);
  setTimeout(() => { if (S.route === 'tasks') { if (S.tasksView === 'list' && done) { row?.classList.add('collapse-out'); setTimeout(rerender, 420); } else rerender(); } else if (S.route === 'case') refreshTab(); refreshDrawer(); paintNav(); }, 520);
  if (done) toast(`أُنجزت «${t.t}»`, { undo: () => { t.st = prev; S.route === 'case' ? refreshTab() : rerender(); paintNav(); } });
};
function parseQuick(v) {
  let due = D(9, 11), pri = 'med'; let t = v;
  if (/اليوم/.test(v)) due = D(9, 10, 17); if (/غد/.test(v)) due = D(9, 11); if (/الأحد/.test(v)) due = D(9, 13); if (/الأسبوع القادم/.test(v)) due = D(9, 15);
  if (/عاجل|مهم/.test(v)) pri = 'high';
  const cm = CASES.find((c) => norm(v).includes(norm(K(c.client).name.split(' ').slice(-1)[0])));
  t = v.replace(/\s*(اليوم|غدًا|غدا|عاجل|الأحد|الأسبوع القادم)\s*/g, ' ').trim();
  return { t, due, pri, case: cm?.id || null };
}
HOOKS.push((root) => {
  const q = $('#taskQA', root); if (!q) return;
  q.onkeydown = (e) => { if (e.key !== 'Enter' || !q.value.trim()) return; const p = parseQuick(q.value); const t = { id: 't' + (++_tid), ...p, who: 'u1', st: 'todo' }; TASKS.push(t); q.value = ''; rerender(); $('#taskQA').focus(); $(`[data-drag="${t.id}"], .trow[data-id="${t.id}"]`)?.classList.add('flash-in');
    toast(`أُضيفت «${t.t}» — ${rel(t.due)}${t.case ? '، مرتبطة بقضية ' + K(CS(t.case).client).name : ''}`, { undo: () => { TASKS.splice(TASKS.indexOf(t), 1); rerender(); } }); };
});
function taskPanel(id) {
  const t = byId(TASKS, id); const c = t.case && CS(t.case); t.sub = t.sub || [['مراجعة المستندات المرتبطة', true], ['التنسيق مع الفريق', false], ['رفع النتيجة في ملف القضية', false]];
  return {
    head: `<div class="row gap8" style="margin-bottom:6px"><span class="badge" style="background:color-mix(in srgb,${TST[t.st][1]} 15%,#fff);color:var(--ink)">${TST[t.st][0]}</span>${isLate(t) ? '<span class="badge b-red">متأخرة</span>' : ''}${t.from ? `<span class="badge b-gold">طلب اعتماد من ${U(t.from).short}</span>` : ''}</div><h2 class="h2" style="font-weight:600;line-height:1.4" contenteditable="true" data-edit="${t.id}" spellcheck="false">${esc(t.t)}</h2>`,
    body: `<dl class="kv"><dt>المسؤول</dt><dd><button class="row gap6" data-a="taskWho" data-id="${t.id}">${av(t.who, 'sm')}${U(t.who).name}${ic('chevD', 'width="14" height="14"')}</button></dd><dt>الاستحقاق</dt><dd style="${isLate(t) ? 'color:var(--red)' : ''}">${wd(t.due)} ${dm(t.due)}${hasTime(t.due) ? ' — ' + hm(t.due) : ''}</dd><dt>الأولوية</dt><dd><button class="row gap6" data-a="taskPri" data-id="${t.id}"><span class="pri-dot" style="background:${PRI[t.pri].c}"></span>${PRI[t.pri].l}${ic('chevD', 'width="14" height="14"')}</button></dd><dt>القضية</dt><dd>${c ? `<a data-a="openCase" data-id="${c.id}" style="cursor:pointer;color:var(--navy)">${c.title}</a>` : t.client ? K(t.client).name : 'داخلية'}</dd></dl>
    <div class="dsec"><h4>خطوات فرعية</h4>${t.sub.map(([s, d], i) => `<div class="check-row"><button class="chk ${d ? 'on' : ''}" data-a="subT" data-id="${t.id}" data-i="${i}">${ic('check')}</button><span class="${d ? 'done-t' : ''}">${s}</span></div>`).join('')}</div>
    ${c ? `<div class="dsec"><h4>مستندات القضية</h4>${caseDocs(c.id).slice(0, 3).map(docLi).join('')}</div>` : ''}
    <div class="dsec"><h4>تعليق</h4><textarea class="inp" placeholder="اكتب تحديثًا أو أشر إلى زميل بـ @" style="min-height:70px"></textarea></div>`,
    foot: t.st === 'review' ? `<button class="btn btn-p" data-a="approveTask" data-id="${t.id}">${ic('check')}اعتماد</button><button class="btn btn-s" data-a="returnTask" data-id="${t.id}">إعادة بملاحظات</button>` : `<button class="btn ${t.st === 'done' ? 'btn-s' : 'btn-p'}" data-a="doneTask" data-id="${t.id}">${t.st === 'done' ? 'إعادة فتح' : ic('check') + 'إنجاز المهمة'}</button><button class="btn btn-q" data-a="stub" data-m="سيُرسل تذكير إلى المسؤول">${ic('bell')}تذكير</button>`,
  };
}
A.openTask = (el) => openDrawer(() => taskPanel(el.dataset.id));
A.subT = (el) => { const t = byId(TASKS, el.dataset.id); const s = t.sub[+el.dataset.i]; s[1] = !s[1]; el.classList.toggle('on', s[1]); el.classList.add('pop'); el.nextElementSibling.classList.toggle('done-t', s[1]); };
A.taskWho = (el) => { const t = byId(TASKS, el.dataset.id); openPop(el, TEAM.map((u) => ({ l: u.name, on: t.who === u.id, f: () => { t.who = u.id; refreshDrawer(); rerender(); toast(`أُسندت المهمة إلى ${u.name}`); } })), { alignStart: true }); };
A.taskPri = (el) => { const t = byId(TASKS, el.dataset.id); openPop(el, Object.entries(PRI).map(([k, v]) => ({ l: v.l, on: t.pri === k, f: () => { t.pri = k; refreshDrawer(); rerender(); } })), { alignStart: true }); };
A.doneTask = (el) => { const t = byId(TASKS, el.dataset.id); t.st = t.st === 'done' ? 'todo' : 'done'; closeDrawer(); S.route === 'case' ? refreshTab() : rerender(); paintNav(); toast(t.st === 'done' ? `أُنجزت «${t.t}»` : 'أُعيد فتح المهمة'); };
A.approveTask = (el) => {
  const t = byId(TASKS, el.dataset.id); t.st = 'done'; if (t.id === 't19') { S.dismissed.add('a3'); const d = byId(DOCS, 'd8'); d.name = 'مذكرة الحضانة — معتمدة'; }
  const n = NOTIFS.find((x) => x.acts?.some((a) => a[1] === 'approve:' + t.id)); if (n) { n.done = 'اعتُمد'; n.unread = false; }
  closeDrawer(); closeModal(); paintNav(); if (['home', 'tasks'].includes(S.route)) rerender(); if (S.route === 'case') refreshTab(); refreshNotifs();
  toast(`اعتُمدت «${t.t.replace('اعتماد ', '')}» وأُبلغ ${t.from ? U(t.from).short : 'الفريق'}`);
};
A.returnTask = (el) => { const t = byId(TASKS, el.dataset.id); t.st = 'doing'; closeDrawer(); rerender(); toast(`أُعيدت إلى ${t.from ? U(t.from).short : 'المسؤول'} مع ملاحظاتك`); };
document.addEventListener('focusout', (e) => { const el = e.target.closest?.('[data-edit]'); if (!el) return; const t = byId(TASKS, el.dataset.edit); const v = el.textContent.trim(); if (v && v !== t.t) { t.t = v; toast('حُفظ العنوان'); S.route !== 'home' && (S.route === 'case' ? refreshTab() : rerender()); } });

/* ==========================================================
   CLIENTS — relationship-centered
   ========================================================== */
function clientCases(k) { return CASES.filter((c) => c.client === k); }
VIEWS.clients = () => {
  let L = CLIENTS.slice();
  if (S.clientF === 'org') L = L.filter((c) => c.kind === 'منشأة'); if (S.clientF === 'ind') L = L.filter((c) => c.kind === 'فرد');
  if (S.clientF === 'stale') L = L.filter((c) => -dayDiff(c.last) >= 14);
  L.sort((a, b) => a.last - b.last);
  if (!L.find((c) => c.id === S.clientId)) S.clientId = L[0]?.id;
  const stale = CLIENTS.filter((c) => -dayDiff(c.last) >= 14).length;
  return `<div class="cl-wrap"><div class="cl-list"><div class="top"><div class="row" style="margin-bottom:12px"><h1 class="h-disp h2 grow">العملاء</h1><button class="btn btn-sm btn-p" data-a="quick" data-k="client">${ic('plus')}عميل</button></div>
    <div class="inp-ico" style="margin-bottom:10px">${ic('search')}<input class="inp" id="clQ" placeholder="ابحث عن عميل" style="height:36px"></div>
    <div class="seg" style="width:100%">${[['all', 'الكل'], ['org', 'منشآت'], ['ind', 'أفراد'], ['stale', `بحاجة لتواصل ${stale}`]].map(([v, l]) => `<button class="${S.clientF === v ? 'on' : ''}" data-a="seg" data-k="clientF" data-v="${v}" style="flex:1;justify-content:center;padding:0 6px">${l}</button>`).join('')}</div></div>
    <div class="cl-items" id="clItems">${L.map(clientItem).join('')}</div></div>
    <div class="cl-prof" id="clProf">${S.clientId ? clientProfile(K(S.clientId)) : ''}</div></div>`;
};
function clientItem(c) { const d = -dayDiff(c.last); const n = clientCases(c.id).length; return `<div class="cl-i ${S.clientId === c.id ? 'on' : ''}" data-a="pickClient" data-id="${c.id}" data-name="${esc(norm(c.name))}">${clientAv(c.id)}<div class="grow" style="min-width:0"><div class="t ell">${c.name}</div><div class="m">${n} ${n === 1 ? 'قضية' : n === 2 ? 'قضيتان' : 'قضايا'} — ${c.kind}</div></div><div class="lc ${d >= 14 ? 'warn' : ''}">${d === 0 ? 'اليوم' : d >= 14 ? ic('alert', 'width="12" height="12" style="display:inline;vertical-align:-1px"') + ' ' + d + ' يومًا' : rel(c.last)}</div></div>`; }
function clientProfile(k) {
  const cs = clientCases(k.id); const inv = INVOICES.filter((i) => i.client === k.id); const due = inv.filter((i) => i.st !== 'paid').reduce((a, b) => a + b.amt, 0);
  const days = -dayDiff(k.last);
  const rel_ = [
    ...cs.map((c) => ({ d: c.opened, ic: 'cases', t: 'فتح قضية', p: c.title, a: `data-a="openCase" data-id="${c.id}"` })),
    ...inv.map((i) => ({ d: i.paid || i.issued, ic: 'receipt', t: i.paid ? 'سداد فاتورة' : 'إصدار فاتورة', p: `${i.id} — ${fmt(i.amt)} ريال` })),
    ...DOCS.filter((d) => cs.some((c) => c.id === d.case)).slice(0, 4).map((d) => ({ d: d.date, ic: 'file', t: 'مستند', p: d.name, a: `data-a="openDoc" data-id="${d.id}"` })),
    { d: k.last, ic: 'phone', t: 'آخر تواصل', p: `مكالمة مع ${k.contact || k.name}` },
    ...(k._log || []),
  ].sort((a, b) => b.d - a.d).slice(0, 9);
  return `<div class="cl-hero">${clientAv(k.id, 'xl')}<div class="grow"><h1 class="h-disp">${k.name}</h1><div class="muted">${k.kind}${k.contact ? ` — جهة الاتصال: ${k.contact}` : ''} — ${k.city}</div>
    <div class="contact-chips"><button class="chip" data-a="logContact" data-id="${k.id}" data-k="مكالمة">${ic('phone')}<span class="ltr">${k.phone}</span></button><button class="chip" data-a="logContact" data-id="${k.id}" data-k="بريد">${ic('mail')}<span class="ltr">${k.email}</span></button><button class="chip" data-a="logContact" data-id="${k.id}" data-k="رسالة واتساب">${ic('msg')}واتساب</button></div></div>
    <button class="btn btn-s" data-a="quick" data-k="case" data-client="${k.id}">${ic('plus')}قضية لهذا العميل</button></div>
  ${days >= 14 ? `<div class="alert-bar">${ic('alert')}<span>لم يحدث تواصل مع هذا العميل منذ <b>${pDays(days)}</b>${cs.some((c) => c.status === 'client') ? '، وإحدى قضاياه بانتظار مستندات منه' : ''}.</span><button class="btn btn-sm btn-s" data-a="logContact" data-id="${k.id}" data-k="مكالمة">تسجيل تواصل</button></div>` : ''}
  ${k.id === 'k2' ? `<div class="alert-bar" style="background:var(--blue-bg);color:#244d66">${ic('msg', 'style="color:var(--blue)"')}<span>رسالة بانتظار الرد منذ يومين: «هل كل شيء جاهز لجلسة الخميس؟»</span><button class="btn btn-sm btn-p" data-a="replyClient" data-id="k2">الرد</button></div>` : ''}
  <div class="kpi-strip"><div><span>قضايا نشطة</span><b>${cs.length}</b></div><div><span>إجمالي الفوترة</span><b>${sarK(inv.reduce((a, b) => a + b.amt, 0))}</b></div><div><span>الرصيد المستحق</span><b style="${due ? 'color:var(--red)' : ''}">${sarK(due)}</b></div><div><span>عميل منذ</span><b style="font-size:16px">${dmy(k.since)}</b></div></div>
  <div class="grid g12"><div class="s7"><div class="sec-t" style="margin-bottom:12px">سجل العلاقة</div><div class="rel-tl">${rel_.map((r) => `<div class="ri ${r._new ? 'flash-in' : ''}" ${r.a || ''} style="${r.a ? 'cursor:pointer' : ''}"><div class="ic">${ic(r.ic)}</div><div><b>${r.t}</b><p>${r.p}</p></div><time>${rel(r.d)}</time></div>`).join('')}</div></div>
  <div class="s5"><div class="sec-t" style="margin-bottom:8px">القضايا</div>${cs.map((c) => `<div class="li" data-a="openCase" data-id="${c.id}" data-peek="${c.id}"><div class="ic">${ic('cases')}</div><div class="grow" style="min-width:0"><div class="t ell">${c.title}</div><div class="m">${STATUS[c.status].l}</div></div></div>`).join('')}
    <div class="sec-t" style="margin:20px 0 8px">الفواتير</div>${inv.map((i) => `<div class="row" style="padding:8px;font-size:13px;border-bottom:1px solid var(--line)"><span class="ltr num muted" style="font-size:11.5px">${i.id}</span><b class="grow num" style="text-align:end;font-weight:600">${fmt(i.amt)}</b>${i.st === 'paid' ? '<span class="badge b-green">مدفوعة</span>' : i.st === 'overdue' ? '<span class="badge b-red">متأخرة</span>' : '<span class="badge b-blue">مستحقة</span>'}</div>`).join('') || '<p class="muted" style="font-size:13px">لا فواتير.</p>'}
    <div class="sunk pad" style="margin-top:20px"><dl class="kv"><dt>مسؤول العلاقة</dt><dd>${U(k.owner).name}</dd><dt>المصدر</dt><dd>${k.source}</dd>${k.vat ? `<dt>الرقم الضريبي</dt><dd class="ltr num">${k.vat}</dd>` : ''}</dl></div></div></div>`;
}
A.pickClient = (el) => { S.clientId = el.dataset.id; $$('.cl-i').forEach((x) => x.classList.toggle('on', x === el)); const p = $('#clProf'); p.innerHTML = clientProfile(K(S.clientId)); p.scrollTop = 0; p.firstElementChild.style.animation = 'viewIn .3s var(--ease-out)'; after(p); };
A.logContact = (el) => { const k = K(el.dataset.id); k.last = nowDate(); (k._log = k._log || []).push({ d: nowDate(), ic: el.dataset.k === 'بريد' ? 'mail' : el.dataset.k === 'مكالمة' ? 'phone' : 'msg', t: el.dataset.k, p: 'سُجل من المنصة بواسطة أ. خالد', _new: true }); rerender(); toast(`سُجل تواصل (${el.dataset.k}) مع ${k.name}`); };
A.replyClient = (el) => openModal(`<div class="m-h"><div class="grow"><h3 class="h2" style="font-weight:600">الرد على محمد الغامدي</h3><div class="muted" style="font-size:13px">«هل كل شيء جاهز لجلسة الخميس؟»</div></div><button class="icon-btn" data-a="mClose">${ic('x')}</button></div><div class="m-b"><textarea class="inp" id="replyT" style="min-height:120px">أهلًا أستاذ محمد، نعم كل شيء جاهز. حافظة المستندات مكتملة، وسأحضر الجلسة اليوم 11:30 في المحكمة العمالية، وأطلعك على النتيجة بعدها مباشرة.</textarea><div class="row gap6" style="margin-top:10px"><span class="chip">${ic('msg')}واتساب</span><span class="chip">${ic('mail')}بريد</span></div></div><div class="m-f"><button class="btn btn-q" data-a="mClose">إلغاء</button><button class="btn btn-p" data-a="sendReply" data-id="k2">إرسال</button></div>`);
A.sendReply = (el) => { const k = K(el.dataset.id); k.last = nowDate(); (k._log = k._log || []).push({ d: nowDate(), ic: 'msg', t: 'رد على رسالة', p: 'بخصوص جاهزية الجلسة', _new: true }); S.dismissed.add('a5'); const n = byId(NOTIFS, 'n5'); n.done = 'تم الرد'; n.unread = false; closeModal(); paintNav(); if (S.route === 'clients' || S.route === 'home') rerender(); toast('أُرسل الرد إلى محمد الغامدي'); };
HOOKS.push((root) => { const q = $('#clQ', root); if (!q) return; q.oninput = () => { const v = norm(q.value); $$('.cl-i').forEach((x) => { x.style.display = x.dataset.name.includes(v) ? '' : 'none'; }); }; });

/* ==========================================================
   DOCUMENTS
   ========================================================== */
VIEWS.docs = () => {
  const types = ['all', ...new Set(DOCS.map((d) => d.type))];
  const L = DOCS.filter((d) => S.docType === 'all' || d.type === S.docType).sort((a, b) => b.date - a.date);
  const recent = DOCS.filter((d) => dayDiff(d.date) >= -2).length;
  return `<div class="page-h"><div><h1 class="h-disp h1">المستندات</h1><div class="sub">${DOCS.length} مستندًا مرتبطة بالقضايا، ${recent} منها أُضيفت أو عُدلت خلال آخر يومين</div></div><div class="tools"><button class="btn btn-p" data-a="fakeUpload">${ic('upload')}رفع مستند</button></div></div>
  <div class="grid docs-wrap">
    <aside><div class="col gap4">${types.map((t) => `<button class="nav-i ${S.docType === t ? 'on' : ''}" style="height:36px" data-a="seg" data-k="docType" data-v="${t}">${ic(t === 'all' ? 'folder' : t === 'حكم' ? 'gavel' : t === 'عقد' ? 'pen' : t === 'مراسلة' ? 'mail' : 'file')}<span>${t === 'all' ? 'كل المستندات' : t}</span><span class="cnt">${t === 'all' ? DOCS.length : DOCS.filter((d) => d.type === t).length}</span></button>`).join('')}</div>
      <div class="sunk" style="padding:14px;margin-top:18px;font-size:12.5px;line-height:1.8"><b style="display:block;margin-bottom:4px">المساحة المستخدمة</b><div class="hbar" style="margin:6px 0"><i style="width:23%;background:var(--gold)"></i></div><span class="muted">4.6 من 20 جيجابايت</span></div></aside>
    <div><div class="dropzone" id="docDrop" style="margin-bottom:18px">${ic('upload')}<b style="color:var(--ink);font-weight:600">اسحب الملفات إلى أي مكان في الصفحة</b><div style="font-size:12px;margin-top:2px">PDF وWord والصور، حتى 50 ميجابايت للملف</div></div><div id="upList"></div>
    <div class="sec-h"><div class="sec-t">أُضيفت مؤخرًا</div></div>
    ${L.length ? `<div class="dgrid">${L.map(docTile).join('')}</div>` : empty('لا مستندات من هذا النوع', 'ارفع أول مستند أو غيّر التصنيف.')}</div></div>`;
};
function docPreview(d) {
  const c = d.case && CS(d.case);
  const body = d.type === 'حكم' ? 'الحمد لله وحده والصلاة والسلام على من لا نبي بعده، وبعد: فلدى الدائرة وبعد الاطلاع على أوراق القضية وسماع الدعوى والإجابة، ولما كان ما تقدم؛ فقد حكمت الدائرة بما يلي…' : 'أصحاب الفضيلة رئيس وأعضاء الدائرة الموقرين، السلام عليكم ورحمة الله وبركاته، وبعد: فإشارة إلى القضية المقيدة لدى فضيلتكم، نتقدم بمذكرتنا هذه متضمنة ما يلي: أولًا: الوقائع. ثانيًا: الرد على دفوع المدعى عليها، إذ إن ما أثارته من دفع بالتقادم لا يستقيم؛ لكون الفواتير محل المطالبة صادرة خلال المدة النظامية…';
  return `<div class="m-h"><div class="grow"><div class="row gap8" style="margin-bottom:4px"><span class="badge">${d.type}</span><span class="badge b-ghost">الإصدار ${d.ver}</span></div><h3 class="h2" style="font-weight:600">${d.name}</h3><div class="muted" style="font-size:13px">${c ? c.title + ' — ' : ''}${d.size} — رفعه ${U(d.by).name} ${rel(d.date)}</div></div><button class="icon-btn" data-a="mClose">${ic('x')}</button></div>
  <div class="m-b"><div class="grid" style="grid-template-columns:1fr 230px;gap:20px"><div class="paper-prev"><div class="pg"><h3>${d.type === 'حكم' ? 'صك حكم' : d.name.replace(' — مسودة نهائية', '').replace(' — مسودة', '')}</h3><div class="c">${c ? `${c.court} — ${c.circuit}<br>القضية رقم ${c.no}` : ''}</div><p>${body}</p><p style="margin-top:12px;color:#999">…</p></div></div>
  <div><div class="sec-t" style="margin-bottom:8px">سجل الإصدارات</div><div class="vh">${[...Array(d.ver)].map((_, i) => { const v = d.ver - i; return `<div class="${i === 0 ? 'cur' : ''}"><b class="v">v${v}</b><span>${i === 0 ? 'الحالي' : 'إصدار سابق'} — ${U(i % 2 ? 'u4' : d.by).short}<br><span class="muted" style="font-size:11.5px">${rel(addDays(d.date, -i * 2))}</span></span></div>`; }).join('')}</div>
  ${c ? `<button class="btn-link" style="margin-top:14px" data-a="openCase" data-id="${c.id}" data-tab="docs">فتح القضية${ic('chevL')}</button>` : ''}</div></div></div>
  <div class="m-f">${/مسودة/.test(d.name) ? `<button class="btn btn-p" data-a="approveDoc" data-id="${d.id}" style="margin-inline-end:auto">${ic('check')}اعتماد المستند</button>` : ''}<button class="btn btn-s" data-a="stub" data-m="بدأ تنزيل ${esc(d.name)}">${ic('download')}تنزيل</button><button class="btn btn-s" data-a="stub" data-m="نُسخ رابط مشاركة آمن صالح 7 أيام">${ic('link')}مشاركة</button></div>`;
}
A.openDoc = (el) => { const d = byId(DOCS, el.dataset.id); if (d) openModal(docPreview(d), 'lg'); };
A.approveDoc = (el) => {
  const d = byId(DOCS, el.dataset.id); d.name = d.name.replace(/ — مسودة( نهائية)?/, '') + ' — معتمدة'; d.ver++;
  if (d.id === 'd7') { S.dismissed.add('a1'); const t = byId(TASKS, 't4'); t.st = 'done'; } if (d.id === 'd8') { S.dismissed.add('a3'); byId(TASKS, 't19').st = 'done'; } if (d.id === 'd1') S.dismissed.add('a2');
  closeModal(); paintNav(); ['home', 'docs'].includes(S.route) ? rerender() : S.route === 'case' && refreshTab();
  toast(`اعتُمد «${d.name}» وحُفظ كإصدار ${d.ver}`);
};
function simulateUpload(files) {
  const box = $('#upList'); const list = files.length ? files : [{ name: 'مستند مرفوع.pdf', size: 820000 }];
  if (!box) { list.forEach((f) => addDoc(f)); toast(`رُفع ${list.length === 1 ? 'مستند' : list.length + ' مستندات'} إلى مركز المستندات`, { action: ['عرض', () => go('docs')] }); return; }
  list.forEach((f, i) => {
    const id = 'up' + Date.now() + i; box.insertAdjacentHTML('beforeend', `<div class="up-row" id="${id}">${ic('file', 'width="18" height="18" style="color:var(--navy)"')}<span style="font-size:13px;min-width:160px" class="ell">${esc(f.name)}</span><div class="hbar"><i style="width:0"></i></div><span class="muted num" style="font-size:12px;width:36px">0%</span></div>`);
    let p = 0; const bar = $(`#${id} i`), lbl = $(`#${id} .num`);
    const t = setInterval(() => { p = Math.min(100, p + 8 + Math.random() * 18); bar.style.width = p + '%'; lbl.textContent = Math.round(p) + '%'; if (p >= 100) { clearInterval(t); addDoc(f); setTimeout(() => { S.route === 'case' ? refreshTab() : rerender(); toast(`رُفع «${f.name}»`); }, 300); } }, 120);
  });
}
function addDoc(f) { const ext = /\.docx?$/i.test(f.name) ? 'docx' : 'pdf'; DOCS.push({ id: 'd' + (++_did), name: f.name.replace(/\.[^.]+$/, ''), type: 'مرفق', case: S.route === 'case' ? S.id : null, by: 'u1', date: nowDate(), size: f.size ? (f.size / 1024 > 1024 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB') : '—', ver: 1, ext }); }
A.fakeUpload = () => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.onchange = () => simulateUpload([...i.files]); i.click(); };
let dragDepth = 0;
window.addEventListener('dragenter', (e) => { if (![...(e.dataTransfer?.types || [])].includes('Files')) return; dragDepth++; $('#gdrop').classList.add('show'); });
window.addEventListener('dragleave', (e) => { if (![...(e.dataTransfer?.types || [])].includes('Files')) return; if (--dragDepth <= 0) { dragDepth = 0; $('#gdrop').classList.remove('show'); } });
window.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); });
window.addEventListener('drop', (e) => { if (!e.dataTransfer?.files?.length) return; e.preventDefault(); dragDepth = 0; $('#gdrop').classList.remove('show'); simulateUpload([...e.dataTransfer.files]); });

/* ==========================================================
   TEAM
   ========================================================== */
VIEWS.team = () => {
  const rows = TEAM.map((u) => { const cs = CASES.filter((c) => c.lead === u.id || c.team.includes(u.id)); const open = TASKS.filter((t) => t.who === u.id && t.st !== 'done'); const late = open.filter(isLate).length; const ss = SESSIONS.filter((s) => s.by === u.id && dayDiff(s.at) >= 0 && dayDiff(s.at) <= 7).length; const load = Math.round(((cs.length * 0.6 + open.length) / u.cap) * 100); return { u, cs, open, late, ss, load }; });
  return `<div class="page-h"><div><h1 class="h-disp h1">الفريق</h1><div class="sub">${TEAM.length} أعضاء، والحِمل موزع على أساس القضايا والمهام المفتوحة مقارنة بطاقة كل عضو</div></div><div class="tools"><button class="btn btn-s" data-a="stub" data-m="ستُرسل دعوة الانضمام بالبريد">${ic('plus')}دعوة عضو</button></div></div>
  <div class="panel" style="padding:8px 8px">${rows.map(({ u, cs, open, late, ss, load }) => `<div class="role-row team-row" style="box-shadow:none;border-radius:12px;cursor:pointer;margin:0" data-a="member" data-id="${u.id}">
    ${av(u.id, 'lg', true)}<div><b style="font-size:14px">${u.name}</b><div class="muted" style="font-size:12px">${u.role} — ${u.status}</div></div>
    <div><div class="row" style="font-size:12px;margin-bottom:5px"><span class="muted grow">الحِمل الحالي</span><b style="color:${load > 95 ? 'var(--red)' : load > 75 ? 'var(--amber)' : 'var(--green)'}">${load}%</b></div><div class="hbar" style="position:relative;overflow:visible"><i style="width:${Math.min(100, load)}%;background:${load > 95 ? 'var(--red)' : load > 75 ? 'var(--gold)' : 'var(--green)'};transition:width 1s var(--ease-out)"></i></div></div>
    <div style="text-align:center"><b style="font-size:18px">${cs.length}</b><div class="muted" style="font-size:11.5px">قضية</div></div><div style="text-align:center"><b style="font-size:18px">${open.length}</b><div class="muted" style="font-size:11.5px">مهمة${late ? ` <span style="color:var(--red)">(${late} متأخرة)</span>` : ''}</div></div><div style="text-align:center"><b style="font-size:18px">${ss}</b><div class="muted" style="font-size:11.5px">جلسات الأسبوع</div></div></div>`).join('')}</div>
  <div class="grid g12" style="margin-top:28px"><div class="s7"><div class="sec-t" style="margin-bottom:12px">ما أنجزه الفريق هذا الأسبوع</div><div class="feed">${ACTIVITY.slice().sort((a, b) => b.at - a.at).slice(0, 6).map((f) => feedItem(f)).join('')}</div></div>
  <div class="s5"><div class="sunk pad"><div class="sec-t" style="margin-bottom:6px">${ic('bulb', 'width="16" height="16"')}ملاحظة توزيع</div><p style="font-size:13.5px;line-height:1.8">سارة تحمل 4 من جلسات الأسبوع القادم التسع، بينما لدى فيصل مساحة. نقل جلسة واحدة يوازن الأسبوع دون تغيير المسؤولية عن القضية.</p><button class="btn btn-sm btn-s" style="margin-top:10px" data-a="calNext">عرض الأسبوع القادم</button></div></div></div>`;
};
function openMember(id) {
  const u = U(id); const cs = CASES.filter((c) => c.lead === id || c.team.includes(id)); const open = TASKS.filter((t) => t.who === id && t.st !== 'done');
  openDrawer(() => ({ head: `<div class="row gap12">${av(id, 'xl', true)}<div><h2 class="h2" style="font-weight:600">${u.name}</h2><div class="muted" style="font-size:13px">${u.role} — ${u.status}</div></div></div>`,
    body: `<div class="kpi-strip" style="grid-template-columns:repeat(3,1fr)"><div><span>قضايا</span><b>${cs.length}</b></div><div><span>مهام مفتوحة</span><b>${open.length}</b></div><div><span>إنجاز في الوقت</span><b>${id === 'u1' ? 88 : 80 + id.charCodeAt(1) % 15}%</b></div></div>
    <div class="dsec" style="margin-top:0"><h4>المهام المفتوحة</h4>${open.map((t) => taskLi(t, true)).join('') || '<p class="muted">لا مهام مفتوحة.</p>'}</div><div class="dsec"><h4>القضايا</h4>${cs.slice(0, 8).map((c) => `<div class="li" data-a="openCase" data-id="${c.id}"><div class="ic">${ic('cases')}</div><div class="grow"><div class="t">${c.title}</div><div class="m">${c.lead === id ? 'مسؤول' : 'مساند'} — ${STATUS[c.status].l}</div></div></div>`).join('')}</div>`,
    foot: `<button class="btn btn-p" data-a="quick" data-k="task" data-who="${id}">${ic('plus')}إسناد مهمة</button><button class="btn btn-q" data-a="stub" data-m="فُتحت محادثة مع ${u.short}">${ic('msg')}رسالة</button>` }));
}
A.member = (el) => openMember(el.dataset.id);
