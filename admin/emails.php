<?php
/* Client email templates: see each one, preview it with sample or real data, and check whether sending is on. */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();

$tpls = mail_templates();
$slug = (string) ($_GET['preview'] ?? '');
if ($slug !== '') {
    if (!isset($tpls[$slug])) { http_response_code(404); exit('Unknown email.'); }
    $cid = (int) ($_GET['client'] ?? 0);
    try {
        $vars = $cid ? ['note' => mb_substr((string) ($_GET['note'] ?? ''), 0, 1000), 'sender' => (string) ($me['name'] ?? '')] + mail_vars($cid, (int) ($_GET['project'] ?? 0), (int) ($_GET['payment'] ?? 0)) + mail_sample_vars() : mail_sample_vars();
        $samples = ['meeting-confirmed' => 'Thursday, 11:00 am at our Andheri studio. Joining online? meet.google.com/abc-defg-hij',
            'monthly-report' => 'Reach up 38%, 1,240 new followers and 3 reels above 50,000 views. Full report: drive.google.com/your-report'];
        if (!$cid && isset($samples[$slug])) $vars['note'] = $samples[$slug];
        $vars['logo_url'] = '../assets/img/logo.png';   /* the preview shows the logo from this server */
        [$subject, $html] = mail_render($slug, $vars);
    } catch (Throwable $e) { http_response_code(404); exit('This preview could not be made.'); }
    /* the email loads its logo from the public website, so allow images from https for this page only */
    header("Content-Security-Policy: default-src 'none'; img-src https: data: 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'", true);
    header('X-Frame-Options: SAMEORIGIN', true);
    header('Cross-Origin-Resource-Policy: same-origin', true);
    header('Content-Type: text/html; charset=utf-8');
    echo str_replace('<title>', '<title>Preview: ', $html);
    exit;
}

require __DIR__ . '/_layout.php';
$c = mail_cfg();
$autoFor = ['enquiry-received' => 'enquiry_received', 'payment-received' => 'payment_received', 'project-delivered' => 'project_delivered', 'project-confirmed' => 'project_confirmed', 'welcome' => 'welcome'];
page_start('Client emails', 'emails');
?>
<section class="page-h">
  <div><h1>Client emails</h1><p class="lead">Ready-made emails in your brand: thank you, welcome, project confirmations, payment requests, reminders and receipts. Send any of them from a client's profile.</p></div>
</section>

<div class="mail-state <?= mail_enabled() ? 'on' : 'off' ?>">
  <span class="ms-i"><?= ic(mail_enabled() ? 'check' : 'lock') ?></span>
  <div><b><?= mail_enabled() ? 'Sending is on' : 'Sending is not switched on yet' ?></b>
    <p><?= mail_enabled() ? 'Emails go out from ' . h($c['from_name'] . ' <' . $c['from_email'] . '>') . ($c['smtp']['host'] ? ' through ' . h($c['smtp']['host']) : ' through the server mail function') . '. Replies go to ' . h($c['reply_to']) . '.'
      : 'Every email below can be previewed now. To send them, your developer adds the mail settings (SMTP) in config.php. The steps are in the README.' ?></p></div>
</div>

<ul class="mail-grid">
  <?php foreach ($tpls as $s => $t): $a = $autoFor[$s] ?? ''; $auto = $a && !empty($c['auto'][$a]); ?>
  <li class="mcard">
    <a class="mc-thumb" href="emails.php?preview=<?= h($s) ?>" target="_blank" rel="noopener" aria-label="Open the <?= h($t['title']) ?> preview"><iframe src="emails.php?preview=<?= h($s) ?>" loading="lazy" tabindex="-1" title="" aria-hidden="true"></iframe></a>
    <div class="mc-top"><span class="mc-i"><?= ic(['payment-request' => 'wallet', 'payment-reminder' => 'wallet', 'payment-received' => 'check', 'renewal-reminder' => 'wallet', 'proposal-sent' => 'note', 'meeting-confirmed' => 'cal', 'monthly-report' => 'trend', 'feedback-request' => 'star', 'welcome' => 'star', 'project-confirmed' => 'layers', 'project-delivered' => 'layers'][$s] ?? 'spark') ?></span>
      <?= $auto ? chip('Automatic', 'ok') : chip('Send from profile', 'mute') ?></div>
    <h2><?= h($t['title']) ?></h2>
    <p class="mc-sub"><?= h(mail_fill($t['subject'], mail_brand_vars() + mail_sample_vars(), false)) ?></p>
    <p class="mc-about"><?= h($t['about']) ?></p>
    <a class="btn ghost sm" href="emails.php?preview=<?= h($s) ?>" target="_blank" rel="noopener"><?= ic('eye') ?>Preview</a>
  </li>
  <?php endforeach; ?>
</ul>
<?php page_end();
