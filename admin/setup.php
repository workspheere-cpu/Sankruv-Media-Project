<?php
/**
 * First-run setup: creates the owner account. Works only while no account exists, and only with
 * the one-time setup code that the server writes to setup-code.txt in the hub's data folder.
 * Nobody can read that file over the web; open it with Hostinger's File Manager.
 */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
if (users_exist()) redirect('login.php');

$codeFile = sk_data_dir() . '/setup-code.txt';
if (!is_file($codeFile)) {
    $code = strtoupper(bin2hex(random_bytes(3))) . '-' . strtoupper(bin2hex(random_bytes(3)));
    @file_put_contents($codeFile, "Sankruv Media Client Hub setup code\n\n" . $code . "\n\nEnter this on the setup page. The file is deleted once the owner account exists.\n");
    @chmod($codeFile, 0600);
}
preg_match('/[0-9A-F]{6}-[0-9A-F]{6}/', (string) @file_get_contents($codeFile), $m);
$expected = $m[0] ?? '';
$where = sk_data_inside_web() ? 'public_html' . str_replace(str_replace('\\', '/', rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), '/')), '', str_replace('\\', '/', sk_data_dir())) : 'the folder sankruv-client-hub-data, next to public_html';

/* A private one-time link (setup.php?key=...) can stand in for the code file. The key lives only in the
   server's config.php, never in the public repository, and stops working once the owner account exists. */
$linkKey = (string) ($CFG['setup_key'] ?? '');
$viaLink = strlen($linkKey) >= 24 && hash_equals($linkKey, (string) ($_GET['key'] ?? ''));

$err = '';
$val = fn($k) => h($_POST[$k] ?? '');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $name = trim((string) ($_POST['name'] ?? ''));
    $username = strtolower(trim((string) ($_POST['username'] ?? '')));
    $email = trim((string) ($_POST['email'] ?? ''));
    $pass = (string) ($_POST['password'] ?? '');
    $code = $viaLink ? $expected : strtoupper(trim((string) ($_POST['code'] ?? '')));
    if (!rate_ok('setup', 10, 900)) $err = 'Too many attempts. Please wait 15 minutes and try again.';
    elseif ($expected === '' || !hash_equals($expected, $code)) $err = 'That setup code does not match. Copy it again from setup-code.txt.';
    elseif ($name === '' || mb_strlen($name) > 80) $err = 'Enter your name.';
    elseif (!valid_username($username)) $err = 'Your ID can use 3 to 32 lowercase letters, numbers, dots, dashes or underscores.';
    elseif ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $err = 'Enter a valid email address, or leave it empty.';
    elseif ($p = password_problem($pass, (string) ($_POST['password2'] ?? ''))) $err = $p;
    else {
        q('INSERT INTO users (username, name, email, role, pass, created_at) VALUES (?, ?, ?, ?, ?, ?)', [$username, $name, $email, 'owner', password_hash($pass, PASSWORD_DEFAULT), now()]);
        @unlink($codeFile);
        attempt_login($username, $pass);
        flash('Your Client Hub is ready. Start by adding your first client.');
        redirect('index.php');
    }
}
?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Set up | Sankruv Media Client Hub</title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;family=Anton&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/login.css?v=<?= (int) @filemtime(__DIR__ . '/assets/login.css') ?>">
</head>
<body class="login setup" data-now="<?= time() ?>">
  <div class="sky" aria-hidden="true"></div>
  <canvas id="core" aria-hidden="true"></canvas>
  <div class="wrap one">
    <form class="card wide" id="card" method="post" novalidate>
      <div class="ch"><span class="lg"><img src="../assets/img/logo.png" alt="Sankruv Media" width="525" height="256"></span><span class="st"><i></i><span>First-time setup</span></span></div>
      <h2>Create the owner account</h2>
      <p class="sub">This page works once. The owner can add team members later.</p>
      <?php if ($viaLink): ?>
      <div class="howto"><?= ic('shield') ?><p>This private setup link is verified. Choose your own User ID and password. Only you will know the password.</p></div>
      <?php else: ?>
      <div class="howto"><?= ic('lock') ?><p>For safety, open <b>setup-code.txt</b> with Hostinger's File Manager in <b><?= h($where) ?></b>, and copy the code below. The file is deleted when setup is finished.</p></div>
      <?php endif; ?>
      <?php if ($err): ?><p class="err" role="alert"><?= ic('x') ?><span><?= h($err) ?></span></p><?php endif; ?>
      <?= csrf_field() ?>
      <?php if (!$viaLink): ?>
      <label for="code">Setup code</label>
      <div class="in"><?= ic('shield') ?><input id="code" name="code" required placeholder="XXXXXX-XXXXXX" value="<?= $val('code') ?>" autocomplete="off" spellcheck="false" autocapitalize="characters"></div>
      <?php endif; ?>
      <div class="two">
        <div><label for="n">Your name</label><div class="in"><?= ic('user') ?><input id="n" name="name" required value="<?= $val('name') ?>" autocomplete="name"></div></div>
        <div><label for="u">User ID</label><div class="in"><?= ic('tag') ?><input id="u" name="username" required value="<?= $val('username') ?>" autocomplete="username" spellcheck="false" autocapitalize="off" placeholder="for example: owner"></div></div>
      </div>
      <label for="e">Email (optional)</label>
      <div class="in"><?= ic('mail') ?><input id="e" name="email" type="email" value="<?= $val('email') ?>" autocomplete="email"></div>
      <div class="two">
        <div><label for="p">Password</label><div class="in"><?= ic('lock') ?><input id="p" name="password" type="password" required autocomplete="new-password" placeholder="At least <?= test_mode() ? 4 : 8 ?> characters"></div></div>
        <div><label for="p2">Repeat password</label><div class="in"><?= ic('lock') ?><input id="p2" name="password2" type="password" required autocomplete="new-password"></div></div>
      </div>
      <button type="submit" class="go" id="go"><span class="sp" aria-hidden="true"></span><span class="t">Create account and open the hub <?= ic('arrow') ?></span></button>
    </form>
  </div>
  <script src="assets/login.js?v=<?= (int) @filemtime(__DIR__ . '/assets/login.js') ?>" defer></script>
</body>
</html>
