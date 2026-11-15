<?php
/**
 * Sankruv Media Client Hub: shared setup for every admin page.
 * PHP 8.0+ with pdo_sqlite. No other requirements.
 *
 * Data (SQLite database, sessions, setup code) lives outside the public web folder when the
 * server allows it (…/sankruv-client-hub-data next to public_html), otherwise in admin/data,
 * which is blocked from the web by .htaccess. Optional settings: copy config.sample.php to config.php.
 */
declare(strict_types=1);
if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }
define('SK', 1);

$CFG = ['brand' => 'Sankruv Media', 'app' => 'Client Hub', 'tz' => 'Asia/Kolkata', 'data_dir' => '', 'site_url' => '../index.html', 'setup_key' => ''];
if (is_file(__DIR__ . '/config.php')) { $CFG = array_merge($CFG, (array) require __DIR__ . '/config.php'); }
date_default_timezone_set($CFG['tz']);

const SK_SERVICES = ['Social Media Management', 'Web Development & Design', 'Branding & Creative Design', 'Corporate & Commercial Shoots'];
const SK_CLIENT_STATUS = ['lead' => 'New lead', 'active' => 'Active', 'on_hold' => 'On hold', 'completed' => 'Completed', 'archived' => 'Archived'];
const SK_PROJECT_STATUS = ['planned' => 'Planned', 'in_progress' => 'In progress', 'review' => 'In review', 'done' => 'Delivered', 'paused' => 'Paused'];
const SK_PRIORITY = ['low' => 'Low', 'normal' => 'Normal', 'high' => 'High'];
const SK_PAY_STATUS = ['pending' => 'Pending', 'paid' => 'Paid'];
const SK_LOG_KINDS = ['note' => 'Note', 'call' => 'Call', 'meeting' => 'Meeting', 'email' => 'Email', 'whatsapp' => 'WhatsApp'];
const SK_INDUSTRIES = ['Lifestyle', 'Fashion', 'Retail', 'Corporate', 'Real estate', 'Food and beverage', 'Jewellery', 'Home and furniture', 'Beauty', 'Education', 'Healthcare', 'Other'];

/* ------------------------------------------------------------------ data folder */
function sk_data_dir(): string
{
    static $dir = null;
    if ($dir !== null) return $dir;
    global $CFG;
    $local = __DIR__ . '/data';
    if ($CFG['data_dir'] !== '') {
        $dir = rtrim($CFG['data_dir'], '/');
    } else {
        $doc = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
        $out = $doc !== '' ? dirname($doc) . '/sankruv-client-hub-data' : '';
        if (is_file($local . '/hub.sqlite')) $dir = $local;
        elseif ($out !== '' && is_dir($out) && is_writable($out)) $dir = $out;
        elseif ($out !== '' && is_writable(dirname($out)) && @mkdir($out, 0750, true)) $dir = $out;
        else $dir = $local;
    }
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    if (!is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order deny,allow\n  Deny from all\n</IfModule>\n");
    }
    if (!is_file($dir . '/index.html')) @file_put_contents($dir . '/index.html', '');
    return $dir;
}
function sk_data_inside_web(): bool { return str_starts_with(sk_data_dir(), __DIR__); }

