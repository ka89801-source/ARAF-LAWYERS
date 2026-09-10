/* ==========================================================
   FINANCE
   ========================================================== */
VIEWS.finance = () => {
  const billed = 86400, coll = 71200; const overdue = INVOICES.filter((i) => i.st === 'overdue'); const dueS = INVOICES.filter((i) => i.st === 'due');
  const age = (i) => -dayDiff(i.due); const buckets = [['0–30 يومًا', (i) => age(i) <= 30, 'var(--gold)'], ['31–60', (i) => age(i) > 30 && age(i) <= 60, 'var(--amber)'], ['61–90', (i) => age(i) > 60 && age(i) <= 90, '#C4643F'], ['+90', (i) => age(i) > 90, 'var(--red)']].map(([l, f, c]) => [l, overdue.filter(f).reduce((a, b) => a + b.amt, 0), c]);
  const ovT = overdue.reduce((a, b) => a + b.amt, 0); const dueT = dueS.reduce((a, b) => a + b.amt, 0);
  const svc = [['ترافع وتقاضٍ', 58], ['استشارات', 18], ['صياغة عقود', 12], ['تنفيذ', 8], ['أخرى', 4]];
  const top = [['k1', 186000], ['k9', 142000], ['k5', 118000], ['k6', 96000], ['k12', 64000]];
  const tabs = [['all', 'الكل', INVOICES.length], ['due', 'مستحقة', dueS.length], ['overdue', 'متأخرة', overdue.length], ['paid', 'مدفوعة', INVOICES.filter((i) => i.st === 'paid').length]];
  const inv = INVOICES.filter((i) => S.finTab === 'all' || i.st === S.finTab).sort((a, b) => (a.st === 'overdue' ? -1 : 0) - (b.st === 'overdue' ? -1 : 0) || b.issued - a.issued);
  return `<div class="page-h"><div><h1 class="h-disp h1">المالية</h1><div class="sub">سبتمبر 2026 حتى اليوم، مع مقارنة بنفس الفترة من أغسطس</div></div><div class="tools"><button class="btn btn-s" data-a="stub" data-m="جُهّز تقرير مالي PDF لشهر سبتمبر">${ic('download')}تقرير</button><button class="btn btn-p" data-a="quickInvoice">${ic('plus')}فاتورة جديدة</button></div></div>
  <div class="fin-hero">
    <div class="fin-big"><div class="lbl">إيرادات الشهر حتى الآن</div><div class="v"><small>SAR</small>${counter(billed)}</div><div class="row" style="font-size:13px;gap:8px">${delta(86.4, 78.2)}<span style="color:rgba(233,230,221,.7)">عن نفس الفترة من الشهر الماضي</span></div>
      <div class="row" style="margin-top:18px;gap:28px;font-size:13px"><div><span style="color:rgba(233,230,221,.6)">محصّل</span><div style="font-size:18px;font-weight:600;color:#fff" class="num">${fmt(coll)}</div></div><div><span style="color:rgba(233,230,221,.6)">مستحق</span><div style="font-size:18px;font-weight:600;color:var(--gold)" class="num">${fmt(dueT)}</div></div><div><span style="color:rgba(233,230,221,.6)">متأخر</span><div style="font-size:18px;font-weight:600;color:#F0A08C" class="num">${fmt(ovT)}</div></div></div>
      <svg class="bg" viewBox="0 0 400 70" preserveAspectRatio="none"><path d="${smooth(REV_2026.map((v, i) => [400 - i * 50, 70 - (v / 170) * 60]))}" fill="none" stroke="var(--gold)" stroke-width="2"/></svg></div>
    <div class="sunk pad"><div class="sec-t" style="margin-bottom:14px">نسبة التحصيل</div><div class="row gap16">${ring(82, 112, 11, 'var(--green)', 'var(--sunk-2)', `<b style="font-size:24px;font-weight:600">${counter(82, '', '%')}</b><div class="muted" style="font-size:11px">هذا الشهر</div>`)}<div style="font-size:13px;line-height:1.9"><div class="muted">متوسط 2026</div><b>89%</b><div class="muted">أفضل شهر</div><b>أبريل 92%</b></div></div></div>
    <div class="sunk pad"><div class="sec-t" style="margin-bottom:4px">أعمار المتأخرات</div><div class="muted" style="font-size:12.5px">${sar(ovT)} في ${overdue.length} فواتير</div>
      <div class="aging">${buckets.filter((b) => b[1]).map(([l, v, c], i) => `<div style="flex:${v};background:${c};animation-delay:${i * 80}ms" data-tip="${esc(l + ': ' + fmt(v) + ' ريال')}"></div>`).join('')}</div>
      ${buckets.map(([l, v, c]) => `<div class="row" style="font-size:12.5px;padding:3px 0"><i style="width:8px;height:8px;border-radius:2px;background:${c}"></i><span class="grow">${l}</span><b class="num" style="font-weight:600">${fmt(v)}</b></div>`).join('')}</div>
  </div>
  <div class="grid g12" style="margin-bottom:28px">
    <section class="s8"><div class="sec-h"><div class="sec-t">الإيرادات الشهرية<small>بآلاف الريالات</small></div><div class="act legend"><span><i style="--c:var(--navy)"></i>2026</span><span><i class="ln" style="--c:var(--gold);width:14px"></i>2025</span><span><i style="--c:var(--green);opacity:.5"></i>المحصّل</span></div></div>
      ${lineChart({ labels: MONTHS.map((m) => m.slice(0, 3)), bars: { name: 'إيرادات 2026', values: REV_2026.concat([null, null, null]), color: 'var(--navy)' }, series: [{ name: '2025', values: REV_2025, color: 'var(--gold)', width: 2 }, { name: 'المحصّل', values: COLL_2026, color: 'var(--green)', width: 1.6 }], w: 760, h: 250, yFmt: (v, t) => t ? fmt(v * 1000) + ' ريال' : v + 'K' })}</section>
    <section class="s4"><div class="sec-t" style="margin-bottom:12px">حسب نوع الخدمة</div>${svc.map(([l, p], i) => `<div style="margin-bottom:12px"><div class="row" style="font-size:13px;margin-bottom:5px"><span class="grow">${l}</span><b class="num">${p}%</b></div><div class="hbar"><i class="growX" style="width:${p}%;animation-delay:${i * 70}ms;background:${i ? 'var(--navy-2)' : 'var(--navy)'};opacity:${1 - i * 0.14}"></i></div></div>`).join('')}
      <div class="divider"></div><div class="sec-t" style="margin-bottom:8px">أعلى العملاء إيرادًا في 2026</div>${top.map(([k, v]) => `<div class="li" data-a="openClient" data-id="${k}" style="padding:6px 4px">${clientAv(k, 'sm')}<span class="grow ell" style="font-size:13px">${K(k).name}</span><b class="num" style="font-size:13px;font-weight:600">${sarK(v)}</b></div>`).join('')}</section>
  </div>
  <section><div class="sec-h"><div class="sec-t">الفواتير</div><div class="act"><div class="seg">${tabs.map(([k, l, n]) => `<button class="${S.finTab === k ? 'on' : ''}" data-a="seg" data-k="finTab" data-v="${k}">${l} <span class="muted" style="font-size:11px">${n}</span></button>`).join('')}</div></div></div>
  <div class="inv-row h"><span>الرقم</span><span>العميل</span><span>القيمة</span><span>الإصدار</span><span>الاستحقاق</span><span>الحالة</span><span></span></div><div id="invList">${inv.map(invRow).join('')}</div></section>`;
};
A.invMenu = (el) => openPop(el, CTX.inv(el.dataset.id));
function markPaid(id) { const i = byId(INVOICES, id); const prev = i.st; i.st = 'paid'; i.paid = nowDate(); rerender(); toast(`سُجل سداد ${id}`, { undo: () => { i.st = prev; i.paid = null; rerender(); } }); }
A.quickInvoice = () => quickAdd('invoice');

