// Başvuru (lead) ucu, sözleşme v2. Asıl kayıt Supabase 'leads' tablosuna (Altıneller ile ortak
// proje, brand_id ile izole); personelin takip ettiği Google Sheet'e SheetDB üzerinden ayna yazılır.
// Yalnız production ortamı yazar: Preview ve yerel çalıştırma dry-run döner.

export const runtime = 'nodejs';
export const maxDuration = 30;

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

// x-lead-env: cutover sonrası "production gerçekten yazıyor mu" kontrolü ve QA'nın
// production'a rakamlı gövde göndermemesi bu başlığa dayanır.
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-lead-env': process.env.VERCEL_ENV ?? 'unset',
    },
  });
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

// Uzun değer reddedilmez, kırpılır: bozuk bir reklam şablonunun uzun utm değeri başvuruyu düşürmemeli.
function text(value: unknown): string | null {
  if (typeof value === 'string') return value ? value.slice(0, MAX_FIELD_LENGTH) : null;
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
    return text(new URL(referer).searchParams.get(name));
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

// Sheet, = + - @ ile başlayan hücreyi formül sayabilir.
function sheetCell(value: string | null): string {
  if (!value) return '';
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function parseBody(contentType: string, raw: string): Body | null {
  if (contentType.includes('application/json')) {
    if (!raw.trim()) return {};
    try {
      return asObject(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return raw ? asObject(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

async function writeSupabase(row: unknown): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('lead endpoint: missing SUPABASE_URL/SUPABASE_SERVICE_KEY env vars');
    return false;
  }
  try {
    const resp = await fetch(url + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    if (resp.ok) return true;
    // PostgREST hata gövdesi satır içeriğini (ad, telefon) taşıyabilir; yalnız hata kodu loglanır.
    const errBody = await resp.text().catch(() => '');
    let code = '';
    try {
      code = String(JSON.parse(errBody).code ?? '');
    } catch {}
    console.error('lead endpoint: supabase insert failed', resp.status, code);
  } catch (err) {
    console.error('lead endpoint: supabase insert failed', err instanceof Error ? err.name : 'error');
  }
  return false;
}

async function writeSheet(data: Record<string, string>): Promise<boolean> {
  try {
    const resp = await fetch(process.env.SHEETDB_URL || SHEETDB_FALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    if (resp.ok) return true;
    console.error('lead endpoint: sheetdb mirror write failed', resp.status);
  } catch (err) {
    console.error('lead endpoint: sheetdb mirror write failed', err instanceof Error ? err.name : 'error');
  }
  return false;
}

export async function POST(request: Request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: 'payload_too_large' });
  }

  const body = parseBody(contentType, raw);
  if (body === null) {
    // Eski uçta Vercel'in ayrıştırıcısı bozuk JSON'a gövdesiz, başlıksız 400 dönüyordu.
    return new Response(null, { status: 400 });
  }

  const telefon = typeof body.telefon === 'string' || typeof body.telefon === 'number' ? String(body.telefon) : '';
  const telefonDigits = telefon.replace(/\D/g, '').slice(0, 32);
  if (!telefonDigits) {
    return json(400, { ok: false, error: 'phone_required' });
  }

  // Gizli tuzak alanı: gerçek ziyaretçi doldurmaz. Bota başarı gösterilir, yazılmaz.
  if (text(body.website)) {
    console.warn('lead endpoint: honeypot hit, not written');
    return json(200, { ok: true });
  }

  const formType = typeof body.form_type === 'string' && Object.hasOwn(FORM_LABELS, body.form_type) ? body.form_type : 'quick';
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
    if (value) rawSignals[name] = value;
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

  const sheetData: Record<string, string> = {
    'Tarih/Saat': istanbulTimestamp(),
    'Kaynak Form': FORM_LABELS[formType],
    Sayfa: sheetCell(sayfa) || 'kayit.html',
    'Veli Adı': sheetCell(text(body.veli)),
    'Öğrenci Adı': sheetCell(text(body.ogrenci)),
    Telefon: telefonDigits,
    'E-posta': sheetCell(text(body.email)),
    Sınıf: sheetCell(text(body.sinif)),
    'İlgilenilen Program': sheetCell(text(body.program)),
    Kampüs: sheetCell(text(body.kampus)),
    'KVKK Onayı': body.kvkk ? 'Evet' : 'Hayır',
    'UTM Source': sheetCell(text(body.utm_source)),
    'UTM Medium': sheetCell(text(body.utm_medium)),
    'UTM Campaign': sheetCell(text(body.utm_campaign)),
    'UTM Content': sheetCell(text(body.utm_content)),
    'UTM Term': sheetCell(text(body.utm_term)),
    Durum: 'Yeni',
  };

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv !== 'production') {
    // Vercel üzerinde çalışıp ortamı okuyamıyorsak (sistem değişkenleri kapalı) sessizce başarı
    // dönmek tüm başvuruları kaybettirir; veli hata görsün ve tekrar denesin.
    if (!vercelEnv && request.headers.has('x-vercel-id')) {
      console.error('lead endpoint: VERCEL_ENV undefined on Vercel; lead NOT written');
      return json(503, { ok: false, error: 'server_misconfigured' });
    }
    console.warn('lead endpoint: dry_run, VERCEL_ENV=' + (vercelEnv ?? 'unset'));
    return json(200, { ok: true, dry_run: true });
  }

  // Kanallardan biri yazdıysa başvuru kaybolmamıştır; ikisi de yazamadıysa veli hata görür.
  const savedToSupabase = await writeSupabase(row);
  const savedToSheet = await writeSheet(sheetData);
  if (!savedToSupabase && savedToSheet) {
    console.error('lead endpoint: lead saved to sheet ONLY (supabase failed)');
  }
  if (!savedToSupabase && !savedToSheet) {
    return json(502, { ok: false, error: 'insert_failed' });
  }
  return json(200, { ok: true });
}
