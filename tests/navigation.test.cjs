/* DOM regression checks only; CSS layout requires a real-browser review. */
const fs = require('node:fs');
const path = require('node:path');
const dom = require('linkedom');

const root = path.resolve(__dirname, '..');
const scripts = ['data.js', 'core.js', 'app.js', 'views-cases.js', 'views-work.js', 'views-biz.js', 'navigation.js'];
const source = scripts.map((name) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n');

function createTestApp(sources, dom) {
  const win = dom.parseHTML('<!doctype html><html dir="rtl" lang="ar"><body></body></html>');
  const doc = win.document;
  Object.defineProperty(doc, 'activeElement', { value: doc.body, writable: true, configurable: true });
  dom.HTMLElement.prototype.focus = function () { this.ownerDocument.activeElement = this; };
  dom.Element.prototype.scrollIntoView = function () { this._scrolled = true; };
  dom.Element.prototype.scrollTo = function (options) { this.scrollTop = options.top || 0; };
  const jobs = new Map();
  let time = 0, serial = 0, hash = '#/home';
  const schedule = (callback, delay = 0) => { const id = ++serial; jobs.set(id, { at: time + delay, callback }); return id; };
  const location = {};
  Object.defineProperty(location, 'hash', {
    get: () => hash,
    set: (value) => { if (value !== hash) { hash = value; schedule(() => win.dispatchEvent(new dom.Event('hashchange'))); } },
  });
  const env = {
    document: doc, window: win, Event: dom.Event, location, innerWidth: 1440, innerHeight: 900,
    performance: { now: () => time }, navigator: { clipboard: { writeText: () => Promise.resolve() } },
    setTimeout: schedule, clearTimeout: (id) => jobs.delete(id), setInterval: () => ++serial, clearInterval: () => {},
    requestAnimationFrame: (callback) => schedule(() => callback(time), 16),
    getComputedStyle: () => ({ direction: 'rtl', getPropertyValue: () => '' }),
  };
  const api = new Function(...Object.keys(env), sources + '\n' + [
    'shell(); parseHash(); render(false);',
    'return { S, A, VIEWS, PORTALS, NAV, SERVICES, CASES, CLIENTS, TASKS, DOCS, TEAM, INVOICES, REQUESTS, CTABS, QA, HOOKS,',
    'go, render, parseHash, portalLinks, portalShortcuts, searchGroups, searchText, optionEntries, recordEntries, hl, openCmd, closeCmd, cmdSearch, cmdRun,',
    'get cmdItems() { return cmdItems; }, get cmdIdx() { return cmdIdx; },',
    'resize(width) { innerWidth = width; window.dispatchEvent(new Event("resize")); }',
    '};'
  ].join('\n'))(...Object.values(env));
  function flush() {
    let count = 0;
    while (jobs.size) {
      if (++count > 10000) throw new Error('Timer loop did not settle');
      const [id, job] = [...jobs.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      jobs.delete(id); time = job.at; job.callback();
    }
  }
  function click(selector) {
    const element = typeof selector === 'string' ? doc.querySelector(selector) : selector;
    if (!element) throw new Error('Missing click target: ' + selector);
    if (element.matches('button, input, textarea, select, a[href]')) element.focus();
    element.dispatchEvent(new dom.Event('click', { bubbles: true, cancelable: true }));
    flush();
    return element;
  }
  function key(element, name, extra = {}) {
    const event = new dom.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key: name, ...extra });
    element.dispatchEvent(event);
    flush();
    return event;
  }
  function input(value) {
    const element = doc.querySelector('#cmdQ');
    if (!element) throw new Error('Search input is missing');
    element.value = value;
    element.dispatchEvent(new dom.Event('input', { bubbles: true }));
    return element;
  }
  flush();
  return { api, doc, win, flush, click, key, input, location };
}

