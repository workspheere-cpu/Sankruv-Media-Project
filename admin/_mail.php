<?php
/**
 * Client emails: templates in emails/*.html, rendered into emails/_layout.html and sent over SMTP
 * (or PHP mail() when no SMTP host is set). Sending is OFF until 'mail' => ['enabled' => true, ...]
 * is set in config.php. See config.sample.php and the README for the settings.
 *
 * Template syntax: {{name}} inserts a value (always HTML-escaped). {{#name}}...{{/name}} shows the block
 * only when the value is not empty. The comment at the top of each template holds subject, preheader,
 * tag, title and about.
 */
declare(strict_types=1);
if (!defined('SK')) { http_response_code(404); exit; }

function mail_cfg(): array
{
    global $CFG;
    static $c = null;
    if ($c !== null) return $c;
    $site = rtrim((string) ($CFG['public_url'] ?? 'https://www.sankruvmedia.com/'), '/') . '/';
    $c = array_replace_recursive([
        'enabled' => false,
        'from_email' => 'contact@sankruvmedia.com',
        'from_name' => 'Sankruv Media',
        'reply_to' => 'contact@sankruvmedia.com',
        'bcc' => '',
        'smtp' => ['host' => '', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => '', 'timeout' => 15],
        'auto' => ['enquiry_received' => true, 'payment_received' => true, 'project_delivered' => false, 'project_confirmed' => false, 'welcome' => false],
        'brand' => [
            'name' => 'Sankruv Media', 'tagline' => 'Building Brands. Creating Impact. Driving Digital Growth.',
            'email' => 'contact@sankruvmedia.com', 'phone' => '+91 866-873-8331', 'whatsapp' => '918668738331', 'city' => 'Mumbai, India',
            'site_url' => $site, 'logo_url' => $site . 'assets/img/logo.png', 'review_url' => $site,
            'payment_info' => 'Bank transfer or UPI. Our team will share the account and UPI details with this request.',
        ],
    ], (array) ($CFG['mail'] ?? []));
    return $c;
}
function mail_enabled(): bool { return (bool) mail_cfg()['enabled']; }

/** All templates: slug => [subject, preheader, tag, title, about] read from each file's header comment. */
function mail_templates(): array
{
    static $all = null;
    if ($all !== null) return $all;
    $all = [];
    foreach (glob(__DIR__ . '/emails/*.html') ?: [] as $f) {
        $slug = basename($f, '.html');
        if ($slug[0] === '_') continue;
        $all[$slug] = mail_meta((string) file_get_contents($f)) + ['slug' => $slug];
    }
    $order = ['enquiry-received', 'welcome', 'project-confirmed', 'payment-request', 'payment-reminder', 'payment-received', 'project-delivered'];
    $pos = fn($k) => ($i = array_search($k, $order, true)) === false ? 99 : $i;
    uksort($all, fn($a, $b) => $pos($a) <=> $pos($b));
    return $all;
}
function mail_meta(string $src): array
{
    $m = ['subject' => '', 'preheader' => '', 'tag' => '', 'title' => '', 'about' => ''];
    if (preg_match('/^<!--(.*?)-->/s', $src, $x)) {
        foreach (explode("\n", $x[1]) as $line) {
            if (preg_match('/^\s*(\w+):\s*(.+)$/', $line, $kv) && array_key_exists($kv[1], $m)) $m[$kv[1]] = trim($kv[2]);
        }
    }
    return $m;
}

/** Fill a template string. Values are escaped; sections show only for non-empty values. */
function mail_fill(string $tpl, array $v, bool $html = true): string
{
    $tpl = preg_replace_callback('/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/s', fn($m) => trim((string) ($v[$m[1]] ?? '')) !== '' ? $m[2] : '', $tpl);
    return preg_replace_callback('/\{\{(\w+)\}\}/', function ($m) use ($v, $html) {
        $val = (string) ($v[$m[1]] ?? '');
        return $html ? nl2br(htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), false) : $val;
    }, $tpl);
}

