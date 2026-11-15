<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

$id = (int) ($_GET['id'] ?? 0);
$c = one('SELECT * FROM clients WHERE id = ?', [$id]);
if (!$c) { flash('That client could not be found.', 'bad'); redirect('clients.php'); }
$projects = q("SELECT * FROM projects WHERE client_id = ? ORDER BY status = 'done', CASE WHEN due_date = '' THEN 1 ELSE 0 END, due_date, id DESC", [$id])->fetchAll();
$rems = q('SELECT r.*, ? AS client FROM reminders r WHERE r.client_id = ? ORDER BY r.done, r.due_at', ['', $id])->fetchAll();
$pays = q('SELECT * FROM payments WHERE client_id = ? ORDER BY status = \'paid\', due_date', [$id])->fetchAll();
$acts = q('SELECT a.*, u.name AS who FROM activity a LEFT JOIN users u ON u.id = a.user_id WHERE a.client_id = ? ORDER BY a.id DESC LIMIT 200', [$id])->fetchAll();
$openP = array_values(array_filter($projects, fn($p) => $p['status'] !== 'done'));
$openR = array_values(array_filter($rems, fn($r) => !(int) $r['done']));
$billed = array_sum(array_map(fn($p) => (int) $p['amount'], $pays));
$paid = array_sum(array_map(fn($p) => $p['status'] === 'paid' ? (int) $p['amount'] : 0, $pays));
$due = $billed - $paid;
$nextDl = null; foreach ($openP as $p) if ($p['due_date'] !== '') { $nextDl = $p; break; }
$nextRem = $openR[0] ?? null;
$svc = array_filter(explode(',', (string) $c['services']));
$hueC = hue((string) $c['name']);
$wa = wa_link($c['whatsapp'] ?: $c['phone']);
$web = web_link($c['website']); $ig = ig_link($c['instagram']);
$sel = fn(array $map, string $cur) => implode('', array_map(fn($k, $v) => '<option value="' . h($k) . '"' . ((string) $k === $cur ? ' selected' : '') . '>' . h($v) . '</option>', array_keys($map), $map));

/* inline-editable info rows: [field, label, icon, type, link] */
$rows = [
    ['contact_person', 'Contact person', 'user', 'text', ''],
    ['designation', 'Designation', 'briefcase', 'text', ''],
    ['phone', 'Phone', 'phone', 'tel', $c['phone'] ? 'tel:' . $c['phone'] : ''],
    ['whatsapp', 'WhatsApp', 'wa', 'tel', $wa],
    ['email', 'Email', 'mail', 'email', $c['email'] ? 'mailto:' . $c['email'] : ''],
    ['website', 'Website', 'link', 'url', $web],
    ['instagram', 'Instagram', 'ig', 'text', $ig],
    ['address', 'Address', 'pin', 'text', $c['address'] ? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($c['address'] . ' ' . $c['city']) : ''],
    ['city', 'City', 'building', 'text', ''],
    ['industry', 'Industry', 'tag', 'select', ''],
    ['gst', 'GST number', 'note', 'text', ''],
    ['source', 'Lead source', 'spark', 'text', ''],
    ['budget', 'Monthly budget', 'wallet', 'number', ''],
];
$kindIcon = ['note' => 'note', 'call' => 'phone', 'meeting' => 'users', 'email' => 'mail', 'whatsapp' => 'wa', 'system' => 'spark', 'project' => 'layers', 'payment' => 'wallet', 'reminder' => 'bell', 'lead' => 'spark'];

