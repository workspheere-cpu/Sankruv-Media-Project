<?php
/* Page shell: sidebar, top bar, quick-add dialogs, search palette. */
declare(strict_types=1);
if (!defined('SK')) { http_response_code(404); exit; }

function page_start(string $title, string $active, array $opt = []): void
{
    global $CFG;
    $u = user();
    $dueCount = (int) col("SELECT COUNT(*) FROM reminders WHERE done = 0 AND due_at <= ?", [today() . ' 23:59']);
    $leadCount = (int) col("SELECT COUNT(*) FROM clients WHERE status = 'lead'");
    $nav = [
        ['index.php', 'dash', 'Dashboard', 'grid', 0],
        ['clients.php', 'clients', 'Clients', 'users', $leadCount],
        ['projects.php', 'projects', 'Projects', 'layers', 0],
        ['reminders.php', 'reminders', 'Reminders', 'bell', $dueCount],
        ['payments.php', 'payments', 'Payments', 'wallet', 0],
    ];
    if (is_owner()) $nav[] = ['team.php', 'team', 'Team', 'shield', 0];
    $f = flash_take();
    ?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a0c15">
<title><?= h($title) ?> | <?= h($CFG['brand']) ?> <?= h($CFG['app']) ?></title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;family=Anton&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/admin.css?v=<?= h((string) @filemtime(__DIR__ . '/assets/admin.css')) ?>">
</head>
<body class="app pg-<?= h($active) ?>">
<script type="application/json" id="sk-data"><?= json_encode(['csrf' => csrf(), 'user' => $u['name'] ?? ''], JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
<aside class="side" aria-label="Main">
  <a class="brand" href="index.php"><img src="../assets/img/logo.png" alt="<?= h($CFG['brand']) ?>" width="525" height="256"><span><?= h($CFG['app']) ?></span></a>
  <button class="new-btn" type="button" data-open="dlg-client"><?= ic('plus') ?><span>New client</span></button>
  <nav class="side-nav">
    <?php foreach ($nav as [$href, $key, $label, $icon, $badge]): ?>
      <a href="<?= $href ?>" class="<?= $active === $key ? 'on' : '' ?>"<?= $active === $key ? ' aria-current="page"' : '' ?>><?= ic($icon) ?><span><?= h($label) ?></span><?php if ($badge): ?><b class="badge"><?= $badge ?></b><?php endif; ?></a>
    <?php endforeach; ?>
  </nav>
  <div class="side-foot">
    <a class="side-link" href="<?= h($CFG['site_url']) ?>" target="_blank" rel="noopener"><?= ic('globe') ?><span>View website</span></a>
    <div class="me">
      <span class="av sm" style="--h:<?= hue((string) ($u['name'] ?? '')) ?>"><?= h(initials((string) ($u['name'] ?? ''))) ?></span>
      <span class="me-t"><b><?= h($u['name'] ?? '') ?></b><small><?= ($u['role'] ?? '') === 'owner' ? 'Owner' : 'Team member' ?></small></span>
      <form method="post" action="logout.php"><?= csrf_field() ?><button class="icon-btn" type="submit" title="Sign out" aria-label="Sign out"><?= ic('logout') ?></button></form>
    </div>
  </div>
</aside>

<div class="main">
  <header class="top">
    <a class="top-brand" href="index.php"><img src="../assets/img/logo.png" alt="<?= h($CFG['brand']) ?>" width="525" height="256"></a>
    <button class="search" type="button" data-open="palette" aria-label="Search clients and projects"><?= ic('search') ?><span>Search clients, projects, phone numbers</span><kbd>Ctrl K</kbd></button>
    <div class="top-r">
      <div class="quick">
        <button class="btn pri" type="button" data-menu="quick-menu"><?= ic('plus') ?><span>New</span><?= ic('down', 'i sm') ?></button>
        <div class="menu" id="quick-menu" hidden>
          <button type="button" data-open="dlg-client"><?= ic('user') ?>Client</button>
          <button type="button" data-open="dlg-project"><?= ic('layers') ?>Project</button>
          <button type="button" data-open="dlg-reminder"><?= ic('bell') ?>Reminder</button>
          <button type="button" data-open="dlg-payment"><?= ic('wallet') ?>Payment</button>
        </div>
      </div>
      <span class="top-date"><?= ic('cal') ?><?= h(date('D, j M')) ?></span>
    </div>
  </header>
  <main class="content" id="content">
<?php if ($f): ?>
    <div class="toast-init" data-kind="<?= h($f[0]) ?>" hidden><?= h($f[1]) ?></div>
<?php endif;
}

function page_end(array $opt = []): void
{
    $clients = q("SELECT id, name, company FROM clients WHERE status != 'archived' ORDER BY name COLLATE NOCASE")->fetchAll();
    $projects = q("SELECT p.id, p.title, c.name AS client FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.status != 'done' ORDER BY c.name COLLATE NOCASE, p.title")->fetchAll();
    $pre = (int) ($opt['client'] ?? 0);
    $copts = function (bool $optional) use ($clients, $pre): string {
        $o = $optional ? '<option value="">No client</option>' : '<option value="" disabled' . ($pre ? '' : ' selected') . '>Choose a client</option>';
        foreach ($clients as $c) $o .= '<option value="' . $c['id'] . '"' . ((int) $c['id'] === $pre ? ' selected' : '') . '>' . h($c['name'] . ($c['company'] ? ' (' . $c['company'] . ')' : '')) . '</option>';
        return $o;
    };
    $sopts = fn(array $map, string $sel = '') => implode('', array_map(fn($k, $v) => '<option value="' . h($k) . '"' . ($k === $sel ? ' selected' : '') . '>' . h($v) . '</option>', array_keys($map), $map));
    $svcChecks = implode('', array_map(fn($s) => '<label class="tick"><input type="checkbox" name="services[]" value="' . h($s) . '"><span>' . h($s) . '</span></label>', SK_SERVICES));
    ?>
  </main>
</div>

<nav class="tabs-m" aria-label="App">
  <a href="index.php"><?= ic('grid') ?><span>Home</span></a>
  <a href="clients.php"><?= ic('users') ?><span>Clients</span></a>
  <button type="button" class="fab" data-menu="quick-menu-m" aria-label="Add new"><?= ic('plus') ?></button>
  <a href="reminders.php"><?= ic('bell') ?><span>Reminders</span></a>
  <a href="projects.php"><?= ic('layers') ?><span>Projects</span></a>
  <div class="menu up" id="quick-menu-m" hidden>
    <button type="button" data-open="dlg-client"><?= ic('user') ?>Client</button>
    <button type="button" data-open="dlg-project"><?= ic('layers') ?>Project</button>
    <button type="button" data-open="dlg-reminder"><?= ic('bell') ?>Reminder</button>
    <button type="button" data-open="dlg-payment"><?= ic('wallet') ?>Payment</button>
    <a href="payments.php"><?= ic('wallet') ?>All payments</a>
    <?php if (is_owner()): ?><a href="team.php"><?= ic('shield') ?>Team</a><?php endif; ?>
  </div>
</nav>

<dialog class="dlg" id="dlg-client" aria-labelledby="dc-h">
  <form class="dlg-f" data-action="client.create">
    <header><span class="dlg-i"><?= ic('user') ?></span><div><h2 id="dc-h">New client</h2><p>Add the basics now. You can fill in the rest on the profile.</p></div><button type="button" class="icon-btn" data-close aria-label="Close"><?= ic('x') ?></button></header>
    <div class="grid2">
      <label class="fld full">Client or brand name<input name="name" required maxlength="120" autocomplete="off"></label>
      <label class="fld">Company<input name="company" maxlength="120"></label>
      <label class="fld">Industry<select name="industry"><option value="">Choose</option><?= $sopts(array_combine(SK_INDUSTRIES, SK_INDUSTRIES)) ?></select></label>
      <label class="fld">Phone<input name="phone" type="tel" maxlength="30" inputmode="tel"></label>
      <label class="fld">Email<input name="email" type="email" maxlength="120"></label>
      <label class="fld">Status<select name="status"><?= $sopts(SK_CLIENT_STATUS, 'active') ?></select></label>
      <label class="fld">Source<input name="source" maxlength="60" placeholder="Referral, Instagram, website"></label>
      <fieldset class="fld full"><legend>Services</legend><div class="ticks"><?= $svcChecks ?></div></fieldset>
    </div>
    <p class="dlg-err" role="alert"></p>
    <footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn pri" type="submit"><?= ic('check') ?>Create client</button></footer>
  </form>
</dialog>

<dialog class="dlg" id="dlg-project" aria-labelledby="dp-h">
  <form class="dlg-f" data-action="project.create">
    <header><span class="dlg-i"><?= ic('layers') ?></span><div><h2 id="dp-h">New project</h2><p>Set a deadline so it shows up on the dashboard.</p></div><button type="button" class="icon-btn" data-close aria-label="Close"><?= ic('x') ?></button></header>
    <div class="grid2">
      <label class="fld full">Project name<input name="title" required maxlength="140" placeholder="For example: Diwali campaign reels"></label>
      <label class="fld full">Client<select name="client_id" required><?= $copts(false) ?></select></label>
      <label class="fld">Service<select name="service"><option value="">Choose</option><?= $sopts(array_combine(SK_SERVICES, SK_SERVICES)) ?></select></label>
      <label class="fld">Status<select name="status"><?= $sopts(SK_PROJECT_STATUS, 'planned') ?></select></label>
      <label class="fld">Start date<input name="start_date" type="date" value="<?= today() ?>"></label>
      <label class="fld">Deadline<input name="due_date" type="date"></label>
      <label class="fld">Project value (₹)<input name="value" type="number" min="0" step="1" inputmode="numeric"></label>
      <label class="fld full">Details<textarea name="details" rows="3" maxlength="4000" placeholder="Scope, deliverables, links"></textarea></label>
    </div>
    <p class="dlg-err" role="alert"></p>
    <footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn pri" type="submit"><?= ic('check') ?>Create project</button></footer>
  </form>
</dialog>

<dialog class="dlg" id="dlg-reminder" aria-labelledby="dr-h">
  <form class="dlg-f" data-action="reminder.create">
    <header><span class="dlg-i"><?= ic('bell') ?></span><div><h2 id="dr-h">New reminder</h2><p>It appears on the dashboard on the day it is due.</p></div><button type="button" class="icon-btn" data-close aria-label="Close"><?= ic('x') ?></button></header>
    <div class="grid2">
      <label class="fld full">What needs to happen?<input name="title" required maxlength="160" placeholder="For example: Send the content calendar for approval"></label>
      <label class="fld">Date<input name="date" type="date" required value="<?= today() ?>"></label>
      <label class="fld">Time<input name="time" type="time" value="10:00"></label>
      <label class="fld">Client<select name="client_id"><?= $copts(true) ?></select></label>
      <label class="fld">Priority<select name="priority"><?= $sopts(SK_PRIORITY, 'normal') ?></select></label>
      <label class="fld full">Project<select name="project_id"><option value="">No project</option><?php foreach ($projects as $p): ?><option value="<?= $p['id'] ?>"><?= h($p['client'] . ': ' . $p['title']) ?></option><?php endforeach; ?></select></label>
    </div>
    <p class="dlg-err" role="alert"></p>
    <footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn pri" type="submit"><?= ic('check') ?>Save reminder</button></footer>
  </form>
</dialog>

<dialog class="dlg" id="dlg-payment" aria-labelledby="dpay-h">
  <form class="dlg-f" data-action="payment.create">
    <header><span class="dlg-i"><?= ic('wallet') ?></span><div><h2 id="dpay-h">New payment</h2><p>Track an invoice, an advance or a monthly retainer.</p></div><button type="button" class="icon-btn" data-close aria-label="Close"><?= ic('x') ?></button></header>
    <div class="grid2">
      <label class="fld full">Client<select name="client_id" required><?= $copts(false) ?></select></label>
      <label class="fld full">Description<input name="label" required maxlength="140" placeholder="For example: November retainer, 50% advance"></label>
      <label class="fld">Amount (₹)<input name="amount" type="number" min="1" step="1" required inputmode="numeric"></label>
      <label class="fld">Due date<input name="due_date" type="date" value="<?= today() ?>"></label>
      <label class="fld">Status<select name="status"><?= $sopts(SK_PAY_STATUS, 'pending') ?></select></label>
    </div>
    <p class="dlg-err" role="alert"></p>
    <footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn pri" type="submit"><?= ic('check') ?>Save payment</button></footer>
  </form>
</dialog>

<dialog class="dlg pal" id="palette" aria-label="Search">
  <div class="pal-in"><?= ic('search') ?><input id="pal-q" type="search" placeholder="Search clients, projects, phone or email" autocomplete="off" aria-label="Search"><kbd>Esc</kbd></div>
  <div class="pal-res" id="pal-res" role="listbox"><p class="pal-hint">Start typing to find a client or project.</p></div>
</dialog>

<dialog class="dlg confirm" id="dlg-confirm">
  <form method="dialog"><p class="d-msg" id="confirm-msg">Are you sure?</p>
  <footer><button class="btn ghost" value="no">Cancel</button><button class="btn danger" value="yes">Delete</button></footer></form>
</dialog>
<div class="toasts" id="toasts" role="status" aria-live="polite"></div>
<script src="assets/admin.js?v=<?= h((string) @filemtime(__DIR__ . '/assets/admin.js')) ?>" defer></script>
</body>
</html>
<?php
}
