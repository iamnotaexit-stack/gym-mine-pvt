import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, redirectTo } = await req.json()

    if (!email) {
      throw new Error("Email is required")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Send Magic Invite Link
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || undefined
    })
    
    if (error) {
      throw error
    }

    const userId = data.user.id

    // 2. Insert Profile as 'member'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, role: 'member', name: name || 'Member' })

    if (profileError) {
      console.error("Profile error:", profileError)
      // Non-fatal, user is invited
    }

    return new Response(
      JSON.stringify({ message: "Invite sent successfully", user: data.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