/* ==========================================================
   ANALYTICS
   ========================================================== */
VIEWS.analytics = () => {
  const yr = S.anPeriod === 'year';
  const k = yr ? [['قضايا جديدة', 50, 41, NEW_CASES], ['قضايا مغلقة', 39, 33, CLOSED_CASES], ['جلسات', 190, 168, SESS_MONTH], ['الإيرادات', '1.14M', null, REV_2026, 1143400, 1052000], ['نسبة التحصيل', '89%', null, [86, 94, 92, 92, 91, 91, 91, 91, 82], 89, 86], ['متوسط مدة القضية', '4.6 شهر', null, [5.1, 5, 4.9, 4.8, 4.8, 4.7, 4.7, 4.6, 4.6], 4.6, 5.2, true]]
    : [['قضايا جديدة', 4, 7, NEW_CASES], ['قضايا مغلقة', 2, 6, CLOSED_CASES], ['جلسات', 23, 23, SESS_MONTH], ['الإيرادات', '86.4K', null, REV_2026, 86.4, 78.2], ['نسبة التحصيل', '82%', null, [86, 94, 92, 92, 91, 91, 91, 91, 82], 82, 91], ['إغلاق المهام في وقتها', '87%', null, [78, 80, 79, 83, 84, 82, 85, 84, 87], 87, 84]];
  const types = [['تجارية', 7.2, 8.1], ['عمالية', 3.1, 3.6], ['عقارية', 5.4, 5.0], ['أحوال شخصية', 4.0, 4.8], ['تنفيذ', 2.6, 3.1], ['إدارية', 8.5, 9.2]];
  const heat = []; for (let w = 0; w < 13; w++) for (let d = 0; d < 5; d++) heat.push(Math.max(0, Math.round((Math.sin(w * 1.3 + d) + 1.2) * 1.6 + (d === 1 || d === 2 ? 1 : 0) - (w === 6 || w === 7 ? 2 : 0))));
  const src = [['إحالة من عميل', 34], ['الموقع الإلكتروني', 24], ['لينكدإن', 16], ['علاقة شخصية', 12], ['وسائل التواصل', 8], ['أخرى', 6]];
  return `<div class="page-h"><div><h1 class="h-disp h1">التحليلات</h1><div class="sub">قراءات عملية من بيانات مكتبك، ${yr ? 'منذ بداية 2026 مقارنة بنفس الفترة من 2025' : 'سبتمبر حتى اليوم مقارنة بأغسطس'}</div></div>
    <div class="tools"><div class="seg">${[['month', 'هذا الشهر'], ['year', 'هذا العام']].map(([v, l]) => `<button class="${S.anPeriod === v ? 'on' : ''}" data-a="seg" data-k="anPeriod" data-v="${v}">${l}</button>`).join('')}</div></div></div>
  <div class="kpi-row">${k.map(([l, v, prev, sp, cur, pv, inv]) => `<div class="kpi"><span>${l}</span><b class="num">${typeof v === 'number' ? counter(v) : v}</b><div class="row">${prev != null ? delta(v, prev) : delta(cur, pv, inv)}<span class="grow"></span>${spark(sp, 70, 22, 'var(--navy)', false)}</div></div>`).join('')}</div>
  <div class="grid g12" style="margin-bottom:30px">
    <section class="s7"><div class="sec-h"><div class="sec-t">القضايا الجديدة والمغلقة</div><div class="act legend"><span><i style="--c:var(--navy)"></i>جديدة</span><span><i style="--c:var(--gold)"></i>مغلقة</span></div></div>${groupBars({ groups: [NEW_CASES, CLOSED_CASES], labels: MONTHS.slice(0, 9).map((m) => m.slice(0, 3)), colors: ['var(--navy)', 'var(--gold)'], w: 660, h: 220 })}
      <p class="muted" style="font-size:12.5px;margin-top:8px">الفجوة بين الجديد والمغلق اتسعت في سبتمبر؛ لديك 3 قضايا تقترب من الحكم قد تعيد التوازن.</p></section>
    <section class="s5"><div class="sec-h"><div class="sec-t">متوسط مدة القضية بالأشهر</div><div class="act legend"><span><i style="--c:var(--navy);border-radius:50%"></i>2026</span><span><i style="--c:#fff;box-shadow:inset 0 0 0 2px var(--faint);border-radius:50%"></i>2025</span></div></div>
      <div class="dotplot">${types.map(([t, a, b]) => `<div class="r"><span>${t}</span><div class="track"><i class="prev" style="right:${(b / 10) * 100}%" data-tip="2025: ${b} شهر"></i><i style="right:${(a / 10) * 100}%" data-tip="2026: ${a} شهر"></i></div><b class="num" style="text-align:end">${a}</b></div>`).join('')}
      <div class="r" style="color:var(--faint);font-size:11px"><span></span><div class="row" style="justify-content:space-between"><span>0</span><span>5</span><span>10 أشهر</span></div><span></span></div></div></section>
  </div>
  <div class="grid g12" style="margin-bottom:30px">
    <section class="s4"><div class="sec-h"><div class="sec-t">كثافة الجلسات<small>آخر 13 أسبوعًا</small></div></div>
      <div class="row" style="align-items:flex-start;gap:8px"><div class="col" style="gap:4px;font-size:10.5px;color:var(--mute);padding-top:1px">${WD_SHORT.slice(0, 5).map((d) => `<span style="height:calc((100% - 16px)/5);line-height:17px">${d}</span>`).join('')}</div>
      <div class="heat grow" style="grid-template-columns:repeat(13,1fr);grid-auto-flow:column;grid-template-rows:repeat(5,1fr)">${heat.map((v, i) => `<i style="background:${v ? `color-mix(in srgb,var(--navy) ${Math.min(100, 14 + v * 17)}%,#fff)` : 'var(--sunk-2)'}" data-tip="${v} جلسات"></i>`).join('')}</div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">الاثنين والثلاثاء الأكثر ازدحامًا بفارق واضح، والأسبوعان في منتصف يوليو كانا الأخف.</p></section>
    <section class="s4"><div class="sec-h"><div class="sec-t">حِمل الفريق حسب حالة القضايا</div></div>
      ${TEAM.filter((u) => u.id !== 'u6').map((u) => { const cs = CASES.filter((c) => c.lead === u.id); return `<div class="stack-row"><span class="row gap6">${av(u.id, 'sm')}${u.short}</span><div class="stack">${Object.keys(STATUS).map((s, i) => { const n = cs.filter((c) => c.status === s).length; return n ? `<div style="flex:${n};background:${STATUS[s].c};animation-delay:${i * 50}ms" data-tip="${STATUS[s].l}: ${n}"></div>` : ''; }).join('')}<div style="flex:${Math.max(0, 8 - cs.length)};background:transparent"></div></div><b class="num">${cs.length}</b></div>`; }).join('')}
      <div class="legend" style="margin-top:10px">${Object.values(STATUS).map((s) => `<span><i style="--c:${s.c}"></i>${s.l}</span>`).join('')}</div></section>
    <section class="s4"><div class="sec-h"><div class="sec-t">مصادر العملاء الجدد</div></div>
      ${src.map(([l, p], i) => `<div class="row" style="padding:6px 0;font-size:13px"><span style="width:118px">${l}</span><div class="hbar grow" style="height:10px"><i class="growX" style="width:${(p / 34) * 100}%;animation-delay:${i * 60}ms;background:${i === 0 ? 'var(--gold)' : 'var(--navy)'};opacity:${i === 0 ? 1 : 1 - i * 0.12}"></i></div><b class="num" style="width:36px;text-align:end">${p}%</b></div>`).join('')}
      <div class="divider"></div><div class="row gap16">${ring(38, 72, 7, 'var(--gold)', 'var(--sunk-2)', `<b style="font-size:15px">38%</b>`)}<p style="font-size:13px;line-height:1.7">من العملاء أسندوا قضية ثانية للمكتب. متوسط إيراد العميل ${sarK(41800)} سنويًا.</p></div></section>
  </div>
  <section class="sunk" style="padding:22px 24px"><div class="sec-t" style="margin-bottom:6px">${ic('bulb', 'width="16" height="16"')}ما تقوله الأرقام هذا الشهر</div>
    <div class="grid three">${[['القضايا العمالية تُغلق أسرع بـ 14% من العام الماضي', 'على الأرجح بسبب انتقال الجلسات إلى الترافع عن بعد؛ يمكن تسعيرها بباقات ثابتة.'], ['الإحالات تجلب ثلث عملائك', 'وهي الأعلى قيمة. طلب إحالة بعد إغلاق كل قضية ناجحة قد يرفع هذه النسبة.'], ['التحصيل انخفض إلى 82%', 'سببه فاتورتان لعميلين فقط؛ متابعتهما هذا الأسبوع تعيد النسبة فوق 90%.']].map(([a, b]) => `<div><p style="font-weight:600;font-size:14px;margin:8px 0 4px">${a}</p><p class="muted" style="font-size:13px;line-height:1.7">${b}</p></div>`).join('')}</div></section>`;
};

