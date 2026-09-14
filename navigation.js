/* ==========================================================
   Navigation — shared portals, destinations and option search
   Existing views, actions, icons and motion remain the source of truth.
   ========================================================== */
const PORTALS = [
  { id: 'daily', l: 'العمل اليومي', ic: 'cal', desc: 'جلساتك ومهامك، في مكان واحد', routes: ['calendar', 'tasks'], quick: ['session', 'task'] },
  { id: 'practice', l: 'القضايا والعملاء', ic: 'cases', desc: 'ملفات القضايا والعملاء والمستندات', routes: ['cases', 'clients', 'docs'], quick: ['case', 'client', 'doc'] },
  { id: 'office', l: 'إدارة المكتب', ic: 'wallet', desc: 'الفريق والمالية وقراءة الأداء', routes: ['team', 'finance', 'analytics'], quick: ['invoice', 'expense'] },
  { id: 'araf', l: 'خدمات أعراف', ic: 'sparkle', desc: 'التسويق والسكرتارية وكل خدمات الدعم', routes: ['services'], quick: [] },
];
const NAV_INFO = {
  home: ['موجز المكتب والتنبيهات والمواعيد المهمة', 'الرئيسية لوحة التحكم داشبورد dashboard home'],
  cases: ['متابعة القضايا ومراحلها وتفاصيلها', 'قضية دعوى ملف تقاضي cases'],
  calendar: ['التقويم وتحضير الجلسات وتسجيل نتائجها', 'جلسة موعد مواعيد تقويم calendar'],
  tasks: ['توزيع المهام ومتابعة الإنجاز والمراجعة', 'مهمة تكليف واجبات tasks'],
  clients: ['ملفات العملاء والتواصل وسجل العلاقة', 'عميل موكل منشأة افراد clients'],
  docs: ['المستندات والمرفقات والنسخ والموافقات', 'مستند وثيقة ملف ملفات ارشيف documents'],
  team: ['أعضاء المكتب وتوزيع العمل والأداء', 'محامي محامين عضو زميل موظف team'],
  finance: ['الفواتير والتحصيل والإيرادات والمتأخرات', 'فاتورة فواتير دفعات مصاريف حسابات مالية finance'],
  analytics: ['مؤشرات المكتب والتقارير والمقارنات', 'تحليل احصاء احصائيات رسوم بيانية تقارير analytics'],
  services: ['تصفح جميع خدمات أعراف واطلب ما تحتاجه', 'طلب خدمة من أعراف خدمة دعم استشارة تسويق سكرتارية services'],
};
S.navGroup = 'daily';
S.portalId = '';
S.serviceSection = '';
S.navTarget = null;
let navRouteKey = '';

