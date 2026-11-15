"""Generates the Client Hub email templates (admin/emails/*.html) from one consistent design.
Email-safe: tables, inline styles, no external CSS, works in Gmail, Outlook, Apple Mail and phones."""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'admin' / 'emails'
F = 'Arial,Helvetica,sans-serif'
P = f'style="margin:0 0 16px;font:16px/1.65 {F};color:#344054;"'


def p(text):
    return f'<p {P}>{text}</p>'


def h2(text):
    return f'<p style="margin:22px 0 8px;font:bold 15px/1.4 {F};color:#101828;">{text}</p>'


def facts(rows):
    out = [f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;border-collapse:separate;border:1px solid #cdeced;border-radius:16px;background:#f4fbfb;">']
    for i, (label, value, *sect) in enumerate(rows):
        border = '' if i == len(rows) - 1 else 'border-bottom:1px solid #dff2f2;'
        row = (f'<tr><td style="padding:13px 18px;font:14px {F};color:#667085;{border}">{label}</td>'
               f'<td align="right" style="padding:13px 18px;font:bold 15px {F};color:#101828;{border}">{value}</td></tr>')
        out.append(f'{{{{#{sect[0]}}}}}{row}{{{{/{sect[0]}}}}}' if sect else row)
    out.append('</table>')
    return '\n'.join(out)


def big(label, value, sub=''):
    """A large highlighted figure, for amounts."""
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;"><tr>'
            f'<td align="center" style="padding:22px 16px;border-radius:18px;background:#0b0e18;background-image:linear-gradient(135deg,#132029,#0b0e18);">'
            f'<p style="margin:0;font:bold 12px {F};letter-spacing:.04em;color:#8be7e8;">{label}</p>'
            f'<p style="margin:6px 0 0;font:bold 34px/1.1 {F};color:#ffffff;">{value}</p>'
            + (f'<p style="margin:6px 0 0;font:13px {F};color:#9aa6b2;">{sub}</p>' if sub else '') +
            '</td></tr></table>')


def detail_box(label, text):
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;"><tr>'
            f'<td style="padding:20px 22px;border-radius:18px;background:#0b0e18;background-image:linear-gradient(135deg,#132029,#0b0e18);">'
            f'<p style="margin:0;font:bold 12px {F};letter-spacing:.04em;color:#8be7e8;">{label}</p>'
            f'<p style="margin:8px 0 0;font:bold 17px/1.55 {F};color:#ffffff;">{text}</p></td></tr></table>')


def steps(items):
    rows = []
    for i, (title, text) in enumerate(items, 1):
        rows.append(f'<tr><td valign="top" style="padding:0 14px 14px 0;width:34px;"><div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:#e8f6f6;color:#1f9a9c;font:bold 14px/30px {F};text-align:center;">{i}</div></td>'
                    f'<td valign="top" style="padding:4px 0 14px;font:15px/1.55 {F};color:#344054;"><b style="color:#101828;">{title}</b><br>{text}</td></tr>')
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 10px;">' + ''.join(rows) + '</table>'


def button(label, url, secondary=None):
    second = ''
    if secondary:
        second = (f'<td style="width:10px;"></td><td style="border-radius:12px;border:1.5px solid #cdeced;"><a href="{secondary[1]}" style="display:inline-block;padding:13px 20px;font:bold 15px {F};color:#1f9a9c;text-decoration:none;border-radius:12px;">{secondary[0]}</a></td>')
    return (f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 24px;"><tr>'
            f'<td style="border-radius:12px;background:#1f9a9c;background-image:linear-gradient(180deg,#3fc0c2,#1f9a9c);box-shadow:0 8px 18px -8px rgba(31,154,156,.7);"><a href="{url}" style="display:inline-block;padding:14px 26px;font:bold 15px {F};color:#ffffff;text-decoration:none;border-radius:12px;">{label} &rarr;</a></td>{second}</tr></table>')


def quote(var):
    return f'{{{{#{var}}}}}<p style="margin:0 0 18px;padding:14px 18px;border-left:3px solid #48bec0;border-radius:0 12px 12px 0;background:#f7f9fa;font:italic 15px/1.6 {F};color:#475467;">{{{{{var}}}}}</p>{{{{/{var}}}}}'