/* ==========================================================
   AARAF SERVICES CENTER
   ========================================================== */
VIEWS.services = () => {
  const cat = SERVICES[S.svcCat]; const active = REQUESTS.filter((r) => r.st < 4);
  return `<section class="svc-hero"><svg class="pat" width="100%" height="100%"><defs><pattern id="pp" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M23 4l19 19-19 19L4 23z" fill="none" stroke="#C9A96E" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#pp)"/></svg>
    <div style="position:relative"><div class="row gap8" style="color:var(--gold);font-size:13px;font-weight:600;margin-bottom:10px">${ic('sparkle', 'width="16" height="16"')}خدمات أعراف</div><h1>طوّر مكتبك من المكان نفسه الذي تديره منه.</h1><p>فرق متخصصة في تسويق المهن القانونية والسكرتارية والتقنية والمحتوى، تعمل على بيانات مكتبك داخل المنصة، ويتابع طلبك من هنا خطوة بخطوة.</p>
      <div class="row gap8" style="margin-top:20px"><button class="btn btn-g" data-a="svcScroll">تصفح الخدمات</button><button class="btn" style="color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)" data-a="svcConsult">احجز مكالمة تعريفية</button></div></div>
    <div class="svc-mine"><h4><span>طلباتك الجارية</span><span style="color:var(--gold)">${active.length}</span></h4>${active.map((r) => `<div class="r" data-a="svcReq" data-id="${r.id}"><span class="ltr num" style="font-size:11px;color:rgba(233,230,221,.5)">${r.id}</span><span class="ell" style="flex:1">${r.svc}</span><span class="badge ${r.st === 3 ? 'b-amber' : 'b-gold'}" style="${r.st === 3 ? '' : 'background:rgba(201,169,110,.18)'}">${REQ_STEPS[r.st]}</span></div>`).join('')}</div></section>

  <div class="feat"><div class="ic">${ic('trend', 'width="22" height="22"')}</div><div><div style="font-weight:600;font-size:15px">القضايا التجارية نمت لديك 22% خلال ربع واحد</div><div class="muted" style="font-size:13px">مكاتب مماثلة تحوّل هذا النمو إلى حضور مهني عبر خطة محتوى تجارية موجهة لأصحاب المنشآت. نبدأ بقراءة ما يبحث عنه عملاؤك الحاليون.</div></div><button class="btn btn-p" data-a="svcRequest" data-id="sv4">خطة محتوى تجاري</button></div>

  <div class="cat-nav" id="svcCats">${Object.entries(SERVICES).map(([k, v]) => `<button class="${S.svcCat === k ? 'on' : ''}" data-a="seg" data-k="svcCat" data-v="${k}">${ic(v.ic)}${v.l}<span class="muted" style="font-size:11.5px;${S.svcCat === k ? 'color:rgba(255,255,255,.6)' : ''}">${v.items.length}</span></button>`).join('')}</div>
  ${S.svcCat === 'marketing' ? `<p class="muted" style="font-size:12.5px;margin:-10px 0 16px">${ic('lock', 'width="13" height="13" style="display:inline;vertical-align:-2px"')} نلتزم في كل خدمة تسويقية بالضوابط المهنية للإعلان عن خدمات المحاماة في المملكة.</p>` : ''}
  <div class="svc-grid">${cat.items.map((s, i) => `<article class="svc" style="animation:rbIn .5s var(--ease-out) ${i * 40}ms both">${s.tag ? `<span class="tag badge b-gold">${s.tag}</span>` : ''}<div class="ic">${ic(cat.ic)}</div><h3>${s.t}</h3><p>${s.p}</p><ul>${s.get.map((g) => `<li>${ic('check')}${g}</li>`).join('')}</ul>
    <div class="foot"><div class="price"><small>يبدأ من</small><b>${sar(s.price)}</b>${s.unit ? ` <small style="display:inline">${s.unit}</small>` : ''}</div><span class="grow"></span><span class="muted" style="font-size:12px">${ic('clock', 'width="13" height="13" style="display:inline;vertical-align:-2px"')} ${s.dur}</span><button class="btn btn-sm btn-p" data-a="svcRequest" data-id="${s.id}">اطلب</button></div></article>`).join('')}</div>

  <section style="margin-top:36px"><div class="sec-h"><div class="sec-t">تتبّع طلباتك</div><div class="act"><span class="muted" style="font-size:12.5px">يُحدَّث تلقائيًا كلما تقدم فريق أعراف في التنفيذ</span></div></div>
    <div id="reqList">${REQUESTS.slice().sort((a, b) => b.at - a.at).map(reqRow).join('')}</div></section>`;
};
function reqRow(r) {
  return `<div class="req ${r._new ? 'flash-in' : ''}" data-req="${r.id}"><div><div class="row gap8"><span class="ltr num muted" style="font-size:11.5px">${r.id}</span><span class="badge">${SERVICES[r.cat].l}</span></div><div style="font-weight:600;margin-top:4px">${r.svc}</div><div class="muted" style="font-size:12px">${r.who} — ${r.st === 4 ? 'اكتمل' : 'التسليم المتوقع ' + dm(r.eta)}${r.note ? ' — ' + r.note : ''}</div></div>
    <div class="rstep">${REQ_STEPS.map((s, i) => `<span class="${i < r.st ? 'd' : i === r.st ? (r.st === 3 ? 'w' : r.st === 4 ? 'd' : 'c') : ''}"><i></i>${s}</span>`).join('')}</div>
    <div class="row">${r.st === 3 ? `<button class="btn btn-sm btn-g" data-a="reqRespond" data-id="${r.id}">إكمال المطلوب منك</button>` : r.st === 4 ? `<button class="btn btn-sm btn-s" data-a="stub" data-m="نُزلت ملفات الطلب ${r.id}">${ic('download')}الملفات</button>` : `<button class="btn btn-sm btn-q" data-a="stub" data-m="فُتحت محادثة الطلب ${r.id} مع فريق أعراف">${ic('msg')}محادثة</button>`}</div></div>`;
}
function findSvc(id) { for (const [k, c] of Object.entries(SERVICES)) { const s = c.items.find((x) => x.id === id); if (s) return [k, s]; } }
A.svcScroll = () => $('#svcCats').scrollIntoView({ behavior: 'smooth', block: 'start' });
A.svcConsult = () => toast('طلبنا لك مكالمة تعريفية؛ سيتواصل معك فريق أعراف خلال يوم عمل', { info: true });
A.svcReq = () => $('#reqList')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
A.svcRequest = (el) => {
  const [cat, s] = findSvc(el.dataset.id);
  openDrawer(() => ({
    head: `<div class="row gap8" style="margin-bottom:4px"><span class="badge b-gold">${SERVICES[cat].l}</span><span class="muted" style="font-size:12px">${s.dur}</span></div><h2 class="h2" style="font-weight:600">${s.t}</h2>`,
    body: `<p style="font-size:14px;line-height:1.8;color:var(--ink-2)">${s.p}</p><div class="sunk" style="padding:14px 16px;margin:16px 0"><div class="sec-t" style="font-size:13px;margin-bottom:6px">ما ستستلمه</div>${s.get.map((g) => `<div class="row" style="font-size:13px;padding:3px 0">${ic('check', 'width="14" height="14" style="color:var(--gold-dk)"')}${g}</div>`).join('')}</div>
      <div class="field" style="margin-bottom:14px"><label>ما الذي تريد تحقيقه من هذه الخدمة؟</label><textarea class="inp" id="svcGoal" placeholder="${cat === 'marketing' ? 'مثال: نريد أن نصل إلى أصحاب المنشآت الصغيرة في الرياض الذين يحتاجون صياغة عقود' : 'صف ما تحتاجه بإيجاز'}"></textarea></div>
      <div class="form-grid"><div class="field"><label>موعد البدء المفضل</label><select class="inp"><option>في أقرب وقت</option><option>الأسبوع القادم</option><option>بداية الشهر القادم</option></select></div><div class="field"><label>مسؤول المتابعة من مكتبك</label><select class="inp">${TEAM.map((t) => `<option>${t.name}</option>`).join('')}</select></div></div>
      <label class="row" style="font-size:13px;margin-top:16px;gap:8px"><input type="checkbox" checked>السماح لفريق أعراف بالاطلاع على بيانات المكتب اللازمة لهذه الخدمة فقط</label>`,
    foot: `<div class="price" style="line-height:1.2"><small class="muted" style="font-size:11px;display:block">يبدأ من</small><b>${sar(s.price)}</b></div><button class="btn btn-p" data-a="svcSubmit" data-id="${s.id}" style="margin-inline-start:auto">إرسال الطلب</button>`,
  }));
};
A.svcSubmit = (el) => {
  const [cat, s] = findSvc(el.dataset.id); const r = { id: 'REQ-' + (1051 + REQUESTS.length), svc: s.t, cat, st: 0, at: nowDate(), who: 'فريق أعراف', eta: addDays(TODAY, 7), note: '', _new: true };
  REQUESTS.push(r); closeDrawer(); if (S.route === 'services') rerender();
  toast(`أُرسل طلب «${s.t}» — رقم ${r.id}`, { action: ['تتبع', () => { go('services'); setTimeout(A.svcReq, 400); }] });
  setTimeout(() => { r.st = 1; r._new = false; r.who = 'م. لمى الحمدان'; r.note = 'استلمت المستشارة طلبك وستتواصل خلال يوم'; if (S.route === 'services') { const row = $(`[data-req="${r.id}"]`); row && (row.outerHTML = reqRow(r)); } NOTIFS.unshift({ id: 'n' + Date.now(), g: 'system', ic: 'sparkle', t: `تم استلام طلبك <b>${s.t}</b> من فريق أعراف`, at: nowDate(), unread: true }); paintNav(); toast(`فريق أعراف استلم طلبك ${r.id}`, { info: true }); }, 6000);
};
A.reqRespond = (el) => { const r = byId(REQUESTS, el.dataset.id); openModal(`<div class="m-h"><div class="grow"><h3 class="h2" style="font-weight:600">المطلوب منك — ${r.id}</h3><div class="muted" style="font-size:13px">${r.note}</div></div><button class="icon-btn" data-a="mClose">${ic('x')}</button></div><div class="m-b"><div class="field"><label>رابط حساب لينكدإن للمكتب</label><input class="inp ltr" style="text-align:left" value="linkedin.com/company/khalid-law" dir="ltr"></div><label class="row" style="font-size:13px;margin-top:14px;gap:8px"><input type="checkbox" checked>منح صلاحية اطلاع مؤقتة لمدة 14 يومًا</label></div><div class="m-f"><button class="btn btn-q" data-a="mClose">لاحقًا</button><button class="btn btn-p" data-a="reqDone" data-id="${r.id}">إرسال</button></div>`); };
A.reqDone = (el) => { const r = byId(REQUESTS, el.dataset.id); r.st = 2; r.note = 'عاد الطلب إلى التنفيذ بعد استلام الصلاحية'; closeModal(); rerender(); toast('أُرسلت المعلومات، وعاد الطلب إلى التنفيذ'); };

