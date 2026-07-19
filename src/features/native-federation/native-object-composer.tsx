/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/features/native-federation/native-object-composer.tsx

  Purpose:

    Let signed-in users create the same bounded native presentation families
    that the Worlds interface can display.

  Responsibilities:

    * collect a template, title, description, visibility, and optional details
    * submit the controlled authoring request to Unfathomably BE
    * present a stable success state with a link to the created object

  This file intentionally does NOT contain:

    * arbitrary JSON-LD editing
    * remote discovery or URL fetching
    * ActivityPub vocabulary construction
*/

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { HTTPError } from '@/api/HTTPError.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Select from '@/components/ui/select.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import Textarea from '@/components/ui/textarea.tsx';
import { useApi } from '@/hooks/useApi.ts';
import toast from '@/toast.tsx';

import type { MessageDescriptor } from 'react-intl';

type TemplateKey = 'books' | 'software' | 'models' | 'markets' | 'games' | 'routes' | 'culture' | 'coordination' | 'publishing';

interface TemplateDefinition {
  label: MessageDescriptor;
  hint: MessageDescriptor;
  detailLabel?: MessageDescriptor;
  detailHint?: MessageDescriptor;
  detailType?: 'number' | 'text';
  detailOptions?: Array<{ label: MessageDescriptor; value: string }>;
  secondaryLabel?: MessageDescriptor;
  secondaryHint?: MessageDescriptor;
  secondaryOptions?: Array<{ label: MessageDescriptor; value: string }>;
  defaultDetail?: string;
}

interface NativeObjectResponse {
  id: string;
  url: string;
}

const messages = defineMessages({
  books: { id: 'native_federation.create.books', defaultMessage: 'Book review' },
  software: { id: 'native_federation.create.software', defaultMessage: 'Software ticket' },
  models: { id: 'native_federation.create.models', defaultMessage: '3D model' },
  markets: { id: 'native_federation.create.markets', defaultMessage: 'Marketplace offer' },
  games: { id: 'native_federation.create.games', defaultMessage: 'Game' },
  routes: { id: 'native_federation.create.routes', defaultMessage: 'Route' },
  culture: { id: 'native_federation.create.culture', defaultMessage: 'Culture item' },
  coordination: { id: 'native_federation.create.coordination', defaultMessage: 'Coordination proposal' },
  publishing: { id: 'native_federation.create.publishing', defaultMessage: 'Publication' },
  created: { id: 'native_federation.create.created', defaultMessage: 'Native object created' },
  open: { id: 'native_federation.create.state.open', defaultMessage: 'Open' },
  inProgress: { id: 'native_federation.create.state.in_progress', defaultMessage: 'In progress' },
  resolved: { id: 'native_federation.create.state.resolved', defaultMessage: 'Resolved' },
  closed: { id: 'native_federation.create.state.closed', defaultMessage: 'Closed' },
  easy: { id: 'native_federation.create.difficulty.easy', defaultMessage: 'Easy' },
  moderate: { id: 'native_federation.create.difficulty.moderate', defaultMessage: 'Moderate' },
  hard: { id: 'native_federation.create.difficulty.hard', defaultMessage: 'Hard' },
  expert: { id: 'native_federation.create.difficulty.expert', defaultMessage: 'Expert' },
  offer: { id: 'native_federation.create.action.offer', defaultMessage: 'Offer' },
  request: { id: 'native_federation.create.action.request', defaultMessage: 'Request' },
  propose: { id: 'native_federation.create.action.propose', defaultMessage: 'Propose' },
  coordinate: { id: 'native_federation.create.action.coordinate', defaultMessage: 'Coordinate' },
});

const stateOptions = [
  { label: messages.open, value: 'open' },
  { label: messages.inProgress, value: 'in_progress' },
  { label: messages.resolved, value: 'resolved' },
  { label: messages.closed, value: 'closed' },
];

