import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // 1. Fetch settings (grace_days, templates, offsets, gym_name)
    const { data: settings } = await supabase.from('settings').select('*').single();
    if (!settings) throw new Error('Settings not found');
    
    const offsets: number[] = settings.reminder_offsets || [-3, 0, 1, 3, 7];
    const templates = settings.templates;
    const gymName = settings.gym_name;
    const fromEmail = 'onboarding@resend.dev';

    // 2. Compute current IST date
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (5.5 * 3600000));
    
    const year = ist.getFullYear();
    const month = String(ist.getMonth() + 1).padStart(2, '0');
    const day = String(ist.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

    // 3. Fetch active, non-frozen members WITH an email address
    const { data: members } = await supabase
      .from('members')
      .select('*, plan:plans(price)')
      .is('deleted_at', null)
      .eq('is_frozen', false)
      .not('email', 'is', null)
      .neq('email', '');

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ message: 'No members to email' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const emailsToSend = [];
    const logsToInsert = [];

    // 4. Determine who needs an email today
    for (const m of members) {
      const dueMs = new Date(m.current_due_date + 'T00:00:00Z').getTime();
      const daysDiff = (dueMs - todayMs) / (1000 * 60 * 60 * 24);
      const currentOffset = -daysDiff;

      if (offsets.includes(currentOffset)) {
        // Check if already sent
        const kind = currentOffset < 0 ? 'due_soon' : (currentOffset === 0 ? 'due_today' : 'overdue');
        const { data: existingLog } = await supabase
          .from('reminder_log')
          .select('id')
          .eq('member_id', m.id)
          .eq('due_date', m.current_due_date)
          .eq('kind', kind)
          .eq('channel', 'email')
          .single();

        if (!existingLog) {
          // Prepare email
          const isOverdue = currentOffset > 0;
          let body = isOverdue ? templates.overdue : templates.due_soon;
          body = body.replace('{name}', m.name).replace('{date}', m.current_due_date);
          
          emailsToSend.push({
            from: `${gymName} <${fromEmail}>`,
            to: [m.email],
            subject: `${gymName} - Fee Reminder`,
            html: `<p>${body}</p><p>Amount: ₹${m.plan?.price}</p><p>Thank you,<br/>${gymName}</p>`,
          });

          logsToInsert.push({
            member_id: m.id,
            due_date: m.current_due_date,
            kind,
            channel: 'email'
          });
        }
      }
    }

    // 5. Send emails via Resend Batch API
    if (emailsToSend.length > 0) {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailsToSend)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Resend Error:', errText);
        throw new Error('Failed to send emails via Resend');
      }

      // 6. Log them as sent
      await supabase.from('reminder_log').insert(logsToInsert);
    }

    return new Response(JSON.stringify({ 
      message: 'Success', 
      sentCount: emailsToSend.length 
    }), { headers: { 'Content-Type': 'application/json' } });
    
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