/* ==========================================================
   NOTIFICATION CENTER
   ========================================================== */
let notifTab = 'urgent';
const NG = [['urgent', 'عاجل'], ['today', 'اليوم'], ['week', 'هذا الأسبوع'], ['team', 'الفريق'], ['system', 'النظام']];
function notifPanel() {
  const L = NOTIFS.filter((n) => n.g === notifTab);
  return {
    head: `<div class="row"><h2 class="h2 grow" style="font-weight:600">الإشعارات</h2><button class="btn btn-sm btn-q" data-a="readAll">تعليم الكل كمقروء</button></div>`,
    body: `<div class="ntabs" style="margin:-18px -22px 10px">${NG.map(([k, l]) => { const n = NOTIFS.filter((x) => x.g === k && x.unread).length; return `<button class="${notifTab === k ? 'on' : ''}" data-a="ntab" data-v="${k}">${l}${n ? `<span class="n ${k === 'urgent' ? 'hot' : ''}">${n}</span>` : ''}</button>`; }).join('')}</div>
    ${L.length ? L.map((n) => `<div class="nt ${n.unread ? 'unread' : ''} ${n.done ? 'done-state' : ''}" data-nid="${n.id}"><div class="ic">${n.from ? av(n.from) : ic(n.ic)}</div><div><p>${n.t}</p><time>${ago(n.at)}</time>
      ${n.acts ? `<div class="acts">${n.acts.map(([l, a, p]) => `<button class="btn btn-sm ${p ? 'btn-p' : 'btn-s'}" data-a="nAct" data-v="${a}" data-nid="${n.id}">${l}</button>`).join('')}</div>` : ''}<div class="res">${ic('check')}${n.done || ''}</div></div></div>`).join('')
      : empty(notifTab === 'urgent' ? 'لا شيء عاجل' : 'لا إشعارات هنا', notifTab === 'urgent' ? 'كل المهل تحت السيطرة الآن. سننبهك فور اقتراب أي موعد نظامي.' : 'ستظهر هنا التحديثات فور حدوثها.')}`,
  };
}
function openNotifs() { openDrawer(notifPanel); }
function refreshNotifs() { if (DR.stack.length && DR.stack[DR.stack.length - 1].render === notifPanel) refreshDrawer(); paintNav(); }
A.notifs = openNotifs;
A.ntab = (el) => { notifTab = el.dataset.v; refreshDrawer(); };
A.readAll = () => { NOTIFS.forEach((n) => (n.unread = false)); refreshNotifs(); toast('عُلّمت كل الإشعارات كمقروءة'); };
A.nAct = (el) => {
  const [k, v] = el.dataset.v.split(':'); const n = byId(NOTIFS, el.dataset.nid); n.unread = false; paintNav();
  if (k === 'approve') return A.approveTask({ dataset: { id: v } });
  if (k === 'remind') { n.done = 'أُرسل التذكير'; refreshNotifs(); return toast(`أُرسل تذكير سداد ${v} إلى العميل`); }
  closeDrawer();
  if (k === 'case') go('case', v); if (k === 'doc') A.openDoc({ dataset: { id: v } }); if (k === 'task') setTimeout(() => A.openTask({ dataset: { id: v } }), 300);
  if (k === 'client') { S.clientId = v; go('clients'); } if (k === 'prep') setTimeout(() => A.prep({ dataset: { id: v } }), 300); if (k === 'nav') go(v);
};

