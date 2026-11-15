<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
if (!users_exist()) redirect('setup.php');
$me = require_login();
require __DIR__ . '/_layout.php';

$t = today(); $in7 = date('Y-m-d', strtotime('+7 day')); $in30 = date('Y-m-d', strtotime('+30 day'));
$k = [
    'active' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'active'"),
    'leads' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead'"),
    'leads7' => (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead' AND created_at >= ?", [date('Y-m-d', strtotime('-7 day'))]),
    'live' => (int) col("SELECT COUNT(*) FROM projects WHERE status IN ('planned','in_progress','review')"),
    'due7' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date != '' AND due_date <= ?", [$in7]),
    'late' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date != '' AND due_date < ?", [$t]),
    'rem_over' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at < ?', [$t]),
    'rem_today' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at >= ? AND due_at <= ?', [$t, $t . ' 23:59']),
    'pending' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending'"),
    'overdue_pay' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending' AND due_date != '' AND due_date < ?", [$t]),
    'paid_month' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y-m-01')]),
];
$todayList = q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 AND r.due_at <= ? ORDER BY r.due_at LIMIT 12", [$t . ' 23:59'])->fetchAll();
$soonList = q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 AND r.due_at > ? AND r.due_at <= ? ORDER BY r.due_at LIMIT 5", [$t . ' 23:59', $in7 . ' 23:59'])->fetchAll();
$deadlines = q("SELECT p.*, c.name AS client FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.status != 'done' AND p.due_date != '' AND p.due_date <= ? ORDER BY p.due_date LIMIT 8", [$in30])->fetchAll();
$pipe = []; foreach (SK_PROJECT_STATUS as $s => $l) $pipe[$s] = 0;
foreach (q('SELECT status, COUNT(*) n FROM projects GROUP BY status')->fetchAll() as $r) $pipe[$r['status']] = (int) $r['n'];
$pipeTotal = max(1, array_sum($pipe));
$leads = q("SELECT * FROM clients WHERE status = 'lead' ORDER BY created_at DESC LIMIT 5")->fetchAll();
$acts = q('SELECT a.*, c.name AS client, u.name AS who FROM activity a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 8')->fetchAll();
$pays = q("SELECT p.*, c.name AS client FROM payments p JOIN clients c ON c.id = p.client_id WHERE p.status = 'pending' AND p.due_date != '' AND p.due_date <= ? ORDER BY p.due_date LIMIT 5", [$in7])->fetchAll();
$clientsTotal = (int) col('SELECT COUNT(*) FROM clients');

/* this week: reminders and deadlines per day */
$week = [];
for ($i = 0; $i < 7; $i++) {
    $d = date('Y-m-d', strtotime("+$i day"));
    $week[] = ['d' => $d,
        'rem' => (int) col('SELECT COUNT(*) FROM reminders WHERE done = 0 AND substr(due_at, 1, 10) = ?', [$d]),
        'dl' => (int) col("SELECT COUNT(*) FROM projects WHERE status != 'done' AND due_date = ?", [$d])];
}
$week[0]['rem'] += $k['rem_over'];

/* collections: money received in each of the last six months */
$months = [];
for ($i = 5; $i >= 0; $i--) {
    $m = date('Y-m', strtotime(date('Y-m-01') . " -$i month"));
    $months[$m] = (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND substr(paid_date, 1, 7) = ?", [$m]);
}
$mVals = array_values($months); $mMax = max(1, max($mVals));
$mNow = end($mVals); $mPrev = $mVals[4];
$mChange = $mPrev ? (int) round(($mNow - $mPrev) / $mPrev * 100) : null;
$mTotal = array_sum($mVals);
$top = q("SELECT c.id, c.name, COALESCE(SUM(p.amount),0) AS billed, COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount END),0) AS paid
  FROM clients c JOIN payments p ON p.client_id = c.id GROUP BY c.id ORDER BY billed DESC LIMIT 5")->fetchAll();
$topMax = max(1, (int) ($top[0]['billed'] ?? 1));

$hr = (int) date('G');
$greet = $hr < 12 ? 'Good morning' : ($hr < 17 ? 'Good afternoon' : 'Good evening');
$first = explode(' ', trim($me['name']))[0];
$todo = $k['rem_over'] + $k['rem_today'];
$todayDone = (int) col('SELECT COUNT(*) FROM reminders WHERE done = 1 AND substr(due_at, 1, 10) = ?', [$t]);
$todayAll = $todayDone + $todo;
$todayPct = $todayAll ? (int) round($todayDone / $todayAll * 100) : 100;

/* needs attention: each item links straight to the fix */
$overPayN = (int) col("SELECT COUNT(*) FROM payments WHERE status = 'pending' AND due_date != '' AND due_date < ?", [$t]);
$staleLeads = (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead' AND created_at < ?", [date('Y-m-d H:i:s', strtotime('-2 day'))]);
$attention = array_values(array_filter([
    $overPayN ? ['payments.php?f=overdue', 'wallet', 'bad', $overPayN . ' overdue payment' . ($overPayN > 1 ? 's' : ''), inr($k['overdue_pay']) . ' to chase'] : null,
    $k['late'] ? ['projects.php', 'flag', 'bad', $k['late'] . ' project' . ($k['late'] > 1 ? 's' : '') . ' past deadline', 'Update the dates or the status'] : null,
    $k['rem_over'] ? ['reminders.php', 'bell', 'warn', $k['rem_over'] . ' overdue reminder' . ($k['rem_over'] > 1 ? 's' : ''), 'Tick them off or move them'] : null,
    $staleLeads ? ['clients.php?status=lead', 'spark', 'lead', $staleLeads . ' lead' . ($staleLeads > 1 ? 's' : '') . ' waiting over 2 days', 'Call or WhatsApp them today'] : null,
]));

/* getting started checklist, shown until every step is done */
$steps = [
    ['Add your first client', $clientsTotal > 0, 'dlg-client'],
    ['Create a project with a deadline', (int) col("SELECT COUNT(*) FROM projects WHERE due_date != ''") > 0, 'dlg-project'],
    ['Set a reminder', (int) col('SELECT COUNT(*) FROM reminders') > 0, 'dlg-reminder'],
    ['Record a payment', (int) col('SELECT COUNT(*) FROM payments') > 0, 'dlg-payment'],
    ['Give your team their own sign-in', (int) col('SELECT COUNT(*) FROM users') > 1, 'team.php'],
    ['Switch on client emails', mail_enabled(), 'emails.php'],
];
$stepsDone = count(array_filter($steps, fn($x) => $x[1]));

/* lead conversion over the last 90 days */
$since90 = date('Y-m-d', strtotime('-90 day'));
$new90 = (int) col('SELECT COUNT(*) FROM clients WHERE created_at >= ?', [$since90]);
$won90 = (int) col("SELECT COUNT(*) FROM clients WHERE created_at >= ? AND status IN ('active','completed','on_hold')", [$since90]);
$conv = $new90 ? (int) round($won90 / $new90 * 100) : 0;
$web90 = (int) col("SELECT COUNT(*) FROM clients WHERE created_at >= ? AND source = 'Website form'", [$since90]);
$summary = $clientsTotal === 0 ? 'Add your first client to start tracking projects, deadlines and payments.'
    : ($todo ? $todo . ' reminder' . ($todo > 1 ? 's' : '') . ' need' . ($todo > 1 ? '' : 's') . ' attention today' : 'No reminders due today')
      . ($k['due7'] ? ', and ' . $k['due7'] . ' project deadline' . ($k['due7'] > 1 ? 's are' : ' is') . ' coming up this week.' : '.');

page_start('Dashboard', 'dash');
?>
<section class="m-hero" aria-label="Today at a glance">
  <div class="mh-top">
    <div><small><?= h(date('l, j M')) ?></small><h1><?= h($greet) ?>, <?= h($first) ?></h1><p><?= h($summary) ?></p></div>
    <div class="mh-orb" role="img" aria-label="<?= $todayDone ?> of <?= $todayAll ?> reminders done today">
      <div class="mh-ring" style="--p:<?= $todayPct ?>"></div>
      <canvas class="mh-core" aria-hidden="true"></canvas>
      <span class="mh-lab"><b><?= $todayDone ?>/<?= $todayAll ?></b><small>done today</small></span>
    </div>
  </div>
  <div class="mh-stats">
    <a href="payments.php"><small>To collect</small><b><?= inr($k['pending']) ?></b></a>
    <a href="payments.php?f=paid"><small>This month</small><b><?= inr($k['paid_month']) ?></b></a>
    <a href="projects.php"><small>Live projects</small><b><?= $k['live'] ?></b></a>
  </div>
  <nav class="mh-act" aria-label="Quick add">
    <button type="button" data-open="dlg-client"><span><?= ic('user') ?></span>Client</button>
    <button type="button" data-open="dlg-reminder"><span><?= ic('bell') ?></span>Reminder</button>
    <button type="button" data-open="dlg-project"><span><?= ic('layers') ?></span>Project</button>
    <button type="button" data-open="dlg-payment"><span><?= ic('wallet') ?></span>Payment</button>
  </nav>
</section>

<?php if ($attention): ?>
<nav class="attn" aria-label="Needs attention">
  <span class="attn-h"><?= ic('flag') ?>Needs attention</span>
  <?php foreach ($attention as [$href, $icon, $tone, $title, $sub]): ?>
  <a class="attn-i t-<?= $tone ?>" href="<?= $href ?>"><span class="ai-i"><?= ic($icon) ?></span><span><b><?= h($title) ?></b><small><?= h($sub) ?></small></span><?= ic('chev', 'i sm') ?></a>
  <?php endforeach; ?>
</nav>
<?php else: ?>
<p class="attn ok"><span class="attn-h"><?= ic('check') ?>All clear</span><span class="muted">No overdue payments, late projects or waiting leads.</span></p>
<?php endif; ?>

<?php if ($stepsDone < count($steps)): ?>
<section class="setup-card" id="setup-card" aria-label="Getting started">
  <div class="sc-h"><div><h2>Set up your Client Hub</h2><p><?= $stepsDone ?> of <?= count($steps) ?> done. Finish these to get the most out of it.</p></div>
    <span class="sc-ring" style="--p:<?= (int) round($stepsDone / count($steps) * 100) ?>"><b><?= (int) round($stepsDone / count($steps) * 100) ?>%</b></span>
    <button class="icon-btn" type="button" data-hide="setup-card" aria-label="Hide for now"><?= ic('x') ?></button></div>
  <ol class="sc-steps">
    <?php foreach ($steps as [$label, $done, $go]): ?>
    <li class="<?= $done ? 'done' : '' ?>"><?php if ($done): ?><span class="sc-c"><?= ic('check', 'i sm') ?></span><?= h($label) ?><?php elseif (str_ends_with($go, '.php')): ?><a href="<?= h($go) ?>"><span class="sc-c"></span><?= h($label) ?></a><?php else: ?><button type="button" data-open="<?= h($go) ?>"><span class="sc-c"></span><?= h($label) ?></button><?php endif; ?></li>
    <?php endforeach; ?>
  </ol>
</section>
<?php endif; ?>

<section class="kpis" aria-label="Summary">
  <a class="kpi" href="clients.php?status=active"><span class="k-i"><?= ic('users') ?></span><b data-count="<?= $k['active'] ?>"><?= $k['active'] ?></b><span>Active clients</span></a>
  <a class="kpi" href="clients.php?status=lead"><span class="k-i lead"><?= ic('spark') ?></span><b data-count="<?= $k['leads'] ?>"><?= $k['leads'] ?></b><span>Open leads<?php if ($k['leads7']): ?> <em class="up">+<?= $k['leads7'] ?> this week</em><?php endif; ?></span></a>
  <a class="kpi" href="projects.php"><span class="k-i"><?= ic('layers') ?></span><b data-count="<?= $k['live'] ?>"><?= $k['live'] ?></b><span>Projects running</span></a>
  <a class="kpi<?= $k['late'] ? ' alert' : '' ?>" href="projects.php"><span class="k-i warn"><?= ic('flag') ?></span><b data-count="<?= $k['due7'] ?>"><?= $k['due7'] ?></b><span>Due in 7 days<?php if ($k['late']): ?> <em class="down"><?= $k['late'] ?> late</em><?php endif; ?></span></a>
  <a class="kpi<?= $k['rem_over'] ? ' alert' : '' ?>" href="reminders.php"><span class="k-i bad"><?= ic('bell') ?></span><b data-count="<?= $todo ?>"><?= $todo ?></b><span>Reminders today<?php if ($k['rem_over']): ?> <em class="down"><?= $k['rem_over'] ?> overdue</em><?php endif; ?></span></a>
  <a class="kpi" href="payments.php"><span class="k-i ok"><?= ic('wallet') ?></span><b><?= inr($k['pending']) ?></b><span>To collect<?php if ($k['overdue_pay']): ?> <em class="down"><?= inr($k['overdue_pay']) ?> overdue</em><?php endif; ?></span></a>
</section>

<nav class="week" aria-label="This week">
  <?php foreach ($week as $i => $w): $n = $w['rem'] + $w['dl']; ?>
  <a class="wd<?= $i === 0 ? ' now' : '' ?><?= $n ? ' busy' : '' ?>" href="reminders.php" title="<?= h(fmt_date($w['d'])) ?>: <?= $w['rem'] ?> reminders, <?= $w['dl'] ?> deadlines">
    <small><?= $i === 0 ? 'Today' : h(date('D', strtotime($w['d']))) ?></small><b><?= h(date('j', strtotime($w['d']))) ?></b>
    <span class="wd-t"><?= $n ? ($w['rem'] ? $w['rem'] . ' task' . ($w['rem'] > 1 ? 's' : '') : '') . ($w['rem'] && $w['dl'] ? ', ' : '') . ($w['dl'] ? $w['dl'] . ' due' : '') : 'Free' ?></span>
    <span class="wd-dots"><?php for ($j = 0; $j < min(3, $w['rem']); $j++): ?><i class="r"></i><?php endfor; ?><?php for ($j = 0; $j < min(2, $w['dl']); $j++): ?><i class="d"></i><?php endfor; ?></span>
  </a>
  <?php endforeach; ?>
</nav>

<div class="dash">
  <nav class="dtabs" aria-label="Insights">
    <button type="button" class="on" data-dt="money6">Collections</button>
    <button type="button" data-dt="pipe">Pipeline</button>
    <button type="button" data-dt="topc">Top clients</button>
  </nav>
  <section class="panel money6 dt dt-on">
    <header class="ph"><h2><?= ic('trend') ?>Collections</h2><a class="more" href="payments.php?f=paid">Payments<?= ic('chev') ?></a></header>
    <div class="m-sum"><div><small>Received in <?= h(date('F')) ?></small><b><?= inr($mNow) ?></b><?php if ($mChange !== null): ?><em class="<?= $mChange >= 0 ? 'up' : 'down' ?>"><?= $mChange >= 0 ? '+' : '' ?><?= $mChange ?>% vs last month</em><?php endif; ?></div><div><small>Last 6 months</small><b><?= inr($mTotal) ?></b></div><div><small>Still to collect</small><b class="t-warn"><?= inr($k['pending']) ?></b></div></div>
    <div class="bars<?= $mTotal ? '' : ' none' ?>" role="img" aria-label="Money received per month for the last six months"><?php if (!$mTotal): ?><p class="bars-empty">No payments received yet. Mark a payment as paid to see it here.</p><?php endif; ?>
      <?php foreach ($months as $m => $v): ?>
      <div class="bc<?= $m === date('Y-m') ? ' cur' : '' ?>"><span class="bv"><?= $v ? h(inr($v)) : '' ?></span><i style="--h:<?= max(3, (int) round($v / $mMax * 100)) ?>%"></i><small><?= h(date('M', strtotime($m . '-01'))) ?></small></div>
      <?php endforeach; ?>
    </div>
  </section>

  <section class="panel topc dt">
    <header class="ph"><h2><?= ic('star') ?>Top clients</h2><a class="more" href="clients.php?sort=value">All clients<?= ic('chev') ?></a></header>
    <?php if (!$top): ?>
      <div class="empty"><span class="e-i"><?= ic('wallet') ?></span><p>Your highest billing clients appear here once you add payments.</p></div>
    <?php else: ?>
      <ol class="top-list">
        <?php foreach ($top as $c): ?>
        <li><a href="client.php?id=<?= (int) $c['id'] ?>#payments"><?= avatar($c, 'sm') ?><span class="tl-n"><b><?= h($c['name']) ?></b><span class="bar"><i style="width:<?= (int) round($c['billed'] / $topMax * 100) ?>%"></i></span></span><span class="tl-v"><b><?= inr($c['billed']) ?></b><small><?= $c['billed'] ? (int) round($c['paid'] / $c['billed'] * 100) : 0 ?>% paid</small></span></a></li>
        <?php endforeach; ?>
      </ol>
    <?php endif; ?>
  </section>

  <section class="panel today">
    <header class="ph"><h2><?= ic('bell') ?>Today</h2><a class="more" href="reminders.php">All reminders<?= ic('chev') ?></a></header>
    <?php if (!$todayList): ?>
      <div class="empty"><span class="e-i ok"><?= ic('check') ?></span><p><b>You are all caught up.</b> Nothing is due today.</p><button class="btn ghost sm" type="button" data-open="dlg-reminder"><?= ic('plus') ?>Add a reminder</button></div>
    <?php else: ?>
      <ul class="rem-list">
        <?php foreach ($todayList as $r): include __DIR__ . '/_rem_row.php'; endforeach; ?>
      </ul>
    <?php endif; ?>
    <?php if ($soonList): ?>
      <h3 class="sub-h">Coming up this week</h3>
      <ul class="rem-list soft"><?php foreach ($soonList as $r): include __DIR__ . '/_rem_row.php'; endforeach; ?></ul>
    <?php endif; ?>
  </section>

  <section class="panel deadlines">
    <header class="ph"><h2><?= ic('flag') ?>Deadlines</h2><a class="more" href="projects.php">All projects<?= ic('chev') ?></a></header>
    <?php if (!$deadlines): ?>
      <div class="empty"><span class="e-i"><?= ic('cal') ?></span><p><b>No deadlines in the next 30 days.</b> Projects with a deadline appear here.</p><button class="btn ghost sm" type="button" data-open="dlg-project"><?= ic('plus') ?>New project</button></div>
    <?php else: ?>
      <ul class="dl-list">
        <?php foreach ($deadlines as $p): $tone = due_tone($p['due_date']); ?>
        <li><a href="client.php?id=<?= (int) $p['client_id'] ?>#projects">
          <span class="dl-date t-<?= $tone ?>"><b><?= h(date('j', strtotime($p['due_date']))) ?></b><small><?= h(date('M', strtotime($p['due_date']))) ?></small></span>
          <span class="dl-main"><b><?= h($p['title']) ?></b><small><?= h($p['client']) ?><?= $p['service'] ? ', ' . h($p['service']) : '' ?></small>
            <span class="bar"><i style="width:<?= (int) $p['progress'] ?>%"></i></span></span>
          <span class="dl-side"><?= chip(rel_day($p['due_date']), $tone) ?><small><?= (int) $p['progress'] ?>% done</small></span>
        </a></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </section>

  <section class="panel pipe dt">
    <header class="ph"><h2><?= ic('layers') ?>Project pipeline</h2></header>
    <div class="stack" aria-hidden="true"><?php foreach ($pipe as $s => $n): if ($n): ?><i class="s-<?= $s ?>" style="flex:<?= $n ?>"></i><?php endif; endforeach; ?></div>
    <ul class="pipe-list">
      <?php foreach ($pipe as $s => $n): ?><li><span class="dot s-<?= $s ?>"></span><span><?= h(SK_PROJECT_STATUS[$s]) ?></span><b><?= $n ?></b><small><?= round($n / $pipeTotal * 100) ?>%</small></li><?php endforeach; ?>
    </ul>
    <div class="money">
      <div><small>Received this month</small><b><?= inr($k['paid_month']) ?></b></div>
      <div><small>Still to collect</small><b><?= inr($k['pending']) ?></b></div>
    </div>
  </section>

  <section class="panel leads">
    <header class="ph"><h2><?= ic('spark') ?>New leads</h2><a class="more" href="clients.php?status=lead">All leads<?= ic('chev') ?></a></header>
    <div class="conv" title="Last 90 days"><div><b><?= $new90 ?></b><small>New, 90 days</small></div><div><b><?= $conv ?>%</b><small>Became clients</small></div><div><b><?= $web90 ?></b><small>From website</small></div></div>
    <?php if (!$leads): ?>
      <div class="empty"><span class="e-i"><?= ic('spark') ?></span><p><b>No open leads.</b> Enquiries from the website contact form arrive here automatically.</p></div>
    <?php else: ?>
      <ul class="people">
        <?php foreach ($leads as $c): ?>
        <li><a href="client.php?id=<?= (int) $c['id'] ?>"><?= avatar($c, 'sm') ?><span><b><?= h($c['name']) ?></b><small><?= h($c['source'] ?: 'Lead') ?>, <?= h(ago($c['created_at'])) ?></small></span><?= ic('chev') ?></a></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
    <?php if ($pays): ?>
      <h3 class="sub-h">Payments due</h3>
      <ul class="people">
        <?php foreach ($pays as $p): ?>
        <li><a href="client.php?id=<?= (int) $p['client_id'] ?>#payments"><span class="av sm pay"><?= ic('wallet', 'i sm') ?></span><span><b><?= inr($p['amount']) ?> from <?= h($p['client']) ?></b><small><?= h($p['label']) ?></small></span><?= chip(rel_day($p['due_date']), due_tone($p['due_date'])) ?></a></li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </section>

  <section class="panel feed">
    <header class="ph"><h2><?= ic('clock') ?>Recent activity</h2></header>
    <?php if (!$acts): ?>
      <div class="empty"><span class="e-i"><?= ic('clock') ?></span><p>Changes, notes and website enquiries will appear here.</p></div>
    <?php else: ?>
      <ol class="feed-list">
        <?php foreach ($acts as $a): ?>
        <li><span class="f-dot k-<?= h($a['kind']) ?>"></span><div><p><?php if ($a['client']): ?><a href="client.php?id=<?= (int) $a['client_id'] ?>#activity"><?= h($a['client']) ?></a> <?php endif; ?><?= h(mb_strimwidth(strtok($a['body'], "\n"), 0, 110, '…')) ?></p><small><?= h(ago($a['created_at'])) ?><?= $a['who'] ? ' by ' . h($a['who']) : '' ?></small></div></li>
        <?php endforeach; ?>
      </ol>
    <?php endif; ?>
  </section>
</div>
<?php page_end();
