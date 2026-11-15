<?php
/* Client Hub, React version. This page only checks the sign-in and loads the app; all screens are in assets/hubapp.js
   (source: react/admin). Data comes from data.php, changes go through api.php. */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
$me = require_login();
$boot = [
    'csrf' => csrf(), 'user' => ['id' => (int) $me['id'], 'name' => $me['name'], 'username' => $me['username'], 'owner' => is_owner(), 'hue' => hue((string) $me['name']), 'init' => initials((string) $me['name'])],
    'brand' => $CFG['brand'], 'app' => $CFG['app'], 'site_url' => $CFG['site_url'], 'test_mode' => test_mode(), 'mail_on' => mail_enabled(), 'today' => today(),
    'services' => SK_SERVICES, 'client_status' => SK_CLIENT_STATUS, 'project_status' => SK_PROJECT_STATUS, 'priority' => SK_PRIORITY, 'pay_status' => SK_PAY_STATUS,
    'log_kinds' => SK_LOG_KINDS, 'industries' => SK_INDUSTRIES,
    'templates' => array_values(array_map(fn($t) => ['slug' => $t['slug'], 'title' => $t['title'], 'about' => $t['about']], mail_templates())),
];
$v = fn(string $f) => (string) @filemtime(__DIR__ . '/assets/' . $f);
?><!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0e18">
<title><?= h($CFG['app'] . ' | ' . $CFG['brand']) ?></title>
<link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Client Hub">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/hub.css?v=<?= h($v('hub.css')) ?>">
<link rel="stylesheet" href="assets/hubapp.css?v=<?= h($v('hubapp.css')) ?>">
</head>
<body class="app js">
<div id="hub"><div class="hub-boot"><img src="assets/icons/icon-192.png" alt="" width="72" height="72"><span></span></div></div>
<noscript><p style="padding:24px">The Client Hub needs JavaScript. You can also use the <a href="index.php?classic=1">classic view</a>.</p></noscript>
<script type="application/json" id="hub-boot"><?= json_encode($boot, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
<script src="assets/hubapp.js?v=<?= h($v('hubapp.js')) ?>" defer></script>
</body>
</html>
