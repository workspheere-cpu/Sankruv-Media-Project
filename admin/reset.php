<?php
/**
 * Owner password reset through a private one-time link: reset.php?key=...
 * The key lives only in the server's config.php ('reset_key', at least 24 characters). Once a password
 * has been set with it, the key is recorded as used and the link stops working. Put a new key in
 * config.php to make another link.
 */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();

$key = (string) ($CFG['reset_key'] ?? '');
$usedFile = sk_data_dir() . '/reset-used.txt';
$used = is_file($usedFile) && in_array(hash('sha256', $key), array_map('trim', (array) @file($usedFile)), true);
$ok = strlen($key) >= 24 && !$used && hash_equals($key, (string) ($_GET['key'] ?? ''));
if (!$ok) { http_response_code(404); exit('This link is not valid or has already been used.'); }

$users = q("SELECT id, username, name, role FROM users ORDER BY role = 'owner' DESC, name COLLATE NOCASE")->fetchAll();
$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $uid = (int) ($_POST['uid'] ?? 0);
    $username = strtolower(trim((string) ($_POST['username'] ?? '')));
    $pass = (string) ($_POST['password'] ?? '');
    $target = one('SELECT * FROM users WHERE id = ?', [$uid]);
    if (!rate_ok('reset', 10, 900)) $err = 'Too many attempts. Please wait 15 minutes and try again.';
    elseif (!$target) $err = 'Choose the account to reset.';
    elseif (!valid_username($username)) $err = 'The User ID can use 3 to 32 lowercase letters, numbers, dots, dashes or underscores.';
    elseif ($username !== $target['username'] && one('SELECT id FROM users WHERE username = ?', [$username])) $err = 'That User ID is already taken.';
    elseif ($p = password_problem($pass, (string) ($_POST['password2'] ?? ''))) $err = $p;
    else {
        q('UPDATE users SET username = ?, pass = ?, active = 1, fails = 0, locked_until = 0 WHERE id = ?', [$username, password_hash($pass, PASSWORD_DEFAULT), $uid]);
        @file_put_contents($usedFile, hash('sha256', $key) . "\n", FILE_APPEND | LOCK_EX);
        attempt_login($username, $pass);
        flash('Password changed. You are signed in as ' . $username . '.');
        redirect('index.php');
    }
}
$val = fn($k, $d = '') => h($_POST[$k] ?? $d);
$first = $users[0] ?? null;
?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Reset password | Sankruv Media Client Hub</title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;family=Anton&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/login.css?v=<?= (int) @filemtime(__DIR__ . '/assets/login.css') ?>">
</head>
<body class="login setup" data-now="<?= time() ?>">
  <div class="sky" aria-hidden="true"></div>
  <canvas id="core" aria-hidden="true"></canvas>
  <div class="wrap one">
    <form class="card wide" id="card" method="post" novalidate>
      <div class="ch"><span class="lg"><img src="../assets/img/logo.png" alt="Sankruv Media" width="525" height="256"></span><span class="st"><i></i><span>Password reset</span></span></div>
      <h2>Set a new password</h2>
      <p class="sub">This private link works once. Choose the account, confirm its User ID and type a new password.</p>
      <?php if ($err): ?><p class="err" role="alert"><?= ic('x') ?><span><?= h($err) ?></span></p><?php endif; ?>
      <?= csrf_field() ?>
      <label for="acct">Account</label>
      <div class="in"><?= ic('user') ?><select id="acct" name="uid" required><?php foreach ($users as $u): ?><option value="<?= (int) $u['id'] ?>" data-user="<?= h($u['username']) ?>"<?= (int) ($_POST['uid'] ?? ($first['id'] ?? 0)) === (int) $u['id'] ? ' selected' : '' ?>><?= h($u['name'] . ' (ID: ' . $u['username'] . ($u['role'] === 'owner' ? ', owner' : '') . ')') ?></option><?php endforeach; ?></select></div>
      <label for="u">User ID</label>
      <div class="in"><?= ic('tag') ?><input id="u" name="username" required value="<?= $val('username', (string) ($first['username'] ?? '')) ?>" autocomplete="username" spellcheck="false" autocapitalize="off"></div>
      <div class="two">
        <div><label for="p">New password</label><div class="in"><?= ic('lock') ?><input id="p" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></div></div>
        <div><label for="p2">Repeat password</label><div class="in"><?= ic('lock') ?><input id="p2" name="password2" type="password" required minlength="8" autocomplete="new-password"></div></div>
      </div>
      <button type="submit" class="go" id="go"><span class="sp" aria-hidden="true"></span><span class="t">Save and sign in <?= ic('arrow') ?></span></button>
    </form>
  </div>
  <script src="assets/login.js?v=<?= (int) @filemtime(__DIR__ . '/assets/login.js') ?>" defer></script>
</body>
</html>