/* ==========================================================
   COMMAND PALETTE
   ========================================================== */
const CMDS = [
  ['إضافة مهمة', 'plus', () => quickAdd('task'), 'Shift T'], ['قضية جديدة', 'cases', () => quickAdd('case')], ['جلسة جديدة', 'cal', () => quickAdd('session')], ['عميل جديد', 'users', () => quickAdd('client')], ['فاتورة جديدة', 'receipt', () => quickAdd('invoice')], ['رفع مستند', 'upload', () => A.fakeUpload()],
  ['موجز اليوم', 'sun', () => A.brief()], ['مراجعة الأسبوع', 'activity', () => A.weekly()], ['الإشعارات', 'bell', openNotifs],
  ...NAV.filter((n) => n !== '-').map((n) => [`الانتقال إلى ${n.l}`, n.ic, () => go(n.r)]),
  ['طلب خدمة من أعراف', 'sparkle', () => go('services')], ['اختصارات لوحة المفاتيح', 'keyboard', () => shortcuts()],
];
let cmdIdx = 0, cmdItems = [];
function openCmd() {
  const w = $('#cmd'); w.innerHTML = `<div class="cmd"><div class="cmd-in">${ic('search')}<input id="cmdQ" placeholder="ابحث في القضايا والعملاء والمهام والجلسات، أو اكتب أمرًا" autocomplete="off"><span class="kbd">Esc</span></div><div class="cmd-res" id="cmdRes"></div>
    <div class="cmd-foot"><span><span class="kbd">↑↓</span>تنقل</span><span><span class="kbd">Enter</span>فتح</span><span><span class="kbd">Esc</span>إغلاق</span><span style="margin-inline-start:auto">جرّب: «العم» أو «456» أو «فاتورة»</span></div></div>`;
  w.classList.add('show'); w.onclick = (e) => { if (e.target === w) closeCmd(); };
  const q = $('#cmdQ'); q.focus(); q.oninput = () => cmdSearch(q.value);
  q.onkeydown = (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); cmdIdx = Math.min(cmdItems.length - 1, cmdIdx + 1); cmdPaint(); } if (e.key === 'ArrowUp') { e.preventDefault(); cmdIdx = Math.max(0, cmdIdx - 1); cmdPaint(); } if (e.key === 'Enter') { e.preventDefault(); cmdRun(cmdIdx); } };
  cmdSearch('');
}
function closeCmd() { $('#cmd').classList.remove('show'); }
A.cmd = openCmd;
function hl(text, q) { if (!q) return esc(text); const nt = norm(text), nq = norm(q); const i = nt.indexOf(nq); if (i < 0) return esc(text); return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length)); }
function cmdSearch(q) {
  const nq = norm(q.trim()); const m = (s) => !nq || norm(s).includes(nq);
  const G = [];
  if (!nq) {
    G.push(['مقترحات الآن', [
      { t: 'تقديم مذكرة التعقيب — الأفق', m: 'موعد نهائي اليوم 4:30 م', ic: 'clock', f: () => A.openTask({ dataset: { id: 't2' } }) },
      { t: 'شركة نماء ضد مؤسسة الإعمار الحديث', m: 'مهلة الاعتراض تنتهي بعد يومين', ic: 'alert', f: () => go('case', 'c3') },
      { t: 'جلسة المحكمة العمالية 11:30', m: 'محمد الغامدي ضد شركة البيان', ic: 'cal', f: () => openSession('s7') }]]);
    G.push(['أوامر', CMDS.slice(0, 6).map(([t, i, f, k]) => ({ t, ic: i, f, k }))]);
  } else {
    const cs = CASES.filter((c) => m(c.title + ' ' + c.no + ' ' + c.opp + ' ' + c.type + ' ' + c.subj)).slice(0, 5).map((c) => ({ t: c.title, m: `${c.type} — ${c.no} — ${STATUS[c.status].l}`, ic: 'cases', f: () => go('case', c.id) }));
    const kl = CLIENTS.filter((c) => m(c.name + ' ' + (c.contact || ''))).slice(0, 4).map((c) => ({ t: c.name, m: `${c.kind} — ${clientCases(c.id).length} قضايا`, ic: 'users', f: () => { S.clientId = c.id; go('clients'); } }));
    const ts = TASKS.filter((t) => t.st !== 'done' && m(t.t)).slice(0, 4).map((t) => ({ t: t.t, m: `${U(t.who).short} — ${rel(t.due)}`, ic: 'tasks', f: () => A.openTask({ dataset: { id: t.id } }) }));
    const ss = SESSIONS.filter((s) => s.at >= sod(TODAY) && m(CS(s.case).title + ' ' + CS(s.case).court + ' جلسة')).slice(0, 3).map((s) => ({ t: `جلسة ${dm(s.at)} — ${CS(s.case).title}`, m: CS(s.case).court, ic: 'cal', f: () => openSession(s.id) }));
    const ds = DOCS.filter((d) => m(d.name + ' ' + d.type)).slice(0, 3).map((d) => ({ t: d.name, m: d.type + (d.case ? ' — ' + CS(d.case).title : ''), ic: 'file', f: () => A.openDoc({ dataset: { id: d.id } }) }));
    const cm = CMDS.filter(([t]) => m(t)).slice(0, 4).map(([t, i, f, k]) => ({ t, ic: i, f, k }));
    [['القضايا', cs], ['العملاء', kl], ['المهام', ts], ['الجلسات', ss], ['المستندات', ds], ['أوامر', cm]].forEach((g) => g[1].length && G.push(g));
  }
  cmdItems = G.flatMap((g) => g[1]); cmdIdx = 0;
  let i = 0; $('#cmdRes').innerHTML = cmdItems.length ? G.map(([l, items]) => `<div class="cmd-g">${l}</div>` + items.map((it) => `<div class="cmd-i" data-ci="${i++}"><div class="ic">${ic(it.ic)}</div><div class="grow" style="min-width:0"><div class="t ell">${hl(it.t, q.trim())}</div>${it.m ? `<div class="m ell">${it.m}</div>` : ''}</div>${it.k ? `<span class="kbd">${it.k}</span>` : `<span class="go">فتح ${ic('chevL', 'width="12" height="12"')}</span>`}</div>`).join('')).join('')
    : `<div class="empty" style="padding:34px">${emptyArt()}<b>لا نتائج لـ «${esc(q)}»</b><p>جرّب رقم القضية أو جزءًا من اسم العميل. البحث يتجاهل الهمزات والتاء المربوطة.</p></div>`;
  $$('#cmdRes .cmd-i').forEach((el) => { el.onmouseenter = () => { cmdIdx = +el.dataset.ci; cmdPaint(false); }; el.onclick = () => cmdRun(+el.dataset.ci); });
  cmdPaint();
}
function cmdPaint(scroll = true) { $$('#cmdRes .cmd-i').forEach((el) => el.classList.toggle('act', +el.dataset.ci === cmdIdx)); if (scroll) $('#cmdRes .cmd-i.act')?.scrollIntoView({ block: 'nearest' }); }
function cmdRun(i) { const it = cmdItems[i]; if (!it) return; closeCmd(); closeDrawer(); setTimeout(it.f, 60); }