const templates: Record<TemplateKey, TemplateDefinition> = {
  books: { label: messages.books, hint: { id: 'native_federation.create.books_hint', defaultMessage: 'Publish a review with an optional link to the book.' }, detailLabel: { id: 'native_federation.create.rating', defaultMessage: 'Rating' }, detailHint: { id: 'native_federation.create.rating_hint', defaultMessage: 'A whole number from 1 to 5.' }, detailType: 'number', defaultDetail: '5' },
  software: { label: messages.software, hint: { id: 'native_federation.create.software_hint', defaultMessage: 'Describe an issue or task and optionally link its repository.' }, detailLabel: { id: 'native_federation.create.ticket_state', defaultMessage: 'Ticket state' }, detailOptions: stateOptions, defaultDetail: 'open' },
  models: { label: messages.models, hint: { id: 'native_federation.create.models_hint', defaultMessage: 'Describe a model and optionally link its canonical download page.' }, detailLabel: { id: 'native_federation.create.version', defaultMessage: 'Version' }, detailHint: { id: 'native_federation.create.version_hint', defaultMessage: 'Optional release or revision label.' } },
  markets: { label: messages.markets, hint: { id: 'native_federation.create.markets_hint', defaultMessage: 'Publish an offer without contacting the linked marketplace.' }, detailLabel: { id: 'native_federation.create.price', defaultMessage: 'Price' }, detailHint: { id: 'native_federation.create.price_hint', defaultMessage: 'Optional positive amount with up to two decimals.' }, secondaryLabel: { id: 'native_federation.create.currency', defaultMessage: 'Currency' }, secondaryHint: { id: 'native_federation.create.currency_hint', defaultMessage: 'Required with a price, as a three-letter code.' } },
  games: { label: messages.games, hint: { id: 'native_federation.create.games_hint', defaultMessage: 'Describe a game, match, or playable project.' }, detailLabel: { id: 'native_federation.create.game_state', defaultMessage: 'State' }, detailHint: { id: 'native_federation.create.game_state_hint', defaultMessage: 'Optional short state such as active or complete.' } },
  routes: { label: messages.routes, hint: { id: 'native_federation.create.routes_hint', defaultMessage: 'Publish a route summary and optionally link its map or GPX page.' }, detailLabel: { id: 'native_federation.create.distance', defaultMessage: 'Distance' }, detailHint: { id: 'native_federation.create.distance_hint', defaultMessage: 'Optional number followed by km, mi, or m.' }, secondaryLabel: { id: 'native_federation.create.difficulty', defaultMessage: 'Difficulty' }, secondaryOptions: [{ label: messages.easy, value: 'easy' }, { label: messages.moderate, value: 'moderate' }, { label: messages.hard, value: 'hard' }, { label: messages.expert, value: 'expert' }] },
  culture: { label: messages.culture, hint: { id: 'native_federation.create.culture_hint', defaultMessage: 'Share a film, performance, exhibition, or other catalog item.' }, detailLabel: { id: 'native_federation.create.category', defaultMessage: 'Category' }, detailHint: { id: 'native_federation.create.category_hint', defaultMessage: 'Optional short catalog category.' } },
  coordination: { label: messages.coordination, hint: { id: 'native_federation.create.coordination_hint', defaultMessage: 'Publish a bounded proposal for shared work or resources.' }, detailLabel: { id: 'native_federation.create.action', defaultMessage: 'Action' }, detailOptions: [{ label: messages.offer, value: 'offer' }, { label: messages.request, value: 'request' }, { label: messages.propose, value: 'propose' }, { label: messages.coordinate, value: 'coordinate' }], defaultDetail: 'propose' },
  publishing: { label: messages.publishing, hint: { id: 'native_federation.create.publishing_hint', defaultMessage: 'Publish a long-form document with an optional canonical reference.' }, detailLabel: { id: 'native_federation.create.license', defaultMessage: 'License' }, detailHint: { id: 'native_federation.create.license_hint', defaultMessage: 'Optional short license name or URL.' } },
};

