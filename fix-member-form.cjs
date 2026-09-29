const fs = require('fs');

let file = fs.readFileSync('src/pages/MemberForm.tsx', 'utf8');

// Replace submit logic
const submitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?if \(!error && insertedMember\) \{/m;
const newSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const anchor_day = parseInt(form.join_date.split('-')[2], 10);
    const selectedPlan = plans.find(p => p.id === form.plan_id);
    
    // If logging plan fee, calculate the real next due date, else they are due immediately
    let current_due_date = form.join_date;
    if (!isEditing && payPlanFee && selectedPlan) {
       current_due_date = calculateNextDueDate(anchor_day, form.join_date, selectedPlan.months);
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      join_date: form.join_date,
      anchor_day,
      plan_id: form.plan_id,
      current_due_date,
      has_trainer: form.has_trainer,
      trainer_name: form.has_trainer ? form.trainer_name : null,
      notes: form.notes || null,
    };

    if (isEditing) {
      const { current_due_date: _discard, ...editPayload } = payload;
      const { error } = await supabase.from('members').update(editPayload).eq('id', id);
      setLoading(false);
      if (!error) navigate(\`/members/\${id}\`);
    } else {
      const { data: insertedMember, error } = await supabase.from('members').insert(payload).select().single();
      
      if (!error && insertedMember) {`;

file = file.replace(submitRegex, newSubmit);

// Replace insert logic
const insertRegex = /if \(logInitialPayment && selectedPlan\) \{[\s\S]*?\}\n\n        \/\/ Log activity/m;
const newInsert = `if ((payAdmissionFee || payPlanFee) && selectedPlan) {
          let totalAmount = 0;
          let notes = [];
          if (payAdmissionFee) {
            totalAmount += globalAdmissionFee;
            notes.push(\`Admission: ₹\${globalAdmissionFee}\`);
          }
          if (payPlanFee) {
            totalAmount += selectedPlan.price;
            notes.push(\`Plan: ₹\${selectedPlan.price}\`);
          }
          
          await supabase.from('payments').insert({
            member_id: insertedMember.id,
            amount: totalAmount,
            trainer_fee: 0,
            method: 'cash',
            paid_on: form.join_date,
            covers_from: form.join_date,
            covers_to: current_due_date,
            note: \`Initial Payment (\${notes.join(', ')})\`
          });
        }

        // Log activity`;

file = file.replace(insertRegex, newInsert);

// Replace UI
const uiRegex = /\{\!isEditing && plans\.length > 0 && \([\s\S]*?\}\)}/m;
const newUI = `{!isEditing && plans.length > 0 && (
            <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Initial Payments (Optional)</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={payAdmissionFee}
                  onChange={e => setPayAdmissionFee(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-gray-900 font-medium select-none">Admission Fee Paid (₹{globalAdmissionFee})</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={payPlanFee}
                  onChange={e => setPayPlanFee(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="text-gray-900 font-medium select-none">Plan Fee Paid (₹{selectedPlanPrice})</span>
              </label>

              {(payAdmissionFee || payPlanFee) && (
                <div className="pt-3 border-t border-gray-200 mt-2">
                  <div className="text-sm text-gray-700">
                    Total Collecting Today: <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">₹{(payAdmissionFee ? globalAdmissionFee : 0) + (payPlanFee ? selectedPlanPrice : 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}`;

file = file.replace(uiRegex, newUI);

fs.writeFileSync('src/pages/MemberForm.tsx', file);
console.log('Fixed!');
