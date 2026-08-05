import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// Shared tenant onboarding checklist rendered on every locality landing page
// (brief #6). Content is original and generic to premium Bangalore gated
// communities, so the same component can be reused across all localities while
// each page's rental-guide numbers stay locality-specific.

interface ChecklistStep {
  title: string;
  detail: string;
}

const STEPS: ChecklistStep[] = [
  {
    title: 'Confirm your budget and shortlist',
    detail:
      'Fix a realistic monthly rent (or purchase) band and pick 3–4 gated communities that match your commute, BHK size and amenity needs before booking visits.',
  },
  {
    title: 'Verify the flat and the society',
    detail:
      'Inspect the actual unit — not just photos — and check maintenance charges, water supply, power backup, parking allotment and society rules with the owner or manager.',
  },
  {
    title: 'Review the rental agreement carefully',
    detail:
      'Read every clause: lock-in period, notice period, rent escalation, deposit terms and who pays for repairs. Ask for changes in writing before you sign.',
  },
  {
    title: 'Agree the security deposit in writing',
    detail:
      'Confirm the deposit amount, refund timeline and the condition the flat must be returned in. Document existing damage with dated photos at move-in.',
  },
  {
    title: 'Complete documentation and police verification',
    detail:
      'Register the agreement, share KYC documents and complete tenant police verification — most premium gated communities require it before issuing move-in approval.',
  },
  {
    title: 'Get your move-in NOC and gate passes',
    detail:
      'Collect the society move-in NOC, resident and vehicle passes, and note the estate office, security and maintenance contacts for day-one support.',
  },
];

export const TenantOnboardingChecklist: React.FC<{ localityName?: string }> = ({
  localityName,
}) => {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
        Move-in made simple
      </p>
      <h2 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">
        Tenant Onboarding Checklist
        {localityName ? ` for ${localityName}` : ''}
      </h2>
      <p className="mt-2 text-sm leading-7 text-charcoal/60">
        A step-by-step guide from Nova Nest Rentals and Property Management to help
        you rent a premium gated-community flat in Bangalore without surprises.
      </p>

      <ol className="mt-6 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {i + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                <h3 className="font-semibold text-charcoal">{step.title}</h3>
              </div>
              <p className="mt-1 text-sm leading-6 text-charcoal/65">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TenantOnboardingChecklist;