/* ==========================================================
   QUICK ADD (FAB + forms)
   ========================================================== */
const QA = [['task', 'مهمة', 'tasks', 'Shift T'], ['case', 'قضية', 'cases'], ['session', 'جلسة', 'cal'], ['client', 'عميل', 'users'], ['doc', 'مستند', 'upload'], ['invoice', 'فاتورة', 'receipt'], ['expense', 'مصروف', 'coins']];
A.fab = () => {
  const f = $('#fab'); const open = !f.classList.contains('open');
  if (open) { $('#fabMenu').innerHTML = QA.map(([k, l, i, kb], j) => `<button data-a="quick" data-k="${k}" style="transition-delay:${(QA.length - j) * 25}ms"><span class="ic">${ic(i)}</span>${l}${kb ? `<span class="k">${kb}</span>` : ''}</button>`).join(''); requestAnimationFrame(() => f.classList.add('open')); }
  else closeFab();
};
function closeFab() { $('#fab')?.classList.remove('open'); }
A.quick = (el) => { closeFab(); quickAdd(el.dataset.k, el.dataset); };
A.quickSession = () => quickAdd('session');
const caseOpts = (sel) => CASES.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.title}</option>`).join('');
const teamOpts = (sel = 'u1') => TEAM.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${t.name}</option>`).join('');
function quickAdd(kind, ds = {}) {
  closeDrawer();
  if (kind === 'doc') return A.fakeUpload();
  const F = {
    task: ['مهمة جديدة', `<div class="field full"><label>المهمة</label><input class="inp" id="qT" autofocus placeholder="مثال: طلب صورة الوكالة من العميل"></div><div class="field"><label>القضية</label><select class="inp" id="qC"><option value="">مهمة داخلية</option>${caseOpts(ds.case || (S.route === 'case' ? S.id : ''))}</select></div><div class="field"><label>المسؤول</label><select class="inp" id="qW">${teamOpts(ds.who)}</select></div><div class="field"><label>الاستحقاق</label><input class="inp" type="date" id="qD" value="2026-09-11"></div><div class="field"><label>الأولوية</label><select class="inp" id="qP"><option value="high">عالية</option><option value="med" selected>متوسطة</option><option value="low">منخفضة</option></select></div>`],
    case: ['قضية جديدة', `<div class="field full"><label>عنوان القضية</label><input class="inp" id="qT" autofocus placeholder="مثال: شركة الأفق ضد مؤسسة الريادة"></div><div class="field"><label>العميل</label><select class="inp" id="qK">${CLIENTS.map((c) => `<option value="${c.id}" ${c.id === ds.client ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div><div class="field"><label>نوع القضية</label><select class="inp" id="qTy">${Object.keys(TYPES).map((t) => `<option>${t}</option>`).join('')}</select></div><div class="field"><label>المحكمة</label><select class="inp" id="qCo">${[...new Set(CASES.map((c) => c.court))].map((c) => `<option>${c}</option>`).join('')}</select></div><div class="field"><label>المحامي المسؤول</label><select class="inp" id="qW">${teamOpts()}</select></div><div class="field"><label>الخصم</label><input class="inp" id="qO"></div><div class="field"><label>قيمة المطالبة (ريال)</label><input class="inp num" id="qA" inputmode="numeric" placeholder="0"></div>`],
    session: ['جلسة جديدة', `<div class="field full"><label>القضية</label><select class="inp" id="qC">${caseOpts(S.route === 'case' ? S.id : 'c1')}</select></div><div class="field"><label>التاريخ</label><input class="inp" type="date" id="qD" value="2026-09-21"></div><div class="field"><label>الوقت</label><input class="inp" type="time" id="qTm" value="10:00"></div><div class="field"><label>النوع</label><select class="inp" id="qK"><option>حضوري</option><option>عن بعد</option></select></div><div class="field"><label>المحامي</label><select class="inp" id="qW">${teamOpts()}</select></div>`],
    client: ['عميل جديد', `<div class="field full"><label>نوع العميل</label><div class="seg" id="qKind"><button class="on" data-kind="منشأة" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this));syncIndicators(this.parentNode.parentNode)">منشأة</button><button data-kind="فرد" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this));syncIndicators(this.parentNode.parentNode)">فرد</button></div></div><div class="field full"><label>الاسم</label><input class="inp" id="qT" autofocus></div><div class="field"><label>الجوال</label><input class="inp" id="qPh" dir="ltr" style="text-align:left" placeholder="+966 5x xxx xxxx"></div><div class="field"><label>البريد</label><input class="inp" id="qE" dir="ltr" style="text-align:left"></div><div class="field"><label>المصدر</label><select class="inp" id="qS"><option>إحالة من عميل</option><option>الموقع الإلكتروني</option><option>لينكدإن</option><option>علاقة شخصية</option></select></div><div class="field"><label>مسؤول العلاقة</label><select class="inp" id="qW">${teamOpts()}</select></div>`],
    invoice: ['فاتورة جديدة', `<div class="field"><label>العميل</label><select class="inp" id="qK">${CLIENTS.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="field"><label>القضية</label><select class="inp" id="qC">${caseOpts('c1')}</select></div><div class="field"><label>المبلغ قبل الضريبة</label><input class="inp num" id="qA" value="10000" inputmode="numeric"></div><div class="field"><label>الاستحقاق</label><input class="inp" type="date" id="qD" value="2026-09-30"></div><div class="field full"><label>البيان</label><input class="inp" id="qT" value="أتعاب مرحلة المرافعة — دفعة ثانية"></div><div class="full sunk" style="padding:12px 14px;font-size:13px" id="qVat"></div>`],
    expense: ['مصروف', `<div class="field"><label>البند</label><select class="inp"><option>رسوم قضائية</option><option>ترجمة معتمدة</option><option>خبير</option><option>تنقلات</option></select></div><div class="field"><label>المبلغ</label><input class="inp num" id="qA" value="450"></div><div class="field full"><label>القضية</label><select class="inp">${caseOpts('c1')}</select></div><div class="field full"><label>ملاحظة</label><input class="inp" placeholder="اختياري"></div>`],
  }[kind];
  openModal(`<div class="m-h"><h3 class="h2 grow" style="font-weight:600">${F[0]}</h3><button class="icon-btn" data-a="mClose">${ic('x')}</button></div><div class="m-b"><div class="form-grid">${F[1]}</div></div><div class="m-f"><span class="muted" style="font-size:12px;margin-inline-end:auto"><span class="kbd">Ctrl Enter</span> للحفظ</span><button class="btn btn-q" data-a="mClose">إلغاء</button><button class="btn btn-p" data-a="qaSave" data-k="${kind}">حفظ</button></div>`);
  setTimeout(() => { syncIndicators($('#modal')); const v = $('#qVat'); const a = $('#qA'); if (v) { const p = () => { const n = +a.value.replace(/\D/g, '') || 0; v.innerHTML = `<div class="row"><span class="grow muted">ضريبة القيمة المضافة 15%</span><b class="num">${fmt(n * 0.15)}</b></div><div class="row"><span class="grow">الإجمالي</span><b class="num">${sar(n * 1.15)}</b></div>`; }; p(); a.oninput = p; } }, 30);
  $('#modal').onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) A.qaSave({ dataset: { k: kind } }); };
}
A.qaSave = (el) => {
  const k = el.dataset.k; const v = (id) => $('#' + id)?.value?.trim?.() ?? '';
  const dt = (s, hh = 0, mm = 0) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, hh, mm); };
  if (k === 'task') { if (!v('qT')) return $('#qT').focus(); const t = { id: 't' + (++_tid), t: v('qT'), case: v('qC') || null, who: v('qW'), pri: v('qP'), due: dt(v('qD')), st: 'todo' }; TASKS.push(t); closeModal(); after0(); toast(`أُضيفت المهمة وأُسندت إلى ${U(t.who).short}`, { action: ['فتح', () => A.openTask({ dataset: { id: t.id } })] }); }
  if (k === 'case') { if (!v('qT')) return $('#qT').focus(); const id = 'c' + (CASES.length + 1 + Math.floor(Math.random() * 900)); CASES.unshift({ id, title: v('qT'), subj: 'قضية جديدة — تحت الإعداد', client: v('qK'), role: 'مدعٍ', opp: v('qO') || '—', type: v('qTy'), court: v('qCo'), no: '—', circuit: 'لم تُقيد بعد', lead: v('qW'), team: [], status: 'prep', pri: 'med', claim: +v('qA').replace(/\D/g, '') || 0, opened: nowDate(), last: { t: 'فتح ملف القضية', d: nowDate() }, fee: 0 }); closeModal(); go('case', id); toast('أُنشئت القضية. الخطوة التالية: رفع الوكالة وصحيفة الدعوى'); }
  if (k === 'session') { const [hh, mm] = v('qTm').split(':').map(Number); const s = { id: 's' + (++_sid), at: dt(v('qD'), hh, mm), case: v('qC'), by: v('qW'), kind: v('qK'), dur: 45 }; SESSIONS.push(s); closeModal(); after0(); toast(`جُدولت الجلسة ${dm(s.at)}`, { action: ['عرض', () => { S.calAnchor = s.at; S.calView = 'week'; go('calendar'); }] }); }
  if (k === 'client') { if (!v('qT')) return $('#qT').focus(); const id = 'k' + (CLIENTS.length + 1); CLIENTS.push({ id, name: v('qT'), kind: $('#qKind button.on').dataset.kind, phone: v('qPh') || '—', email: v('qE') || '—', since: nowDate(), last: nowDate(), owner: v('qW'), source: v('qS'), city: 'الرياض' }); closeModal(); S.clientId = id; S.clientF = 'all'; go('clients'); toast('أُضيف العميل'); }
  if (k === 'invoice') { const i = { id: 'INV-2026-0' + (++_iid), client: v('qK'), case: v('qC'), amt: Math.round((+v('qA').replace(/\D/g, '') || 0) * 1.15), issued: nowDate(), due: dt(v('qD')), st: 'due' }; INVOICES.unshift(i); closeModal(); S.finTab = 'all'; S.route === 'finance' ? rerender() : after0(); toast(`أُصدرت الفاتورة ${i.id} وأُرسلت إلى العميل`, { action: ['المالية', () => go('finance')] }); }
  if (k === 'expense') { closeModal(); toast('سُجل المصروف على القضية'); }
};
function after0() { if (S.route === 'case') refreshTab(); else rerender(); paintNav(); }

/* ==========================================================
   CONTEXT MENUS
   ========================================================== */
const CTX = {
  case: (id) => { const c = CS(id); return [{ h: c.title }, { l: 'فتح القضية', ic: 'expand', k: 'Enter', f: () => go('case', id) }, { l: 'إضافة مهمة', ic: 'plus', f: () => quickAdd('task', { case: id }) }, { l: 'الخط الزمني', ic: 'gantt', f: () => go('case', id, 'timeline') }, { l: 'نسخ رقم القضية', ic: 'copy', f: () => { navigator.clipboard?.writeText(c.no); toast('نُسخ رقم القضية'); } }, '-', { h: 'نقل إلى' }, ...Object.entries(STATUS).filter(([k]) => k !== c.status).slice(0, 4).map(([k, s]) => ({ l: s.l, f: () => moveCase(id, k) }))]; },
  task: (id) => { const t = byId(TASKS, id); return [{ l: 'فتح', ic: 'expand', f: () => A.openTask({ dataset: { id } }) }, { l: t.st === 'done' ? 'إعادة فتح' : 'إنجاز', ic: 'check', f: () => moveTask(id, t.st === 'done' ? 'todo' : 'done') }, '-', ...Object.entries(TST).filter(([k]) => k !== t.st && k !== 'done').map(([k, [l]]) => ({ l: 'نقل إلى ' + l, f: () => moveTask(id, k) })), '-', { l: 'حذف', ic: 'x', red: true, f: () => { const i = TASKS.indexOf(t); TASKS.splice(i, 1); rerender(); toast('حُذفت المهمة', { undo: () => { TASKS.splice(i, 0, t); rerender(); } }); } }]; },
  doc: (id) => [{ l: 'معاينة', ic: 'eye', f: () => A.openDoc({ dataset: { id } }) }, { l: 'تنزيل', ic: 'download', f: () => toast('بدأ التنزيل') }, { l: 'نسخ رابط مشاركة', ic: 'link', f: () => toast('نُسخ رابط مشاركة آمن') }],
  inv: (id) => { const i = byId(INVOICES, id); return [{ h: id }, ...(i.st !== 'paid' ? [{ l: 'تسجيل السداد', ic: 'check', f: () => markPaid(id) }, { l: 'إرسال تذكير', ic: 'bell', f: () => toast(`أُرسل تذكير إلى ${K(i.client).name}`) }] : []), { l: 'تنزيل PDF', ic: 'download', f: () => toast('بدأ تنزيل الفاتورة') }, { l: 'ملف العميل', ic: 'users', f: () => { S.clientId = i.client; go('clients'); } }]; },
};

/* ==========================================================
   ONBOARDING & SHORTCUTS
   ========================================================== */
let ob = { step: 0, type: 'office', areas: new Set(['تجارية', 'عمالية']) };
function onboarding() {
  const st = ob.step; const dots = [0, 1, 2].map((i) => `<i style="width:${i === st ? 22 : 8}px;height:8px;border-radius:4px;background:${i <= st ? 'var(--navy)' : 'var(--sunk-2)'};display:block;transition:all .3s"></i>`).join('');
  const body = [
    `<h3 class="h-disp h2" style="margin-bottom:4px">أهلًا بك في أعراف للمحامين</h3><p class="muted" style="margin-bottom:18px">لنجهّز المنصة على طريقة عملك. ثلاث خطوات فقط.</p><div class="opt-cards">${[['solo', 'user', 'محامٍ مستقل', 'أدير قضاياي بنفسي مع دعم محدود'], ['office', 'team', 'مكتب محاماة', 'فريق من 2 إلى 20 شخصًا'], ['firm', 'cases', 'شركة مهنية', 'أقسام وشركاء وصلاحيات متعددة']].map(([k, i, t, d]) => `<button class="opt-card ${ob.type === k ? 'on' : ''}" data-a="obType" data-v="${k}">${ic(i, 'width="22" height="22" style="color:var(--navy)"')}<b>${t}</b><small>${d}</small></button>`).join('')}</div>`,
    `<h3 class="h-disp h2" style="margin-bottom:16px">عن مكتبك</h3><div class="form-grid"><div class="field full"><label>اسم المكتب</label><input class="inp" value="مكتب خالد للمحاماة والاستشارات القانونية"></div><div class="field"><label>عدد أعضاء الفريق</label><select class="inp"><option>2–5</option><option selected>6–10</option><option>11–20</option></select></div><div class="field"><label>المدينة</label><select class="inp"><option>الرياض</option><option>جدة</option><option>الدمام</option></select></div><div class="field full"><label>مجالات العمل</label><div class="toggle-chips">${Object.keys(TYPES).map((t) => `<button class="chip ${ob.areas.has(t) ? 'on' : ''}" data-a="obArea" data-v="${t}">${t}</button>`).join('')}</div></div></div>`,
    `<h3 class="h-disp h2" style="margin-bottom:4px">من أين تبدأ؟</h3><p class="muted" style="margin-bottom:18px">يمكنك البدء بقضية واحدة، أو نقل بياناتك الحالية دفعة واحدة.</p><div class="opt-cards">${[['case', 'cases', 'أضف أول قضية', 'دقيقتان'], ['client', 'users', 'أضف أول عميل', 'دقيقة'], ['import', 'upload', 'استيراد من Excel', 'أو اطلب من فريق أعراف نقلها']].map(([k, i, t, d]) => `<button class="opt-card" data-a="obGo" data-v="${k}">${ic(i, 'width="22" height="22" style="color:var(--navy)"')}<b>${t}</b><small>${d}</small></button>`).join('')}</div>`,
  ][st];
  openModal(`<div class="m-b" style="padding-top:26px">${body}</div><div class="m-f" style="justify-content:space-between"><div class="row gap4">${dots}</div><div class="row">${st ? '<button class="btn btn-q" data-a="obNav" data-d="-1">السابق</button>' : '<button class="btn btn-q" data-a="mClose">تخطي</button>'}${st < 2 ? '<button class="btn btn-p" data-a="obNav" data-d="1">التالي</button>' : '<button class="btn btn-p" data-a="obGo" data-v="done">إنهاء</button>'}</div></div>`, 'lg');
}
A.obType = (el) => { ob.type = el.dataset.v; onboarding(); };
A.obArea = (el) => { const v = el.dataset.v; ob.areas.has(v) ? ob.areas.delete(v) : ob.areas.add(v); el.classList.toggle('on'); };
A.obNav = (el) => { ob.step = Math.max(0, Math.min(2, ob.step + +el.dataset.d)); onboarding(); };
A.obGo = (el) => { const v = el.dataset.v; ob.step = 0; closeModal(); if (v === 'case' || v === 'client') setTimeout(() => quickAdd(v), 250); else if (v === 'import') go('services'); else toast('جاهز. مكتبك مُعدّ على المنصة'); };
function shortcuts() {
  const K_ = [['Ctrl K أو /', 'البحث والأوامر'], ['N', 'إضافة سريعة'], ['Shift T', 'مهمة جديدة'], ['Esc', 'إغلاق اللوحة أو النافذة'], ['↑ ↓ ثم Enter', 'التنقل في نتائج البحث'], ['زر الفأرة الأيمن', 'قائمة إجراءات على القضايا والمهام والفواتير'], ['السحب والإفلات', 'نقل البطاقات بين المراحل، ورفع الملفات من أي مكان']];
  openModal(`<div class="m-h"><h3 class="h2 grow" style="font-weight:600">اختصارات لوحة المفاتيح</h3><button class="icon-btn" data-a="mClose">${ic('x')}</button></div><div class="m-b">${K_.map(([k, l]) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="grow">${l}</span><span class="kbd" style="margin:0;font-size:12px">${k}</span></div>`).join('')}</div>`);
}
