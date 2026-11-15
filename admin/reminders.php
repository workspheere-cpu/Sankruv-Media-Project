<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

$t = today();
$all = q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 0 ORDER BY r.due_at")->fetchAll();
$groups = ['Overdue' => [], 'Today' => [], 'Tomorrow' => [], 'This week' => [], 'Later' => []];
$tom = date('Y-m-d', strtotime('+1 day')); $wk = date('Y-m-d', strtotime('+7 day'));
foreach ($all as $r) {
    $d = substr($r['due_at'], 0, 10);
    $groups[$d < $t ? 'Overdue' : ($d === $t ? 'Today' : ($d === $tom ? 'Tomorrow' : ($d <= $wk ? 'This week' : 'Later')))][] = $r;
}
$done = q("SELECT r.*, c.name AS client FROM reminders r LEFT JOIN clients c ON c.id = r.client_id WHERE r.done = 1 ORDER BY r.done_at DESC LIMIT 20")->fetchAll();

page_start('Reminders', 'reminders');
?>
<section class="page-h">
  <div><h1>Reminders</h1><p class="lead"><?= count($all) ?> open<?= $groups['Overdue'] ? ', <span class="t-bad">' . count($groups['Overdue']) . ' overdue</span>' : '' ?>. Tick a reminder when it is done, or move it to tomorrow with the clock.</p></div>
  <div class="page-act"><button class="btn pri" type="button" data-open="dlg-reminder"><?= ic('plus') ?>New reminder</button></div>
</section>
<?php if (!$all && !$done): ?>
  <div class="empty big"><span class="e-i"><?= ic('bell') ?></span><h2>No reminders yet</h2><p>Add follow-ups, approvals, renewals and payment chasers. Each one appears on your dashboard on the day it is due.</p><button class="btn pri" type="button" data-open="dlg-reminder"><?= ic('plus') ?>Add a reminder</button></div>
<?php else: ?>
<div class="rem-groups">
  <?php foreach ($groups as $g => $list): if (!$list) continue; ?>
  <section class="panel rg g-<?= strtolower(str_replace(' ', '-', $g)) ?>">
    <header class="ph"><h2><?= h($g) ?></h2><b class="cnt"><?= count($list) ?></b></header>
    <ul class="rem-list"><?php foreach ($list as $r): include __DIR__ . '/_rem_row.php'; endforeach; ?></ul>
  </section>
  <?php endforeach; ?>
  <?php if (!$all): ?><div class="empty"><span class="e-i ok"><?= ic('check') ?></span><p><b>All done.</b> No open reminders.</p></div><?php endif; ?>
  <?php if ($done): ?>
  <details class="panel done-box"><summary><?= ic('check') ?>Recently completed (<?= count($done) ?>)</summary><ul class="rem-list"><?php foreach ($done as $r): include __DIR__ . '/_rem_row.php'; endforeach; ?></ul></details>
  <?php endif; ?>
</div>
<?php endif;
page_end();