function runNavigationTests(sources, dom) {
  const create = () => createTestApp(sources, dom);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const results = [];
  function test(name, run) {
    try { run(); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error.message, stack: error.stack }); }
  }
  test('Every existing section and all 26 services remain reachable', () => {
    const h = create(), a = h.api;
    const routes = a.PORTALS.flatMap(a.portalLinks).map((n) => n.r);
    a.NAV.filter((n) => n.r && n.r !== 'home').forEach((n) => check(routes.includes(n.r), 'Missing route: ' + n.r));
    const groups = a.optionEntries(), serviceOptions = groups.find((g) => g[2] === 'services')[1];
    check(serviceOptions.length === 26, 'A service is missing');
    a.QA.forEach(([kind]) => check(groups[1][1].some((item) => item.id === 'quick-' + kind), 'Missing quick action: ' + kind));
    const ids = groups.flatMap((g) => g[1]).map((item) => item.id);
    check(new Set(ids).size === ids.length, 'Search IDs must be unique');
  });
  test('Sidebar groups expand, collapse and follow the active route', () => {
    const h = create();
    check(h.doc.querySelectorAll('.nav-portal').length === 4, 'Expected four portals');
    h.click('[data-a="navGroup"][data-id="practice"]');
    check(h.doc.querySelector('#nav-group-practice').inert === false, 'Expanded children must be interactive');
    check(h.doc.querySelector('#nav-group-daily').inert === true, 'Other groups must collapse');
    h.click('[data-a="navGroup"][data-id="practice"]');
    check(h.doc.querySelector('#nav-group-practice').inert === true, 'Collapsed children must leave the tab order');
    h.api.go('case', 'c1', 'docs'); h.flush();
    check(h.api.S.navGroup === 'practice', 'Case route should open its portal');
    check(h.doc.querySelector('#nav [data-to="cases"]').getAttribute('aria-current') === 'page', 'Case parent must stay active');
  });
  test('All portal links open their intended pages and service categories', () => {
    const h = create();
    const destinations = h.api.PORTALS.flatMap(h.api.portalLinks);
    destinations.forEach((n) => {
      h.api.go('portals', n.group); h.flush();
      const selector = '#view .portal-link[data-to="' + n.r + '"]' + (n.id ? '[data-id="' + n.id + '"]' : ':not([data-id])');
      h.click(selector);
      check(h.api.S.route === n.r, 'Wrong route for ' + n.l);
      if (n.r === 'services') check(h.api.S.serviceSection === (n.id || ''), 'Wrong service category for ' + n.l);
      check(!h.doc.querySelector('#view').textContent.includes('undefined'), 'Undefined content in ' + n.l);
    });
  });
  test('Compact sidebar and mobile menus give access to every portal', () => {
    const h = create();
    h.api.resize(1024); h.flush();
    h.click('[data-a="navGroup"][data-id="araf"]');
    check(h.api.S.route === 'portals' && h.api.S.portalId === 'araf', 'Compact icon should open its portal');
    h.api.resize(390); h.flush();
    h.api.go('home'); h.flush();
    h.click('[data-a="toggleSide"]');
    check(h.api.S.route === 'portals', 'Mobile menu should open the directory');
    h.api.go('home'); h.flush();
    h.click('#mnav [data-to="portals"]');
    check(h.doc.querySelectorAll('.portal-panel').length === 4, 'Mobile directory must include all portals');
  });
  test('Arabic spelling, diacritics, word order and Arabic digits work in search', () => {
    const h = create(), a = h.api;
    check(a.searchText('إِضَافَةُ مَصْرُوف ١٢٣ ۱۲۳') === 'اضافه مصروف 123 123', 'Arabic normalization failed');
    const first = a.searchGroups('استشارة تسويقية')[0][1][0];
    check(first.id === 'service-sv8', 'Exact service should rank ahead of category descriptions');
    check(a.searchGroups('بصريه هويه').flatMap((g) => g[1]).some((i) => i.id === 'service-sv30'), 'Word order should not matter');
    const invoice = a.INVOICES[0], arabicID = invoice.id.replace(/\d/g, (n) => String.fromCharCode(0x660 + Number(n)));
    check(a.searchGroups(arabicID).flatMap((g) => g[1]).some((i) => i.id === 'invoice-' + invoice.id), 'Arabic invoice digits failed');
    check(a.searchGroups('مصروف').flatMap((g) => g[1]).some((i) => i.id === 'quick-expense'), 'Expense action is missing');
  });
  test('Search opens the chosen service without submitting a request', () => {
    const h = create(), count = h.api.REQUESTS.length;
    h.click('.searchbtn');
    const q = h.input('استشارة تسويقية');
    h.key(q, 'Enter');
    check(h.doc.querySelector('#drawer').classList.contains('show'), 'Service form should open');
    check(h.doc.querySelector('#drawer').textContent.includes('استشارة تسويقية'), 'Wrong service form');
    check(h.doc.querySelector('[data-a="svcSubmit"]').dataset.id === 'sv8', 'Wrong service target');
    check(h.api.REQUESTS.length === count, 'Search must not submit requests');
  });
  test('Search scopes and show-more expose all matches', () => {
    const h = create();
    h.click('.searchbtn'); h.click('[data-a="cmdScope"][data-scope="services"]');
    check(h.api.cmdItems.length === 7 && h.api.cmdItems[6].stay, 'Expected six matches and a show-more option');
    h.api.cmdRun(6); h.flush();
    check(h.api.cmdItems.length === 26, 'Show more must expose every service');
    check(h.doc.querySelector('#cmd').classList.contains('show'), 'Show more must keep search open');
    check(h.doc.querySelector('#cmdStatus').textContent === '26 نتيجة', 'Count should include hidden matches');
  });
  test('Arrow keys, Enter, Tab, Escape and Ctrl K keep search accessible', () => {
    const h = create();
    const trigger = h.click('.searchbtn'), q = h.doc.querySelector('#cmdQ');
    h.key(q, 'ArrowUp');
    check(h.api.cmdIdx === h.api.cmdItems.length - 1, 'ArrowUp should wrap');
    h.key(q, 'ArrowDown');
    check(h.api.cmdIdx === 0, 'ArrowDown should wrap');
    check(q.getAttribute('aria-activedescendant') === 'cmd-result-0', 'Active result should be announced');
    h.key(q, 'Tab', { shiftKey: true });
    check(h.doc.activeElement.dataset.scope === 'records', 'Shift Tab should stay inside search');
    h.key(h.doc.activeElement, 'Tab');
    check(h.doc.activeElement === q, 'Tab should return to input');
    h.key(q, 'Escape');
    check(h.doc.activeElement === trigger, 'Closing search should restore focus');
    check(!h.doc.querySelector('#cmd').classList.contains('show'), 'Escape should close search');
    h.key(trigger, 'k', { ctrlKey: true });
    check(h.doc.querySelector('#cmd').classList.contains('show'), 'Ctrl K should open search');
  });
  test('No results cannot run a stale selection or expose injected HTML', () => {
    const h = create();
    h.click('.searchbtn');
    const q = h.input('<img src=x onerror=alert(1)> impossible-search');
    check(h.api.cmdItems.length === 0, 'Expected no matching results');
    check(!q.hasAttribute('aria-activedescendant'), 'Empty search should clear active result');
    h.key(q, 'Enter');
    check(h.doc.querySelector('#cmd').classList.contains('show'), 'Enter on empty results should do nothing');
    check(h.doc.querySelector('#cmdRes img') === null, 'Query HTML must be escaped');
    check(h.api.hl('<img>', '<img').includes('&lt;img'), 'Highlighted text must remain escaped');
    check(h.api.hl('ملف 📄', '📄') === 'ملف <mark>📄</mark>', 'Unicode symbols should highlight safely');
  });
  test('Client search resets a conflicting client filter', () => {
    const h = create(), client = h.api.CLIENTS[0];
    h.api.S.clientF = client.kind === 'منشأة' ? 'ind' : 'org';
    const item = h.api.recordEntries().flatMap((g) => g[1]).find((i) => i.id === 'client-' + client.id);
    item.f(); h.flush();
    check(h.api.S.clientF === 'all' && h.api.S.clientId === client.id, 'Selected client was lost to a filter');
    check(h.doc.querySelector('#clProf').textContent.includes(client.name), 'Selected client profile did not open');
  });
  test('Case-section search selects a case and opens the requested tab', () => {
    const h = create();
    h.click('.searchbtn'); h.input('مذكرات القضية');
    const i = h.api.cmdItems.findIndex((item) => item.id === 'case-tab-memos');
    check(i >= 0, 'Case memos option is missing');
    h.api.cmdRun(i); h.flush();
    check(h.doc.querySelector('.cmd-context').textContent.includes('المذكرات'), 'Case picker should explain the requested section');
    h.input(h.api.CASES[0].no);
    h.key(h.doc.querySelector('#cmdQ'), 'Enter');
    check(h.api.S.route === 'case' && h.api.S.id === 'c1' && h.api.S.tab === 'memos', 'Case tab route is incorrect');
  });
  test('Deep links focus the exact invoice and service request', () => {
    const h = create(), invoice = h.api.INVOICES[0], request = h.api.REQUESTS[0];
    h.api.S.finTab = 'paid'; h.api.go('finance', invoice.id); h.flush();
    check(h.api.S.finTab === 'all', 'Invoice deep link must clear conflicting filters');
    let target = h.doc.querySelector('.inv-row[data-ctx="inv:' + invoice.id + '"]');
    check(target?._scrolled && h.doc.activeElement === target, 'Invoice must be scrolled into view and focused');
    h.api.go('services', 'requests', request.id); h.flush();
    target = h.doc.querySelector('[data-req="' + request.id + '"]');
    check(target?._scrolled && h.doc.activeElement === target, 'Request must be scrolled into view and focused');
    h.api.go('services', 'requests', request.id); h.flush();
    check(h.doc.querySelector('[data-req="' + request.id + '"]')._scrolled, 'Repeated same-route navigation must still work');
    h.location.hash = '#/services/constructor'; h.flush();
    check(h.api.S.serviceSection === '', 'Unknown category must fall back safely');
    h.location.hash = '#/constructor'; h.flush();
    check(h.api.S.route === 'home', 'Unknown route must fall back safely');
  });
  test('All indexed options and records execute without runtime errors', () => {
    const h = create();
    const items = [...h.api.optionEntries(), ...h.api.recordEntries()].flatMap((g) => g[1]);
    items.forEach((item) => {
      h.api.closeCmd(false); h.api.A.drClose(); h.api.A.mClose(); h.flush();
      try { item.f(); h.flush(); } catch (error) { throw new Error(item.id + ': ' + error.message); }
    });
  });
  test('Existing views, case tabs and alternate case displays still render', () => {
    const h = create(), a = h.api;
    Object.keys(a.VIEWS).forEach((route) => { a.S.route = route; if (route === 'case') a.S.id = 'c1'; check(a.VIEWS[route]().length > 0, 'Empty view: ' + route); });
    a.S.route = 'case';
    a.CASES.forEach((c) => { a.S.id = c.id; a.CTABS.forEach(([tab]) => { a.S.tab = tab; check(a.VIEWS.case().length > 0, 'Empty case tab'); }); });
    a.S.route = 'cases';
    ['list', 'cards', 'kanban', 'gantt'].forEach((view) => { a.S.casesView = view; check(a.VIEWS.cases().length > 0, 'Empty case layout'); });
    a.S.route = 'tasks';
    ['kanban', 'list'].forEach((view) => { a.S.tasksView = view; check(a.VIEWS.tasks().length > 0, 'Empty task layout'); });
  });
  return results;
}

const results = runNavigationTests(source, dom);
for (const result of results) {
  console.log((result.passed ? 'PASS ' : 'FAIL ') + result.name);
  if (!result.passed) console.error(result.stack || result.error);
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
else console.log('All ' + results.length + ' navigation and search checks passed.');
