import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Configuration Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Vérifier que c'est bien une requête POST de Stripe
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('🔔 Webhook reçu de Stripe')
    console.log('📋 Headers reçus:', Object.fromEntries(req.headers.entries()))
    
    // Initialiser Supabase avec les permissions service role pour modifier la BDD
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role pour bypass RLS
    )

    // Récupérer le body brut et la signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('📊 Infos de debug:', {
      bodyLength: body.length,
      hasSignature: !!signature,
      webhookSecretExists: !!webhookSecret,
      webhookSecretStart: webhookSecret.substring(0, 8) + '...'
    })

    if (!signature) {
      console.error('❌ Signature manquante')
      return new Response(
        JSON.stringify({ error: 'Signature manquante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      console.log('🔑 Tentative de vérification de signature...')
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Signature vérifiée, événement:', event.type)
    } catch (err) {
      console.error('❌ Erreur de signature:', err)
      console.error('📋 Détails signature:', {
        signatureHeader: signature,
        bodyPreview: body.substring(0, 100) + '...'
      })
      return new Response('Signature invalide', { status: 400 })
    }

    // Traiter les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseClient)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient)
        break
      
      default:
        console.log('ℹ️ Événement non traité:', event.type)
    }

    console.log('✅ Webhook traité avec succès')
    return new Response('ok', { headers: corsHeaders })

  } catch (error) {
    console.error('❌ Erreur webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Traiter la session de checkout complétée (nouveau paiement)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log('💳 Traitement checkout completed:', session.id)
  
  const userId = session.metadata?.userId
  const planType = session.metadata?.planType
  
  if (!userId || !planType) {
    console.error('❌ Métadonnées manquantes:', { userId, planType })
    return
  }

  // Récupérer les détails de l'abonnement depuis Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  
  // Insérer/mettre à jour l'abonnement dans la BDD
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscription.id,
      subscription_type: planType,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    })

  if (subscriptionError) {
    console.error('❌ Erreur insertion subscription:', subscriptionError)
    return
  }

  // Mettre à jour le profil utilisateur
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      subscription_type: planType,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (profileError) {
    console.error('❌ Erreur mise à jour profil:', profileError)
    return
  }

  console.log('✅ Abonnement créé/mis à jour:', { userId, planType, subscriptionId: subscription.id })
}

/**
 * Traiter le paiement récurrent réussi
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  console.log('💰 Traitement payment succeeded:', invoice.id)
  
  if (!invoice.subscription) {
    console.log('ℹ️ Facture sans abonnement, ignorée')
    return
  }

  // Récupérer l'abonnement pour mettre à jour les dates
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  
  // Mettre à jour les dates de période dans la BDD
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Erreur mise à jour période:', error)
    return
  }

  console.log('✅ Période d\'abonnement mise à jour:', subscription.id)
}

/**
 * Traiter la mise à jour d'abonnement (changement de plan)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  console.log('🔄 Traitement subscription updated:', subscription.id)
  
  // Déterminer le nouveau type de plan depuis les items
  let newPlanType = 'free'
  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id
    // Mapper les Price IDs vers les types de plans
    if (priceId === 'price_1S7DguFJ4UpJbpMkq59BY17e') {
      newPlanType = 'pro'
    } else if (priceId === 'price_1S7DhzFJ4UpJbpMkm2IPbhkX') {
      newPlanType = 'premium'
    }
  }

  // Mettre à jour l'abonnement
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      subscription_type: newPlanType,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('❌ Erreur mise à jour subscription:', subscriptionError)
    return
  }

  // Récupérer l'user_id pour mettre à jour le profil
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (subscriptionData?.user_id) {
    // Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_type: newPlanType,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.user_id)

    if (profileError) {
      console.error('❌ Erreur mise à jour profil:', profileError)
    }
  }

  console.log('✅ Abonnement mis à jour:', { subscriptionId: subscription.id, newPlanType })
}

/**
 * Traiter l'annulation d'abonnement
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  console.log('❌ Traitement subscription deleted:', subscription.id)
  
  // Marquer l'abonnement comme annulé
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (subscriptionError) {
    console.error('❌ Erreur annulation subscription:', subscriptionError)
    return
  }

  // Récupérer l'user_id pour remettre en plan gratuit
  const { data: subscriptionData } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (subscriptionData?.user_id) {
    // Remettre l'utilisateur en plan gratuit
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_type: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionData.user_id)

    if (profileError) {
      console.error('❌ Erreur remise en gratuit:', profileError)
    }
  }

  console.log('✅ Abonnement annulé, utilisateur remis en gratuit')
}