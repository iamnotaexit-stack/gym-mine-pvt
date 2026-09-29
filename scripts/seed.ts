import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'; // Should use service_role for seeding usually

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding database...');
  
  // 1. Insert a default plan
  const { data: plan, error: planError } = await supabase.from('plans').insert({
    name: '1 Month Standard',
    months: 1,
    price: 1500
  }).select().single();

  if (planError) {
    console.error('Error creating plan:', planError);
    return;
  }

  console.log('Created plan:', plan.id);

  // 2. Generate 200 members
  const members = [];
  const statuses = ['active', 'due', 'due_soon', 'overdue', 'frozen'];
  const today = new Date();

  for (let i = 1; i <= 200; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Simulate due date based on status
    let diffDays = 0;
    if (status === 'active') diffDays = 15;
    if (status === 'due_soon') diffDays = 3;
    if (status === 'due') diffDays = 0;
    if (status === 'overdue') diffDays = -10;
    if (status === 'frozen') diffDays = 20;

    const dueDate = new Date(today.getTime() + diffDays * 24 * 60 * 60 * 1000);
    const joinDate = new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000); // approx 1 month before

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const dueStr = `${year}-${month}-${day}`;

    const jYear = joinDate.getFullYear();
    const jMonth = String(joinDate.getMonth() + 1).padStart(2, '0');
    const jDay = String(joinDate.getDate()).padStart(2, '0');
    const joinStr = `${jYear}-${jMonth}-${jDay}`;

    members.push({
      name: `Demo Member ${i}`,
      phone: `+9198765${String(i).padStart(5, '0')}`,
      email: i % 5 === 0 ? `member${i}@example.com` : null, // only some have emails
      join_date: joinStr,
      current_due_date: dueStr,
      anchor_day: joinDate.getDate(),
      plan_id: plan.id,
      is_frozen: status === 'frozen',
      has_trainer: i % 10 === 0,
      trainer_name: i % 10 === 0 ? 'Alex Coach' : null,
    });
  }

  // Insert in batches
  for (let i = 0; i < members.length; i += 50) {
    const batch = members.slice(i, i + 50);
    const { error } = await supabase.from('members').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      console.log(`Inserted members ${i} to ${i + batch.length}`);
    }
  }

  console.log('Seeding complete! 200 members added.');
}

seed();
