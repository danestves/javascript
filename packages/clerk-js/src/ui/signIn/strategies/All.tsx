import { Button } from '@clerk/shared/components/button';
import { OAuthStrategy, SignInFactor } from '@clerk/types';
import React from 'react';
import { Separator } from 'ui/common';
import { useSupportEmail } from 'ui/hooks/useSupportEmail';
import { allStrategiesButtonsComparator } from 'ui/signIn/strategies/factorSortingUtils';
import { factorHasLocalStrategy } from '../utils';

import { OAuth } from './OAuth';

export function getButtonLabel(factor: SignInFactor): string {
  switch (factor.strategy) {
    case 'email_link':
      return `Send magic link to ${factor.safeIdentifier}`;
    case 'email_code':
      return `Email code to ${factor.safeIdentifier}`;
    case 'phone_code':
      return `Send code to ${factor.safeIdentifier}`;
    case 'password':
      return 'Sign in with your password';
    default:
      throw `Invalid sign in strategy: "${factor.strategy}"`;
  }
}

export type AllProps = {
  factors: SignInFactor[];
  selectFactor: (factor: SignInFactor) => void;
};

export function All({ selectFactor, factors }: AllProps): JSX.Element {
  const supportEmail = useSupportEmail();
  const firstPartyFactors = factors.filter(f => !f.strategy.startsWith('oauth_'));
  const oauthFactors = factors.filter(f => f.strategy.startsWith('oauth_'));
  const oauthStrategies = oauthFactors.map(f => f.strategy) as OAuthStrategy[];

  const handleClick = (e: React.MouseEvent, strategy: SignInFactor) => {
    e.preventDefault();
    selectFactor(strategy);
  };

  const href = `mailto:${supportEmail}`;

  const firstPartyButtons = firstPartyFactors
    .filter(factor => factorHasLocalStrategy(factor))
    .sort(allStrategiesButtonsComparator)
    .map((factor, i) => (
      <Button
        key={`button-${i}`}
        className='cl-primary-button'
        onClick={e => handleClick(e, factor)}
      >
        {getButtonLabel(factor)}
      </Button>
    ));

  return (
    <>
      <OAuth oauthOptions={oauthStrategies} />
      {oauthStrategies.length > 0 && firstPartyButtons.length > 0 && <Separator />}
      {firstPartyButtons}
      <div className='cl-auth-form-link cl-auth-trouble-link'>
        <a
          href={href}
          title='Contact support'
        >
          I am having trouble signing in
        </a>
      </div>
    </>
  );
}