/** Render one template. Returns [subject, html, text]. */
function mail_render(string $slug, array $vars): array
{
    $file = __DIR__ . '/emails/' . basename($slug) . '.html';
    if (!preg_match('/^[a-z0-9-]+$/', $slug) || !is_file($file)) throw new RuntimeException('Unknown email template.');
    $src = (string) file_get_contents($file);
    $meta = mail_meta($src);
    $vars = $vars + mail_brand_vars();
    $subject = mail_fill($meta['subject'], $vars, false);
    $body = mail_fill(preg_replace('/^<!--.*?-->\s*/s', '', $src), $vars);
    $html = mail_fill((string) file_get_contents(__DIR__ . '/emails/_layout.html'), ['subject' => $subject, 'preheader' => mail_fill($meta['preheader'], $vars, false), 'tag' => $meta['tag'], 'content' => '@@CONTENT@@'] + $vars);
    $html = str_replace('@@CONTENT@@', $body, $html);
    $text = mail_html_to_text($body) . "\n\nWarm regards,\nTeam " . $vars['brand'] . "\n" . $vars['brand_phone'] . ' | ' . $vars['brand_email'] . "\n" . $vars['site_url'];
    return [$subject, $html, $text];
}
function mail_html_to_text(string $html): string
{
    $t = preg_replace(['/<br\s*\/?>/i', '/<\/(p|h1|h2|tr|table)>/i', '/<\/td>\s*<td[^>]*>/i', '/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i'], ["\n", "\n\n", ': ', '$2 ($1)'], $html);
    $t = html_entity_decode(strip_tags((string) $t), ENT_QUOTES, 'UTF-8');
    return trim(preg_replace(["/[ \t]+/", "/\n\s*\n\s*\n+/"], [' ', "\n\n"], $t));
}
function mail_brand_vars(): array
{
    $b = mail_cfg()['brand'];
    return [
        'brand' => $b['name'], 'brand_tagline' => $b['tagline'], 'brand_email' => $b['email'], 'brand_phone' => $b['phone'],
        'brand_phone_tel' => preg_replace('/[^0-9+]/', '', $b['phone']), 'brand_city' => $b['city'],
        'whatsapp_url' => 'https://wa.me/' . preg_replace('/\D/', '', $b['whatsapp']), 'site_url' => $b['site_url'],
        'site_host' => preg_replace('#^https?://(www\.)?|/$#', '', $b['site_url']), 'logo_url' => $b['logo_url'],
        'review_url' => $b['review_url'], 'payment_info' => $b['payment_info'], 'year' => date('Y'),
    ];
}

