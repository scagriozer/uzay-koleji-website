// Kayit formu lead endpoint. Supabase 'leads' tablosuna yazar (Altineller ile ortak proje,
// brand_id ile izole). Google Apps Script kanali (script.google.com/.../exec) erisim izni
// sessizce sifirlanip 12 Agustos 2026'dan beri basvurulari kaybettigi icin devreden cikarildi.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const telefonDigits = String(body.telefon || '').replace(/\D/g, '');
  if (!telefonDigits) {
    res.status(400).json({ ok: false, error: 'phone_required' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const UZAY_BRAND_ID = process.env.UZAY_BRAND_ID || '8550e68a-8068-4a32-96c2-64d240cf5e48';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('lead endpoint: missing SUPABASE_URL/SUPABASE_SERVICE_KEY env vars');
    res.status(500).json({ ok: false, error: 'server_misconfigured' });
    return;
  }

  const row = {
    brand_id: UZAY_BRAND_ID,
    is_qualified: true,
    qualification_reason: 'site_form_submission',
    name: (body.veli || body.ogrenci || null),
    email: body.email || null,
    phone: telefonDigits,
    utm_source: body.utm_source || null,
    utm_medium: body.utm_medium || null,
    utm_campaign: body.utm_campaign || null,
    utm_content: body.utm_content || null,
    utm_term: body.utm_term || null,
    referrer: req.headers.referer || req.headers.referrer || null,
    landing_page: body.sayfa || null,
    raw_signals: {
      veli_adi: body.veli || null,
      ogrenci_adi: body.ogrenci || null,
      program: body.program || null,
      kampus: body.kampus || null,
      sinif: body.sinif || null,
      kvkk_onayi: typeof body.kvkk === 'boolean' ? body.kvkk : null,
      kaynak_form: body.form_type === 'big' ? 'Başvuru Formu' : 'Hızlı Kayıt',
      sayfa: body.sayfa || 'kayit.html'
    }
  };

  try {
    const resp = await fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(function () { return ''; });
      console.error('lead endpoint: supabase insert failed', resp.status, errText);
      res.status(502).json({ ok: false, error: 'insert_failed' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead endpoint: unexpected error', err);
    res.status(500).json({ ok: false, error: 'unexpected_error' });
  }
};
