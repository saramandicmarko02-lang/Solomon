function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('sr-RS');
  } catch {
    return value;
  }
}

function showMessage(el, text, ok) {
  el.hidden = false;
  el.textContent = text;
  el.className = 'message ' + (ok ? 'ok' : 'err');
}

function isUserEditingForm() {
  const active = document.activeElement;
  if (!active) return false;
  return active.closest('#settingsForm, #enrollForm') !== null;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function applySettingsToForm(status) {
  document.getElementById('serverBaseUrl').value = status.serverBaseUrl || '';
  document.getElementById('inputFolderPath').value = status.inputFolderPath || '';
  document.getElementById('adminPort').value = status.adminPort || 5050;
  document.getElementById('heartbeatInterval').value = status.heartbeatIntervalSeconds || 7;
  if (status.enrollmentPath !== undefined) {
    document.getElementById('enrollmentPath').value = status.enrollmentPath || '/agent/enroll';
  }
}

function applyConnectionStatus(status) {
  document.getElementById('enrolled').textContent = status.enrolled ? 'Da' : 'Ne';
  document.getElementById('agentId').textContent = status.agentId || '—';
  document.getElementById('wsStatus').textContent = status.connected ? 'Povezan' : 'Nije povezan';
  document.getElementById('lastHeartbeat').textContent = formatDate(status.lastSuccessfulHeartbeat);
  document.getElementById('lastAttempt').textContent = formatDate(status.lastConnectionAttempt);
  document.getElementById('lastError').textContent = status.lastError || '—';

  const badge = document.getElementById('connectionBadge');
  if (!status.enrolled) {
    badge.textContent = 'Nije registrovan';
    badge.className = 'badge badge-pending';
  } else if (status.connected) {
    badge.textContent = 'Povezan';
    badge.className = 'badge badge-online';
  } else {
    badge.textContent = 'Offline';
    badge.className = 'badge badge-offline';
  }
}

async function refreshStatus(updateForm) {
  const status = await fetchJson('/api/status');
  applyConnectionStatus(status);

  if (updateForm && !isUserEditingForm()) {
    applySettingsToForm(status);
  }
}

async function refreshActivity() {
  const log = document.getElementById('activityLog');
  try {
    const items = await fetchJson('/api/activity');
    if (!items.length) {
      log.innerHTML = '<p class="muted">Nema aktivnosti.</p>';
      return;
    }
    log.innerHTML = items.map(item => `
      <div class="activity-item">
        <span>${formatDate(item.timestamp)}</span>
        <span class="level-${item.level}">${item.level}</span>
        <span>${escapeHtml(item.message)}</span>
      </div>
    `).join('');
  } catch (e) {
    log.innerHTML = `<p class="muted">Greška: ${escapeHtml(e.message)}</p>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('settingsMessage');
  try {
    const body = {
      serverBaseUrl: document.getElementById('serverBaseUrl').value,
      inputFolderPath: document.getElementById('inputFolderPath').value,
      adminPort: Number(document.getElementById('adminPort').value),
      heartbeatIntervalSeconds: Number(document.getElementById('heartbeatInterval').value),
      enrollmentPath: document.getElementById('enrollmentPath').value
    };
    const result = await fetchJson('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showMessage(msg, result.message || 'Sačuvano.', true);
    await refreshStatus(true);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});

document.getElementById('enrollForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('enrollMessage');
  try {
    const body = {
      serverBaseUrl: document.getElementById('serverBaseUrl').value,
      enrollmentCode: document.getElementById('enrollmentCode').value
    };
    const result = await fetchJson('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    showMessage(msg, result.message || 'Registracija uspešna.', true);
    document.getElementById('enrollmentCode').value = '';
    await refreshStatus(false);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});

document.getElementById('unenrollBtn').addEventListener('click', async () => {
  if (!confirm('Ukloniti registraciju agenta? Konekcija će biti prekinuta.')) return;
  const msg = document.getElementById('enrollMessage');
  try {
    const result = await fetchJson('/api/unenroll', { method: 'POST' });
    showMessage(msg, result.message || 'Registracija uklonjena.', true);
    await refreshStatus(false);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});

async function tick() {
  if (isUserEditingForm()) {
    return;
  }
  try {
    await refreshStatus(false);
    await refreshActivity();
  } catch (e) {
    console.error(e);
  }
}

refreshStatus(true);
refreshActivity();
setInterval(tick, 5000);