/** Values for a client, and optionally one of their projects and payments. */
function mail_vars(int $clientId, int $projectId = 0, int $paymentId = 0): array
{
    $c = one('SELECT * FROM clients WHERE id = ?', [$clientId]);
    if (!$c) throw new RuntimeException('Client not found.');
    $name = trim($c['contact_person'] ?: $c['name']);
    $v = [
        'client_name' => $c['name'], 'first_name' => explode(' ', $name)[0], 'client_company' => $c['company'] ?: $c['name'],
        'client_email' => $c['email'], 'client_services' => str_replace(',', ', ', (string) $c['services']) ?: 'To be confirmed',
        'reference' => 'SM-L' . str_pad((string) $clientId, 4, '0', STR_PAD_LEFT),
    ];
    if ($projectId) {
        $p = one('SELECT * FROM projects WHERE id = ? AND client_id = ?', [$projectId, $clientId]);
        if ($p) $v += ['project_title' => $p['title'], 'project_service' => $p['service'] ?: 'As discussed', 'start_date' => $p['start_date'] ? fmt_date($p['start_date']) : 'To be confirmed',
            'due_date' => $p['due_date'] ? fmt_date($p['due_date']) : 'To be confirmed', 'project_value' => (int) $p['value'] ? inr($p['value']) : '', 'project_details' => $p['details']];
    }
    if ($paymentId) {
        $y = one('SELECT * FROM payments WHERE id = ? AND client_id = ?', [$paymentId, $clientId]);
        if ($y) {
            $bal = (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE client_id = ? AND status = 'pending'", [$clientId]);
            $v += ['payment_label' => $y['label'], 'amount' => inr($y['amount']), 'payment_due' => $y['due_date'] ? fmt_date($y['due_date']) : 'On receipt',
                'paid_date' => fmt_date($y['paid_date'] ?: today()), 'invoice_no' => 'SM-' . date('y', strtotime($y['created_at'])) . '-' . str_pad((string) $y['id'], 4, '0', STR_PAD_LEFT),
                'receipt_no' => 'SMR-' . str_pad((string) $y['id'], 5, '0', STR_PAD_LEFT), 'balance' => $bal ? inr($bal) : ''];
        }
    }
    return $v;
}

/** Sample values, used for previews when no client is chosen. */
function mail_sample_vars(): array
{
    return ['client_name' => 'Brew Lane Cafe', 'first_name' => 'Riya', 'client_company' => 'Brew Lane Cafe', 'client_services' => 'Social Media Management, Branding & Creative Design',
        'reference' => 'SM-L0042', 'services' => 'Social Media Management, Web Development & Design', 'timeline' => 'Within a month',
        'message' => 'We are opening a second outlet in Bandra and want a launch campaign plus a new website.',
        'project_title' => 'Diwali reels campaign', 'project_service' => 'Social Media Management', 'start_date' => fmt_date(today()), 'due_date' => fmt_date(date('Y-m-d', strtotime('+21 day'))),
        'project_value' => inr(45000), 'project_details' => '12 reels, 20 posts and a festive story series.', 'payment_label' => '50% advance for Diwali campaign', 'amount' => inr(22500),
        'payment_due' => fmt_date(date('Y-m-d', strtotime('+3 day'))), 'paid_date' => fmt_date(today()), 'invoice_no' => 'SM-' . date('y') . '-0007', 'receipt_no' => 'SMR-00007', 'balance' => inr(22500)];
}

/** Send a rendered email. Returns ['ok' => bool, 'error' => string]. */
function mail_send(string $to, string $toName, array $rendered): array
{
    [$subject, $html, $text] = $rendered;
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return ['ok' => false, 'error' => 'This client has no valid email address.'];
    if (!mail_enabled()) return ['ok' => false, 'error' => 'Email sending is not set up yet.'];
    $c = mail_cfg();
    $enc = fn(string $s) => preg_match('/[^\x20-\x7e]/', $s) ? '=?UTF-8?B?' . base64_encode($s) . '?=' : $s;
    $clean = fn(string $s) => trim(str_replace(["\r", "\n"], ' ', $s));
    $boundary = 'b' . bin2hex(random_bytes(12));
    $domain = substr(strrchr($c['from_email'], '@') ?: '@localhost', 1);
    $headers = [
        'Date: ' . date('r'),
        'From: ' . $enc($clean($c['from_name'])) . ' <' . $c['from_email'] . '>',
        'To: ' . ($toName !== '' ? $enc($clean($toName)) . ' ' : '') . '<' . $to . '>',
        'Reply-To: ' . $c['reply_to'],
        'Subject: ' . $enc($clean($subject)),
        'Message-ID: <' . bin2hex(random_bytes(10)) . '@' . $domain . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text))
          . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$boundary--\r\n";
    $rcpt = array_values(array_filter([$to, filter_var($c['bcc'], FILTER_VALIDATE_EMAIL) ? $c['bcc'] : '']));
    if (trim((string) $c['smtp']['host']) === '') {
        $hdr = array_values(array_filter($headers, fn($h) => !preg_match('/^(To|Subject|Date):/', $h)));
        if ($rcpt[1] ?? '') $hdr[] = 'Bcc: ' . $rcpt[1];
        $ok = @mail($to, $enc($clean($subject)), $body, implode("\r\n", $hdr), '-f' . $c['from_email']);
        return ['ok' => $ok, 'error' => $ok ? '' : 'The server could not send the email.'];
    }
    return mail_smtp($c['smtp'], $c['from_email'], $rcpt, implode("\r\n", $headers) . "\r\n\r\n" . $body);
}

