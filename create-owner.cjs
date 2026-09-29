const postgres = require('postgres');

const connectionString = "postgresql://postgres:*+5d8HXL7wgpu5A@db.bczmllkpasrkrfqtqjrs.supabase.co:5432/postgres";

const sql = postgres(connectionString, { ssl: 'require' });

async function createOwner() {
  try {
    const email = 'admin@fitpro.com';
    const password = 'password123';
    
    console.log("Checking if user exists...");
    
    // Check if user exists
    let existing = await sql`SELECT id FROM auth.users WHERE email = ${email}`;
    
    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log("User exists with ID:", userId);
      // Update password
      // Since we don't have pgcrypto hashing logic handy in JS, we use pgcrypto's crypt
      await sql`UPDATE auth.users SET encrypted_password = crypt(${password}, gen_salt('bf')) WHERE id = ${userId}`;
      console.log("Password updated to 'password123'.");
    } else {
      console.log("Creating new user...");
      const result = await sql`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
          recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
          created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${email}, crypt(${password}, gen_salt('bf')), now(),
          now(), now(), '{"provider":"email","providers":["email"]}', '{}',
          now(), now(), '', '', '', ''
        ) RETURNING id
      `;
      userId = result[0].id;
      console.log("Created user with ID:", userId);
    }
    
    // Check if profile exists
    const profile = await sql`SELECT id FROM public.profiles WHERE id = ${userId}`;
    if (profile.length === 0) {
      await sql`INSERT INTO public.profiles (id, role, name) VALUES (${userId}, 'owner', 'Admin')`;
      console.log("Created owner profile.");
    } else {
      await sql`UPDATE public.profiles SET role = 'owner' WHERE id = ${userId}`;
      console.log("Updated existing profile to owner.");
    }
    
    console.log("\nSuccess! You can now log in with:");
    console.log("Email: admin@fitpro.com");
    console.log("Password: password123");
    
  } catch (err) {
    console.error("Error creating owner:", err);
  } finally {
    await sql.end();
  }
}

createOwner();
