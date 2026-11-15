<?php
/**
 * Sign-in for the Client Hub. Same layout and safeguards as the WorkSphere team portal:
 * CSRF token, per-network rate limit, per-account lock after repeated failures.
 */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
if (!users_exist()) redirect('setup.php');

$next = (string) ($_GET['next'] ?? $_POST['next'] ?? '');
$next = preg_match('#^[a-z]+\.php(\?[a-z_]+=[A-Za-z0-9_-]+(&[a-z_]+=[A-Za-z0-9_-]+)*)?$#', $next) && is_file(__DIR__ . '/' . strtok($next, '?')) ? $next : '';
if (user()) redirect($next ?: 'index.php');

$error = '';
$notice = ['out' => 'You have signed out. See you soon.', 'expired' => 'Your session ended. Sign in again to continue.'][(string) ($_GET['m'] ?? '')] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    if ($username === '' || $password === '') {
        $error = 'Enter your ID and password.';
    } elseif (!rate_ok('login', 15, 900)) {
        usleep(800000);
        $error = 'Too many sign-in attempts from this network. Please wait 15 minutes and try again.';
    } elseif (attempt_login($username, $password)) {
        redirect($next ?: 'index.php');
    } else {
        usleep(300000);
        $error = 'Incorrect ID or password, or the account is locked for a few minutes after too many tries.';
    }
}
$h = fn($v) => h($v);
?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0a0c15">
<title>Sign in | Sankruv Media Client Hub</title>
<meta name="description" content="Secure sign-in for the Sankruv Media team: clients, projects, deadlines, reminders and payments in one workspace.">
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;family=Anton&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/login.css?v=<?= (int) @filemtime(__DIR__ . '/assets/login.css') ?>">
</head>
<body class="login" data-now="<?= time() ?>">
  <div class="sky" aria-hidden="true"></div>
  <canvas id="core" aria-hidden="true"></canvas>
  <div class="veil" aria-hidden="true"></div>
  <div class="wrap">
    <section class="story" aria-label="Sankruv Media Client Hub">
      <div class="top"><img src="../assets/img/logo.png" alt="" width="525" height="256"><div><b>Sankruv Media</b><small>Client Hub</small></div></div>
      <div class="pitch">
        <span class="eye"><i></i>Your client workspace</span>
        <h1>Every client.<br>Every deadline.<br><span>One place.</span></h1>
        <p>Client profiles, projects, reminders and payments for the Sankruv Media team, organised so nothing slips.</p>
        <div class="feats"><span><?= ic('users') ?>Client profiles</span><span><?= ic('layers') ?>Projects</span><span><?= ic('bell') ?>Reminders</span><span><?= ic('wallet') ?>Payments</span></div>
      </div>
      <div class="route"><span class="pl" id="tip"><?= ic('spark') ?><span id="tipT">Press Ctrl K anywhere to find a client</span></span><span>Move your mouse to light the shape</span></div>
    </section>

    <form class="card" id="card" method="post" novalidate autocomplete="on" aria-labelledby="h2">
      <div class="ch">
        <span class="lg"><img src="../assets/img/logo.png" alt="Sankruv Media" width="525" height="256"></span>
        <span class="st"><i></i><span>Secure sign-in</span></span>
      </div>
      <h2 id="h2">Welcome back</h2>
      <p class="sub">Sign in with your Sankruv ID to open the Client Hub.</p>
      <?php if ($error): ?><p class="err" role="alert"><?= ic('x') ?><span><?= $h($error) ?></span></p><?php elseif ($notice): ?><p class="err warn" role="status"><?= ic('check') ?><span><?= $h($notice) ?></span></p><?php endif; ?>
      <?= csrf_field() ?>
      <input type="hidden" name="next" value="<?= $h($next) ?>">
      <label for="u">User ID</label>
      <div class="in"><?= ic('user') ?><input id="u" type="text" name="username" autocomplete="username" required autofocus placeholder="Your ID" value="<?= $h($_POST['username'] ?? '') ?>" spellcheck="false" autocapitalize="off"></div>
      <label for="p">Password <small id="caps">Caps Lock is on</small></label>
      <div class="in"><?= ic('lock') ?><input id="p" type="password" name="password" autocomplete="current-password" required placeholder="Your password">
        <button type="button" class="peek" id="peek" aria-label="Show password" aria-pressed="false"><?= ic('eye') ?></button></div>
      <button type="submit" class="go" id="go"><span class="sp" aria-hidden="true"></span><span class="t">Sign in <?= ic('arrow') ?></span></button>
      <div class="roles"><div><?= ic('grid') ?><span><b>Owner</b>Full hub and team</span></div><div><?= ic('users') ?><span><b>Team</b>Clients and projects</span></div></div>
      <div class="fine"><span><?= ic('shield') ?>Secure, encrypted session</span><span>India time <b id="ist">--:--</b></span></div>
    </form>
  </div>
  <div class="copy">&copy; <?= date('Y') ?> Sankruv Media</div>
  <script src="assets/login.js?v=<?= (int) @filemtime(__DIR__ . '/assets/login.js') ?>" defer></script>
</body>
</html>
