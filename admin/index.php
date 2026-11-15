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

$hr = (int) date('G');
$greet = $hr < 12 ? 'Good morning' : ($hr < 17 ? 'Good afternoon' : 'Good evening');
$first = explode(' ', trim($me['name']))[0];
$todo = $k['rem_over'] + $k['rem_today'];
$summary = $clientsTotal === 0 ? 'Add your first client to start tracking projects, deadlines and payments.'
    : ($todo ? $todo . ' reminder' . ($todo > 1 ? 's' : '') . ' need' . ($todo > 1 ? '' : 's') . ' attention today' : 'No reminders due today')
      . ($k['due7'] ? ', and ' . $k['due7'] . ' project deadline' . ($k['due7'] > 1 ? 's are' : ' is') . ' coming up this week.' : '.');

page_start('Dashboard', 'dash');
?>
<section class="hello">
  <div>
    <p class="eyebrow"><?= h(date('l, j F Y')) ?></p>
    <h1><?= h($greet) ?>, <?= h($first) ?></h1>
    <p class="lead"><?= h($summary) ?></p>
  </div>
  <div class="hello-act">
    <button class="btn ghost" type="button" data-open="dlg-reminder"><?= ic('bell') ?>Add reminder</button>
    <button class="btn pri" type="button" data-open="dlg-project"><?= ic('layers') ?>New project</button>
  </div>
</section>

<section class="kpis" aria-label="Summary">
  <a class="kpi" href="clients.php?status=active"><span class="k-i"><?= ic('users') ?></span><b data-count="<?= $k['active'] ?>"><?= $k['active'] ?></b><span>Active clients</span></a>
  <a class="kpi" href="clients.php?status=lead"><span class="k-i lead"><?= ic('spark') ?></span><b data-count="<?= $k['leads'] ?>"><?= $k['leads'] ?></b><span>Open leads<?php if ($k['leads7']): ?> <em class="up">+<?= $k['leads7'] ?> this week</em><?php endif; ?></span></a>
  <a class="kpi" href="projects.php"><span class="k-i"><?= ic('layers') ?></span><b data-count="<?= $k['live'] ?>"><?= $k['live'] ?></b><span>Projects running</span></a>
  <a class="kpi<?= $k['late'] ? ' alert' : '' ?>" href="projects.php"><span class="k-i warn"><?= ic('flag') ?></span><b data-count="<?= $k['due7'] ?>"><?= $k['due7'] ?></b><span>Due in 7 days<?php if ($k['late']): ?> <em class="down"><?= $k['late'] ?> late</em><?php endif; ?></span></a>
  <a class="kpi<?= $k['rem_over'] ? ' alert' : '' ?>" href="reminders.php"><span class="k-i bad"><?= ic('bell') ?></span><b data-count="<?= $todo ?>"><?= $todo ?></b><span>Reminders today<?php if ($k['rem_over']): ?> <em class="down"><?= $k['rem_over'] ?> overdue</em><?php endif; ?></span></a>
  <a class="kpi" href="payments.php"><span class="k-i ok"><?= ic('wallet') ?></span><b><?= inr($k['pending']) ?></b><span>To collect<?php if ($k['overdue_pay']): ?> <em class="down"><?= inr($k['overdue_pay']) ?> overdue</em><?php endif; ?></span></a>
</section>

<div class="dash">
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

  <section class="panel pipe">
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
