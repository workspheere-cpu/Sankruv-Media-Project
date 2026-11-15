<?php
/* Read-only JSON for the React Client Hub (app.php). Changes still go through api.php.
   GET data.php?view=dashboard|clients|client&id=N|projects|reminders|payments|emails|opts */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_out(['ok' => false, 'error' => 'Use GET.'], 405);
header('Cache-Control: no-store');

$t = today();
$person = fn(string $name) => ['hue' => hue($name), 'init' => initials($name)];
$dRem = function (array $r) use ($person): array {
    $d = substr((string) $r['due_at'], 0, 10); $tm = substr((string) $r['due_at'], 11, 5);
    return ['id' => (int) $r['id'], 'title' => $r['title'], 'client_id' => (int) $r['client_id'], 'client' => (string) ($r['client'] ?? ''), 'done' => (int) $r['done'], 'priority' => $r['priority'],
        'date' => $d, 'rel' => rel_day($d), 'tone' => due_tone($d, (bool) $r['done']), 'time' => $tm && $tm !== '00:00' ? date('g:i a', strtotime($tm)) : ''];
};
$dProj = function (array $p) use ($person): array {
    return ['id' => (int) $p['id'], 'client_id' => (int) $p['client_id'], 'client' => (string) ($p['client'] ?? ''), 'title' => $p['title'], 'service' => $p['service'], 'status' => $p['status'],
        'start_date' => $p['start_date'], 'due_date' => $p['due_date'], 'progress' => (int) $p['progress'], 'value' => (int) $p['value'], 'details' => $p['details'],
        'rel' => $p['due_date'] ? rel_day($p['due_date']) : '', 'tone' => due_tone($p['due_date'], $p['status'] === 'done'), 'due_text' => fmt_date($p['due_date']), 'updated' => strtolower(ago($p['updated_at']))] + $person((string) ($p['client'] ?? ''));
};
$dPay = function (array $p) use ($t, $person): array {
    return ['id' => (int) $p['id'], 'client_id' => (int) $p['client_id'], 'client' => (string) ($p['client'] ?? ''), 'label' => $p['label'], 'amount' => (int) $p['amount'], 'status' => $p['status'],
        'due_date' => $p['due_date'], 'paid_date' => $p['paid_date'], 'paid_text' => fmt_date($p['paid_date']), 'due_text' => fmt_date($p['due_date']), 'rel' => $p['due_date'] ? rel_day($p['due_date']) : 'No date',
        'tone' => due_tone($p['due_date'], $p['status'] === 'paid'), 'late' => $p['status'] === 'pending' && $p['due_date'] !== '' && $p['due_date'] < $t] + $person((string) ($p['client'] ?? ''));
};
$dAct = fn(array $a) => ['id' => (int) $a['id'], 'client_id' => (int) $a['client_id'], 'client' => (string) ($a['client'] ?? ''), 'kind' => $a['kind'], 'body' => $a['body'], 'who' => (string) ($a['who'] ?? ''), 'ago' => ago($a['created_at']), 'when' => fmt_date($a['created_at'], true)];
$dClient = function (array $c) use ($person): array {
    $out = $c; foreach (['id', 'starred', 'budget'] as $k) $out[$k] = (int) $c[$k];
    foreach (['nd', 'open_p', 'open_r', 'billed', 'due'] as $k) if (array_key_exists($k, $c)) $out[$k] = $k === 'nd' ? (string) $c[$k] : (int) $c[$k];
    return $out + $person((string) $c['name']) + ['wa_url' => wa_link($c['whatsapp'] ?: $c['phone']), 'web_url' => web_link($c['website']), 'ig_url' => ig_link($c['instagram']),
        'since' => fmt_date($c['created_at']), 'updated' => strtolower(ago($c['updated_at'])), 'nd_rel' => !empty($c['nd']) ? rel_day($c['nd']) : '', 'nd_tone' => due_tone($c['nd'] ?? null), 'services_list' => array_values(array_filter(explode(',', (string) $c['services'])))];
};