T = {}

T['enquiry-received'] = dict(
    subject='Thank you, {{first_name}}. We have your enquiry', preheader='Our team will contact you within one working day with ideas and a plan.',
    tag='Enquiry received', headline='Thank you, {{first_name}}!', subline='Your enquiry is with our team.',
    title='Thank you for your enquiry', about='Sent to a new lead when the website contact form creates them. Confirms the brief and sets expectations.',
    body=[p('We have received your enquiry and the team is already looking at it. Here is what you shared with us:'),
          facts([('Services', '{{services}}'), ('Start', '{{timeline}}'), ('Reference', '{{reference}}')]), quote('message'),
          h2('What happens next'),
          steps([('We study your brand', 'Your goals, audience and competitors.'), ('We get in touch', 'A call or WhatsApp within one working day.'), ('You get a clear plan', 'Scope, timeline and a free quote.')]),
          p('Want to talk sooner? Message us on WhatsApp and we will reply right away.'), button('Chat on WhatsApp', '{{whatsapp_url}}')])

T['welcome'] = dict(
    subject='Welcome to {{brand}}, {{first_name}}', preheader='We are excited to start working on {{client_company}}. Here is how we will work together.',
    tag='Welcome on board', headline='Welcome on board, {{first_name}}', subline='Great brands are built together. Let us begin.',
    title='Welcome a new client', about='Sent when a client becomes active. Introduces the team and how you will work together.',
    body=[p('Thank you for choosing {{brand}}. We are excited to work with <b style="color:#101828;">{{client_company}}</b> and help your brand get noticed, remembered and chosen.'),
          facts([('Your services', '{{client_services}}'), ('Client ID', '{{reference}}')]),
          h2('How we will work together'),
          steps([('Kick-off call', 'We align on goals, audience and brand voice.'), ('Monthly plan', 'You review and approve the plan before production starts.'),
                 ('Create and launch', 'Design, shoots and publishing, handled by one team.'), ('Report', 'Every month you see what worked and what we improve next.')]),
          p('For anything at all, reply to this email or message us on WhatsApp. We are here for you.'), button('Message our team', '{{whatsapp_url}}')])

T['proposal-sent'] = dict(
    subject='Your proposal: {{project_title}}', preheader='Scope, timeline and investment for {{project_title}}.',
    tag='Proposal', headline='Your proposal is ready', subline='{{project_title}}',
    title='Send a proposal or quotation', about='Shares the scope, timeline and value of a planned project. Choose the project when sending.',
    body=[p('Hi {{first_name}}, thank you for the conversation. Here is our proposal for <b style="color:#101828;">{{project_title}}</b>.'),
          '{{#project_value}}' + big('PROJECT INVESTMENT', '{{project_value}}', 'Valid until {{valid_until}}') + '{{/project_value}}',
          facts([('Service', '{{project_service}}'), ('Start', '{{start_date}}'), ('Delivery', '{{due_date}}')]),
          '{{#project_details}}' + h2('Scope') + p('{{project_details}}') + '{{/project_details}}',
          p('Reply to this email to approve, or message us if you would like to adjust anything. We will start as soon as you give the go-ahead.'),
          button('Approve on WhatsApp', '{{whatsapp_url}}', ('Ask a question', 'mailto:{{brand_email}}'))])

T['project-confirmed'] = dict(
    subject='Confirmed: {{project_title}}', preheader='Your project is confirmed. Delivery by {{due_date}}.',
    tag='Project confirmed', headline='Your project is confirmed', subline='{{project_title}}',
    title='Confirm a new project', about='Confirms a project with its service, dates and value. Choose the project when sending.',
    body=[p('Hi {{first_name}}, thank you for the go-ahead. We have scheduled your project and the team is ready to begin.'),
          facts([('Project', '{{project_title}}'), ('Service', '{{project_service}}'), ('Start date', '{{start_date}}'), ('Delivery by', '{{due_date}}'), ('Project value', '{{project_value}}', 'project_value')]),
          '{{#project_details}}' + h2('Scope') + p('{{project_details}}') + '{{/project_details}}',
          p('We will share progress at every key step. If anything changes on your side, just reply to this email.'), button('Talk to us on WhatsApp', '{{whatsapp_url}}')])

