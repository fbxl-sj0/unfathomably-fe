import { PureComponent, Suspense } from 'react';

import Base from '@/components/modal-root.tsx';
import {
  AccountModerationModal,
  ActionsModal,
  BirthdaysModal,
  BoostModal,
  CompareHistoryModal,
  ComponentModal,
  ComposeEventModal,
  ComposeModal,
  ConfirmationModal,
  CryptoDonateModal,
  DislikesModal,
  EditAnnouncementModal,
  EditDomainModal,
  EditFederationModal,
  EmbedModal,
  EmojiPickerModal,
  EventMapModal,
  EventParticipantsModal,
  FamiliarFollowersModal,
  FavouritesModal,
  HotkeysModal,
  JoinEventModal,
  LandingPageModal,
  ListAdder,
  ListEditor,
  CreateGroupModal,
  MediaModal,
  MentionsModal,
  MissingDescriptionModal,
  MuteModal,
  NostrLoginModal,
  NostrSignupModal,
  OnboardingModal,
  ReactionsModal,
  ReblogsModal,
  ReplyMentionsModal,
  ReportModal,
  StreakModal,
  UnauthorizedModal,
  VideoModal,
  EditRuleModal,
  PayRequestModal,
  PolicyModal,
  ZapSplitModal,
  ZapInvoiceModal,
  ZapsModal,
  CaptchaModal,
} from '@/features/ui/util/async-components.ts';

import ModalLoading from './modal-loading.tsx';

/* eslint sort-keys: "error" */
const MODAL_COMPONENTS: Record<string, React.ExoticComponent<any>> = {
  'ACCOUNT_MODERATION': AccountModerationModal,
  'ACTIONS': ActionsModal,
  'BIRTHDAYS': BirthdaysModal,
  'BOOST': BoostModal,
  'CAPTCHA': CaptchaModal,
  'COMPARE_HISTORY': CompareHistoryModal,
  'COMPONENT': ComponentModal,
  'COMPOSE': ComposeModal,
  'COMPOSE_EVENT': ComposeEventModal,
  'CONFIRM': ConfirmationModal,
  'CREATE_GROUP': CreateGroupModal,
  'CRYPTO_DONATE': CryptoDonateModal,
  'DISLIKES': DislikesModal,
  'EDIT_ANNOUNCEMENT': EditAnnouncementModal,
  'EDIT_DOMAIN': EditDomainModal,
  'EDIT_FEDERATION': EditFederationModal,
  'EDIT_RULE': EditRuleModal,
  'EMBED': EmbedModal,
  'EMOJI_PICKER': EmojiPickerModal,
  'EVENT_MAP': EventMapModal,
  'EVENT_PARTICIPANTS': EventParticipantsModal,
  'FAMILIAR_FOLLOWERS': FamiliarFollowersModal,
  'FAVOURITES': FavouritesModal,
  'HOTKEYS': HotkeysModal,
  'JOIN_EVENT': JoinEventModal,
  'LANDING_PAGE': LandingPageModal,
  'LIST_ADDER': ListAdder,
  'LIST_EDITOR': ListEditor,
  'MEDIA': MediaModal,
  'MENTIONS': MentionsModal,
  'MISSING_DESCRIPTION': MissingDescriptionModal,
  'MUTE': MuteModal,
  'NOSTR_LOGIN': NostrLoginModal,
  'NOSTR_SIGNUP': NostrSignupModal,
  'ONBOARDING': OnboardingModal,
  'PAY_REQUEST': PayRequestModal,
  'POLICY': PolicyModal,
  'REACTIONS': ReactionsModal,
  'REBLOGS': ReblogsModal,
  'REPLY_MENTIONS': ReplyMentionsModal,
  'REPORT': ReportModal,
  'STREAK': StreakModal,
  'UNAUTHORIZED': UnauthorizedModal,
  'VIDEO': VideoModal,
  'ZAPS': ZapsModal,
  'ZAP_INVOICE': ZapInvoiceModal,
  'ZAP_SPLIT': ZapSplitModal,
};

export type ModalType = keyof typeof MODAL_COMPONENTS | null;

interface IModalRoot {
  type: ModalType;
  props?: Record<string, any> | null;
  onClose: (type?: ModalType) => void;
}

export default class ModalRoot extends PureComponent<IModalRoot> {

  private locked = false;
  private scrollY = 0;
  private previousBodyStyle = {
    left: '',
    overflow: '',
    position: '',
    right: '',
    top: '',
    width: '',
  };

  componentDidMount() {
    if (this.props.type) this.lockDocumentScroll();
  }

  componentDidUpdate(prevProps: IModalRoot) {
    if (!prevProps.type && this.props.type) this.lockDocumentScroll();
    if (prevProps.type && !this.props.type) this.unlockDocumentScroll();
  }

  componentWillUnmount() {
    this.unlockDocumentScroll();
  }

  lockDocumentScroll = () => {
    if (this.locked) return;

    const { body, documentElement } = document;
    this.locked = true;
    this.scrollY = window.scrollY;
    this.previousBodyStyle = {
      left: body.style.left,
      overflow: body.style.overflow,
      position: body.style.position,
      right: body.style.right,
      top: body.style.top,
      width: body.style.width,
    };

    body.classList.add('overflow-hidden');
    documentElement.classList.add('overflow-hidden');
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  };

  unlockDocumentScroll = () => {
    if (!this.locked) return;

    const { body, documentElement } = document;
    this.locked = false;
    body.classList.remove('overflow-hidden');
    documentElement.classList.remove('overflow-hidden');
    body.style.position = this.previousBodyStyle.position;
    body.style.top = this.previousBodyStyle.top;
    body.style.left = this.previousBodyStyle.left;
    body.style.right = this.previousBodyStyle.right;
    body.style.width = this.previousBodyStyle.width;
    body.style.overflow = this.previousBodyStyle.overflow;
    window.scrollTo(0, this.scrollY);
  };

  renderLoading = (modalId: string) => {
    return !['MEDIA', 'VIDEO', 'BOOST', 'CONFIRM', 'ACTIONS'].includes(modalId) ? <ModalLoading /> : null;
  };

  onClickClose = (_?: ModalType) => {
    const { onClose, type } = this.props;
    onClose(type);
  };

  render() {
    const { type, props } = this.props;
    const Component = type ? MODAL_COMPONENTS[type] : null;

    return (
      <Base onClose={this.onClickClose} type={type}>
        {(Component && !!type) && (
          <Suspense fallback={this.renderLoading(type)}>
            <Component {...props} onClose={this.onClickClose} />
          </Suspense>
        )}
      </Base>
    );
  }

}
