<?php
/* One reminder row. Expects $r with optional $r['client']. */
if (!defined('SK')) { http_response_code(404); exit; }
$dd = substr((string) $r['due_at'], 0, 10);
$tone = due_tone($dd, (bool) $r['done']);
$tm = substr((string) $r['due_at'], 11, 5);
?>
<li class="rem<?= (int) $r['done'] ? ' done' : '' ?> pr-<?= h($r['priority']) ?>" data-id="<?= (int) $r['id'] ?>">
  <button class="tickbox" type="button" data-act="reminder.toggle" data-id="<?= (int) $r['id'] ?>" aria-pressed="<?= (int) $r['done'] ? 'true' : 'false' ?>" aria-label="Mark as done"><?= ic('check') ?></button>
  <div class="rem-main">
    <b><?= h($r['title']) ?></b>
    <small><?php if (!empty($r['client'])): ?><a href="client.php?id=<?= (int) $r['client_id'] ?>"><?= h($r['client']) ?></a>, <?php endif; ?><span class="t-<?= $tone ?>"><?= h(rel_day($dd)) ?><?= $tm && $tm !== '00:00' ? ' at ' . h(date('g:i a', strtotime($tm))) : '' ?></span><?php if ($r['priority'] === 'high'): ?>, <span class="t-bad">High priority</span><?php endif; ?></small>
  </div>
  <div class="rem-act">
    <?php if (!(int) $r['done']): ?><button class="icon-btn" type="button" data-act="reminder.snooze" data-id="<?= (int) $r['id'] ?>" data-days="1" title="Move to tomorrow" aria-label="Move to tomorrow"><?= ic('clock') ?></button><?php endif; ?>
    <button class="icon-btn" type="button" data-act="reminder.delete" data-id="<?= (int) $r['id'] ?>" data-confirm="Delete this reminder?" title="Delete" aria-label="Delete reminder"><?= ic('trash') ?></button>
  </div>
</li>
