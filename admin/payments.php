<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

$f = (string) ($_GET['f'] ?? 'open');
$t = today();
$where = ['open' => "p.status = 'pending'", 'overdue' => "p.status = 'pending' AND p.due_date != '' AND p.due_date < :t", 'paid' => "p.status = 'paid'", 'all' => '1=1'][$f] ?? "p.status = 'pending'";
$rows = q("SELECT p.*, c.name AS client FROM payments p JOIN clients c ON c.id = p.client_id WHERE $where ORDER BY " . ($f === 'paid' ? 'p.paid_date DESC' : "CASE WHEN p.due_date = '' THEN 1 ELSE 0 END, p.due_date") . ' LIMIT 500',
    $f === 'overdue' ? [':t' => $t] : [])->fetchAll();
$tot = [
    'pending' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending'"),
    'overdue' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'pending' AND due_date != '' AND due_date < ?", [$t]),
    'month' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y-m-01')]),
    'year' => (int) col("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'paid' AND paid_date >= ?", [date('Y') . '-01-01']),
];
page_start('Payments', 'payments');
?>
<section class="page-h">
  <div><h1>Payments</h1><p class="lead">Invoices, advances and retainers across every client. Mark a payment as paid when the money arrives.</p></div>
  <div class="page-act"><button class="btn pri" type="button" data-open="dlg-payment"><?= ic('plus') ?>New payment</button></div>
</section>
<section class="kpis four">
  <a class="kpi" href="?f=open"><span class="k-i warn"><?= ic('wallet') ?></span><b><?= inr($tot['pending']) ?></b><span>To collect</span></a>
  <a class="kpi<?= $tot['overdue'] ? ' alert' : '' ?>" href="?f=overdue"><span class="k-i bad"><?= ic('flag') ?></span><b><?= inr($tot['overdue']) ?></b><span>Overdue</span></a>
  <a class="kpi" href="?f=paid"><span class="k-i ok"><?= ic('check') ?></span><b><?= inr($tot['month']) ?></b><span>Received in <?= h(date('F')) ?></span></a>
  <a class="kpi" href="?f=paid"><span class="k-i"><?= ic('trend') ?></span><b><?= inr($tot['year']) ?></b><span>Received in <?= h(date('Y')) ?></span></a>
</section>
<div class="toolbar"><nav class="seg" aria-label="Filter payments">
  <?php foreach (['open' => 'To collect', 'overdue' => 'Overdue', 'paid' => 'Received', 'all' => 'All'] as $k => $v): ?><a href="?f=<?= $k ?>" class="<?= $f === $k ? 'on' : '' ?>"><?= h($v) ?></a><?php endforeach; ?>
</nav></div>
<?php if (!$rows): ?>
  <div class="empty"><span class="e-i"><?= ic('wallet') ?></span><p><b>Nothing here.</b> <?= $f === 'open' ? 'No payments are waiting to be collected.' : 'No payments match this filter.' ?></p></div>
<?php else: ?>
<div class="panel table-w"><table class="tbl">
  <thead><tr><th>Client</th><th>Description</th><th class="num">Amount</th><th>Due</th><th>Status</th></tr></thead>
  <tbody>
  <?php foreach ($rows as $p): $late = $p['status'] === 'pending' && $p['due_date'] !== '' && $p['due_date'] < $t; ?>
    <tr class="<?= $p['status'] === 'paid' ? 'paid' : '' ?>">
      <td><a class="tlink" href="client.php?id=<?= (int) $p['client_id'] ?>#payments"><?= avatar(['name' => $p['client']], 'xs') ?><?= h($p['client']) ?></a></td>
      <td><?= h($p['label']) ?><?php if ($p['paid_date']): ?><small>Received <?= h(fmt_date($p['paid_date'])) ?></small><?php endif; ?></td>
      <td class="num"><b><?= inr($p['amount']) ?></b></td>
      <td><span class="t-<?= $p['status'] === 'paid' ? 'mute' : due_tone($p['due_date']) ?>"><?= h($p['due_date'] ? ($p['status'] === 'paid' ? fmt_date($p['due_date']) : rel_day($p['due_date'])) : 'No date') ?></span></td>
      <td><label class="chip-sel t-<?= $p['status'] === 'paid' ? 'ok' : ($late ? 'bad' : 'warn') ?>"><span class="sr">Status</span><select data-save="payment" data-id="<?= (int) $p['id'] ?>" data-field="status" data-reload><?php foreach (SK_PAY_STATUS as $k => $v): ?><option value="<?= $k ?>"<?= $k === $p['status'] ? ' selected' : '' ?>><?= h($v) ?></option><?php endforeach; ?></select><?= ic('down', 'i sm') ?></label></td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table></div>
<?php endif;
page_end();
