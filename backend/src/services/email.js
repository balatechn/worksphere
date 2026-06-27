const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

async function sendReminderEmail({ to, itemTitle, itemDescription, category, deadline, assignee }) {
  const categoryLabels = {
    MY_TASKS: 'My Task',
    TEAM_TASKS: 'Team Task',
    REMINDERS: 'Reminder',
    FOLLOW_UPS: 'Follow Up',
    WAITING_APPROVAL: 'Awaiting Approval',
    CALLS: 'Call',
    MEETINGS: 'Meeting',
    PROCUREMENT: 'Procurement',
    NOTES: 'Note',
    DELEGATED: 'Delegated Task',
  };

  const label = categoryLabels[category] || 'Task';
  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  await transporter.sendMail({
    from: `"WorkSphere" <${process.env.SMTP_USER}>`,
    to,
    subject: `WorkSphere Reminder: ${itemTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">WorkSphere</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your Productivity Assistant</p>
          </div>
          <div style="padding:32px;">
            <div style="display:inline-block;background:#ede9fe;color:#6366f1;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;">${label}</div>
            <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;">${itemTitle}</h2>
            ${itemDescription ? `<p style="color:#64748b;margin:0 0 16px;line-height:1.6;">${itemDescription}</p>` : ''}
            ${assignee ? `<div style="background:#f1f5f9;padding:12px 16px;border-radius:8px;margin-bottom:16px;"><span style="color:#64748b;font-size:13px;">Assigned to: </span><strong style="color:#1e293b;">${assignee}</strong></div>` : ''}
            ${deadlineStr ? `<div style="background:#fef3c7;padding:12px 16px;border-radius:8px;margin-bottom:16px;"><span style="color:#92400e;font-size:13px;">⏰ Deadline: </span><strong style="color:#92400e;">${deadlineStr}</strong></div>` : ''}
            <div style="text-align:center;margin-top:24px;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">This reminder was sent by WorkSphere productivity assistant.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

async function sendDailySummaryEmail({ to, userName, items }) {
  const pending = items.filter(i => i.status === 'PENDING');
  const urgent = items.filter(i => i.isUrgent && i.status === 'PENDING');

  await transporter.sendMail({
    from: `"WorkSphere" <${process.env.SMTP_USER}>`,
    to,
    subject: `WorkSphere Daily Summary — ${pending.length} pending tasks`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">WorkSphere</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Good morning, ${userName || 'there'}!</p>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 24px;color:#1e293b;">Your Daily Summary</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
              <div style="background:#f1f5f9;padding:16px;border-radius:8px;text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#6366f1;">${pending.length}</div>
                <div style="color:#64748b;font-size:13px;">Pending Tasks</div>
              </div>
              <div style="background:#fef2f2;padding:16px;border-radius:8px;text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#ef4444;">${urgent.length}</div>
                <div style="color:#64748b;font-size:13px;">Urgent Items</div>
              </div>
            </div>
            ${urgent.length > 0 ? `
              <h3 style="color:#ef4444;margin:0 0 12px;font-size:16px;">🔴 Urgent Items</h3>
              ${urgent.slice(0, 5).map(item => `
                <div style="padding:12px;border-left:3px solid #ef4444;background:#fef2f2;margin-bottom:8px;border-radius:0 8px 8px 0;">
                  <strong style="color:#1e293b;">${item.title}</strong>
                  ${item.assignee ? `<span style="color:#64748b;font-size:12px;"> — ${item.assignee}</span>` : ''}
                </div>
              `).join('')}
            ` : ''}
            ${pending.slice(0, 8).map(item => `
              <div style="padding:12px;border-bottom:1px solid #f1f5f9;">
                <strong style="color:#1e293b;">${item.title}</strong>
                <span style="float:right;background:#ede9fe;color:#6366f1;padding:2px 8px;border-radius:10px;font-size:11px;">${item.category.replace('_', ' ')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

async function sendMonthlyActivityReport({ to, userName, items, monthName }) {
  const total = items.length;
  const completed = items.filter(i => i.status === 'COMPLETED').length;
  const pending = items.filter(i => i.status === 'PENDING').length;
  const urgent = items.filter(i => i.isUrgent).length;

  const CATEGORY_LABELS = {
    MY_TASKS: 'My Tasks', TEAM_TASKS: 'Team Tasks', REMINDERS: 'Reminders',
    FOLLOW_UPS: 'Follow-ups', WAITING_APPROVAL: 'Waiting Approval', CALLS: 'Calls',
    MEETINGS: 'Meetings', PROCUREMENT: 'Procurement', NOTES: 'Notes', DELEGATED: 'Delegated',
  };
  const CATEGORY_ICONS = {
    MY_TASKS: '✅', TEAM_TASKS: '👥', REMINDERS: '🔔', FOLLOW_UPS: '↩️',
    WAITING_APPROVAL: '⏳', CALLS: '📞', MEETINGS: '📅', PROCUREMENT: '🛒',
    NOTES: '📝', DELEGATED: '➡️',
  };
  const STATUS_BADGE = { COMPLETED: '#22c55e', PENDING: '#f59e0b', IN_PROGRESS: '#6366f1', SNOOZED: '#94a3b8', CANCELLED: '#ef4444' };

  const grouped = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const sectionsHtml = Object.entries(grouped).map(([cat, catItems]) => {
    const rows = catItems.map(item => {
      const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
      const statusColor = STATUS_BADGE[item.status] || '#94a3b8';
      return `<tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:8px 12px;font-size:13px;color:#1e293b;">${item.title}</td>
        <td style="padding:8px 12px;font-size:12px;"><span style="background:${statusColor}22;color:${statusColor};padding:2px 8px;border-radius:10px;font-weight:500;">${item.status}</span></td>
        <td style="padding:8px 12px;font-size:12px;color:#64748b;">${deadline}</td>
        <td style="padding:8px 12px;font-size:12px;color:#64748b;">${item.assignee || '—'}</td>
      </tr>`;
    }).join('');
    return `<div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:600;color:#4f46e5;margin-bottom:8px;">${CATEGORY_ICONS[cat] || '•'} ${CATEGORY_LABELS[cat] || cat} <span style="background:#e0e7ff;color:#4f46e5;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:500;margin-left:6px;">${catItems.length}</span></div>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f1f5f9;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:500;">ITEM</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:500;">STATUS</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:500;">DEADLINE</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:500;">ASSIGNEE</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  await transporter.sendMail({
    from: `"WorkSphere" <${process.env.SMTP_USER}>`,
    to,
    subject: `WorkSphere — ${monthName} Activity Report`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:700px;margin:0 auto;padding:32px 16px;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:28px 32px;margin-bottom:24px;color:white;">
          <div style="font-size:22px;font-weight:700;">WorkSphere</div>
          <div style="font-size:13px;opacity:0.85;margin-top:4px;">Monthly Activity Report — ${monthName}</div>
          <div style="font-size:12px;opacity:0.7;margin-top:2px;">Hi ${userName || 'there'}, here's your summary</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:white;border-radius:10px;padding:16px;border-left:4px solid #6366f1;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <div style="font-size:28px;font-weight:700;color:#111;">${total}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Total Items</div>
          </div>
          <div style="flex:1;min-width:120px;background:white;border-radius:10px;padding:16px;border-left:4px solid #22c55e;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <div style="font-size:28px;font-weight:700;color:#111;">${completed}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Completed</div>
          </div>
          <div style="flex:1;min-width:120px;background:white;border-radius:10px;padding:16px;border-left:4px solid #f59e0b;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <div style="font-size:28px;font-weight:700;color:#111;">${pending}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Pending</div>
          </div>
          <div style="flex:1;min-width:120px;background:white;border-radius:10px;padding:16px;border-left:4px solid #ef4444;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <div style="font-size:28px;font-weight:700;color:#111;">${urgent}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px;">Urgent</div>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <div style="font-size:16px;font-weight:600;color:#111;margin-bottom:20px;">Activity Breakdown — ${monthName}</div>
          ${total === 0 ? '<p style="color:#94a3b8;font-size:14px;">No items recorded this month.</p>' : sectionsHtml}
        </div>
        <div style="text-align:center;padding:24px 0 8px;font-size:11px;color:#9ca3af;">
          Sent automatically every Saturday at 7:00 PM IST by WorkSphere.<br>
          <a href="https://n6co0az1uzf7qcxxsmymtwiy.187.127.134.246.sslip.io" style="color:#6366f1;">Open WorkSphere →</a>
        </div>
      </div>
    </body></html>`,
  });
}

module.exports = { sendReminderEmail, sendDailySummaryEmail, sendMonthlyActivityReport };