function portalForRoute(route = S.route) {
  return PORTALS.find((g) => g.routes.includes(route === 'case' ? 'cases' : route));
}
function portalLinks(g) {
  const links = g.routes.map((r) => {
    const n = NAV.find((item) => item.r === r);
    return { ...n, key: r, desc: NAV_INFO[r][0], aliases: NAV_INFO[r][1], group: g.id };
  });
  if (g.id === 'araf') {
    Object.entries(SERVICES).forEach(([id, cat]) => links.push({
      key: 'service-category-' + id, r: 'services', id, l: cat.l, ic: cat.ic,
      desc: cat.items.length + ' خدمات — ' + cat.items.slice(0, 2).map((s) => s.t).join('، '),
      aliases: cat.items.map((s) => s.t).join(' '), group: g.id,
    }));
    links.push({ key: 'requests', r: 'services', id: 'requests', l: 'تتبع طلباتي', ic: 'inbox', desc: 'حالة طلباتك والمطلوب منك ومخرجات الخدمات', aliases: 'طلب طلبات متابعة تتبع', group: g.id });
  }
  return links;
}
function navActive(n) {
  if (n.r === 'services') return S.route === 'services' && (n.id || '') === S.serviceSection;
  return S.route === n.r || (n.r === 'cases' && S.route === 'case');
}
function navAttrs(n) {
  return 'data-a="nav" data-to="' + n.r + '"' + (n.id ? ' data-id="' + n.id + '"' : '');
}
function navButton(n, child = false) {
  const c = n.cnt ? n.cnt() : '';
  const count = c ? (typeof c === 'object' ? '<span class="cnt hot">' + c.n + '</span>' : '<span class="cnt">' + c + '</span>') : '';
  return '<button class="nav-i ' + (child ? 'nav-child ' : '') + (n.cls || '') + (navActive(n) ? ' on' : '') + '" ' + navAttrs(n) +
    ' aria-label="' + esc(n.l) + '" title="' + esc(n.l) + '"' + (navActive(n) ? ' aria-current="page"' : '') + '>' +
    ic(n.ic) + '<span>' + esc(n.l) + '</span>' + count + '</button>';
}
function portalNav() {
  const key = S.route + '/' + (S.portalId || '') + '/' + (S.serviceSection || '');
  if (key !== navRouteKey) {
    const group = portalForRoute();
    if (group) S.navGroup = group.id;
    navRouteKey = key;
  }
  return navButton(NAV[0]) +
    navButton({ r: 'portals', l: 'كل البوابات', ic: 'grid' }) + '<div class="nav-sep"></div>' +
    PORTALS.map((g) => '<section class="nav-portal" data-group="' + g.id + '">' +
      '<button class="nav-i nav-portal-toggle' + (portalForRoute()?.id === g.id ? ' active-portal' : '') +
      '" data-a="navGroup" data-id="' + g.id + '" aria-controls="nav-group-' + g.id + '" aria-expanded="false" title="' + esc(g.l) + '" aria-label="' + esc(g.l) + '">' +
      ic(g.ic) + '<span>' + g.l + '</span>' + ic('chevD', 'class="portal-chevron"') + '</button>' +
      '<div class="nav-children" id="nav-group-' + g.id + '" inert><div>' + portalLinks(g).map((n) => navButton(n, true)).join('') + '</div></div></section>').join('');
}
function compactNav() {
  const app = $('#app');
  return app.classList.contains('collapsed') || (innerWidth <= 1280 && !app.classList.contains('expanded'));
}
function syncNavGroups() {
  $$('.nav-portal').forEach((el) => {
    const open = !compactNav() && S.navGroup === el.dataset.group;
    el.classList.toggle('is-open', open);
    const toggle = $('.nav-portal-toggle', el);
    if (compactNav()) {
      toggle.removeAttribute('aria-expanded');
      toggle.removeAttribute('aria-controls');
    } else {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-controls', 'nav-group-' + el.dataset.group);
    }
    $('.nav-children', el).inert = !open;
  });
}
A.navGroup = (el) => {
  const group = PORTALS.find((g) => g.id === el.dataset.id);
  if (!group) return;
  if (compactNav()) return go('portals', group.id);
  S.navGroup = S.navGroup === group.id ? '' : group.id;
  syncNavGroups();
};
window.addEventListener('resize', syncNavGroups);

