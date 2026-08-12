/*
 * Unfathomably FE
 * File: key-add-step.tsx
 * Purpose: Import an nsec into the browser-local signer and authenticate.
 * This file intentionally does not transmit or persist a raw secret key remotely.
 */

import { nip19 } from 'nostr-tools';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';


import { logInNostr } from '@/actions/nostr.ts';
import EmojiGraphic from '@/components/emoji-graphic.tsx';
import Button from '@/components/ui/button.tsx';
import Divider from '@/components/ui/divider.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Input from '@/components/ui/input.tsx';
import Modal from '@/components/ui/modal.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useConnectedNostr } from '@/contexts/nostr-context.tsx';
import { keyring } from '@/features/nostr/keyring.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

import NostrExtensionIndicator from '../components/nostr-extension-indicator.tsx';

interface IKeyAddStep {
  onClose(): void;
}

const KeyAddStep: React.FC<IKeyAddStep> = ({ onClose }) => {
  const [nsec, setNsec] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const { relay } = useConnectedNostr();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNsec(e.target.value);
    setError(undefined);
  };

  const handleSubmit = async () => {
    if (!relay) return;

    setIsSubmitting(true);

    try {
      const result = nip19.decode(nsec.trim());

      if (result.type === 'nsec') {
        const seckey = result.data;
        const signer = keyring.add(seckey);
        await dispatch(logInNostr(signer, relay));
        onClose();
        return;
      }

      setError('Invalid nsec');
    } catch (e) {
      setError('Invalid nsec');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={<FormattedMessage id='nostr_signup.key-add.title' defaultMessage='Import Key' />} width='sm' onClose={onClose}>
      <Stack className='my-3' space={6}>

        <EmojiGraphic emoji='🔑' />

        <Text theme='muted' size='sm'>
          <FormattedMessage
            id='nostr_signup.key-add.security'
            defaultMessage='Your nsec stays in this browser keyring. The server receives only your public key and events you sign.'
          />
        </Text>

        <Form onSubmit={handleSubmit}>
          <Stack space={6}>
            <FormGroup labelText='Secret key' errors={error ? [error] : []}>
              <Input
                value={nsec}
                type='password'
                onChange={handleChange}
                autoComplete='off'
                spellCheck={false}
                placeholder='nsec1…'
              />
            </FormGroup>

            <Stack space={2}>
              <Button theme='accent' size='lg' type='submit' disabled={!nsec || !relay || isSubmitting}>
                <FormattedMessage id='nostr_signup.key-add.key_button' defaultMessage='Add Key' />
              </Button>

              <Divider text='or' />

              <NostrExtensionIndicator />
            </Stack>

          </Stack>
        </Form>


      </Stack>
    </Modal>
  );
};

export default KeyAddStep;

/* end of key-add-step.tsx */
