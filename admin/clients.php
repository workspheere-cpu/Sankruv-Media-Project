<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

$status = (string) ($_GET['status'] ?? 'all');
if ($status !== 'all' && !isset(SK_CLIENT_STATUS[$status])) $status = 'all';
$sort = (string) ($_GET['sort'] ?? 'recent');
$order = ['recent' => 'c.updated_at DESC', 'name' => 'c.name COLLATE NOCASE', 'deadline' => "CASE WHEN nd IS NULL THEN 1 ELSE 0 END, nd", 'value' => 'billed DESC'][$sort] ?? 'c.updated_at DESC';
$counts = ['all' => 0]; foreach (SK_CLIENT_STATUS as $k => $v) $counts[$k] = 0;
foreach (q('SELECT status, COUNT(*) n FROM clients GROUP BY status')->fetchAll() as $r) { $counts[$r['status']] = (int) $r['n']; if ($r['status'] !== 'archived') $counts['all'] += (int) $r['n']; }
$where = $status === 'all' ? "c.status != 'archived'" : 'c.status = :s';
$rows = q("SELECT c.*,
    (SELECT MIN(due_date) FROM projects p WHERE p.client_id = c.id AND p.status != 'done' AND p.due_date != '') AS nd,
    (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.status != 'done') AS open_p,
    (SELECT COUNT(*) FROM reminders r WHERE r.client_id = c.id AND r.done = 0) AS open_r,
    (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id) AS billed,
    (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id AND y.status = 'pending') AS due
  FROM clients c WHERE $where ORDER BY c.starred DESC, $order", $status === 'all' ? [] : [':s' => $status])->fetchAll();

page_start('Clients', 'clients');
?>
<section class="page-h">
  <div><h1>Clients</h1><p class="lead"><?= $counts['all'] ?> client<?= $counts['all'] === 1 ? '' : 's' ?><?= $counts['lead'] ? ', ' . $counts['lead'] . ' open lead' . ($counts['lead'] > 1 ? 's' : '') : '' ?>. Open any profile to see projects, reminders, payments and history.</p></div>
  <div class="page-act">
    <?php if (is_owner()): ?><a class="btn ghost" href="export.php"><?= ic('download') ?>Export CSV</a><?php endif; ?>
    <button class="btn pri" type="button" data-open="dlg-client"><?= ic('plus') ?>Add client</button>
  </div>
</section>

<div class="toolbar">
  <nav class="seg" aria-label="Filter by status">
    <a href="?status=all&amp;sort=<?= h($sort) ?>" class="<?= $status === 'all' ? 'on' : '' ?>">All <b><?= $counts['all'] ?></b></a>
    <?php foreach (SK_CLIENT_STATUS as $k => $v): ?><a href="?status=<?= $k ?>&amp;sort=<?= h($sort) ?>" class="<?= $status === $k ? 'on' : '' ?>"><?= h($v) ?> <b><?= $counts[$k] ?></b></a><?php endforeach; ?>
  </nav>
  <div class="tool-r">
    <label class="filter"><?= ic('search') ?><input type="search" id="cfilter" placeholder="Filter this list" aria-label="Filter clients"></label>
    <label class="sel"><span class="sr">Sort</span><select data-nav><?php foreach (['recent' => 'Recently updated', 'name' => 'Name A to Z', 'deadline' => 'Next deadline', 'value' => 'Highest billing'] as $k => $v): ?><option value="?status=<?= h($status) ?>&amp;sort=<?= $k ?>"<?= $sort === $k ? ' selected' : '' ?>><?= h($v) ?></option><?php endforeach; ?></select></label>
  </div>
</div>

<?php if (!$rows): ?>
  <div class="empty big"><span class="e-i"><?= ic('users') ?></span><h2><?= $status === 'all' ? 'No clients yet' : 'No ' . h(strtolower(SK_CLIENT_STATUS[$status])) . ' clients' ?></h2><p>Add a client to start tracking their projects, deadlines, reminders and payments in one profile.</p><button class="btn pri" type="button" data-open="dlg-client"><?= ic('plus') ?>Add your first client</button></div>
<?php else: ?>
<ul class="cards" id="clist">
  <?php foreach ($rows as $c): $nd = $c['nd']; ?>
  <li class="ccard" data-q="<?= h(mb_strtolower($c['name'] . ' ' . $c['company'] . ' ' . $c['email'] . ' ' . $c['phone'] . ' ' . $c['city'] . ' ' . $c['industry'])) ?>">
    <a class="cc-link" href="client.php?id=<?= (int) $c['id'] ?>" aria-label="Open <?= h($c['name']) ?>"></a>
    <div class="cc-top">
      <?= avatar($c) ?>
      <div class="cc-name"><b><?= h($c['name']) ?><?php if ((int) $c['starred']): ?><span class="star"><?= ic('star', 'i sm') ?></span><?php endif; ?></b><small><?= h(trim($c['company'] . ($c['company'] && $c['industry'] ? ', ' : '') . $c['industry'])) ?: 'No company added' ?></small></div>
      <?= chip(SK_CLIENT_STATUS[$c['status']], status_tone($c['status'])) ?>
    </div>
    <dl class="cc-facts">
      <div><dt>Next deadline</dt><dd class="t-<?= $nd ? due_tone($nd) : 'mute' ?>"><?= $nd ? h(rel_day($nd)) : 'None' ?></dd></div>
      <div><dt>Open projects</dt><dd><?= (int) $c['open_p'] ?></dd></div>
      <div><dt>To collect</dt><dd><?= (int) $c['due'] ? inr($c['due']) : '₹0' ?></dd></div>
    </dl>
    <div class="cc-act">
      <?php if ($c['phone']): ?><a class="icon-btn" href="tel:<?= h($c['phone']) ?>" title="Call" aria-label="Call <?= h($c['name']) ?>"><?= ic('phone') ?></a><?php endif; ?>
      <?php if ($w = wa_link($c['whatsapp'] ?: $c['phone'])): ?><a class="icon-btn" href="<?= h($w) ?>" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp <?= h($c['name']) ?>"><?= ic('wa') ?></a><?php endif; ?>
      <?php if ($c['email']): ?><a class="icon-btn" href="mailto:<?= h($c['email']) ?>" title="Email" aria-label="Email <?= h($c['name']) ?>"><?= ic('mail') ?></a><?php endif; ?>
      <span class="cc-upd"><?= (int) $c['open_r'] ? (int) $c['open_r'] . ' reminder' . ((int) $c['open_r'] > 1 ? 's' : '') . ', ' : '' ?>updated <?= h(strtolower(ago($c['updated_at']))) ?></span>
    </div>
  </li>
  <?php endforeach; ?>
</ul>
<p class="empty-f" id="cnone" hidden>No clients match this filter.</p>
<?php endif;
page_end();
