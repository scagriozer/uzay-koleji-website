// Başvuru (lead) ucu, sözleşme v2. Asıl kayıt Supabase 'leads' tablosuna (Altıneller ile ortak
// proje, brand_id ile izole); personelin takip ettiği Google Sheet'e SheetDB üzerinden ayna yazım
// best-effort'tur. Yalnız production ortamı yazar: Preview ve yerel çalıştırma dry-run döner.

export const runtime = 'nodejs';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_LENGTH = 500;
const WRITE_TIMEOUT_MS = 8000;
// Kimlik public repoda zaten açık; SHEETDB_URL ile döndürülmüş adres verilene kadar yedek.
const SHEETDB_FALLBACK_URL = 'https://sheetdb.io/api/v1/rp66tk9n7c7vt';
const UZAY_BRAND_ID_FALLBACK = '8550e68a-8068-4a32-96c2-64d240cf5e48';

const FORM_LABELS: Record<string, string> = {
  quick: 'Hızlı Kayıt',
  big: 'Başvuru Formu',
  etkinlik: 'Etkinlik Kaydı',
  bursluluk: 'Bursluluk Başvurusu',
};

type Body = Record<string, unknown>;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function methodNotAllowed() {
  return json(405, { ok: false, error: 'method_not_allowed' });
}

// Next, export edilmeyen yöntemlere gövdesiz 405 (OPTIONS'a 204) döner; eski uç hepsine JSON 405 veriyordu.
export {
  methodNotAllowed as GET,
  methodNotAllowed as HEAD,
  methodNotAllowed as OPTIONS,
  methodNotAllowed as PUT,
  methodNotAllowed as PATCH,
  methodNotAllowed as DELETE,
};

function text(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (typeof value === 'number') return String(value);
  return null;
}

function asObject(value: unknown): Body {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Body) : {};
}

// Reklam tıklama kimlikleri gövdede yoksa formun bulunduğu sayfanın (Referer) sorgusundan okunur.
function clickId(body: Body, referer: string | null, name: string): string | null {
  const fromBody = text(body[name]);
  if (fromBody) return fromBody;
  if (!referer) return null;
  try {
    return new URL(referer).searchParams.get(name);
  } catch {
    return null;
  }
}

function istanbulTimestamp(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
}

export async function POST(request: Request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: 'payload_too_large' });
  }

  let body: Body = {};
  if (contentType.includes('application/json')) {
    if (raw.trim()) {
      try {
        body = asObject(JSON.parse(raw));
      } catch {
        // Eski uçta Vercel'in ayrıştırıcısı bozuk JSON'a gövdesiz, başlıksız 400 dönüyordu.
        return new Response(null, { status: 400 });
      }
    }
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(new URLSearchParams(raw));
  } else if (raw) {
    try {
      body = asObject(JSON.parse(raw));
    } catch {
      body = {};
    }
  }

  const telefonDigits = String(body.telefon || '').replace(/\D/g, '');
  if (!telefonDigits) {
    return json(400, { ok: false, error: 'phone_required' });
  }

  // Gizli tuzak alanı: gerçek ziyaretçi doldurmaz. Bota başarı gösterilir, yazılmaz.
  if (text(body.website)) {
    return json(200, { ok: true });
  }

  const tooLong = Object.values(body).some((v) => typeof v === 'string' && v.length > MAX_FIELD_LENGTH);
  if (tooLong) {
    return json(400, { ok: false, error: 'invalid_payload' });
  }

  if (process.env.VERCEL_ENV !== 'production') {
    return json(200, { ok: true, dry_run: true });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('lead endpoint: missing SUPABASE_URL/SUPABASE_SERVICE_KEY env vars');
    return json(500, { ok: false, error: 'server_misconfigured' });
  }

  const formType = FORM_LABELS[String(body.form_type)] ? String(body.form_type) : 'quick';
  const isEvent = formType === 'etkinlik';
  const referer = request.headers.get('referer');
  const sayfa = text(body.sayfa);

  const rawSignals: Record<string, unknown> = {
    veli_adi: text(body.veli),
    ogrenci_adi: text(body.ogrenci),
    program: text(body.program),
    kampus: text(body.kampus),
    sinif: text(body.sinif),
    kvkk_onayi: typeof body.kvkk === 'boolean' ? body.kvkk : null,
    kaynak_form: FORM_LABELS[formType],
    sayfa: sayfa || 'kayit.html',
    form_type: formType,
  };
  for (const name of ['gclid', 'gbraid', 'wbraid']) {
    const value = clickId(body, referer, name);
    if (value) rawSignals[name] = value.slice(0, MAX_FIELD_LENGTH);
  }
  if (text(body.etkinlik)) rawSignals.etkinlik = text(body.etkinlik);

  const row = {
    brand_id: process.env.UZAY_BRAND_ID || UZAY_BRAND_ID_FALLBACK,
    is_qualified: !isEvent,
    qualification_reason: isEvent ? 'event_registration' : 'site_form_submission',
    name: text(body.veli) || text(body.ogrenci),
    email: text(body.email),
    phone: telefonDigits,
    utm_source: text(body.utm_source),
    utm_medium: text(body.utm_medium),
    utm_campaign: text(body.utm_campaign),
    utm_content: text(body.utm_content),
    utm_term: text(body.utm_term),
    referrer: referer,
    landing_page: sayfa,
    raw_signals: rawSignals,
  };

  try {
    const resp = await fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('lead endpoint: supabase insert failed', resp.status, errText);
      return json(502, { ok: false, error: 'insert_failed' });
    }
  } catch (err) {
    console.error('lead endpoint: supabase insert failed', err);
    return json(502, { ok: false, error: 'insert_failed' });
  }

  // Supabase kaydı başarılı; Sheet aynası başarısız olsa da forma yansımaz, yalnız loglanır.
  try {
    const sheetResp = await fetch(process.env.SHEETDB_URL || SHEETDB_FALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          'Tarih/Saat': istanbulTimestamp(),
          'Kaynak Form': FORM_LABELS[formType],
          Sayfa: sayfa || 'kayit.html',
          'Veli Adı': text(body.veli) || '',
          'Öğrenci Adı': text(body.ogrenci) || '',
          Telefon: telefonDigits,
          'E-posta': text(body.email) || '',
          Sınıf: text(body.sinif) || '',
          'İlgilenilen Program': text(body.program) || '',
          Kampüs: text(body.kampus) || '',
          'KVKK Onayı': body.kvkk ? 'Evet' : 'Hayır',
          'UTM Source': text(body.utm_source) || '',
          'UTM Medium': text(body.utm_medium) || '',
          'UTM Campaign': text(body.utm_campaign) || '',
          'UTM Content': text(body.utm_content) || '',
          'UTM Term': text(body.utm_term) || '',
          Durum: 'Yeni',
        },
      }),
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    if (!sheetResp.ok) {
      console.error('lead endpoint: sheetdb mirror write failed (non-fatal)', sheetResp.status);
    }
  } catch (sheetErr) {
    console.error('lead endpoint: sheetdb mirror write failed (non-fatal)', sheetErr);
  }

  return json(200, { ok: true });
}
