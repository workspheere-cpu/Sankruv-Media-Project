<?php
/* Simple page frame for the few server-rendered pages that sit outside the React app (Team and password). */
declare(strict_types=1);

function page_start(string $title, string $active, array $opt = []): void
{
    global $CFG;
    $f = flash_take();
    $v = fn(string $file) => (string) @filemtime(__DIR__ . '/assets/' . $file);
    ?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0e18">
<title><?= h($title . ' | ' . $CFG['app']) ?></title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/hub.css?v=<?= h($v('hub.css')) ?>">
<link rel="stylesheet" href="assets/hubapp.css?v=<?= h($v('hubapp.css')) ?>">
</head>
<body class="app plain pg-<?= h($active) ?>">
<header class="plain-top">
  <a class="btn ghost sm" href="app.php"><?= ic('chev', 'i flip') ?>Back to the Client Hub</a>
  <a class="top-logo" href="app.php" aria-label="<?= h($CFG['brand']) ?> Client Hub"><img src="assets/icons/logo-ink.png" alt="" width="525" height="256"></a>
  <form method="post" action="logout.php"><?= csrf_field() ?><button class="btn ghost sm" type="submit"><?= ic('logout') ?>Sign out</button></form>
</header>
<main class="content plain-content" id="content">
<?php if ($f): ?>
  <p class="plain-flash <?= $f[0] === 'bad' ? 'bad' : 'ok' ?>" role="status"><?= ic($f[0] === 'bad' ? 'x' : 'check') ?><span><?= h($f[1]) ?></span></p>
<?php endif;
}

function page_end(array $opt = []): void
{
    ?>
</main>
</body>
</html>
<?php
}