/* ------------------------------------------------------------------ database */
function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO('sqlite:' . sk_data_dir() . '/hub.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
    sk_migrate($pdo);
    return $pdo;
}
function sk_migrate(PDO $pdo): void
{
    $v = (int) $pdo->query('PRAGMA user_version')->fetchColumn();
    if ($v < 1) {
        $pdo->exec(<<<SQL
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, email TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member', pass TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, fails INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0, last_login TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY, name TEXT NOT NULL, company TEXT DEFAULT '', industry TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'lead', contact_person TEXT DEFAULT '', designation TEXT DEFAULT '', phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '', email TEXT DEFAULT '', website TEXT DEFAULT '', instagram TEXT DEFAULT '', address TEXT DEFAULT '',
  city TEXT DEFAULT '', gst TEXT DEFAULT '', source TEXT DEFAULT '', services TEXT DEFAULT '', budget INTEGER DEFAULT 0,
  about TEXT DEFAULT '', starred INTEGER NOT NULL DEFAULT 0, created_by INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL, service TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'planned', start_date TEXT DEFAULT '', due_date TEXT DEFAULT '',
  progress INTEGER NOT NULL DEFAULT 0, value INTEGER NOT NULL DEFAULT 0, details TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY, client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, due_at TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'normal',
  done INTEGER NOT NULL DEFAULT 0, done_at TEXT, created_by INTEGER, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, label TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', due_date TEXT DEFAULT '', paid_date TEXT DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY, client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'note', body TEXT NOT NULL, user_id INTEGER, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hits (k TEXT NOT NULL, t INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS i_proj_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS i_proj_due ON projects(due_date);
CREATE INDEX IF NOT EXISTS i_rem_due ON reminders(done, due_at);
CREATE INDEX IF NOT EXISTS i_pay_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS i_act_client ON activity(client_id, created_at);
CREATE INDEX IF NOT EXISTS i_hits ON hits(k, t);
PRAGMA user_version = 1;
SQL);
    }
}
function now(): string { return date('Y-m-d H:i:s'); }
function today(): string { return date('Y-m-d'); }
function q(string $sql, array $args = []): PDOStatement { $st = db()->prepare($sql); $st->execute($args); return $st; }
function one(string $sql, array $args = []): ?array { $r = q($sql, $args)->fetch(); return $r ?: null; }
function col(string $sql, array $args = []) { return q($sql, $args)->fetchColumn(); }

/* ------------------------------------------------------------------ http, session, security */
function sk_headers(bool $html = true): void
{
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    if ($html) header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}
function sk_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
}
function sk_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $path = rtrim(str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/'))), '/') . '/';
    session_name('SKHUB');
    session_set_cookie_params(['lifetime' => 0, 'path' => $path, 'secure' => sk_https(), 'httponly' => true, 'samesite' => 'Lax']);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    $sp = sk_data_dir() . '/sessions';
    if (!is_dir($sp)) @mkdir($sp, 0700, true);
    if (is_dir($sp) && is_writable($sp)) session_save_path($sp);
    session_start();
    if (isset($_SESSION['seen']) && time() - (int) $_SESSION['seen'] > 8 * 3600) { $_SESSION = []; session_regenerate_id(true); }
    $_SESSION['seen'] = time();
}
function client_ip(): string { return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 64); }
function rate_ok(string $key, int $max, int $window): bool
{
    $k = $key . '|' . client_ip(); $t = time();
    if (random_int(1, 20) === 1) q('DELETE FROM hits WHERE t < ?', [$t - 86400]);
    if ((int) col('SELECT COUNT(*) FROM hits WHERE k = ? AND t > ?', [$k, $t - $window]) >= $max) return false;
    q('INSERT INTO hits (k, t) VALUES (?, ?)', [$k, $t]);
    return true;
}
function csrf(): string { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32)); return $_SESSION['csrf']; }
function csrf_field(): string { return '<input type="hidden" name="_csrf" value="' . csrf() . '">'; }
function csrf_verify(): void
{
    $t = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF'] ?? '');
    if (!is_string($t) || !hash_equals(csrf(), $t)) {
        http_response_code(419);
        if (is_api()) json_out(['ok' => false, 'error' => 'Your session expired. Refresh the page and try again.'], 419);
        exit('Your session expired. Go back, refresh the page and try again.');
    }
}
function is_api(): bool { return basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) === 'api.php'; }
function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function redirect(string $to): void { header('Location: ' . $to, true, 303); exit; }
function flash(string $msg, string $kind = 'ok'): void { $_SESSION['flash'] = [$kind, $msg]; }
function flash_take(): ?array { $f = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $f; }

