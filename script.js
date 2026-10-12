(() => {
  const $ = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll('.panel')];
  let active = 0;
  let submitLock = false;
  const chosenPlaces = new Set();
  const chosenActivities = new Set();
  let lastPlanText = '';

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $('date').min = localToday;
  $('date').value = localToday;

  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  }
  function showPanel(n) {
    active = n;
    panels.forEach((p, i) => p.classList.toggle('active', i === n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (n === 5) renderSummary();
    if (n === 7) renderSuccessSummary();
  }
  function prettyDate(value) {
    if (!value) return 'Not selected';
    return new Date(value + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function selectedPlaceList() {
    const values = [...chosenPlaces].filter(v => v !== 'Custom place');
    const custom = $('customPlace').value.trim();
    if (chosenPlaces.has('Custom place') && custom) values.push(custom);
    return values;
  }
  function makePlanText() {
    const places = selectedPlaceList();
    const activities = [...chosenActivities];
    return [
      'Our Durga Puja Plan ♡',
      `Date: ${prettyDate($('date').value)}`,
      `Time: ${$('timeSlot').value}`,
      `Places: ${places.length ? places.join(', ') : 'No places selected'}`,
      `Activities: ${activities.length ? activities.join(', ') : 'No activities selected'}`,
      `Special request: ${$('special').value.trim() || 'None'}`,
      `Message: ${$('message').value.trim() || 'None'}`
    ].join('\n');
  }
  function addRow(icon, key, value) {
    const row = document.createElement('div'); row.className = 'summary-row';
    const i = document.createElement('div'); i.className = 'summary-icon'; i.textContent = icon;
    const k = document.createElement('div'); k.className = 'summary-key'; k.textContent = key;
    const v = document.createElement('div'); v.className = 'summary-value'; v.textContent = value || '—';
    row.append(i, k, v); return row;
  }
  function renderSummary() {
    const box = $('summary'); box.replaceChildren();
    box.append(
      addRow('🗓️', 'Tarikh', prettyDate($('date').value)),
      addRow('🕒', 'Shomoy', $('timeSlot').value),
      addRow('📍', 'Jaiga (Selected)', selectedPlaceList().join(', ') || 'Not selected'),
      addRow('🎟️', 'Activities', [...chosenActivities].join(', ') || 'Not selected'),
      addRow('💌', 'Special Request', $('special').value.trim() || 'None'),
      addRow('💗', 'Tomar Message', $('message').value.trim() || 'None')
    );
  }
  function renderSuccessSummary() { $('successSummary').textContent = makePlanText(); }
  function updateCount(inputId, countId) { $(countId).textContent = $(inputId).value.length; }
  $('special').addEventListener('input', () => updateCount('special', 'specialCount'));
  $('message').addEventListener('input', () => updateCount('message', 'messageCount'));

  $('yesBtn').addEventListener('click', () => showPanel(1));
  $('maybeBtn').addEventListener('click', () => { toast('No pressure — dekhe nao, tarpor cholo ♡'); });
  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => {
    if (active === 1 && $('date').value < localToday) { toast('Please choose a date from today onward ♡'); return; }
    if (active === 2 && chosenPlaces.size === 0) { toast('At least one place select koro ♡'); return; }
    if (active === 2 && chosenPlaces.has('Custom place') && !$('customPlace').value.trim()) { toast('Custom place-ta likhe dao ♡'); return; }
    if (active === 3 && chosenActivities.size === 0) { toast('At least one activity select koro ♡'); return; }
    showPanel(active + 1);
  }));
  document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => showPanel(Math.max(0, active - 1))));
  document.querySelectorAll('[data-place]').forEach(btn => btn.addEventListener('click', () => {
    const val = btn.dataset.place;
    if (chosenPlaces.has(val)) chosenPlaces.delete(val); else chosenPlaces.add(val);
    btn.classList.toggle('selected', chosenPlaces.has(val));
    $('customPlaceWrap').classList.toggle('hidden', !chosenPlaces.has('Custom place'));
  }));
  document.querySelectorAll('[data-activity]').forEach(btn => btn.addEventListener('click', () => {
    const val = btn.dataset.activity;
    if (chosenActivities.has(val)) chosenActivities.delete(val); else chosenActivities.add(val);
    btn.classList.toggle('selected', chosenActivities.has(val));
  }));
  $('reviewBtn').addEventListener('click', () => showPanel(5));

  // EmailJS browser integration. Public Key is intended for client-side use.
  const EMAILJS_PUBLIC_KEY = 'T3_hyH48oEjbcJKDo';
  const EMAILJS_SERVICE_ID = 'service_rkq2zur';
  const EMAILJS_TEMPLATE_ID = 'template_iuksoic';

  let emailJsReady = false;
  function initEmailJS() {
    if (emailJsReady) return true;
    if (!window.emailjs) return false;
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    emailJsReady = true;
    return true;
  }

  async function deliverPlan() {
    if (!initEmailJS()) {
      throw new Error('EmailJS library did not load. Check your internet connection and reload the page.');
    }
    const places = selectedPlaceList();
    const activities = [...chosenActivities];
    const specialRequest = $('special').value.trim() || 'None';
    const personalMessage = $('message').value.trim() || 'None';
    const params = {
      from_name: 'Your Durga Puja Planner',
      puja_date: `${prettyDate($('date').value)} · ${$('timeSlot').value}`,
      selected_places: places.length ? places.join(', ') : 'No places selected',
      activities: activities.length ? activities.join(', ') : 'No activities selected',
      message: `Special request: ${specialRequest}\nPersonal message: ${personalMessage}`
    };
    return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
  }
  $('submitBtn').addEventListener('click', async () => {
    if (submitLock) return;
    if (!$('date').value) { toast('Date-ta select koro ♡'); showPanel(1); return; }
    submitLock = true;
    $('submitBtn').disabled = true;
    lastPlanText = makePlanText();
    showPanel(6);
    $('progressBar').style.width = '0%';
    let pct = 0;
    const progressTimer = setInterval(() => { pct = Math.min(92, pct + 8 + Math.random() * 12); $('progressBar').style.width = `${pct}%`; }, 180);
    try {
      await deliverPlan();
      clearInterval(progressTimer);
      $('progressBar').style.width = '100%';
      $('loadingCaption').textContent = 'Almost ready... ♡';
      showPanel(7);
      toast('Plan submitted successfully! ❤️');
    } catch (error) {
      clearInterval(progressTimer);
      showPanel(5);
      console.error('EmailJS send failed:', error);
      toast('Email send failed. Check EmailJS template settings and try again.');
    } finally {
      submitLock = false;
      $('submitBtn').disabled = false;
    }
  });
  $('restartBtn').addEventListener('click', () => {
    chosenPlaces.clear(); chosenActivities.clear();
    document.querySelectorAll('.tile.selected').forEach(el => el.classList.remove('selected'));
    $('customPlace').value = ''; $('customPlaceWrap').classList.add('hidden');
    $('special').value = ''; $('message').value = '';
    updateCount('special', 'specialCount'); updateCount('message', 'messageCount');
    $('date').value = localToday; $('timeSlot').value = 'Evening (5 PM - 9 PM)';
    showPanel(0);
  });
  $('shareBtn').addEventListener('click', async () => {
    const text = lastPlanText || makePlanText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Our Durga Puja Plan ♡', text }); } catch (e) { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); toast('Plan copied — share it with your favorite person ♡'); }
      catch (e) { toast('Sharing is not supported here. You can copy the summary manually.'); }
    }
  });
})();