function mail_smtp(array $s, string $from, array $rcpt, string $data): array
{
    $secure = strtolower((string) $s['secure']);
    $host = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $s['host'] . ':' . (int) $s['port'];
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
    $fp = @stream_socket_client($host, $errno, $errstr, (int) $s['timeout'], STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) return ['ok' => false, 'error' => 'Could not connect to the mail server.'];
    stream_set_timeout($fp, (int) $s['timeout']);
    $read = function () use ($fp): string { $out = ''; while (($l = fgets($fp, 515)) !== false) { $out .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $out; };
    $cmd = function (string $c, array $ok) use ($fp, $read): string { if ($c !== '') fwrite($fp, $c . "\r\n"); $r = $read(); if (!in_array((int) substr($r, 0, 3), $ok, true)) throw new RuntimeException(trim($r) ?: 'No reply'); return $r; };
    try {
        $cmd('', [220]);
        $me = gethostname() ?: 'localhost';
        $cmd('EHLO ' . $me, [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) throw new RuntimeException('TLS failed');
            $cmd('EHLO ' . $me, [250]);
        }
        if ((string) $s['user'] !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string) $s['user']), [334]);
            $cmd(base64_encode((string) $s['pass']), [235]);
        }
        $cmd('MAIL FROM:<' . $from . '>', [250]);
        foreach ($rcpt as $r) $cmd('RCPT TO:<' . $r . '>', [250, 251]);
        $cmd('DATA', [354]);
        $cmd(preg_replace('/^\./m', '..', $data) . "\r\n.", [250]);
        $cmd('QUIT', [221]);
        fclose($fp);
        return ['ok' => true, 'error' => ''];
    } catch (Throwable $e) {
        @fclose($fp);
        error_log('Client Hub SMTP: ' . $e->getMessage());
        return ['ok' => false, 'error' => 'The mail server refused the email. Check the SMTP settings.'];
    }
}

/** Render and send a template to a client, and record it in the client's history. */
function mail_to_client(string $slug, int $clientId, int $projectId = 0, int $paymentId = 0, array $extra = [], string $to = ''): array
{
    try {
        $vars = $extra + mail_vars($clientId, $projectId, $paymentId);
        $rendered = mail_render($slug, $vars);
    } catch (Throwable $e) { return ['ok' => false, 'error' => $e->getMessage()]; }
    $to = $to !== '' ? $to : (string) $vars['client_email'];
    $r = mail_send($to, $vars['client_name'], $rendered);
    if ($r['ok']) log_activity($clientId, 'email', 'Email sent to ' . $to . ': ' . $rendered[0]);
    return $r + ['subject' => $rendered[0]];
}

/** Automatic emails, each switched on or off in config ('auto'). Failures never stop the main action. */
function mail_auto(string $event, int $clientId, int $projectId = 0, int $paymentId = 0, array $extra = []): void
{
    $map = ['enquiry_received' => 'enquiry-received', 'payment_received' => 'payment-received', 'project_delivered' => 'project-delivered', 'project_confirmed' => 'project-confirmed', 'welcome' => 'welcome'];
    if (!mail_enabled() || empty(mail_cfg()['auto'][$event]) || !isset($map[$event])) return;
    try { mail_to_client($map[$event], $clientId, $projectId, $paymentId, $extra); } catch (Throwable $e) { error_log('Client Hub mail: ' . $e->getMessage()); }
}
