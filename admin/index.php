<?php
/* The Client Hub is a React app: app.php. This file only sends signed-in users there. */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
require_login();
redirect('app.php');