function portalShortcuts() {
  return '<section class="portal-shortcuts" aria-labelledby="portal-shortcuts-title">' +
    '<div class="sec-h"><h2 class="sec-t" id="portal-shortcuts-title">إلى أين تريد الوصول؟</h2><button class="btn btn-sm btn-q" data-a="nav" data-to="portals">كل الخيارات' + ic('chevL') + '</button></div>' +
    '<div class="portal-launchers">' + PORTALS.map((g) => '<button class="portal-launcher" data-a="nav" data-to="portals" data-id="' + g.id + '">' +
      '<span class="portal-icon">' + ic(g.ic) + '</span><span class="grow"><b>' + g.l + '</b><small>' + g.desc + '</small></span>' + ic('chevL', 'class="portal-arrow"') + '</button>').join('') + '</div></section>';
}
VIEWS.portals = () => {
  const selected = PORTALS.find((g) => g.id === S.portalId);
  const groups = selected ? [selected] : PORTALS;
  return '<div class="page-h"><div><h1 class="h-disp h1">' + (selected ? selected.l : 'بوابات المكتب') +
    '</h1><p class="sub">' + (selected ? selected.desc : 'اختر ما تريد إنجازه؛ كل أقسام مكتبك وخدمات أعراف هنا.') +
    '</p></div><div class="tools"><button class="btn btn-s" data-a="nav" data-to="home">' + ic('home') + 'العودة إلى اليوم</button></div></div>' +
    '<button class="portal-search" data-a="cmd" aria-haspopup="dialog" aria-controls="cmd">' + ic('search') +
    '<span class="grow"><b>ابحث عن أي خيار أو خدمة</b><small>مثل: استشارة تسويقية، مصروف، مذكرات القضية، أو رقم فاتورة</small></span><span class="kbd">Ctrl K</span></button>' +
    '<div class="portal-filters" aria-label="تصفية البوابات"><button class="chip' + (!selected ? ' on' : '') +
    '" data-a="nav" data-to="portals" aria-pressed="' + !selected + '">كل البوابات</button>' +
    PORTALS.map((g) => '<button class="chip' + (selected?.id === g.id ? ' on' : '') + '" data-a="nav" data-to="portals" data-id="' + g.id +
      '" aria-pressed="' + (selected?.id === g.id) + '">' + ic(g.ic) + g.l + '</button>').join('') + '</div>' +
    '<div class="portal-grid' + (selected ? ' single' : '') + '">' + groups.map((g, index) =>
      '<section class="portal-panel" style="--portal-delay:' + index * 45 + 'ms" aria-labelledby="portal-title-' + g.id + '">' +
      '<div class="portal-panel-head"><span class="portal-icon">' + ic(g.ic) + '</span><div><h2 id="portal-title-' + g.id + '">' + g.l + '</h2><p>' + g.desc + '</p></div></div>' +
      '<div class="portal-links">' + portalLinks(g).map((n) => '<button class="portal-link" ' + navAttrs(n) + '>' + ic(n.ic) +
        '<span class="grow"><b>' + n.l + '</b><small>' + esc(n.desc) + '</small></span>' + ic('chevL', 'class="portal-arrow"') + '</button>').join('') + '</div>' +
      (g.quick.length ? '<div class="portal-quick"><span>إضافة سريعة</span>' + g.quick.map((kind) => {
        const q = QA.find((item) => item[0] === kind);
        return '<button class="chip" data-a="quick" data-k="' + kind + '">' + ic(q[2]) + q[1] + '</button>';
      }).join('') + '</div>' : '') + '</section>').join('') + '</div>' +
    '<div class="portal-help"><button class="btn btn-q" data-a="notifs">' + ic('bell') + 'الإشعارات</button><button class="btn btn-q" data-a="settings">' +
    ic('sliders') + 'الإعدادات</button><button class="btn btn-q" data-a="showShortcuts">' + ic('keyboard') + 'اختصارات لوحة المفاتيح</button></div>';
};
A.showShortcuts = () => shortcuts();

