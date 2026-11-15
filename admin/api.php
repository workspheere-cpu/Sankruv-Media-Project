<?php
/**
 * JSON actions used by the hub pages. POST only, signed-in users only, CSRF token in the X-CSRF header.
 * Body: {"action": "client.update", ...}. Reply: {"ok": true, ...} or {"ok": false, "error": "..."}.
 * Search is the one read action and also accepts GET.
 */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();

$in = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $raw = (string) file_get_contents('php://input', false, null, 0, 200000);
    $in = json_decode($raw, true);
    if (!is_array($in)) json_out(['ok' => false, 'error' => 'The request could not be read.'], 400);
} elseif (($_GET['action'] ?? '') === 'search') {
    $in = ['action' => 'search', 'q' => (string) ($_GET['q'] ?? '')];
} else {
    json_out(['ok' => false, 'error' => 'Use POST.'], 405);
}

$s = fn(string $k, int $max = 500) => mb_substr(trim((string) ($in[$k] ?? '')), 0, $max);
$id = (int) ($in['id'] ?? 0);
function bad(string $msg): void { json_out(['ok' => false, 'error' => $msg], 422); }
function valid_date(string $d): bool { return $d === '' || (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) && checkdate((int) substr($d, 5, 2), (int) substr($d, 8, 2), (int) substr($d, 0, 4)); }
function need(string $table, int $id): array
{
    $row = one("SELECT * FROM $table WHERE id = ?", [$id]);
    if (!$row) json_out(['ok' => false, 'error' => 'This item no longer exists. Refresh the page.'], 404);
    return $row;
}
function clean_field(string $entity, string $field, $value)
{
    $v = is_string($value) ? trim($value) : $value;
    $txt = fn($max) => mb_substr((string) $v, 0, $max);
    switch ($entity . '.' . $field) {
        case 'client.name': if ($txt(120) === '') bad('The client needs a name.'); return $txt(120);
        case 'client.status': if (!isset(SK_CLIENT_STATUS[$v])) bad('Choose a valid status.'); return $v;
        case 'client.email': if ($v !== '' && !filter_var($v, FILTER_VALIDATE_EMAIL)) bad('Enter a valid email address.'); return $txt(120);
        case 'client.budget': return max(0, (int) $v);
        case 'client.starred': return $v ? 1 : 0;
        case 'client.services':
            $list = is_array($v) ? $v : explode(',', (string) $v);
            return implode(',', array_values(array_intersect(SK_SERVICES, array_map('trim', $list))));
        case 'client.about': return $txt(5000);
        case 'client.company': case 'client.industry': case 'client.contact_person': case 'client.designation': case 'client.phone':
        case 'client.whatsapp': case 'client.website': case 'client.instagram': case 'client.address': case 'client.city':
        case 'client.gst': case 'client.source':
            return $txt(200);
        case 'project.title': if ($txt(140) === '') bad('The project needs a name.'); return $txt(140);
        case 'project.status': if (!isset(SK_PROJECT_STATUS[$v])) bad('Choose a valid status.'); return $v;
        case 'project.service': return in_array($v, SK_SERVICES, true) ? $v : '';
        case 'project.start_date': case 'project.due_date': if (!valid_date((string) $v)) bad('Enter a valid date.'); return (string) $v;
        case 'project.progress': return max(0, min(100, (int) $v));
        case 'project.value': return max(0, (int) $v);
        case 'project.details': return $txt(4000);
        case 'payment.label': if ($txt(140) === '') bad('Add a description.'); return $txt(140);
        case 'payment.amount': if ((int) $v < 1) bad('Enter an amount.'); return (int) $v;
        case 'payment.status': if (!isset(SK_PAY_STATUS[$v])) bad('Choose a valid status.'); return $v;
        case 'payment.due_date': case 'payment.paid_date': if (!valid_date((string) $v)) bad('Enter a valid date.'); return (string) $v;
        case 'reminder.title': if ($txt(160) === '') bad('Write what needs to happen.'); return $txt(160);
        case 'reminder.priority': if (!isset(SK_PRIORITY[$v])) bad('Choose a valid priority.'); return $v;
    }
    bad('This field cannot be changed here.');
}

