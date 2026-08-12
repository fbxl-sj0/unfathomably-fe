/*
 * Unfathomably FE
 * File: nostr-signup-modal.tsx
 * Purpose: Coordinate the available Nostr signup and key-selection steps.
 * This file intentionally does not store keys or perform authentication.
 */

import { useState } from 'react';

import ExtensionStep from '../nostr-login-modal/steps/extension-step.tsx';
import KeyAddStep from '../nostr-login-modal/steps/key-add-step.tsx';

import KeyStep from './steps/key-step.tsx';
import KeygenStep from './steps/keygen-step.tsx';

type Step = 'extension' | 'key' | 'key-add' | 'keygen';

interface INostrSignupModal {
  onClose: (type?: string) => void;
}

const NostrSignUpModal: React.FC<INostrSignupModal> = ({ onClose }) => {
  const [step, setStep] = useState<Step>(window.nostr ? 'extension' : 'key');

  const handleClose = () => onClose('NOSTR_SIGNUP');

  switch (step) {
    case 'extension':
      return <ExtensionStep onClickAlt={() => setStep('key')} onClose={handleClose} />;
    case 'key':
      return <KeyStep setStep={setStep} onClose={handleClose} />;
    case 'key-add':
      return <KeyAddStep onClose={handleClose} />;
    case 'keygen':
      return <KeygenStep onClose={handleClose} />;
    default:
      return null;
  }
};

export default NostrSignUpModal;

/* end of nostr-signup-modal.tsx */
