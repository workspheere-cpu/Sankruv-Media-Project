<?php
/* Email preview: emails.php?preview=<template>[&client=ID&project=ID&payment=ID&note=...]. The gallery itself is a React screen (app.php#/emails). */
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

redirect('app.php#/emails');
