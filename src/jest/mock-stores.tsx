import alexJson from '@/__fixtures__/pleroma-account.json';
import { instanceV2Schema } from '@/schemas/instance.ts';

import { buildAccount } from './factory.ts';

/** Store with registrations open. */
const storeOpen = { instance: instanceV2Schema.parse({ registrations: { enabled: true } }) };

/** Store with registrations closed. */
const storeClosed = { instance: instanceV2Schema.parse({ registrations: { enabled: false } }) };

/** Store with a logged-in user. */
const storeLoggedIn = {
  me: alexJson.id,
  accounts: {
    [alexJson.id]: buildAccount(alexJson as any),
  },
};

export {
  storeOpen,
  storeClosed,
  storeLoggedIn,
};
