// Crea'fi Genius Mastermind — the top-tier program ($1,500, communityId 'creafi-mastermind').
//
// A SEPARATE, standalone community for the high-ticket mastermind. Two ways to pay,
// both totaling $1,500:
//   1. Pay in Full   — $1,500 one-time.
//   2. 5-Month Plan  — $300/mo for 5 months (5 × $300 = $1,500), then it stops on its own.
//
// How the 5-pay auto-stops (no new code): the 5-Month Plan checks out against a PERSISTED
// Stripe Price that carries `metadata.installments = 5`. The creafigenius.com Stripe webhook
// already counts paid invoices on any such subscription and cancels it once the full plan is
// collected (reason 'cancellation_requested') — so the member keeps LIFETIME access after the
// 5th payment, exactly like the full course's $497 4-pay. See creafi-site stripe-webhook.mjs.
//
// Both plans reference `stripePriceId`, filled in once the Stripe Product + Prices are created
// (scripts/create-mastermind-stripe.cjs). The Product carries the Crea'fi logo image, so it
// shows on the Stripe checkout page and on the invoice/receipt.
//
// This is a coaching/mastermind tier — no pre-built course lessons are seeded. Once a buyer is
// in, they get the community: group calls on the calendar, the member feed, replays, and any
// content Chad adds inside it later.

export const CREAFI_MASTERMIND = {
  community: {
    id: 'creafi-mastermind',
    slug: 'creafi-mastermind',
    name: "Crea'fi Genius Mastermind",
    description: "The top-tier mastermind — direct coaching, live group calls, and hands-on help structuring your real deals.",
    color: '#a16207', // premium gold, to set the top tier apart from the full course (black) and Lite (teal)
    emoji: '🏆',
    memberCount: 0,
    // Truthy joinUrl keeps free self-registration blocked (purchase-only); `checkout: 'in-app'`
    // tells JoinPage to run the Stripe checkout here instead of redirecting to an external funnel.
    joinUrl: 'https://app.creafigenius.com/join/creafi-mastermind',
    checkout: 'in-app',
    logoUrl: '/creafi-logo.png',
    category: 'Finance & Wealth',
    isLocked: false,
    lockedScreenLogo: null,
    createdAt: '2026-11-13',
  },

  // Two purchase options for the SAME tier. The storefront (LockScreen / PricingTab) and the
  // public JoinPage render every active plan for the community as its own card.
  plans: [
    {
      id: 'pl_creafi_mastermind_full',
      communityId: 'creafi-mastermind',
      name: 'Pay in Full',
      price: 1500,
      interval: 'once',
      description: 'One payment — save the plan fee and you’re done.',
      features: [
        'Everything in the Mastermind',
        'Live group coaching calls',
        'Deal structuring help on your real deals',
        'Direct access and member community',
        'One payment of $1,500',
      ],
      isActive: true,
      stripePriceId: 'price_1UbMJy2ejxCaLu7pR9fJiUsZ', // one-time $1,500 (prod_VcbXRIHVrkwL7t)
    },
    {
      id: 'pl_creafi_mastermind_5pay',
      communityId: 'creafi-mastermind',
      name: '5-Month Plan',
      price: 300,
      interval: 'month',
      installments: 5, // the webhook stops billing after the 5th payment; access stays for life
      description: '5 monthly payments of $300 (total $1,500). Billing stops automatically after the 5th.',
      features: [
        'Everything in the Mastermind',
        'Live group coaching calls',
        'Deal structuring help on your real deals',
        'Direct access and member community',
        '5 payments of $300, then it stops — lifetime access',
      ],
      isActive: true,
      stripePriceId: 'price_1UbMJy2ejxCaLu7pol66IoNI', // $300/mo, metadata.installments=5 (prod_VcbXRIHVrkwL7t)
    },
  ],
}
