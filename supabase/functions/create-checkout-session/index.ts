import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

// Configuration des plans (doit correspondre au frontend)
const PLANS = {
  pro: {
    priceId: 'price_1S7DguFJ4UpJbpMkq59BY17e',
    name: 'Pro'
  },
  premium: {
    priceId: 'price_1S7DhzFJ4UpJbpMkm2IPbhkX',
    name: 'Premium'
  }
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialiser Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Récupérer les données de la requête
    const { planType, userId, userEmail, successUrl, cancelUrl } = await req.json()

    // Vérifier que le plan existe
    if (!PLANS[planType as keyof typeof PLANS]) {
      throw new Error(`Plan "${planType}" non trouvé`)
    }

    const plan = PLANS[planType as keyof typeof PLANS]

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planType,
        planName: plan.name
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
          planName: plan.name
        }
      }
    })

    // Retourner l'ID de session
    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})