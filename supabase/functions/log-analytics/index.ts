import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_type, event_data, user_id, user_agent, timestamp } = await req.json()

    console.log('Analytics event:', {
      event_type,
      user_id: user_id ? 'present' : 'none',
      event_data_keys: Object.keys(event_data || {}),
      timestamp
    })

    // In a production app, you might want to store this in a dedicated analytics table
    // For now, we'll just log it
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Analytics logging error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to log analytics event'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