switch ($in['action'] ?? '') {
    /* ---------------- search ---------------- */
    case 'search':
        $term = mb_substr(trim((string) $in['q']), 0, 60);
        if ($term === '') json_out(['ok' => true, 'results' => []]);
        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $term) . '%';
        $dig = digits($term);
        $out = [];
        $rows = q("SELECT id, name, company, status, phone, email FROM clients WHERE name LIKE :l ESCAPE '\\' OR company LIKE :l ESCAPE '\\' OR email LIKE :l ESCAPE '\\' OR city LIKE :l ESCAPE '\\'"
            . ($dig !== '' && strlen($dig) >= 3 ? " OR replace(replace(replace(phone,' ',''),'-',''),'+','') LIKE :d OR replace(replace(replace(whatsapp,' ',''),'-',''),'+','') LIKE :d" : '')
            . " ORDER BY status = 'archived', name COLLATE NOCASE LIMIT 8", array_merge([':l' => $like], $dig !== '' && strlen($dig) >= 3 ? [':d' => '%' . $dig . '%'] : []))->fetchAll();
        foreach ($rows as $r) $out[] = ['type' => 'Client', 'title' => $r['name'], 'sub' => trim(($r['company'] ?: '') . ' ' . SK_CLIENT_STATUS[$r['status']]), 'url' => 'client.php?id=' . $r['id'], 'init' => initials($r['name']), 'hue' => hue($r['name'])];
        $rows = q("SELECT p.id, p.title, p.due_date, p.client_id, c.name FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.title LIKE ? ESCAPE '\\' ORDER BY p.due_date LIMIT 6", [$like])->fetchAll();
        foreach ($rows as $r) $out[] = ['type' => 'Project', 'title' => $r['title'], 'sub' => $r['name'] . ($r['due_date'] ? ', due ' . fmt_date($r['due_date']) : ''), 'url' => 'client.php?id=' . $r['client_id'] . '#projects', 'init' => '', 'hue' => hue($r['name'])];
        json_out(['ok' => true, 'results' => $out]);

    /* ---------------- clients ---------------- */
    case 'client.create':
        $name = $s('name', 120);
        if ($name === '') bad('Enter the client or brand name.');
        $status = isset(SK_CLIENT_STATUS[$in['status'] ?? '']) ? $in['status'] : 'active';
        $email = $s('email', 120);
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) bad('Enter a valid email address, or leave it empty.');
        $services = clean_field('client', 'services', $in['services'] ?? []);
        q('INSERT INTO clients (name, company, industry, status, phone, whatsapp, email, source, services, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [$name, $s('company', 120), $s('industry', 60), $status, $s('phone', 30), $s('phone', 30), $email, $s('source', 60), $services, $me['id'], now(), now()]);
        $cid = (int) db()->lastInsertId();
        log_activity($cid, 'system', 'Client created by ' . $me['name']);
        json_out(['ok' => true, 'id' => $cid, 'url' => 'client.php?id=' . $cid, 'message' => $name . ' added']);

    case 'client.update':
        need('clients', $id);
        $field = (string) ($in['field'] ?? '');
        $old = one('SELECT * FROM clients WHERE id = ?', [$id]);
        $val = clean_field('client', $field, $in['value'] ?? '');
        q("UPDATE clients SET $field = ?, updated_at = ? WHERE id = ?", [$val, now(), $id]);
        if ($field === 'status' && $old['status'] !== $val) log_activity($id, 'system', 'Status changed from ' . SK_CLIENT_STATUS[$old['status']] . ' to ' . SK_CLIENT_STATUS[$val]);
        if ($field === 'status' && $old['status'] === 'lead' && $val === 'active') mail_auto('welcome', $id);
        json_out(['ok' => true, 'value' => $val, 'display' => $field === 'budget' ? ($val ? inr($val) : '') : (string) $val]);

    case 'client.delete':
        $c = need('clients', $id);
        if (!is_owner()) bad('Only the owner can delete a client. You can archive it instead.');
        q('DELETE FROM clients WHERE id = ?', [$id]);
        json_out(['ok' => true, 'url' => 'clients.php', 'message' => $c['name'] . ' deleted']);

    /* ---------------- projects ---------------- */
    case 'project.create':
        $cid = (int) ($in['client_id'] ?? 0); need('clients', $cid);
        $title = $s('title', 140); if ($title === '') bad('Enter a project name.');
        $status = isset(SK_PROJECT_STATUS[$in['status'] ?? '']) ? $in['status'] : 'planned';
        foreach (['start_date', 'due_date'] as $k) if (!valid_date($s($k, 10))) bad('Enter valid dates.');
        q('INSERT INTO projects (client_id, title, service, status, start_date, due_date, progress, value, details, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$cid, $title, in_array($in['service'] ?? '', SK_SERVICES, true) ? $in['service'] : '', $status, $s('start_date', 10), $s('due_date', 10), $status === 'done' ? 100 : 0, max(0, (int) ($in['value'] ?? 0)), $s('details', 4000), now(), now()]);
        $pid = (int) db()->lastInsertId();
        log_activity($cid, 'project', 'New project: ' . $title . ($s('due_date', 10) ? ', deadline ' . fmt_date($s('due_date', 10)) : ''));
        mail_auto('project_confirmed', $cid, $pid);
        q('UPDATE clients SET updated_at = ? WHERE id = ?', [now(), $cid]);
        json_out(['ok' => true, 'url' => 'client.php?id=' . $cid . '#projects', 'message' => 'Project created']);

    case 'project.update':
        $p = need('projects', $id);
        $field = (string) ($in['field'] ?? '');
        $val = clean_field('project', $field, $in['value'] ?? '');
        $extra = '';
        $args = [$val, now()];
        if ($field === 'status' && $val === 'done') { $extra = ', progress = 100'; }
        if ($field === 'progress' && $val === 100 && $p['status'] !== 'done') { $extra = ", status = 'review'"; }
        q("UPDATE projects SET $field = ?, updated_at = ?$extra WHERE id = ?", array_merge($args, [$id]));
        if ($field === 'status' && $p['status'] !== $val) log_activity((int) $p['client_id'], 'project', $p['title'] . ': ' . SK_PROJECT_STATUS[$val]);
        if ($field === 'status' && $val === 'done' && $p['status'] !== 'done') mail_auto('project_delivered', (int) $p['client_id'], $id);
        $row = one('SELECT * FROM projects WHERE id = ?', [$id]);
        json_out(['ok' => true, 'value' => $val, 'progress' => (int) $row['progress'], 'status' => $row['status'], 'due' => rel_day($row['due_date']), 'tone' => due_tone($row['due_date'], $row['status'] === 'done')]);

    case 'project.delete':
        $p = need('projects', $id);
        q('DELETE FROM projects WHERE id = ?', [$id]);
        log_activity((int) $p['client_id'], 'project', 'Project removed: ' . $p['title']);
        json_out(['ok' => true, 'message' => 'Project deleted']);

    /* ---------------- reminders ---------------- */
    case 'reminder.create':
        $title = $s('title', 160); if ($title === '') bad('Write what needs to happen.');
        $date = $s('date', 10); if ($date === '' || !valid_date($date)) bad('Choose a date.');
        $time = preg_match('/^\d{2}:\d{2}$/', $s('time', 5)) ? $s('time', 5) : '10:00';
        $cid = (int) ($in['client_id'] ?? 0) ?: null; if ($cid) need('clients', $cid);
        $pid = (int) ($in['project_id'] ?? 0) ?: null;
        if ($pid) { $pp = need('projects', $pid); $cid = $cid ?: (int) $pp['client_id']; }
        q('INSERT INTO reminders (client_id, project_id, title, due_at, priority, created_by, created_at) VALUES (?,?,?,?,?,?,?)',
            [$cid, $pid, $title, $date . ' ' . $time, isset(SK_PRIORITY[$in['priority'] ?? '']) ? $in['priority'] : 'normal', $me['id'], now()]);
        json_out(['ok' => true, 'message' => 'Reminder saved for ' . fmt_date($date)]);

    case 'reminder.toggle':
        $r = need('reminders', $id);
        $done = (int) $r['done'] ? 0 : 1;
        q('UPDATE reminders SET done = ?, done_at = ? WHERE id = ?', [$done, $done ? now() : null, $id]);
        if ($done && $r['client_id']) log_activity((int) $r['client_id'], 'reminder', 'Done: ' . $r['title']);
        json_out(['ok' => true, 'done' => $done]);

    case 'reminder.update':
        $r = need('reminders', $id);
        $field = (string) ($in['field'] ?? '');
        if ($field === 'due_at') {
            $v = (string) ($in['value'] ?? '');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/', $v)) bad('Choose a valid date.');
            q('UPDATE reminders SET due_at = ? WHERE id = ?', [strlen($v) === 10 ? $v . ' ' . substr($r['due_at'], 11, 5) : $v, $id]);
            json_out(['ok' => true]);
        }
        $val = clean_field('reminder', $field, $in['value'] ?? '');
        q("UPDATE reminders SET $field = ? WHERE id = ?", [$val, $id]);
        json_out(['ok' => true, 'value' => $val]);

    case 'reminder.snooze':
        $r = need('reminders', $id);
        $days = max(1, min(30, (int) ($in['days'] ?? 1)));
        $base = max(strtotime(today()), strtotime(substr($r['due_at'], 0, 10)));
        q('UPDATE reminders SET due_at = ? WHERE id = ?', [date('Y-m-d', strtotime("+$days day", $base)) . ' ' . substr($r['due_at'], 11, 5), $id]);
        json_out(['ok' => true, 'message' => 'Moved to ' . fmt_date(date('Y-m-d', strtotime("+$days day", $base)))]);

    case 'reminder.delete':
        need('reminders', $id);
        q('DELETE FROM reminders WHERE id = ?', [$id]);
        json_out(['ok' => true, 'message' => 'Reminder deleted']);

    /* ---------------- payments ---------------- */
    case 'payment.create':
        $cid = (int) ($in['client_id'] ?? 0); need('clients', $cid);
        $label = $s('label', 140); if ($label === '') bad('Add a description.');
        $amount = (int) ($in['amount'] ?? 0); if ($amount < 1) bad('Enter the amount.');
        $due = $s('due_date', 10); if (!valid_date($due)) bad('Enter a valid due date.');
        $status = ($in['status'] ?? '') === 'paid' ? 'paid' : 'pending';
        $pid = (int) ($in['project_id'] ?? 0) ?: null;
        q('INSERT INTO payments (client_id, project_id, label, amount, status, due_date, paid_date, created_at) VALUES (?,?,?,?,?,?,?,?)',
            [$cid, $pid, $label, $amount, $status, $due, $status === 'paid' ? today() : '', now()]);
        $payId = (int) db()->lastInsertId();
        log_activity($cid, 'payment', ($status === 'paid' ? 'Payment received: ' : 'Payment added: ') . $label . ', ' . inr($amount));
        if ($status === 'paid') mail_auto('payment_received', $cid, 0, $payId);
        json_out(['ok' => true, 'url' => 'client.php?id=' . $cid . '#payments', 'message' => 'Payment saved']);

    case 'payment.update':
        $p = need('payments', $id);
        $field = (string) ($in['field'] ?? '');
        $val = clean_field('payment', $field, $in['value'] ?? '');
        q("UPDATE payments SET $field = ? WHERE id = ?", [$val, $id]);
        if ($field === 'status') {
            q('UPDATE payments SET paid_date = ? WHERE id = ?', [$val === 'paid' ? today() : '', $id]);
            if ($val === 'paid' && $p['status'] !== 'paid') { log_activity((int) $p['client_id'], 'payment', 'Payment received: ' . $p['label'] . ', ' . inr($p['amount'])); mail_auto('payment_received', (int) $p['client_id'], 0, $id); }
        }
        json_out(['ok' => true, 'value' => $val]);

    case 'payment.delete':
        need('payments', $id);
        q('DELETE FROM payments WHERE id = ?', [$id]);
        json_out(['ok' => true, 'message' => 'Payment deleted']);

    /* ---------------- notes and interactions ---------------- */
    case 'note.create':
        $cid = (int) ($in['client_id'] ?? 0); need('clients', $cid);
        $body = $s('body', 4000); if ($body === '') bad('Write a note first.');
        $kind = isset(SK_LOG_KINDS[$in['kind'] ?? '']) ? $in['kind'] : 'note';
        log_activity($cid, $kind, $body);
        q('UPDATE clients SET updated_at = ? WHERE id = ?', [now(), $cid]);
        json_out(['ok' => true, 'message' => SK_LOG_KINDS[$kind] . ' saved']);

    /* ---------------- client emails ---------------- */
    case 'email.send':
        $cid = (int) ($in['client_id'] ?? 0); $c = need('clients', $cid);
        $tpl = (string) ($in['template'] ?? '');
        if (!isset(mail_templates()[$tpl])) bad('Choose an email to send.');
        $to = trim((string) ($in['to'] ?? '')) ?: (string) $c['email'];
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) bad('Add a valid email address for this client first.');
        if (!mail_enabled()) bad('Email sending is not set up yet. Ask your developer to add the mail settings in config.php.');
        $r = mail_to_client($tpl, $cid, (int) ($in['project_id'] ?? 0), (int) ($in['payment_id'] ?? 0), [], $to);
        if (!$r['ok']) bad($r['error']);
        json_out(['ok' => true, 'message' => 'Email sent to ' . $to]);

    case 'note.delete':
        $n = need('activity', $id);
        if (!in_array($n['kind'], array_keys(SK_LOG_KINDS), true)) bad('Automatic history entries cannot be deleted.');
        q('DELETE FROM activity WHERE id = ?', [$id]);
        json_out(['ok' => true, 'message' => 'Note deleted']);
}
json_out(['ok' => false, 'error' => 'Unknown action.'], 400);
