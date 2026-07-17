import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://ktpbhznjzndhbxwoklvq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9+]/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, telephone, userId } = req.body;
    const normalizedPhone = normalizePhone(telephone);
    let alreadyHadTrial = false;

    // 1. Verifie si un client Stripe existe deja avec cet email, et s'il a deja eu un abonnement
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId = null;

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      customerId = customer.id;
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
      if (subscriptions.data.length > 0) alreadyHadTrial = true;
    }

    // 2. Verifie si ce numero de telephone a deja servi a un essai (meme avec un autre email/compte)
    if (!alreadyHadTrial && normalizedPhone) {
      const { data: phoneRecords } = await supabaseAdmin
        .from('kv_store')
        .select('value')
        .eq('key', `trial-guard:phone:${normalizedPhone}`)
        .eq('shared', true)
        .limit(1);
      if (phoneRecords && phoneRecords.length > 0) alreadyHadTrial = true;
    }

    // 3. Cree ou met a jour le client Stripe avec le telephone (utile pour la verification carte plus tard)
    if (!customerId) {
      const newCustomer = await stripe.customers.create({ email, phone: normalizedPhone || undefined });
      customerId = newCustomer.id;
    } else if (normalizedPhone) {
      await stripe.customers.update(customerId, { phone: normalizedPhone });
    }

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer: customerId,
      success_url: `${req.headers.origin}/?abonnement=succes`,
      cancel_url: `${req.headers.origin}/?abonnement=annule`,
      metadata: { userId: userId || '', telephone: normalizedPhone || '' },
      subscription_data: {
        metadata: { userId: userId || '', telephone: normalizedPhone || '' }
      }
    };

    // N'accorde l'essai de 14 jours que si aucun signal (email ou telephone) n'indique un essai deja utilise
    if (!alreadyHadTrial) {
      sessionParams.subscription_data.trial_period_days = 14;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