page_start($c['name'], 'clients');
?>
<a class="back" href="clients.php"><?= ic('chev', 'i flip') ?>All clients</a>
<section class="prof" style="--h:<?= $hueC ?>" data-client="<?= $id ?>">
  <div class="cover" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="prof-body">
    <?= avatar($c, 'xl') ?>
    <div class="prof-id">
      <h1 class="editable-title" data-edit="client" data-id="<?= $id ?>" data-field="name" data-type="text" data-value="<?= h($c['name']) ?>"><span class="val"><?= h($c['name']) ?></span><button class="icon-btn edit" type="button" aria-label="Edit name"><?= ic('edit') ?></button></h1>
      <p class="prof-sub"><?= h(trim(implode(', ', array_filter([$c['company'], $c['industry'], $c['city']])))) ?: 'Add company, industry and city below' ?></p>
      <div class="prof-chips">
        <label class="chip-sel t-<?= status_tone($c['status']) ?>"><span class="sr">Status</span><select data-save="client" data-id="<?= $id ?>" data-field="status"><?= $sel(SK_CLIENT_STATUS, $c['status']) ?></select><?= ic('down', 'i sm') ?></label>
        <span class="chip t-mute"><?= ic('cal', 'i sm') ?>Client since <?= h(date('M Y', strtotime($c['created_at']))) ?></span>
        <?php if ($c['source']): ?><span class="chip t-mute"><?= ic('spark', 'i sm') ?><?= h($c['source']) ?></span><?php endif; ?>
      </div>
    </div>
    <div class="prof-tools">
      <button class="icon-btn star-btn<?= (int) $c['starred'] ? ' on' : '' ?>" type="button" data-star="<?= $id ?>" aria-pressed="<?= (int) $c['starred'] ? 'true' : 'false' ?>" title="Pin to the top of the client list" aria-label="Pin client"><?= ic('star') ?></button>
    </div>
  </div>
  <div class="gacts">
    <?php
    $acts2 = [
        ['Call', 'phone', $c['phone'] ? 'tel:' . $c['phone'] : '', ''],
        ['WhatsApp', 'wa', $wa, '_blank'],
        ['Email', 'mail', $c['email'] ? 'mailto:' . $c['email'] : '', ''],
        ['Website', 'globe', $web, '_blank'],
        ['Instagram', 'ig', $ig, '_blank'],
    ];
    foreach ($acts2 as [$l, $i, $href, $tg]): ?>
      <?php if ($href): ?><a class="gact" href="<?= h($href) ?>"<?= $tg ? ' target="_blank" rel="noopener"' : '' ?>><span><?= ic($i) ?></span><?= h($l) ?></a>
      <?php else: ?><button class="gact off" type="button" data-focus-field="<?= ['Call' => 'phone', 'WhatsApp' => 'whatsapp', 'Email' => 'email', 'Website' => 'website', 'Instagram' => 'instagram'][$l] ?>" title="Add <?= h(strtolower($l)) ?> details"><span><?= ic($i) ?></span><?= h($l) ?></button><?php endif; ?>
    <?php endforeach; ?>
    <button class="gact" type="button" data-open="dlg-reminder"><span><?= ic('bell') ?></span>Reminder</button>
    <button class="gact" type="button" data-open="dlg-project"><span><?= ic('layers') ?></span>Project</button>
    <button class="gact" type="button" data-tab-go="activity" data-focus="#note-body"><span><?= ic('note') ?></span>Note</button>
  </div>
  <nav class="ptabs" role="tablist" aria-label="Client sections">
    <a href="#overview" role="tab" data-tab="overview">Overview</a>
    <a href="#projects" role="tab" data-tab="projects">Projects <b><?= count($openP) ?></b></a>
    <a href="#reminders" role="tab" data-tab="reminders">Reminders <b><?= count($openR) ?></b></a>
    <a href="#payments" role="tab" data-tab="payments">Payments<?php if ($due): ?> <b class="warn"><?= inr($due) ?></b><?php endif; ?></a>
    <a href="#activity" role="tab" data-tab="activity">History <b><?= count($acts) ?></b></a>
  </nav>
</section>