T['meeting-confirmed'] = dict(
    subject='Meeting confirmed with {{brand}}', preheader='Your meeting with our team is confirmed. Details inside.',
    tag='Meeting', headline='See you soon, {{first_name}}', subline='Your meeting with our team is confirmed.',
    title='Confirm a meeting or call', about='Confirms a meeting or call. Write the date, time and place or link in the personal note.',
    body=[p('Hi {{first_name}}, thank you for making time for us. Here are the details of our meeting:'),
          '{{#note}}' + detail_box('MEETING DETAILS', '{{note}}') + '{{/note}}',
          h2('To make the most of it'),
          steps([('Bring your goals', 'What would make the next three months a success?'), ('Share references', 'Brands, posts or websites you like.'), ('Invite decision makers', 'So we can agree on next steps together.')]),
          p('Need to change the time? Reply to this email or message us on WhatsApp.'), button('Message us', '{{whatsapp_url}}')])

T['payment-request'] = dict(
    subject='Payment due: {{payment_label}} ({{amount}})', preheader='{{amount}} is due on {{payment_due}}. Payment details inside.',
    tag='Payment request', headline='Payment request', subline='{{payment_label}}',
    title='Request a payment', about='Asks the client to pay an invoice, advance or retainer. Choose the payment when sending.',
    body=[p('Hi {{first_name}}, here are the details for your upcoming payment to {{brand}}.'),
          big('AMOUNT DUE', '{{amount}}', 'Due on {{payment_due}}'),
          facts([('For', '{{payment_label}}'), ('Reference', '{{invoice_no}}')]),
          h2('How to pay'), p('{{payment_info}}'),
          p('Please mention <b style="color:#101828;">{{invoice_no}}</b> with your payment. We will send a receipt as soon as it arrives.'),
          button('Questions? WhatsApp us', '{{whatsapp_url}}')])

T['payment-reminder'] = dict(
    subject='Friendly reminder: {{payment_label}} is due', preheader='A quick reminder about {{amount}} due on {{payment_due}}.',
    tag='Payment reminder', headline='A friendly reminder', subline='{{payment_label}}',
    title='Remind about a pending payment', about='A polite reminder for a payment that is due or overdue. Choose the payment when sending.',
    body=[p('Hi {{first_name}}, we hope all is well. This is a quick reminder that the payment below is still open.'),
          big('STILL OPEN', '{{amount}}', 'Was due on {{payment_due}}'),
          facts([('For', '{{payment_label}}'), ('Reference', '{{invoice_no}}')]),
          h2('How to pay'), p('{{payment_info}}'),
          p('If you have already paid, thank you, and please ignore this email. If something is holding it up, just reply and we will help.'),
          button('Reply on WhatsApp', '{{whatsapp_url}}')])

T['payment-received'] = dict(
    subject='Payment received, thank you! ({{amount}})', preheader='We have received {{amount}} for {{payment_label}}. Your receipt is inside.',
    tag='Payment receipt', headline='Payment received, thank you!', subline='Keep this email as your receipt.',
    title='Payment received receipt', about='Thanks the client and confirms the amount received. Sent automatically when a payment is marked as paid.',
    body=[p('Hi {{first_name}}, we have received your payment. Thank you for your trust in {{brand}}.'),
          big('AMOUNT RECEIVED', '{{amount}}', 'Paid on {{paid_date}}'),
          facts([('Receipt number', '{{receipt_no}}'), ('For', '{{payment_label}}'), ('Status', '<span style="color:#067647;">&#10003; Paid</span>'), ('Balance on your account', '{{balance}}', 'balance')]),
          p('Need a formal invoice or GST bill? Just reply to this email and we will share it.')])

