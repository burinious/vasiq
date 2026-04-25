import { useState } from 'react';
import { MessageCircle, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';

const onboardingCards = [
  {
    title: 'Welcome to VASIQ',
    label: 'Campus pulse',
    body: 'VASIQ is for quick campus signal: class changes, materials, hostel gist, sapa help, opportunities, events, and updates students need before they waste data elsewhere.',
    icon: Sparkles,
  },
  {
    title: 'Join the right circles early',
    label: 'Groups',
    body: 'Start with the groups that already matter: department, hostel, study circle, builders, fellowship, opportunities, and the circles your friends actually open.',
    icon: UsersRound,
  },
  {
    title: 'Keep the signal useful',
    label: 'Updates',
    body: 'Posts should help someone move fast: share test info, PDFs, past questions, cheap deals, transport updates, serious gist, and openings before they get buried.',
    icon: MessageCircle,
  },
  {
    title: 'Trust matters here',
    label: 'Safety',
    body: 'Visibility is good, but trust matters. Clear profile details, verified email, reports, and blocking keep clout, jokes, and campus gist from turning unsafe.',
    icon: ShieldCheck,
  },
];

function OnboardingCards({ mode = 'modal', onClose, onSkip, skipping = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCard = onboardingCards[activeIndex];
  const ActiveIcon = activeCard.icon;
  const isLastCard = activeIndex === onboardingCards.length - 1;

  return (
    <div className={`onboarding-card-stack onboarding-card-stack-${mode}`}>
      <div className="onboarding-card-top">
        <div>
          <p className="eyebrow">{activeCard.label}</p>
          <h2>{activeCard.title}</h2>
        </div>
        {onClose ? (
          <button type="button" className="onboarding-close-button" onClick={onClose}>
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
            <span className="sr-only">Close onboarding</span>
          </button>
        ) : null}
      </div>

      <div className="onboarding-card-body">
        <span className="onboarding-card-icon">
          <ActiveIcon size={28} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <p>{activeCard.body}</p>
      </div>

      <div className="onboarding-dots" aria-label="Onboarding steps">
        {onboardingCards.map((card, index) => (
          <button
            key={card.title}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${card.title}`}
          />
        ))}
      </div>

      <div className="onboarding-actions">
        {onSkip ? (
          <button type="button" className="ghost-button" onClick={onSkip} disabled={skipping}>
            {skipping ? 'Skipping...' : 'Skip forever'}
          </button>
        ) : null}
        <button
          type="button"
          className="secondary-button"
          onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
          disabled={activeIndex === 0}
        >
          Back
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (isLastCard) {
              onClose?.();
              return;
            }

            setActiveIndex((current) => current + 1);
          }}
        >
          {isLastCard ? 'Close' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default OnboardingCards;
