<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

$rows = q("SELECT p.*, c.name AS client FROM projects p JOIN clients c ON c.id = p.client_id
  WHERE p.status != 'done' OR p.updated_at >= ? ORDER BY CASE WHEN p.due_date = '' THEN 1 ELSE 0 END, p.due_date, p.id DESC", [date('Y-m-d', strtotime('-45 day'))])->fetchAll();
$cols = []; foreach (SK_PROJECT_STATUS as $k => $v) $cols[$k] = [];
foreach ($rows as $r) $cols[$r['status']][] = $r;
$late = count(array_filter($rows, fn($r) => $r['status'] !== 'done' && $r['due_date'] !== '' && $r['due_date'] < today()));
$val = array_sum(array_map(fn($r) => $r['status'] !== 'done' ? (int) $r['value'] : 0, $rows));

page_start('Projects', 'projects');
?>
<section class="page-h">
  <div><h1>Projects</h1><p class="lead"><?= count($rows) - count($cols['done']) ?> running<?= $late ? ', <span class="t-bad">' . $late . ' past deadline</span>' : '' ?><?= $val ? ', worth ' . inr($val) : '' ?>. Drag a card to change its stage, or open the client to edit details.</p></div>
  <div class="page-act"><button class="btn pri" type="button" data-open="dlg-project"><?= ic('plus') ?>New project</button></div>
</section>
<?php if (!$rows): ?>
  <div class="empty big"><span class="e-i"><?= ic('layers') ?></span><h2>No projects yet</h2><p>Create a project for a client, set a deadline, and track its progress from start to delivery.</p><button class="btn pri" type="button" data-open="dlg-project"><?= ic('plus') ?>Create a project</button></div>
<?php else: ?>
<div class="board" id="board">
  <?php foreach ($cols as $st => $list): ?>
  <section class="col" data-status="<?= $st ?>" aria-label="<?= h(SK_PROJECT_STATUS[$st]) ?>">
    <header><span class="dot s-<?= $st ?>"></span><h2><?= h(SK_PROJECT_STATUS[$st]) ?></h2><b><?= count($list) ?></b></header>
    <div class="col-list">
      <?php foreach ($list as $p): $tone = due_tone($p['due_date'], $p['status'] === 'done'); ?>
      <article class="kcard" draggable="true" data-pid="<?= (int) $p['id'] ?>">
        <a class="k-t" href="client.php?id=<?= (int) $p['client_id'] ?>#projects"><?= h($p['title']) ?></a>
        <span class="k-c"><?= avatar(['name' => $p['client']], 'xs') ?><?= h($p['client']) ?></span>
        <?php if ($p['service']): ?><span class="k-s"><?= h($p['service']) ?></span><?php endif; ?>
        <span class="bar"><i style="width:<?= (int) $p['progress'] ?>%"></i></span>
        <span class="k-f"><?= $p['due_date'] ? chip(rel_day($p['due_date']), $tone) : '<span class="chip t-mute">No deadline</span>' ?><small><?= (int) $p['progress'] ?>%</small>
          <label class="k-move"><span class="sr">Move to</span><select data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="status" data-reload><?php foreach (SK_PROJECT_STATUS as $k => $v): ?><option value="<?= $k ?>"<?= $k === $p['status'] ? ' selected' : '' ?>><?= h($v) ?></option><?php endforeach; ?></select></label></span>
      </article>
      <?php endforeach; ?>
      <?php if (!$list): ?><p class="col-empty">Nothing here</p><?php endif; ?>
    </div>
  </section>
  <?php endforeach; ?>
</div>
<?php endif;
page_end();