<!-- ============ overview ============ -->
<section class="tabp" id="tab-overview" data-panel="overview">
  <div class="ov">
    <div class="ov-l">
      <section class="panel">
        <header class="ph"><h2><?= ic('user') ?>Details</h2><small class="hint">Click any line to edit</small></header>
        <div class="rows">
          <?php foreach ($rows as [$f, $l, $i, $type, $link]):
            $v = (string) $c[$f];
            $disp = $f === 'budget' ? ((int) $v ? inr($v) : '') : $v; ?>
          <div class="row" id="row-<?= $f ?>" data-edit="client" data-id="<?= $id ?>" data-field="<?= $f ?>" data-type="<?= $type ?>" data-value="<?= h($f === 'budget' && !(int) $v ? '' : $v) ?>"<?= $type === 'select' ? ' data-options="' . h(json_encode(SK_INDUSTRIES)) . '"' : '' ?>>
            <span class="r-i"><?= ic($i) ?></span>
            <span class="r-v"><small><?= h($l) ?></small><span class="val"><?= $disp !== '' ? h($disp) : '<em class="ph">Add ' . h(strtolower($l)) . '</em>' ?></span></span>
            <span class="r-act"><?php if ($link): ?><a class="icon-btn" href="<?= h($link) ?>" target="_blank" rel="noopener" aria-label="Open <?= h($l) ?>"><?= ic('arrow') ?></a><?php endif; ?><button class="icon-btn edit" type="button" aria-label="Edit <?= h($l) ?>"><?= ic('edit') ?></button></span>
          </div>
          <?php endforeach; ?>
        </div>
      </section>
      <section class="panel">
        <header class="ph"><h2><?= ic('layers') ?>Services</h2><small class="hint">What this client uses</small></header>
        <div class="svc-tog" data-services="<?= $id ?>">
          <?php foreach (SK_SERVICES as $s): ?><button type="button" class="tog<?= in_array($s, $svc, true) ? ' on' : '' ?>" aria-pressed="<?= in_array($s, $svc, true) ? 'true' : 'false' ?>" data-svc="<?= h($s) ?>"><?= ic('check', 'i sm') ?><?= h($s) ?></button><?php endforeach; ?>
        </div>
      </section>
      <section class="panel">
        <header class="ph"><h2><?= ic('note') ?>About this client</h2><small class="hint" id="about-state">Saves automatically</small></header>
        <textarea class="about" rows="5" data-save="client" data-id="<?= $id ?>" data-field="about" data-state="#about-state" placeholder="Goals, brand voice, preferences, logins location, anything the team should know"><?= h($c['about']) ?></textarea>
      </section>
    </div>
    <aside class="ov-r">
      <section class="panel glance">
        <div class="g"><small>Open projects</small><b><?= count($openP) ?></b></div>
        <div class="g"><small>Open reminders</small><b><?= count($openR) ?></b></div>
        <div class="g"><small>Billed</small><b><?= inr($billed) ?></b></div>
        <div class="g <?= $due ? 'warn' : '' ?>"><small>To collect</small><b><?= inr($due) ?></b></div>
      </section>
      <section class="panel nextup">
        <header class="ph"><h2><?= ic('flag') ?>Next up</h2></header>
        <?php if ($nextDl): ?>
          <a class="nu" href="#projects" data-tab-go="projects"><span class="nu-i t-<?= due_tone($nextDl['due_date']) ?>"><?= ic('flag') ?></span><span><small>Next deadline, <?= h(rel_day($nextDl['due_date'])) ?></small><b><?= h($nextDl['title']) ?></b><span class="bar"><i style="width:<?= (int) $nextDl['progress'] ?>%"></i></span></span></a>
        <?php endif; ?>
        <?php if ($nextRem): ?>
          <a class="nu" href="#reminders" data-tab-go="reminders"><span class="nu-i t-<?= due_tone(substr($nextRem['due_at'], 0, 10)) ?>"><?= ic('bell') ?></span><span><small>Next reminder, <?= h(rel_day(substr($nextRem['due_at'], 0, 10))) ?></small><b><?= h($nextRem['title']) ?></b></span></a>
        <?php endif; ?>
        <?php if (!$nextDl && !$nextRem): ?><p class="muted">No deadlines or reminders yet. Add a project with a deadline, or a reminder, to see them here.</p><?php endif; ?>
      </section>
      <section class="panel money-c">
        <header class="ph"><h2><?= ic('wallet') ?>Payments</h2></header>
        <div class="ring" style="--p:<?= $billed ? round($paid / $billed * 100) : 0 ?>"><span><b><?= $billed ? round($paid / $billed * 100) : 0 ?>%</b><small>collected</small></span></div>
        <dl class="mrow"><div><dt>Received</dt><dd><?= inr($paid) ?></dd></div><div><dt>Pending</dt><dd><?= inr($due) ?></dd></div></dl>
      </section>
      <section class="panel danger">
        <header class="ph"><h2><?= ic('shield') ?>Manage</h2></header>
        <?php if ($c['status'] !== 'archived'): ?>
          <button class="btn ghost full" type="button" data-set-status="archived" data-id="<?= $id ?>"><?= ic('download') ?>Archive client</button>
        <?php else: ?>
          <button class="btn ghost full" type="button" data-set-status="active" data-id="<?= $id ?>"><?= ic('check') ?>Restore as active</button>
        <?php endif; ?>
        <?php if (is_owner()): ?><button class="btn danger-t full" type="button" data-act="client.delete" data-id="<?= $id ?>" data-confirm="Delete <?= h($c['name']) ?> and all their projects, reminders, payments and history? This cannot be undone."><?= ic('trash') ?>Delete permanently</button><?php endif; ?>
      </section>
    </aside>
  </div>
</section>

