<?php
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verify();
    $_SESSION = [];
    $p = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    session_destroy();
    redirect('login.php?m=out');
}
redirect('index.php');