/* ------------------------------------------------------------------ users and sign-in */
function users_exist(): bool { return (int) col('SELECT COUNT(*) FROM users') > 0; }
function user(): ?array
{
    static $u = false;
    if ($u !== false) return $u;
    $u = null;
    if (!empty($_SESSION['uid'])) $u = one('SELECT * FROM users WHERE id = ? AND active = 1', [(int) $_SESSION['uid']]);
    return $u;
}
function is_owner(): bool { return (user()['role'] ?? '') === 'owner'; }
function require_login(): array
{
    $u = user();
    if ($u) return $u;
    if (is_api()) json_out(['ok' => false, 'error' => 'Please sign in again.'], 401);
    $self = basename((string) $_SERVER['SCRIPT_NAME']);
    $qs = $_SERVER['QUERY_STRING'] ?? '';
    redirect('login.php' . ($self !== 'index.php' ? '?next=' . rawurlencode($self . ($qs !== '' ? '?' . $qs : '')) : ''));
}
function attempt_login(string $username, string $password): bool
{
    static $dummy = null;
    $u = one('SELECT * FROM users WHERE username = ?', [strtolower($username)]);
    if (!$u || !(int) $u['active']) { password_verify($password, $dummy ??= password_hash('timing-guard', PASSWORD_DEFAULT)); return false; }
    if ((int) $u['locked_until'] > time()) return false;
    if (!password_verify($password, $u['pass'])) {
        $fails = (int) $u['fails'] + 1;
        q('UPDATE users SET fails = ?, locked_until = ? WHERE id = ?', [$fails >= 5 ? 0 : $fails, $fails >= 5 ? time() + 600 : 0, $u['id']]);
        return false;
    }
    if (password_needs_rehash($u['pass'], PASSWORD_DEFAULT)) q('UPDATE users SET pass = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $u['id']]);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $u['id'];
    unset($_SESSION['csrf']);
    q('UPDATE users SET fails = 0, locked_until = 0, last_login = ? WHERE id = ?', [now(), $u['id']]);
    sk_gc_sessions();
    return true;
}
function sk_gc_sessions(): void
{
    $sp = sk_data_dir() . '/sessions';
    if (!is_dir($sp) || random_int(1, 5) !== 1) return;
    foreach ((array) glob($sp . '/sess_*') as $f) if (is_file($f) && filemtime($f) < time() - 2 * 86400) @unlink($f);
}
function valid_username(string $u): bool { return (bool) preg_match('/^[a-z0-9._-]{3,32}$/', $u); }
function password_problem(string $p, string $confirm): ?string
{
    if (strlen($p) < 10) return 'Use at least 10 characters for the password.';
    if ($p !== $confirm) return 'The two passwords do not match.';
    return null;
}

/* ------------------------------------------------------------------ formatting */
function h($v): string { return htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function inr($n): string
{
    $n = (int) round((float) $n); $neg = $n < 0; $s = (string) abs($n);
    if (strlen($s) > 3) { $last = substr($s, -3); $rest = substr($s, 0, -3); $rest = preg_replace('/\B(?=(\d{2})+(?!\d))/', ',', $rest); $s = $rest . ',' . $last; }
    return ($neg ? '-' : '') . '₹' . $s;
}
function initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $i = mb_strtoupper(mb_substr($parts[0] ?? '?', 0, 1) . (isset($parts[1]) ? mb_substr($parts[1], 0, 1) : ''));
    return $i !== '' ? $i : '?';
}
function hue(string $s): int { return [186, 222, 262, 32, 340, 152, 200, 12][abs(crc32($s)) % 8]; }
function days_until(?string $date): ?int
{
    if (!$date) return null;
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', substr($date, 0, 10));
    if (!$d) return null;
    return (int) (new DateTimeImmutable('today'))->diff($d)->format('%r%a');
}
function rel_day(?string $date): string
{
    $n = days_until($date);
    if ($n === null) return 'No date';
    if ($n === 0) return 'Today';
    if ($n === 1) return 'Tomorrow';
    if ($n === -1) return 'Yesterday';
    if ($n < 0) return abs($n) . ' days overdue';
    if ($n < 14) return 'In ' . $n . ' days';
    return fmt_date($date);
}
function due_tone(?string $date, bool $done = false): string
{
    if ($done) return 'ok';
    $n = days_until($date);
    if ($n === null) return 'mute';
    if ($n < 0) return 'bad';
    if ($n <= 2) return 'warn';
    return 'calm';
}
function fmt_date(?string $date, bool $time = false): string
{
    if (!$date) return '';
    $t = strtotime($date);
    if (!$t) return '';
    return date($time && strlen($date) > 10 ? 'j M Y, g:i a' : 'j M Y', $t);
}
function ago(string $dt): string
{
    $s = time() - (int) strtotime($dt);
    if ($s < 60) return 'Just now';
    if ($s < 3600) return floor($s / 60) . ' min ago';
    if ($s < 86400) return floor($s / 3600) . ' h ago';
    if ($s < 7 * 86400) return floor($s / 86400) . ' d ago';
    return fmt_date($dt);
}
function digits(string $s): string { return preg_replace('/\D+/', '', $s) ?? ''; }
function wa_link(string $num): string { $d = digits($num); if (strlen($d) === 10) $d = '91' . $d; return $d !== '' ? 'https://wa.me/' . $d : ''; }
function web_link(string $u): string { $u = trim($u); if ($u === '') return ''; return preg_match('#^https?://#i', $u) ? $u : 'https://' . $u; }
function ig_link(string $u): string { $u = trim($u); if ($u === '') return ''; if (preg_match('#^https?://#i', $u)) return $u; return 'https://instagram.com/' . ltrim($u, '@'); }
function log_activity(?int $clientId, string $kind, string $body): void
{
    q('INSERT INTO activity (client_id, kind, body, user_id, created_at) VALUES (?, ?, ?, ?, ?)', [$clientId, $kind, mb_substr($body, 0, 4000), user()['id'] ?? null, now()]);
}

/* ------------------------------------------------------------------ icons */
function ic(string $name, string $cls = 'i'): string
{
    static $P = [
        'grid' => '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
        'users' => '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
        'layers' => '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
        'bell' => '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
        'wallet' => '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2M7 6l9-3 1 3"/>',
        'shield' => '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
        'globe' => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
        'search' => '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
        'plus' => '<path d="M12 5v14M5 12h14"/>',
        'phone' => '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
        'wa' => '<path d="M20.5 11.6A8.5 8.5 0 0 1 8 19l-4.5 1.3L4.8 16A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M9 8.6c.3 2.9 2.6 5.3 5.6 5.7l1-1.3-1.8-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-1.8z"/>',
        'mail' => '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
        'link' => '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
        'ig' => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor"/>',
        'pin' => '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
        'star' => '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
        'edit' => '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
        'trash' => '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
        'check' => '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        'x' => '<path d="M6 6l12 12M18 6L6 18"/>',
        'clock' => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        'cal' => '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
        'chev' => '<path d="M9 6l6 6-6 6"/>',
        'down' => '<path d="M6 9l6 6 6-6"/>',
        'logout' => '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
        'download' => '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
        'note' => '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A1.5 1.5 0 0 1 5 19V4.5A1 1 0 0 1 6 3.5z"/><path d="M9 11h6M9 15h6"/>',
        'building' => '<rect x="4" y="3" width="11" height="18" rx="1.5"/><path d="M15 9h4.5a.5.5 0 0 1 .5.5V21M8 7h3M8 11h3M8 15h3M3 21h18"/>',
        'tag' => '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.5"/>',
        'user' => '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        'flag' => '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
        'arrow' => '<path d="M5 12h14M13 6l6 6-6 6"/>',
        'spark' => '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
        'chat' => '<path d="M4 5h16v11H9l-5 4z"/>',
        'menu' => '<path d="M4 7h16M4 12h16M4 17h16"/>',
        'more' => '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
        'eye' => '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        'lock' => '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
        'trend' => '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
        'briefcase' => '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    ];
    $p = $P[$name] ?? $P['spark'];
    return '<svg class="' . $cls . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $p . '</svg>';
}

function avatar(array $c, string $cls = ''): string
{
    return '<span class="av ' . $cls . '" style="--h:' . hue((string) $c['name']) . '">' . h(initials((string) $c['name'])) . '</span>';
}
function chip(string $label, string $tone): string { return '<span class="chip t-' . h($tone) . '">' . h($label) . '</span>'; }
function status_tone(string $s): string { return ['lead' => 'lead', 'active' => 'ok', 'on_hold' => 'warn', 'completed' => 'calm', 'archived' => 'mute', 'planned' => 'calm', 'in_progress' => 'lead', 'review' => 'warn', 'done' => 'ok', 'paused' => 'mute'][$s] ?? 'mute'; }

sk_headers(basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) !== 'api.php' && basename((string) ($_SERVER['SCRIPT_NAME'] ?? '')) !== 'lead.php');
