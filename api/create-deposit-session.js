import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://ktpbhznjzndhbxwoklvq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserIdForSlug(slug) {
  const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const { data } = await supabaseAdmin
    .from('kv_store')
    .select('value')
    .eq('key', `slug-registry:${cleanSlug}`)
    .eq('shared', true)
    .limit(1);
  return data && data.length > 0 ? data[0].value : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { slug, reservationId, amount, devise, prenom } = req.body;
    if (!slug || !reservationId || !amount) {
      return res.status(400).json({ error: 'slug, reservationId et amount requis' });
    }

    const userId = await getUserIdForSlug(slug);
    if (!userId) return res.status(404).json({ error: 'Moniteur introuvable' });

    const currency = String(devise || 'EUR').toLowerCase();
    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: 'Acompte de réservation - cours de ski' },
          unit_amount: unitAmount
        },
        quantity: 1
      }],
      success_url: `${req.headers.origin}/${slug}?paiement=succes&reservation=${reservationId}&prenom=${encodeURIComponent(prenom || '')}`,
      cancel_url: `${req.headers.origin}/${slug}?paiement=annule&reservation=${reservationId}`,
      metadata: { type: 'reservation-deposit', slug, reservationId: String(reservationId), userId }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
