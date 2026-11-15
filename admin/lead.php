<?php
/**
 * Website enquiry intake. The contact page posts its 3-step brief here as JSON.
 * Each brief becomes a new lead in the Client Hub, with the full message in its history and a
 * high-priority reminder to reply the next day.
 * Protections: same-site Origin check, hidden honeypot field, rate limits, size and length limits.
 */
declare(strict_types=1);
require __DIR__ . '/_boot.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'Use POST.'], 405);
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) json_out(['ok' => false, 'error' => 'Not allowed.'], 403);
$raw = (string) file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode($raw, true);
if (!is_array($in)) json_out(['ok' => false, 'error' => 'The request could not be read.'], 400);
if (!empty($in['website'])) json_out(['ok' => true]);
if (!rate_ok('lead', 6, 3600) || (int) col("SELECT COUNT(*) FROM clients WHERE source = 'Website form' AND created_at > ?", [date('Y-m-d H:i:s', time() - 86400)]) > 200) {
    json_out(['ok' => false, 'error' => 'Too many enquiries. Please message us on WhatsApp instead.'], 429);
}
$t = fn(string $k, int $max) => mb_substr(trim(strip_tags((string) ($in[$k] ?? ''))), 0, $max);
$name = $t('name', 100); $email = $t('email', 120); $phone = $t('phone', 30); $company = $t('company', 120);
$timeline = $t('timeline', 60); $message = $t('message', 3000);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['ok' => false, 'error' => 'Please add your name and a valid email address.'], 422);
$asked = array_map(fn($x) => mb_substr(trim((string) $x), 0, 60), is_array($in['services'] ?? null) ? array_slice($in['services'], 0, 6) : []);
$services = implode(',', array_values(array_intersect(SK_SERVICES, $asked)));

$existing = one('SELECT id FROM clients WHERE lower(email) = lower(?)', [$email]);
if ($existing) {
    $cid = (int) $existing['id'];
    q('UPDATE clients SET updated_at = ? WHERE id = ?', [now(), $cid]);
} else {
    q('INSERT INTO clients (name, company, status, phone, whatsapp, email, source, services, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [$name, $company, 'lead', $phone, $phone, $email, 'Website form', $services, now(), now()]);
    $cid = (int) db()->lastInsertId();
}
$brief = "New enquiry from the website\n\nServices: " . (implode(', ', $asked) ?: 'Not given') . "\nTimeline: " . ($timeline ?: 'Not given')
    . ($company ? "\nCompany: $company" : '') . ($phone ? "\nPhone: $phone" : '') . "\nEmail: $email" . ($message ? "\n\n$message" : '');
q('INSERT INTO activity (client_id, kind, body, created_at) VALUES (?, ?, ?, ?)', [$cid, 'lead', $brief, now()]);
q('INSERT INTO reminders (client_id, title, due_at, priority, created_at) VALUES (?, ?, ?, ?, ?)',
    [$cid, 'Reply to ' . $name . "'s website enquiry", date('Y-m-d', strtotime('+1 day')) . ' 10:00', 'high', now()]);
mail_auto('enquiry_received', $cid, 0, 0, ['services' => implode(', ', $asked) ?: 'Not given', 'timeline' => $timeline ?: 'Not given', 'message' => $message]);
json_out(['ok' => true]);