T['renewal-reminder'] = dict(
    subject='Your {{brand}} plan renews soon', preheader='Your monthly plan renews on {{payment_due}}. Nothing to do if you are happy to continue.',
    tag='Renewal', headline='Your plan renews soon', subline='Thank you for growing with us.',
    title='Retainer renewal reminder', about='Lets a client know their monthly retainer is about to renew. Choose the payment when sending.',
    body=[p('Hi {{first_name}}, a quick heads-up that your monthly plan with {{brand}} renews soon.'),
          big('RENEWAL AMOUNT', '{{amount}}', 'Renews on {{payment_due}}'),
          facts([('Plan', '{{payment_label}}'), ('Services', '{{client_services}}'), ('Reference', '{{invoice_no}}')]),
          p('Nothing to do if you are happy to continue. Want to add a service, change the scope or pause for a month? Just reply and we will set it up.'),
          button('Talk to us', '{{whatsapp_url}}')])

T['monthly-report'] = dict(
    subject='Your monthly report from {{brand}}', preheader='How your brand performed this month and what we will do next.',
    tag='Monthly report', headline='Your monthly report is ready', subline='{{month}}',
    title='Share the monthly report', about='Shares the monthly results. Add the highlights or the report link in the personal note.',
    body=[p('Hi {{first_name}}, here is a summary of what we achieved for {{client_company}} this month.'),
          quote('note'),
          h2('What we will focus on next'),
          steps([('Double down on what worked', 'More of the content and channels that performed best.'), ('Fix what did not', 'Clear changes for anything below target.'), ('Plan ahead', 'Next month\'s calendar is ready for your review.')]),
          p('Happy to walk you through the numbers on a quick call.'), button('Book a quick call', '{{whatsapp_url}}')])

T['project-delivered'] = dict(
    subject='Delivered: {{project_title}}', preheader='Your project is complete. Thank you for working with us.',
    tag='Project delivered', headline='Your project is live!', subline='{{project_title}}',
    title='Project delivered', about='Celebrates a finished project and asks for a review. Can go out automatically when a project is marked Delivered.',
    body=[p('Hi {{first_name}}, we are happy to share that <b style="color:#101828;">{{project_title}}</b> is complete and delivered. Thank you for working with us on it.'),
          p('If you would like any final changes, reply to this email and we will take care of it.'),
          h2('Enjoyed working with us?'), p('A short review helps other brands find us, and it means a lot to our team.'),
          button('Leave a quick review', '{{review_url}}'),
          p('Planning what is next? We would love to help with your next campaign, website or shoot.')])

T['feedback-request'] = dict(
    subject='{{first_name}}, how are we doing?', preheader='Two minutes of feedback helps us serve {{client_company}} better.',
    tag='Feedback', headline='How are we doing?', subline='Your honest feedback shapes our work.',
    title='Ask for feedback or a review', about='Asks a happy client for a review or honest feedback.',
    body=[p('Hi {{first_name}}, thank you for working with {{brand}}. We would love to hear how we are doing.'),
          steps([('Leave a review', 'A few lines on Google helps other brands find us.'), ('Or just reply', 'Tell us what we should keep doing and what we should improve.')]),
          button('Write a review', '{{review_url}}', ('Reply by email', 'mailto:{{brand_email}}')),
          p('Thank you for your trust. It means a lot to the whole team.')])

ORDER = ['enquiry-received', 'welcome', 'proposal-sent', 'project-confirmed', 'meeting-confirmed', 'payment-request', 'payment-reminder', 'payment-received', 'renewal-reminder', 'monthly-report', 'project-delivered', 'feedback-request']

for f in OUT.glob('*.html'):
    if not f.name.startswith('_'):
        f.unlink()
for slug in ORDER:
    t = T[slug]
    meta = '\n'.join(f'{k}: {t[k]}' for k in ['subject', 'preheader', 'tag', 'headline', 'subline', 'title', 'about'])
    (OUT / f'{slug}.html').write_text(f'<!--\n{meta}\n-->\n' + '\n'.join(t['body']) + '\n')

