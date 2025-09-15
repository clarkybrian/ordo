import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'

// Initialisation de Stripe avec la clé publique
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
if (!stripePublishableKey) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not defined')
}

// Variable pour stocker l'instance Stripe
let stripeInstance: Stripe | null = null

// Fonction pour obtenir l'instance Stripe
async function getStripe(): Promise<Stripe> {
  if (!stripeInstance) {
    console.log('🔄 Initialisation de Stripe...')
    stripeInstance = await loadStripe(stripePublishableKey)
    if (!stripeInstance) {
      throw new Error('Échec de l\'initialisation de Stripe')
    }
    console.log('✅ Stripe initialisé avec succès')
  }
  return stripeInstance
}

// Configuration des plans avec leurs IDs Stripe
export const STRIPE_PLANS = {
  pro: {
    priceId: 'price_1S7DguFJ4UpJbpMkq59BY17e', // À remplacer par votre vrai Price ID Stripe
    name: 'Pro',
    price: 2.99
  },
  premium: {
    priceId: 'price_1S7DhzFJ4UpJbpMkm2IPbhkX', // À remplacer par votre vrai Price ID Stripe  
    name: 'Premium',
    price: 5.99
  }
} as const

export type PlanType = keyof typeof STRIPE_PLANS

/**
 * Crée une session de checkout Stripe pour un plan donné
 */
export async function createCheckoutSession(planType: PlanType) {
  try {
    // Vérifier que l'utilisateur est connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Utilisateur non connecté')
    }

    // Appeler votre Edge Function Supabase pour créer la session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        planType,
        userId: user.id,
        userEmail: user.email,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`
      }
    })

    if (error) {
      console.error('Erreur lors de la création de la session:', error)
      throw new Error('Erreur lors de la création de la session de paiement')
    }

    return data.sessionId
  } catch (error) {
    console.error('Erreur createCheckoutSession:', error)
    throw error
  }
}

/**
 * Redirige vers Stripe Checkout
 */
export async function redirectToCheckout(planType: PlanType) {
  console.log('💳 redirectToCheckout appelée pour:', planType)
  try {
    const stripe = await getStripe()
    console.log('✅ Instance Stripe obtenue')

    // Créer la session de checkout
    console.log('🔄 Création de la session checkout...')
    const sessionId = await createCheckoutSession(planType)
    console.log('✅ Session créée avec ID:', sessionId)

    // Rediriger vers Stripe Checkout
    console.log('🔄 Redirection vers Stripe Checkout...')
    const { error } = await stripe.redirectToCheckout({
      sessionId
    })

    if (error) {
      console.error('❌ Erreur lors de la redirection:', error)
      throw new Error('Erreur lors de la redirection vers le paiement')
    }
    console.log('✅ Redirection initiée')
  } catch (error) {
    console.error('❌ Erreur redirectToCheckout:', error)
    throw error
  }
}

/**
 * Gère le clic sur un bouton de plan
 */
export async function handlePlanSelection(planName: string) {
  console.log('🎯 handlePlanSelection appelée avec:', planName)
  try {
    // Plan gratuit - juste authentification
    if (planName === 'Gratuit') {
      console.log('🆓 Plan gratuit sélectionné - redirection vers Google Auth')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose',
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) {
        console.error('❌ Erreur Google Auth:', error)
        throw new Error('Erreur lors de l\'authentification Google')
      }
      console.log('✅ Redirection Google Auth initiée')
      return
    }

    // Plans payants - redirection vers Stripe
    console.log('💳 Plan payant sélectionné:', planName)
    const planType = planName.toLowerCase() as PlanType
    console.log('🔄 Plan type converti:', planType)
    
    if (planType in STRIPE_PLANS) {
      console.log('✅ Plan trouvé dans STRIPE_PLANS:', STRIPE_PLANS[planType])
      await redirectToCheckout(planType)
    } else {
      console.error('❌ Plan non reconnu:', planName, 'Plans disponibles:', Object.keys(STRIPE_PLANS))
      throw new Error(`Plan "${planName}" non reconnu`)
    }
  } catch (error) {
    console.error('❌ Erreur handlePlanSelection:', error)
    // Afficher l'erreur à l'utilisateur
    alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}