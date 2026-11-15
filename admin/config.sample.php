<?php
/*
 * Optional settings. Copy this file to config.php (same folder) and change what you need.
 * config.php is never committed to Git, and the website deploy leaves it alone.
 */
return [
    'brand'    => 'Sankruv Media',
    'app'      => 'Client Hub',
    'tz'       => 'Asia/Kolkata',
    // Folder for the database and session files. Leave empty to pick one automatically:
    // a folder next to public_html called sankruv-client-hub-data, or admin/data as a fallback.
    'data_dir' => '',
    // Where the "View website" link in the sidebar points.
    'site_url' => '../index.html',
];