<!-- ============ projects ============ -->
<section class="tabp" id="tab-projects" data-panel="projects">
  <div class="tab-h"><h2>Projects</h2><button class="btn pri" type="button" data-open="dlg-project"><?= ic('plus') ?>New project</button></div>
  <?php if (!$projects): ?>
    <div class="empty"><span class="e-i"><?= ic('layers') ?></span><p><b>No projects yet.</b> Add one with a deadline so it appears on the dashboard and in reminders.</p><button class="btn ghost sm" type="button" data-open="dlg-project"><?= ic('plus') ?>New project</button></div>
  <?php endif; ?>
  <div class="pgrid">
  <?php foreach ($projects as $p): $pt = due_tone($p['due_date'], $p['status'] === 'done'); ?>
    <article class="pcard st-<?= h($p['status']) ?>" data-pid="<?= (int) $p['id'] ?>">
      <header>
        <input class="pc-title" value="<?= h($p['title']) ?>" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="title" aria-label="Project name" maxlength="140">
        <label class="chip-sel t-<?= status_tone($p['status']) ?>"><span class="sr">Status</span><select data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="status"><?= $sel(SK_PROJECT_STATUS, $p['status']) ?></select><?= ic('down', 'i sm') ?></label>
      </header>
      <div class="pc-prog">
        <input type="range" min="0" max="100" step="5" value="<?= (int) $p['progress'] ?>" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="progress" aria-label="Progress">
        <output><?= (int) $p['progress'] ?>%</output>
      </div>
      <div class="pc-grid">
        <label>Service<select data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="service"><option value="">Not set</option><?= $sel(array_combine(SK_SERVICES, SK_SERVICES), (string) $p['service']) ?></select></label>
        <label>Start<input type="date" value="<?= h($p['start_date']) ?>" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="start_date"></label>
        <label>Deadline <span class="due-chip t-<?= $pt ?>"><?= h($p['due_date'] ? rel_day($p['due_date']) : '') ?></span><input type="date" value="<?= h($p['due_date']) ?>" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="due_date"></label>
        <label>Value (₹)<input type="number" min="0" step="1" value="<?= (int) $p['value'] ?: '' ?>" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="value" inputmode="numeric"></label>
      </div>
      <textarea rows="2" placeholder="Scope, deliverables, links" data-save="project" data-id="<?= (int) $p['id'] ?>" data-field="details"><?= h($p['details']) ?></textarea>
      <footer><small>Updated <?= h(strtolower(ago($p['updated_at']))) ?></small><button class="icon-btn" type="button" data-act="project.delete" data-id="<?= (int) $p['id'] ?>" data-confirm="Delete the project “<?= h($p['title']) ?>”?" aria-label="Delete project"><?= ic('trash') ?></button></footer>
    </article>
  <?php endforeach; ?>
  </div>
</section>

<!-- ============ reminders ============ -->
<section class="tabp" id="tab-reminders" data-panel="reminders">
  <div class="tab-h"><h2>Reminders</h2></div>
  <form class="quick-add" data-action="reminder.create" data-reload>
    <input type="hidden" name="client_id" value="<?= $id ?>">
    <label class="qa-main"><span class="sr">Reminder</span><input name="title" required maxlength="160" placeholder="Add a reminder, for example: Follow up on the quotation"></label>
    <label><span class="sr">Date</span><input type="date" name="date" required value="<?= date('Y-m-d', strtotime('+1 day')) ?>"></label>
    <label><span class="sr">Time</span><input type="time" name="time" value="10:00"></label>
    <label><span class="sr">Priority</span><select name="priority"><?= $sel(SK_PRIORITY, 'normal') ?></select></label>
    <button class="btn pri" type="submit"><?= ic('plus') ?>Add</button>
  </form>
  <?php if (!$rems): ?>
    <div class="empty"><span class="e-i"><?= ic('bell') ?></span><p><b>No reminders for this client.</b> Add follow-ups, approvals or renewal dates above.</p></div>
  <?php else: ?>
    <ul class="rem-list">
      <?php foreach ($rems as $r): if ((int) $r['done']) continue; include __DIR__ . '/_rem_row.php'; endforeach; ?>
    </ul>
    <?php $doneR = array_filter($rems, fn($r) => (int) $r['done']); if ($doneR): ?>
      <details class="done-box"><summary><?= count($doneR) ?> completed</summary><ul class="rem-list"><?php foreach ($doneR as $r): include __DIR__ . '/_rem_row.php'; endforeach; ?></ul></details>
    <?php endif; ?>
  <?php endif; ?>
</section>

