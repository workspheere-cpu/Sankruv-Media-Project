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
    // Optional private first-run link: setup.php?key=THIS_VALUE (at least 24 characters).
    // It works only until the owner account exists. Never put a real key in a public repository.
    'setup_key' => '',
    // Optional one-time password reset link: reset.php?key=THIS_VALUE (at least 24 characters).
    'reset_key' => '',
    // Public website address, used for links and the logo inside client emails.
    'public_url' => 'https://www.sankruvmedia.com/',

    // Client emails (templates live in admin/emails/). Sending stays off until 'enabled' is true.
    'mail' => [
        'enabled'    => false,
        'from_email' => 'contact@sankruvmedia.com',   // must be a mailbox on your domain
        'from_name'  => 'Sankruv Media',
        'reply_to'   => 'contact@sankruvmedia.com',
        'bcc'        => '',                            // optional: a copy of every email for your records
        // Hostinger email: smtp.hostinger.com, port 465, secure 'ssl', user = the full mailbox address.
        // Leave host empty to use the server's own mail() function instead.
        'smtp' => ['host' => '', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => ''],
        // Which emails go out automatically.
        'auto' => [
            'enquiry_received'  => true,   // website enquiry: thank-you email to the visitor
            'payment_received'  => true,   // payment marked as paid: receipt to the client
            'project_delivered' => false,  // project marked Delivered: thank you and review request
            'project_confirmed' => false,  // new project created: confirmation with dates
            'welcome'           => false,  // lead changed to Active: welcome email
        ],
        'brand' => [
            'review_url'   => 'https://g.page/r/YOUR-GOOGLE-REVIEW-LINK',
            'payment_info' => 'Bank transfer or UPI. Account name: Sankruv Media. UPI: yourname@bank. Please share the payment screenshot on WhatsApp.',
        ],
    ],
];
