import { useState } from 'react';
import { MessageCircle, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';

const onboardingCards = [
  {
    title: 'Welcome to VASIQ',
    label: 'Campus first',
    body: 'VASIQ is your student social space for campus updates, useful posts, groups, and direct conversations.',
    icon: Sparkles,
  },
  {
    title: 'Join the right circles',
    label: 'Groups',
    body: 'Find department, study, project, and community groups. Some groups may need admin or moderator approval first.',
    icon: UsersRound,
  },
  {
    title: 'Talk safely',
    label: 'Chats',
    body: 'Use direct messages and group chats with respect. You can report posts, comments, replies, and unsafe activity.',
    icon: MessageCircle,
  },
  {
    title: 'You control the noise',
    label: 'Safety',
    body: 'Skip this guide to stop seeing it automatically. Help can always replay it, show FAQs, and manage account actions.',
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
