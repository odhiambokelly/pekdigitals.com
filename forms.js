/*
 * Pekdigitals website forms
 * -------------------------
 * Handles every form on the site (consultation, contact, support ticket,
 * newsletter, affiliate applications) and sends it to the Google Apps Script
 * backend in backend/google-apps-script.gs, which:
 *   - emails the submission to NOTIFY_EMAIL (Reply-To = the client),
 *   - sends the client an automatic confirmation reply,
 *   - saves it as a row in the Google Sheet (and backs that Sheet up nightly).
 *
 * Front-end backup: every submission is first saved in this browser's
 * localStorage "outbox". It is removed only after the backend confirms it was
 * saved. If sending fails (offline, server down), it is retried automatically
 * the next time the visitor opens any page of the site.
 *
 * Until ENDPOINT is filled in, forms fall back to opening the visitor's email
 * app with the message addressed to NOTIFY_EMAIL, so nothing is lost.
 */
(function () {
  'use strict';

  // ==== SETTINGS ============================================================
  // Paste the Web App URL from Google Apps Script here (ends in /exec).
  var ENDPOINT = '';
  if (window.PEK_FORMS_ENDPOINT) ENDPOINT = window.PEK_FORMS_ENDPOINT; // for testing
  var NOTIFY_EMAIL = 'support@bigkeysenterprises.com';
  // ==========================================================================

  var OUTBOX_KEY = 'pek_forms_outbox_v1';
  var MAX_ATTACH_BYTES = 8 * 1024 * 1024; // 8 MB total per support ticket

  var FORM_TYPES = {
    'cta-form': 'Free Consultation',
    'contact-form': 'Contact Enquiry',
    'support-ticket-form': 'Support Ticket',
    'newsletter-form': 'Newsletter Signup',
    'newsletter-signup': 'Newsletter Signup',
    'affiliateForm': 'Affiliate Application'
  };

  // ---------- localStorage outbox (front-end backup) ----------
  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch (e) { return []; }
  }
  function writeOutbox(items) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(items)); } catch (e) { /* storage blocked or full */ }
  }
  function addToOutbox(payload) {
    var copy = JSON.parse(JSON.stringify(payload));
    if (copy.attachments) { // files are too big for localStorage; keep names only
      copy.attachmentNames = copy.attachments.map(function (a) { return a.name; }).join(', ');
      delete copy.attachments;
    }
    var items = readOutbox().filter(function (i) { return i.id !== copy.id; });
    items.push(copy);
    writeOutbox(items);
  }
  function removeFromOutbox(id) {
    writeOutbox(readOutbox().filter(function (i) { return i.id !== id; }));
  }

  // ---------- helpers ----------
  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  // Give unnamed fields a sensible name so FormData picks them up.
  function nameFields(form) {
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.name || el.type === 'submit' || el.type === 'button') return;
      var ph = el.getAttribute('placeholder') || '';
      if (el.type === 'email') el.name = 'email';
      else if (el.tagName === 'SELECT') el.name = 'service';
      else if (/name/i.test(ph)) el.name = 'name';
      else el.name = el.id || slug(ph) || el.type;
    });
    if (!form.querySelector('input[name="_hp"]')) { // spam trap: hidden from people, bots fill it
      var hp = document.createElement('input');
      hp.type = 'text'; hp.name = '_hp'; hp.tabIndex = -1; hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      form.appendChild(hp);
    }
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve({ name: file.name, type: file.type || 'application/octet-stream', data: String(r.result).split(',')[1] }); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function collect(form) {
    var fd = new FormData(form);
    var data = {}, files = [];
    fd.forEach(function (value, key) {
      if (value instanceof File) { if (value.size) files.push(value); return; }
      data[key] = data[key] ? data[key] + ', ' + value : value;
    });
    // dropdowns: send the readable label ("Social Media Marketing"), not the code
    form.querySelectorAll('select[name]').forEach(function (s) {
      if (s.value && s.selectedOptions[0]) data[s.name] = s.selectedOptions[0].text.trim();
    });
    // normalise common aliases
    data.name = data.name || data.fullName || '';
    if (data.fullName) delete data.fullName;
    var type = FORM_TYPES[form.id] || form.getAttribute('data-form-type') || 'Website Form';
    var payload = {
      id: uid(type === 'Support Ticket' ? 'TKT' : 'PEK'),
      formType: type,
      page: location.pathname.replace(/^\//, '') || 'index.html',
      submittedAt: new Date().toISOString(),
      fields: data
    };
    if (type === 'Support Ticket') payload.ticketId = payload.id;
    return { payload: payload, files: files };
  }

  // ---------- network ----------
  function send(payload) {
    // text/plain avoids a CORS preflight, which Apps Script doesn't support.
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || 'Server did not confirm');
      return res;
    });
  }

  function mailtoFallback(payload) {
    var f = payload.fields, lines = [];
    Object.keys(f).forEach(function (k) { if (k !== '_hp') lines.push(k + ': ' + f[k]); });
    lines.push('', 'Reference: ' + payload.id, 'Page: ' + payload.page);
    var subject = payload.formType + (f.name ? ' – ' + f.name : '');
    return 'mailto:' + NOTIFY_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  // Retry anything left in the outbox from earlier visits.
  function flushOutbox() {
    if (!ENDPOINT || !navigator.onLine) return;
    readOutbox().forEach(function (item) {
      item.retried = true;
      send(item).then(function () { removeFromOutbox(item.id); }).catch(function () { /* keep for next time */ });
    });
  }

  // ---------- UI ----------
  var COLORS = { success: ['#ecfdf5', '#065f46', '#10b981'], error: ['#fef2f2', '#991b1b', '#ef4444'], info: ['#eff6ff', '#1e3a8a', '#3b82f6'] };

  function showMessage(form, type, html) {
    // Pages with their own message box (contact & support pages)
    var box = form.parentNode.querySelector('#form-messages');
    if (box && type !== 'info') {
      var ok = box.querySelector('#success-message'), bad = box.querySelector('#error-message');
      if (ok && bad) {
        box.classList.remove('hidden');
        ok.classList.toggle('hidden', type !== 'success');
        bad.classList.toggle('hidden', type === 'success');
        // The page's own success box already says enough; add our detail to errors only.
        var extra = box.querySelector('.pek-extra');
        if (type === 'success') { if (extra) extra.remove(); }
        else {
          extra = extra || document.createElement('p');
          extra.className = 'pek-extra text-sm mt-2';
          extra.innerHTML = html;
          bad.appendChild(extra);
        }
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    var el = form.querySelector('.pek-form-msg');
    if (!el) {
      el = document.createElement('div');
      el.className = 'pek-form-msg';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      form.appendChild(el);
    }
    var c = COLORS[type];
    el.style.cssText = 'margin-top:12px;padding:12px 14px;border-radius:10px;font-size:14px;line-height:1.5;text-align:left;' +
      'background:' + c[0] + ';color:' + c[1] + ';border:1px solid ' + c[2];
    el.innerHTML = html;
  }

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"], button:not([type])');
    if (!btn) return;
    if (busy) { btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Sending…'; btn.disabled = true; }
    else { btn.innerHTML = btn.dataset.label || btn.innerHTML; btn.disabled = false; }
  }

  var SUCCESS_TEXT = {
    'Free Consultation': 'Thank you! Your consultation request has been received. We have emailed you a confirmation and will contact you within 24 hours.',
    'Contact Enquiry': 'Thank you! Your message has been received. A confirmation has been sent to your email and we will reply within 24 hours.',
    'Support Ticket': 'Your support ticket has been submitted. A confirmation with your ticket ID has been sent to your email.',
    'Newsletter Signup': 'You are subscribed! Check your inbox for a welcome email.',
    'Affiliate Application': 'Application received! We have emailed you a confirmation and will send your affiliate link within 48 hours once approved.'
  };

  function onSubmit(event) {
    var form = event.target;
    if (!form || !FORM_TYPES[form.id]) return;
    // Take over from any older demo handlers on the page.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var c = collect(form), payload = c.payload;
    if (payload.fields._hp) { form.reset(); showMessage(form, 'success', SUCCESS_TEXT[payload.formType]); return; }
    delete payload.fields._hp;

    if (!ENDPOINT) { // backend not connected yet: hand over to the visitor's email app
      showMessage(form, 'info', 'Opening your email app to send this to <strong>' + NOTIFY_EMAIL + '</strong>. If nothing opens, email us directly at <a href="mailto:' + NOTIFY_EMAIL + '" style="text-decoration:underline">' + NOTIFY_EMAIL + '</a>.');
      window.location.href = mailtoFallback(payload);
      return;
    }

    setBusy(form, true);
    var total = c.files.reduce(function (s, f) { return s + f.size; }, 0);
    var filesReady = (c.files.length && total <= MAX_ATTACH_BYTES)
      ? Promise.all(c.files.map(readFile)).then(function (a) { payload.attachments = a; })
      : Promise.resolve(c.files.length ? (payload.fields.attachmentNote = 'Attachments over 8 MB were not uploaded') : null);

    filesReady.then(function () {
      addToOutbox(payload); // front-end backup before we try the network
      return send(payload);
    }).then(function (res) {
      removeFromOutbox(payload.id);
      form.reset();
      var msg = SUCCESS_TEXT[payload.formType] || 'Thank you! Your submission has been received.';
      if (res.duplicate && payload.formType === 'Newsletter Signup') msg = 'You are already subscribed – thank you!';
      if (payload.ticketId) {
        var t = form.parentNode.querySelector('#ticket-id');
        if (t) t.textContent = payload.ticketId;
        msg += ' Ticket ID: <strong>' + payload.ticketId + '</strong>';
      }
      showMessage(form, 'success', msg);
    }).catch(function () {
      showMessage(form, 'error', 'We could not reach our server just now. Your details are saved on this device and will be sent automatically next time you visit. ' +
        'For anything urgent, <a href="' + mailtoFallback(payload) + '" style="text-decoration:underline;font-weight:600">email us at ' + NOTIFY_EMAIL + '</a>.');
    }).then(function () { setBusy(form, false); });
  }

  // Short privacy notice under each form (affiliate forms already link to the policies).
  function addPrivacyNote(form) {
    if (form.id === 'affiliateForm' || form.querySelector('.pek-privacy')) return;
    var dark = /newsletter/.test(form.id);
    var p = document.createElement('p');
    p.className = 'pek-privacy';
    p.style.cssText = 'margin-top:10px;font-size:12px;line-height:1.5;opacity:.8;' + (dark ? 'color:#9ca3af' : 'color:#6b7280');
    p.innerHTML = (form.id.indexOf('newsletter') === 0 ? 'Unsubscribe anytime. ' : 'We only use your details to reply to you. ') +
      'See our <a href="privacy.html" style="text-decoration:underline;color:inherit">Privacy Policy</a>.';
    form.appendChild(p);
  }

  function init() {
    Object.keys(FORM_TYPES).forEach(function (id) {
      document.querySelectorAll('form#' + id).forEach(function (f) { nameFields(f); addPrivacyNote(f); });
    });
    flushOutbox();
  }

  // Capture phase on document runs before handlers attached to the forms.
  document.addEventListener('submit', onSubmit, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('online', flushOutbox);
})();