switch ((string) ($_GET['view'] ?? '')) {
    case 'opts':
        json_out(['ok' => true, 'clients' => q("SELECT id, name FROM clients WHERE status != 'archived' ORDER BY name COLLATE NOCASE")->fetchAll(),
            'badges' => ['leads' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead'"), 'due' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at <= ?', [$t . ' 23:59'])]]);

    case 'dashboard':
        $in7 = date('Y-m-d', strtotime('+7 day')); $in30 = date('Y-m-d', strtotime('+30 day'));
        $k = [
            'active' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'active'"), 'leads' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead'"),
            'leads7' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead' AND created_at >= ?", [date('Y-m-d', strtotime('-7 day'))]),
            'live' => (int) col("SELECT COUNT(*) FROM projects WHERE status IN ('planned','in_progress','review')"),
            'due7' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date != '' AND due_date <= ?", [$in7]),
            'late' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date != '' AND due_date < ?", [$t]),
            'rem_over' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at < ?', [$t]),
            'rem_today' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at >= ? AND due_at <= ?', [$t, $t . ' 23:59']),
            'pending' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending'"),
            'overdue_pay' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending' AND due_date != '' AND due_date < ?", [$t]),
            'overdue_pay_n' => (int) col("SELECT COUNT(*) FROM payments WHERE status = 'pending' AND due_date != '' AND due_date < ?", [$t]),
            'paid_month' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y-m-01')]),
            'stale_leads' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead' AND created_at < ?", [date('Y-m-d H:i:s', strtotime('-2 day'))]),
            'today_done' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 1 AND substr(due_at, 1, 10) = ?', [$t]),
            'clients' => (int) col('SELECT COUNT(*) FROM clients'),
        ];
        $week = [];
        for ($i = 0; $i < 7; $i++) {
            $d = date('Y-m-d', strtotime("+$i day"));
            $week[] = ['day' => $i === 0 ? 'Today' : date('D', strtotime($d)), 'num' => date('j', strtotime($d)),
                'rem' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND substr(due_at, 1, 10) = ?', [$d]) + ($i === 0 ? $k['rem_over'] : 0),
                'dl' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date = ?", [$d])];
        }
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = date('Y-m', strtotime(date('Y-m-01') . " -$i month"));
            $months[] = ['label' => date('M', strtotime($m . '-01')), 'cur' => $i === 0, 'value' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND substr(paid_date, 1, 7) = ?", [$m])];
        }
        $pipe = []; foreach (SK_PROJECT_STATUS as $s => $l) $pipe[$s] = 0;
        foreach (q('SELECT status, COUNT(*) n FROM projects GROUP BY status')->fetchAll() as $r) $pipe[$r['status']] = (int) $r['n'];
        $since90 = date('Y-m-d', strtotime('-90 day'));
        $h = (int) date('G');
        json_out(['ok' => true, 'k' => $k, 'week' => $week, 'months' => $months, 'pipe' => $pipe, 'month_name' => date('F'), 'date_text' => date('l, j M'),
            'greet' => $h < 12 ? 'Good morning' : ($h < 17 ? 'Good afternoon' : 'Good evening'),
            'today' => array_map($dRem, q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 AND r.due_at <= ? ORDER BY r.due_at LIMIT 12", [$t . ' 23:59'])->fetchAll()),
            'soon' => array_map($dRem, q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 AND r.due_at > ? AND r.due_at <= ? ORDER BY r.due_at LIMIT 5", [$t . ' 23:59', $in7 . ' 23:59'])->fetchAll()),
            'deadlines' => array_map($dProj, q("SELECT p.*, c.name AS client FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.status != 'done' AND p.due_date != '' AND p.due_date <= ? ORDER BY p.due_date LIMIT 8", [$in30])->fetchAll()),
            'leads' => array_map($dClient, q("SELECT * FROM clients WHERE status = 'lead' ORDER BY created_at DESC LIMIT 5")->fetchAll()),
            'acts' => array_map($dAct, q('SELECT a.*, c.name AS client, u.name AS who FROM activity a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 7')->fetchAll()),
            'pays' => array_map($dPay, q("SELECT p.*, c.name AS client FROM payments p JOIN clients c ON c.id = p.client_id WHERE p.status = 'pending' AND p.due_date != '' AND p.due_date <= ? ORDER BY p.due_date LIMIT 5", [$in7])->fetchAll()),
            'top' => array_map(fn($c) => ['id' => (int) $c['id'], 'name' => $c['name'], 'billed' => (int) $c['billed'], 'paid' => (int) $c['paid']] + $person($c['name']),
                q("SELECT c.id, c.name, COALESCE(SUM(p.amount),0) AS billed, COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount END),0) AS paid FROM clients c JOIN payments p ON p.client_id = c.id GROUP BY c.id ORDER BY billed DESC LIMIT 5")->fetchAll()),
            'conv' => ['new' => (int) col('SELECT COUNT(*) FROM clients WHERE created_at >= ?', [$since90]), 'won' => (int) col("SELECT COUNT(*) FROM clients WHERE created_at >= ? AND status IN ('active','completed','on_hold')", [$since90]),
                'web' => (int) col("SELECT COUNT(*) FROM clients WHERE created_at >= ? AND source = 'Website form'", [$since90])],
            'setup' => ['project' => (int) col("SELECT COUNT(*) FROM projects WHERE due_date != ''") > 0, 'reminder' => (int) col('SELECT COUNT(*) FROM reminders') > 0, 'payment' => (int) col('SELECT COUNT(*) FROM payments') > 0,
                'team' => (int) col('SELECT COUNT(*) FROM users') > 1, 'mail' => mail_enabled()]]);

    case 'clients':
        json_out(['ok' => true, 'rows' => array_map($dClient, q("SELECT c.*,
            (SELECT MIN(due_date) FROM projects p WHERE p.client_id = c.id AND p.status != 'done' AND p.due_date != '') AS nd,
            (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.status != 'done') AS open_p,
            (SELECT COUNT(*) FROM reminders r WHERE r.client_id = c.id AND r.done = 0) AS open_r,
            (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id) AS billed,
            (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id AND y.status = 'pending') AS due
            FROM clients c ORDER BY c.starred DESC, c.updated_at DESC")->fetchAll())]);

    case 'client':
        $id = (int) ($_GET['id'] ?? 0);
        $c = one('SELECT * FROM clients WHERE id = ?', [$id]);
        if (!$c) json_out(['ok' => false, 'error' => 'That client could not be found.'], 404);
        json_out(['ok' => true, 'c' => $dClient($c),
            'projects' => array_map($dProj, q("SELECT * FROM projects WHERE client_id = ? ORDER BY status = 'done', CASE WHEN due_date = '' THEN 1 ELSE 0 END, due_date, id DESC", [$id])->fetchAll()),
            'rems' => array_map($dRem, q('SELECT * FROM reminders WHERE client_id = ? ORDER BY done, due_at', [$id])->fetchAll()),
            'pays' => array_map($dPay, q("SELECT * FROM payments WHERE client_id = ? ORDER BY status = 'paid', due_date", [$id])->fetchAll()),
            'acts' => array_map($dAct, q('SELECT a.*, u.name AS who FROM activity a LEFT JOIN users u ON u.id = a.user_id WHERE a.client_id = ? ORDER BY a.id DESC LIMIT 200', [$id])->fetchAll())]);

    case 'projects':
        json_out(['ok' => true, 'rows' => array_map($dProj, q("SELECT p.*, c.name AS client FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.status != 'done' OR p.updated_at >= ?
            ORDER BY CASE WHEN p.due_date = '' THEN 1 ELSE 0 END, p.due_date, p.id DESC", [date('Y-m-d', strtotime('-45 day'))])->fetchAll())]);

    case 'reminders':
        $tom = date('Y-m-d', strtotime('+1 day')); $wk = date('Y-m-d', strtotime('+7 day'));
        $open = array_map(function ($r) use ($dRem, $t, $tom, $wk) {
            $x = $dRem($r); $d = $x['date'];
            return $x + ['group' => $d < $t ? 'Overdue' : ($d === $t ? 'Today' : ($d === $tom ? 'Tomorrow' : ($d <= $wk ? 'This week' : 'Later')))];
        }, q('SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 ORDER BY r.due_at')->fetchAll());
        json_out(['ok' => true, 'open' => $open, 'done' => array_map($dRem, q('SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 1 ORDER BY r.done_at DESC LIMIT 20')->fetchAll())]);

    case 'payments':
        json_out(['ok' => true, 'month_name' => date('F'), 'year' => date('Y'),
            'rows' => array_map($dPay, q("SELECT p.*, c.name AS client FROM payments p JOIN clients c ON c.id = p.client_id ORDER BY p.status = 'paid', CASE WHEN p.due_date = '' THEN 1 ELSE 0 END, p.due_date LIMIT 800")->fetchAll()),
            'tot' => ['month' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y-m-01')]),
                'year' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y') . '-01-01'])]]);

    case 'emails':
        $c = mail_cfg(); $auto = ['enquiry-received' => 'enquiry_received', 'payment-received' => 'payment_received', 'project-delivered' => 'project_delivered', 'project-confirmed' => 'project_confirmed', 'welcome' => 'welcome'];
        $vars = mail_brand_vars() + mail_sample_vars();
        json_out(['ok' => true, 'enabled' => mail_enabled(), 'from' => $c['from_name'] . ' <' . $c['from_email'] . '>', 'reply_to' => $c['reply_to'],
            'templates' => array_values(array_map(fn($x) => ['slug' => $x['slug'], 'title' => $x['title'], 'about' => $x['about'], 'subject' => mail_fill($x['subject'], $vars, false),
                'auto' => isset($auto[$x['slug']]) && !empty($c['auto'][$auto[$x['slug']]])], mail_templates()))]);
}
json_out(['ok' => false, 'error' => 'Unknown view.'], 400);