<!-- ============ payments ============ -->
<section class="tabp" id="tab-payments" data-panel="payments">
  <div class="tab-h"><h2>Payments</h2>
    <div class="mini-tot"><span>Billed <b><?= inr($billed) ?></b></span><span>Received <b class="t-ok"><?= inr($paid) ?></b></span><span>Pending <b class="t-warn"><?= inr($due) ?></b></span></div></div>
  <form class="quick-add" data-action="payment.create" data-reload>
    <input type="hidden" name="client_id" value="<?= $id ?>">
    <label class="qa-main"><span class="sr">Description</span><input name="label" required maxlength="140" placeholder="Invoice or payment, for example: December retainer"></label>
    <label><span class="sr">Amount</span><input type="number" name="amount" min="1" required placeholder="Amount ₹" inputmode="numeric"></label>
    <label><span class="sr">Due date</span><input type="date" name="due_date" value="<?= today() ?>"></label>
    <label><span class="sr">Status</span><select name="status"><?= $sel(SK_PAY_STATUS, 'pending') ?></select></label>
    <button class="btn pri" type="submit"><?= ic('plus') ?>Add</button>
  </form>
  <?php if (!$pays): ?>
    <div class="empty"><span class="e-i"><?= ic('wallet') ?></span><p><b>No payments recorded.</b> Track invoices, advances and retainers to see what is still to collect.</p></div>
  <?php else: ?>
  <div class="table-w"><table class="tbl">
    <thead><tr><th>Description</th><th class="num">Amount</th><th>Due</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead>
    <tbody>
      <?php foreach ($pays as $p): $late = $p['status'] === 'pending' && $p['due_date'] !== '' && $p['due_date'] < today(); ?>
      <tr class="<?= $p['status'] === 'paid' ? 'paid' : '' ?>">
        <td><b><?= h($p['label']) ?></b><?php if ($p['paid_date']): ?><small>Received <?= h(fmt_date($p['paid_date'])) ?></small><?php endif; ?></td>
        <td class="num"><?= inr($p['amount']) ?></td>
        <td><span class="t-<?= $p['status'] === 'paid' ? 'mute' : due_tone($p['due_date']) ?>"><?= h($p['due_date'] ? ($p['status'] === 'paid' ? fmt_date($p['due_date']) : rel_day($p['due_date'])) : 'No date') ?></span></td>
        <td><label class="chip-sel t-<?= $p['status'] === 'paid' ? 'ok' : ($late ? 'bad' : 'warn') ?>"><span class="sr">Status</span><select data-save="payment" data-id="<?= (int) $p['id'] ?>" data-field="status" data-reload><?= $sel(SK_PAY_STATUS, $p['status']) ?></select><?= ic('down', 'i sm') ?></label></td>
        <td class="act"><button class="icon-btn" type="button" data-act="payment.delete" data-id="<?= (int) $p['id'] ?>" data-confirm="Delete this payment record?" aria-label="Delete payment"><?= ic('trash') ?></button></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table></div>
  <?php endif; ?>
</section>

<!-- ============ history ============ -->
<section class="tabp" id="tab-activity" data-panel="activity">
  <div class="tab-h"><h2>History</h2></div>
  <form class="log" data-action="note.create" data-reload>
    <input type="hidden" name="client_id" value="<?= $id ?>">
    <div class="log-kinds" role="radiogroup" aria-label="Type">
      <?php $i = 0; foreach (SK_LOG_KINDS as $k => $l): ?><label><input type="radio" name="kind" value="<?= $k ?>"<?= $i++ === 0 ? ' checked' : '' ?>><span><?= ic($kindIcon[$k], 'i sm') ?><?= h($l) ?></span></label><?php endforeach; ?>
    </div>
    <textarea id="note-body" name="body" rows="3" required maxlength="4000" placeholder="What happened? For example: Call with Riya, approved the reel concepts, wants delivery by Friday."></textarea>
    <div class="log-f"><small>Everything logged here is visible to your team.</small><button class="btn pri" type="submit"><?= ic('check') ?>Save to history</button></div>
  </form>
  <ol class="timeline">
    <?php foreach ($acts as $a): $user = in_array($a['kind'], array_keys(SK_LOG_KINDS), true); ?>
    <li class="k-<?= h($a['kind']) ?>">
      <span class="tl-i"><?= ic($kindIcon[$a['kind']] ?? 'spark', 'i sm') ?></span>
      <div class="tl-b">
        <div class="tl-h"><b><?= h(SK_LOG_KINDS[$a['kind']] ?? ($a['kind'] === 'lead' ? 'Website enquiry' : 'Update')) ?></b><small><?= h(fmt_date($a['created_at'], true)) ?><?= $a['who'] ? ', ' . h($a['who']) : '' ?></small>
          <?php if ($user): ?><button class="icon-btn" type="button" data-act="note.delete" data-id="<?= (int) $a['id'] ?>" data-confirm="Delete this entry from the history?" aria-label="Delete entry"><?= ic('trash') ?></button><?php endif; ?></div>
        <p><?= nl2br(h($a['body'])) ?></p>
      </div>
    </li>
    <?php endforeach; ?>
  </ol>
</section>
<?php page_end(['client' => $id]);