/* Resolve destinations against known records; never use arbitrary hash text in selectors. */
function parseNavigationHash(parts) {
  S.portalId = S.route === 'portals' && PORTALS.some((g) => g.id === parts[1]) ? parts[1] : '';
  S.navTarget = null;
  if (S.route === 'services') {
    const category = Object.prototype.hasOwnProperty.call(SERVICES, parts[1]);
    S.serviceSection = parts[1] === 'requests' || category ? parts[1] : '';
    if (category) S.svcCat = parts[1];
    if (parts[1] === 'requests') {
      const request = byId(REQUESTS, parts[2]);
      S.navTarget = { kind: 'request', id: request?.id || '' };
    } else if (category) S.navTarget = { kind: 'catalog' };
  }
  if (S.route === 'finance' && byId(INVOICES, parts[1])) {
    S.finTab = 'all';
    S.navTarget = { kind: 'invoice', id: parts[1] };
  }
}
HOOKS.push((root) => {
  const target = S.navTarget;
  if (!target) return;
  let el;
  if (target.kind === 'catalog') el = $('#svcCats', root);
  if (target.kind === 'request') el = target.id ? $$('[data-req]', root).find((row) => row.dataset.req === target.id) : $('#reqList', root);
  if (target.kind === 'invoice') el = $$('.inv-row[data-ctx]', root).find((row) => row.dataset.ctx === 'inv:' + target.id);
  if (!el) return;
  S.navTarget = null;
  el.classList.add('destination-focus');
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: 'auto', block: 'center' });
});
function openCaseSection(tab) {
  if (S.route === 'case' && CS(S.id)) go('case', S.id, tab);
  else openCmd({ caseTab: tab });
}