LAYOUT = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>{{{{subject}}}}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f4;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f4;">{{{{preheader}}}}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f4;">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <!-- header: logo in the middle, headline on the dark brand band -->
      <tr><td align="center" bgcolor="#0b0e18" style="background:#0b0e18;background-image:radial-gradient(120% 90% at 100% 0%,#1d4d50 0%,rgba(11,14,24,0) 55%),linear-gradient(160deg,#141b2b,#0b0e18);border-radius:24px 24px 0 0;padding:34px 32px 30px;">
        <img src="{{{{logo_url}}}}" width="132" alt="{{{{brand}}}}" style="display:block;margin:0 auto;width:132px;max-width:132px;height:auto;border:0;color:#ffffff;font:bold 20px {F};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 0;"><tr><td style="border:1px solid #2f6f71;border-radius:999px;padding:5px 14px;font:bold 12px {F};color:#8be7e8;">{{{{tag}}}}</td></tr></table>
        <p style="margin:14px 0 0;font:bold 28px/1.25 {F};color:#ffffff;">{{{{headline}}}}</p>
        <p style="margin:8px 0 0;font:15px/1.5 {F};color:#9aa6b2;">{{{{subline}}}}</p>
      </td></tr>
      <tr><td style="height:4px;line-height:4px;font-size:0;background:#48bec0;background-image:linear-gradient(90deg,#1f9a9c,#8be7e8,#1f9a9c);">&nbsp;</td></tr>
      <!-- body -->
      <tr><td style="background:#ffffff;padding:34px 32px 10px;font:16px/1.65 {F};color:#344054;">
@@CONTENT@@
{{{{#note_box}}}}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;"><tr><td style="padding:16px 18px;border-radius:16px;background:#fffaeb;border:1px solid #fedf89;font:15px/1.6 {F};color:#344054;"><b style="display:block;margin-bottom:4px;font-size:13px;color:#b54708;">A note from {{{{sender}}}}</b>{{{{note_box}}}}</td></tr></table>{{{{/note_box}}}}
      </td></tr>
      <!-- signature and quick contact -->
      <tr><td style="background:#ffffff;padding:4px 32px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e4e7ec;"><tr>
          <td style="padding-top:20px;font:15px/1.6 {F};color:#344054;">Warm regards,<br><b style="color:#101828;">{{{{sender}}}}</b><br><span style="color:#667085;font-size:13px;">Team {{{{brand}}}}</span></td>
          <td align="right" valign="bottom" style="padding-top:20px;">
            <a href="{{{{whatsapp_url}}}}" style="display:inline-block;margin-left:6px;padding:9px 14px;border-radius:999px;background:#e8f6f6;font:bold 13px {F};color:#1f9a9c;text-decoration:none;">WhatsApp</a>
            <a href="tel:{{{{brand_phone_tel}}}}" style="display:inline-block;margin-left:6px;padding:9px 14px;border-radius:999px;background:#e8f6f6;font:bold 13px {F};color:#1f9a9c;text-decoration:none;">Call</a>
          </td></tr></table>
      </td></tr>
      <!-- footer -->
      <tr><td align="center" style="background:#0b0e18;border-radius:0 0 24px 24px;padding:24px 32px;font:13px/1.6 {F};color:#9aa6b2;">
        <p style="margin:0 0 6px;font-weight:bold;color:#e8eef3;">{{{{brand_tagline}}}}</p>
        <p style="margin:0 0 8px;"><a href="mailto:{{{{brand_email}}}}" style="color:#8be7e8;text-decoration:none;">{{{{brand_email}}}}</a> &nbsp;|&nbsp; <a href="tel:{{{{brand_phone_tel}}}}" style="color:#8be7e8;text-decoration:none;">{{{{brand_phone}}}}</a> &nbsp;|&nbsp; <a href="{{{{site_url}}}}" style="color:#8be7e8;text-decoration:none;">{{{{site_host}}}}</a></p>
        <p style="margin:0;font-size:12px;color:#667085;">{{{{brand}}}}, {{{{brand_city}}}}. You are receiving this because you work with or enquired with {{{{brand}}}}. Reply any time to reach our team.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
'''
(OUT / '_layout.html').write_text(LAYOUT)
print('templates:', len(ORDER))
