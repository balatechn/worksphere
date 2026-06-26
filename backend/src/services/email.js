const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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

module.exports = { sendReminderEmail, sendDailySummaryEmail };