/* A fresh index reflects added records without storing client data elsewhere. */
function optionEntries() {
  const entry = (id, t, icon, f, m = '', aliases = '') => ({ id, t, ic: icon, f, m, aliases });
  const routeEntries = [entry('route-home', 'اليوم', 'home', () => go('home'), NAV_INFO.home[0], NAV_INFO.home[1]),
    entry('route-portals', 'كل البوابات', 'grid', () => go('portals'), 'دليل أقسام المكتب وخدمات أعراف', 'خيارات اقسام دليل بوابة')];
  PORTALS.forEach((g) => {
    routeEntries.push(entry('portal-' + g.id, g.l, g.ic, () => go('portals', g.id), g.desc, 'بوابة ' + g.l));
    portalLinks(g).forEach((n) => routeEntries.push(entry('route-' + n.key, n.l, n.ic, () => go(n.r, n.id), g.l + ' — ' + n.desc, n.aliases)));
  });
  const quickNames = { task: 'إضافة مهمة', case: 'قضية جديدة', session: 'جلسة جديدة', client: 'عميل جديد', doc: 'رفع مستند', invoice: 'فاتورة جديدة', expense: 'إضافة مصروف' };
  const quickAliases = { task: 'مهمة جديدة انشاء تكليف', case: 'اضافة انشاء قضية دعوى', session: 'اضافة موعد جلسة', client: 'اضافة موكل عميل', doc: 'اضافة ملف وثيقة مرفق رفع ملفات', invoice: 'اضافة انشاء فاتورة', expense: 'مصروف جديد مصاريف نفقات' };
  const commands = QA.map(([kind, , icon, shortcut]) => ({ ...entry('quick-' + kind, quickNames[kind], icon, () => quickAdd(kind), 'فتح نموذج الإضافة', quickAliases[kind]), k: shortcut }));
  [
    ['brief', 'موجز اليوم', 'sun', () => A.brief(), 'ملخص يومك والمهل القريبة'],
    ['weekly', 'مراجعة الأسبوع', 'activity', () => A.weekly(), 'الإنجاز ومقارنة الأسبوع السابق'],
    ['notifs', 'الإشعارات', 'bell', openNotifs, 'التنبيهات والطلبات العاجلة'],
    ['settings', 'الإعدادات', 'sliders', () => A.settings(), 'إعدادات المكتب'],
    ['shortcuts', 'اختصارات لوحة المفاتيح', 'keyboard', shortcuts, 'طرق الوصول السريع'],
    ['onboarding', 'تجربة البداية', 'sparkle', onboarding, 'تهيئة المكتب وخطوات البدء'],
    ['profile', 'صفحتي', 'user', () => openMember('u1'), 'حسابي وملفي الشخصي'],
    ['service-call', 'احجز مكالمة تعريفية', 'phone', () => A.svcConsult(), 'التعرف على خدمات أعراف'],
  ].forEach((args) => commands.push(entry(...args)));
  const view = (id, title, route, stateKey, value, icon, description) => commands.push(entry(id, title, icon, () => { S[stateKey] = value; go(route); }, description));
  [['list', 'قائمة القضايا', 'list'], ['cards', 'بطاقات القضايا', 'grid'], ['kanban', 'مراحل القضايا', 'kanban'], ['gantt', 'الخط الزمني للقضايا', 'gantt']]
    .forEach(([key, title, icon]) => view('cases-view-' + key, title, 'cases', 'casesView', key, icon, 'طريقة عرض القضايا'));
  SAVED.forEach(([key, title]) => commands.push(entry('cases-saved-' + key, title, 'filter', () => { S.casesSaved = key; S.casesQ = ''; S.cf = {}; go('cases'); }, 'قائمة قضايا محفوظة')));
  [['day', 'تقويم اليوم'], ['week', 'تقويم الأسبوع'], ['month', 'تقويم الشهر']]
    .forEach(([key, title]) => view('calendar-' + key, title, 'calendar', 'calView', key, 'cal', 'عرض الجلسات والمواعيد'));
  [['kanban', 'لوحة المهام', 'kanban'], ['list', 'قائمة المهام', 'list']]
    .forEach(([key, title, icon]) => view('tasks-view-' + key, title, 'tasks', 'tasksView', key, icon, 'طريقة عرض المهام'));
  [['mine', 'مهامي'], ['team', 'مهام الفريق'], ['upcoming', 'مهام خلال 7 أيام'], ['late', 'المهام المتأخرة']]
    .forEach(([key, title]) => view('tasks-scope-' + key, title, 'tasks', 'tasksScope', key, 'tasks', 'متابعة المهام'));
  [['all', 'كل العملاء'], ['org', 'عملاء المنشآت'], ['ind', 'العملاء الأفراد'], ['stale', 'عملاء بحاجة لتواصل']]
    .forEach(([key, title]) => view('clients-' + key, title, 'clients', 'clientF', key, 'users', 'تصفية العملاء'));
  [['all', 'كل الفواتير'], ['due', 'الفواتير المستحقة'], ['overdue', 'الفواتير المتأخرة'], ['paid', 'الفواتير المدفوعة']]
    .forEach(([key, title]) => view('finance-' + key, title, 'finance', 'finTab', key, 'receipt', 'المالية والتحصيل'));
  [['month', 'تحليلات هذا الشهر'], ['year', 'تحليلات هذا العام']]
    .forEach(([key, title]) => view('analytics-' + key, title, 'analytics', 'anPeriod', key, 'chart', 'مؤشرات الأداء'));
  [...new Set(DOCS.map((d) => d.type))].forEach((type) => view('docs-' + type, 'مستندات: ' + type, 'docs', 'docType', type, 'file', 'تصفية المستندات حسب النوع'));
  const sectionNames = { overview: 'نظرة عامة على القضية', timeline: 'الخط الزمني للقضية', sessions: 'جلسات القضية', tasks: 'مهام القضية', docs: 'مستندات القضية', memos: 'مذكرات القضية', notes: 'ملاحظات القضية', client: 'عميل القضية', invoices: 'فواتير القضية', team: 'فريق القضية' };
  CTABS.forEach(([tab, title]) => commands.push(entry('case-tab-' + tab, sectionNames[tab], 'cases', () => openCaseSection(tab), S.route === 'case' && CS(S.id) ? CS(S.id).title : 'اختر القضية لفتح هذا القسم', title.replace(/ال/g, ''))));
  const services = Object.entries(SERVICES).flatMap(([cat, data]) => data.items.map((s) =>
    entry('service-' + s.id, s.t, data.ic, () => A.svcRequest({ dataset: { id: s.id } }), data.l + ' — ' + s.dur, [data.l, s.p, ...s.get].join(' '))));
  return [['الأقسام والبوابات', routeEntries, 'options'], ['الخيارات والإجراءات', commands, 'options'], ['خدمات أعراف', services, 'services']];
}
function recordEntries() {
  return [
    ['القضايا', CASES.map((c) => ({ id: 'case-' + c.id, t: c.title, m: c.type + ' — ' + c.no + ' — ' + STATUS[c.status].l, ic: 'cases', aliases: [c.no, c.opp, c.subj, c.court, K(c.client)?.name].join(' '), f: () => go('case', c.id) }))],
    ['العملاء', CLIENTS.map((c) => ({ id: 'client-' + c.id, t: c.name, m: c.kind + ' — ' + clientCases(c.id).length + ' قضايا', aliases: [c.contact, c.phone, c.email].join(' '), ic: 'users', f: () => { S.clientF = 'all'; S.clientId = c.id; go('clients'); } }))],
    ['المهام', TASKS.map((t) => ({ id: 'task-' + t.id, t: t.t, m: U(t.who).short + ' — ' + TST[t.st][0] + ' — ' + rel(t.due), aliases: t.case ? CS(t.case)?.title : '', ic: 'tasks', f: () => A.openTask({ dataset: { id: t.id } }) }))],
    ['الجلسات', SESSIONS.map((s) => ({ id: 'session-' + s.id, t: 'جلسة ' + dm(s.at) + ' — ' + CS(s.case).title, m: CS(s.case).court + ' — ' + U(s.by).name, aliases: [CS(s.case).no, s.kind, s.result].join(' '), ic: 'cal', f: () => openSession(s.id) }))],
    ['المستندات', DOCS.map((d) => ({ id: 'doc-' + d.id, t: d.name, m: d.type + (d.case ? ' — ' + CS(d.case)?.title : ''), ic: 'file', f: () => A.openDoc({ dataset: { id: d.id } }) }))],
    ['الفواتير', INVOICES.map((i) => ({ id: 'invoice-' + i.id, t: i.id + ' — ' + K(i.client).name, m: fmt(i.amt) + ' ريال — ' + ({ paid: 'مدفوعة', overdue: 'متأخرة', due: 'مستحقة' }[i.st] || i.st), aliases: 'فاتورة فواتير ' + i.amt, ic: 'receipt', f: () => go('finance', i.id) }))],
    ['الفريق', TEAM.map((u) => ({ id: 'member-' + u.id, t: u.name, m: u.role, ic: 'team', aliases: u.short, f: () => openMember(u.id) }))],
    ['طلبات أعراف', REQUESTS.map((r) => ({ id: 'request-' + r.id, t: r.svc, m: r.id + ' — ' + REQ_STEPS[r.st], aliases: [r.id, r.note, r.who, 'طلب طلبات'].join(' '), ic: 'inbox', f: () => go('services', 'requests', r.id) }))],
  ].map(([label, entries]) => [label, entries, 'records']);
}
function searchText(value) {
  return norm(String(value ?? '').normalize('NFKC'))
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/\s+/g, ' ').trim();
}
function searchScore(item, query) {
  const q = searchText(query);
  if (!q) return 1;
  const title = searchText(item.t), full = searchText([item.t, item.m, item.aliases].join(' '));
  const words = q.split(' ');
  if (!words.every((word) => full.includes(word))) return 0;
  return title === q ? 100 : title.startsWith(q) ? 80 : title.includes(q) ? 60 : words.every((word) => title.includes(word)) ? 40 : 20;
}
function searchGroups(query, scope = 'all', caseTab = '') {
  let groups;
  if (caseTab) {
    groups = [recordEntries()[0]];
    groups[0][1] = groups[0][1].map((item, index) => ({ ...item, f: () => go('case', CASES[index].id, caseTab) }));
  } else groups = [...optionEntries(), ...recordEntries()].filter((g) => scope === 'all' || g[2] === scope);
  const matches = groups.map(([label, items, kind]) => [label, items.map((item, order) => ({ item, order, score: searchScore(item, query) }))
    .filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score || a.order - b.order).map((hit) => hit.item), kind]).filter((g) => g[1].length);
  return searchText(query) ? matches.sort((a, b) => searchScore(b[1][0], query) - searchScore(a[1][0], query)) : matches;
}
