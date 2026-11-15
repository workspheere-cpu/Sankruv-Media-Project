<?php
/* Download every client as a CSV file (opens in Excel or Google Sheets). */
declare(strict_types=1);
require __DIR__ . '/_boot.php';
sk_session();
require_login();
if (!is_owner()) { http_response_code(403); exit('Only the owner can export the client list.'); }
$rows = q("SELECT c.*, (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS projects,
  (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id) AS billed,
  (SELECT COALESCE(SUM(amount),0) FROM payments y WHERE y.client_id = c.id AND y.status = 'pending') AS pending
  FROM clients c ORDER BY c.name COLLATE NOCASE")->fetchAll();
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="sankruv-clients-' . date('Y-m-d') . '.csv"');
$out = fopen('php://output', 'w');
fwrite($out, "\xEF\xBB\xBF");
$cols = ['name' => 'Name', 'company' => 'Company', 'status' => 'Status', 'industry' => 'Industry', 'contact_person' => 'Contact person', 'phone' => 'Phone', 'whatsapp' => 'WhatsApp',
    'email' => 'Email', 'website' => 'Website', 'instagram' => 'Instagram', 'city' => 'City', 'address' => 'Address', 'gst' => 'GST number', 'source' => 'Source',
    'services' => 'Services', 'projects' => 'Projects', 'billed' => 'Billed (INR)', 'pending' => 'Pending (INR)', 'created_at' => 'Added on'];
fputcsv($out, array_values($cols));
$safe = fn($v) => preg_match('/^[=+\-@\t\r]/', (string) $v) ? "'" . $v : (string) $v;
foreach ($rows as $r) {
    $r['status'] = SK_CLIENT_STATUS[$r['status']] ?? $r['status'];
    fputcsv($out, array_map(fn($k) => $safe($r[$k] ?? ''), array_keys($cols)));
}
fclose($out);
