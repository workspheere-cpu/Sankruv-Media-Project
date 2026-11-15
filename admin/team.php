<?php
/* Team accounts (owner only) and changing your own password (everyone). */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
require __DIR__ . '/_layout.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $do = (string) ($_POST['do'] ?? '');
    if ($do === 'password') {
        $cur = (string) ($_POST['current'] ?? '');
        $row = one('SELECT pass FROM users WHERE id = ?', [$me['id']]);
        if (!password_verify($cur, $row['pass'])) flash('Your current password is not correct.', 'bad');
        elseif ($p = password_problem((string) ($_POST['new'] ?? ''), (string) ($_POST['new2'] ?? ''))) flash($p, 'bad');
        else { q('UPDATE users SET pass = ? WHERE id = ?', [password_hash((string) $_POST['new'], PASSWORD_DEFAULT), $me['id']]); session_regenerate_id(true); flash('Password changed.'); }
        redirect('team.php');
    }
    if (!is_owner()) { flash('Only the owner can manage team accounts.', 'bad'); redirect('team.php'); }
    if ($do === 'add') {
        $u = strtolower(trim((string) ($_POST['username'] ?? ''))); $n = trim((string) ($_POST['name'] ?? '')); $e = trim((string) ($_POST['email'] ?? ''));
        $role = ($_POST['role'] ?? '') === 'owner' ? 'owner' : 'member';
        if ($n === '' || !valid_username($u)) flash('Add a name and an ID of 3 to 32 lowercase letters, numbers, dots, dashes or underscores.', 'bad');
        elseif ($e !== '' && !filter_var($e, FILTER_VALIDATE_EMAIL)) flash('Enter a valid email address, or leave it empty.', 'bad');
        elseif (one('SELECT id FROM users WHERE username = ?', [$u])) flash('That ID is already taken.', 'bad');
        elseif ($p = password_problem((string) ($_POST['pass'] ?? ''), (string) ($_POST['pass2'] ?? ''))) flash($p, 'bad');
        else { q('INSERT INTO users (username, name, email, role, pass, created_at) VALUES (?,?,?,?,?,?)', [$u, mb_substr($n, 0, 80), $e, $role, password_hash((string) $_POST['pass'], PASSWORD_DEFAULT), now()]); flash($n . ' can now sign in with the ID ' . $u . '.'); }
        redirect('team.php');
    }
    $uid = (int) ($_POST['uid'] ?? 0);
    $target = one('SELECT * FROM users WHERE id = ?', [$uid]);
    if (!$target || $uid === (int) $me['id']) { flash('You cannot change your own access here.', 'bad'); redirect('team.php'); }
    if ($do === 'toggle') { q('UPDATE users SET active = ? WHERE id = ?', [(int) $target['active'] ? 0 : 1, $uid]); flash($target['name'] . ((int) $target['active'] ? ' can no longer sign in.' : ' can sign in again.')); }
    if ($do === 'reset') {
        if ($p = password_problem((string) ($_POST['pass'] ?? ''), (string) ($_POST['pass'] ?? ''))) flash($p, 'bad');
        else { q('UPDATE users SET pass = ?, fails = 0, locked_until = 0 WHERE id = ?', [password_hash((string) $_POST['pass'], PASSWORD_DEFAULT), $uid]); flash('New password set for ' . $target['name'] . '. Share it with them privately.'); }
    }
    redirect('team.php');
}
$users = q('SELECT * FROM users ORDER BY role = \'owner\' DESC, name COLLATE NOCASE')->fetchAll();
page_start('Team', 'team');
?>
<section class="page-h"><div><h1>Team and security</h1><p class="lead">Give each team member their own ID. Owners can manage accounts and delete clients; team members can do everything else.</p></div></section>
<div class="two-col">
  <?php if (is_owner()): ?>
  <section class="panel">
    <header class="ph"><h2><?= ic('users') ?>Accounts</h2></header>
    <ul class="people big">
      <?php foreach ($users as $u): ?>
      <li><?= avatar($u, 'sm') ?><span><b><?= h($u['name']) ?><?= (int) $u['id'] === (int) $me['id'] ? ' (you)' : '' ?></b><small><?= h($u['username']) ?>, <?= $u['role'] === 'owner' ? 'Owner' : 'Team member' ?>, <?= $u['last_login'] ? 'last sign-in ' . h(strtolower(ago($u['last_login']))) : 'never signed in' ?></small></span>
        <?php if ((int) $u['id'] !== (int) $me['id']): ?>
        <span class="u-act">
          <?= chip((int) $u['active'] ? 'Active' : 'Disabled', (int) $u['active'] ? 'ok' : 'mute') ?>
          <form method="post"><?= csrf_field() ?><input type="hidden" name="do" value="toggle"><input type="hidden" name="uid" value="<?= (int) $u['id'] ?>"><button class="btn ghost sm" type="submit"><?= (int) $u['active'] ? 'Disable' : 'Enable' ?></button></form>
          <details class="reset"><summary class="btn ghost sm">New password</summary><form method="post" class="inline-f"><?= csrf_field() ?><input type="hidden" name="do" value="reset"><input type="hidden" name="uid" value="<?= (int) $u['id'] ?>"><input type="password" name="pass" minlength="10" required placeholder="At least 10 characters" autocomplete="new-password" aria-label="New password"><button class="btn pri sm" type="submit">Save</button></form></details>
        </span>
        <?php endif; ?>
      </li>
      <?php endforeach; ?>
    </ul>
  </section>
  <section class="panel">
    <header class="ph"><h2><?= ic('plus') ?>Add a team member</h2></header>
    <form method="post" class="form-g"><?= csrf_field() ?><input type="hidden" name="do" value="add">
      <label class="fld">Name<input name="name" required maxlength="80"></label>
      <label class="fld">User ID<input name="username" required maxlength="32" pattern="[a-z0-9._\-]{3,32}" placeholder="for example: riya" autocapitalize="off" spellcheck="false"></label>
      <label class="fld">Email (optional)<input name="email" type="email" maxlength="120"></label>
      <label class="fld">Role<select name="role"><option value="member">Team member</option><option value="owner">Owner</option></select></label>
      <label class="fld">Password<input name="pass" type="password" required minlength="10" autocomplete="new-password"></label>
      <label class="fld">Repeat password<input name="pass2" type="password" required minlength="10" autocomplete="new-password"></label>
      <button class="btn pri" type="submit"><?= ic('check') ?>Create account</button>
    </form>
  </section>
  <?php endif; ?>
  <section class="panel">
    <header class="ph"><h2><?= ic('lock') ?>Change your password</h2></header>
    <form method="post" class="form-g"><?= csrf_field() ?><input type="hidden" name="do" value="password">
      <label class="fld">Current password<input name="current" type="password" required autocomplete="current-password"></label>
      <label class="fld">New password<input name="new" type="password" required minlength="10" autocomplete="new-password"></label>
      <label class="fld">Repeat new password<input name="new2" type="password" required minlength="10" autocomplete="new-password"></label>
      <button class="btn pri" type="submit"><?= ic('check') ?>Change password</button>
    </form>
  </section>
</div>
<?php page_end();