const NativeObjectComposer: React.FC = () => {
  const api = useApi();
  const intl = useIntl();
  const [expanded, setExpanded] = useState(false);
  const [template, setTemplate] = useState<TemplateKey>('books');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [detail, setDetail] = useState(templates.books.defaultDetail || '');
  const [secondary, setSecondary] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [created, setCreated] = useState<NativeObjectResponse>();
  const definition = templates[template];

  const { mutate: createNativeObject, isPending } = useMutation({
    mutationFn: async (): Promise<NativeObjectResponse> => {
      const response = await api.post('/api/v1/discovery/native-objects', { template, title: title.trim(), content: content.trim(), reference_url: referenceUrl.trim(), detail: detail.trim(), secondary: secondary.trim(), visibility });
      const result = await response.json() as Partial<NativeObjectResponse>;

      if (typeof result.id !== 'string' || typeof result.url !== 'string') {
        throw new Error('The server returned an invalid native object.');
      }

      return { id: result.id, url: result.url };
    },
    onSuccess: (result) => {
      setCreated(result);
      setTitle('');
      setContent('');
      setReferenceUrl('');
      setDetail(definition.defaultDetail || '');
      setSecondary('');
      toast.success(messages.created);
    },
    onError: (error) => toast.showAlertForError(error as HTTPError),
  });

  const selectTemplate = (nextTemplate: TemplateKey) => {
    setTemplate(nextTemplate);
    setDetail(templates[nextTemplate].defaultDetail || '');
    setSecondary('');
    setCreated(undefined);
  };

  return (
    <section className='rounded-xl border border-solid border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/40'>
      <Stack space={4}>
        <HStack alignItems='center' justifyContent='between' space={4}>
          <Stack space={1}>
            <Text size='lg' weight='bold'><FormattedMessage id='native_federation.create.heading' defaultMessage='Create for the wider fediverse' /></Text>
            <Text size='sm' theme='muted'><FormattedMessage id='native_federation.create.summary' defaultMessage='Choose a native object family. References remain inert links and are never fetched while you compose.' /></Text>
          </Stack>
          <Button type='button' theme={expanded ? 'secondary' : 'primary'} onClick={() => setExpanded((value) => !value)}>
            {expanded ? <FormattedMessage id='native_federation.create.close' defaultMessage='Close' /> : <FormattedMessage id='native_federation.create.open' defaultMessage='Create' />}
          </Button>
        </HStack>

        {expanded && (
          <Form onSubmit={() => createNativeObject()}>
            <FormGroup labelText={<FormattedMessage id='native_federation.create.type' defaultMessage='Object type' />} hintText={intl.formatMessage(definition.hint)}>
              <Select value={template} onChange={(event) => selectTemplate(event.target.value as TemplateKey)}>
                {(Object.keys(templates) as TemplateKey[]).map((key) => <option key={key} value={key}>{intl.formatMessage(templates[key].label)}</option>)}
              </Select>
            </FormGroup>
            <FormGroup labelText={<FormattedMessage id='native_federation.create.title' defaultMessage='Title' />}><Input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} required /></FormGroup>
            <FormGroup labelText={<FormattedMessage id='native_federation.create.description' defaultMessage='Description' />}><Textarea value={content} onChange={(event) => setContent(event.target.value)} required /></FormGroup>
            <FormGroup labelText={<FormattedMessage id='native_federation.create.reference' defaultMessage='Reference URL' />} hintText={<FormattedMessage id='native_federation.create.reference_hint' defaultMessage='Optional canonical page, repository, catalog entry, map, or resource link.' />}><Input type='url' value={referenceUrl} maxLength={2048} onChange={(event) => setReferenceUrl(event.target.value)} /></FormGroup>

            {definition.detailLabel && (
              <FormGroup labelText={intl.formatMessage(definition.detailLabel)} hintText={definition.detailHint && intl.formatMessage(definition.detailHint)}>
                {definition.detailOptions ? <Select value={detail} onChange={(event) => setDetail(event.target.value)}>{definition.detailOptions.map((option) => <option key={option.value} value={option.value}>{intl.formatMessage(option.label)}</option>)}</Select> : <Input type={definition.detailType || 'text'} min={definition.detailType === 'number' ? 1 : undefined} max={definition.detailType === 'number' ? 5 : undefined} value={detail} maxLength={120} onChange={(event) => setDetail(event.target.value)} />}
              </FormGroup>
            )}

            {definition.secondaryLabel && (
              <FormGroup labelText={intl.formatMessage(definition.secondaryLabel)} hintText={definition.secondaryHint && intl.formatMessage(definition.secondaryHint)}>
                {definition.secondaryOptions ? <Select value={secondary} onChange={(event) => setSecondary(event.target.value)}><option value=''>{intl.formatMessage({ id: 'native_federation.create.unspecified', defaultMessage: 'Unspecified' })}</option>{definition.secondaryOptions.map((option) => <option key={option.value} value={option.value}>{intl.formatMessage(option.label)}</option>)}</Select> : <Input value={secondary} maxLength={120} onChange={(event) => setSecondary(event.target.value)} />}
              </FormGroup>
            )}

            <FormGroup labelText={<FormattedMessage id='native_federation.create.visibility' defaultMessage='Visibility' />}>
              <Select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value='public'>{intl.formatMessage({ id: 'privacy.public.short', defaultMessage: 'Public' })}</option><option value='unlisted'>{intl.formatMessage({ id: 'privacy.unlisted.short', defaultMessage: 'Unlisted' })}</option><option value='private'>{intl.formatMessage({ id: 'privacy.private.short', defaultMessage: 'Followers only' })}</option></Select>
            </FormGroup>
            <FormActions><Button type='submit' theme='primary' disabled={isPending || !title.trim() || !content.trim()}>{isPending ? <FormattedMessage id='native_federation.create.creating' defaultMessage='Creating...' /> : <FormattedMessage id='native_federation.create.submit' defaultMessage='Publish native object' />}</Button></FormActions>
          </Form>
        )}

        {created && (
          <HStack alignItems='center' justifyContent='between' space={4} className='rounded-lg bg-white p-3 dark:bg-gray-900'>
            <Text size='sm' weight='medium'><FormattedMessage id='native_federation.create.ready' defaultMessage='Your native object is published and ready to federate.' /></Text>
            <Button type='button' onClick={() => window.location.assign(created.url)}><FormattedMessage id='native_federation.create.view' defaultMessage='View object' /></Button>
          </HStack>
        )}
      </Stack>
    </section>
  );
};

export default NativeObjectComposer;

/* end of src/features/native-federation/native-object-composer.tsx */
