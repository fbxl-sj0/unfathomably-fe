import { NSchema as n, NostrSigner, NSecSigner } from '@nostrify/nostrify';
import { getPublicKey, nip19 } from 'nostr-tools';
import { z } from 'zod';

const storageLocks = new WeakMap<object, Set<string>>();

const lockStorageKey = (storage: Storage | undefined, key: string): void => {
  if (!storage) return;

  const prototype = Object.getPrototypeOf(storage) as Storage | undefined;

  if (!prototype || typeof prototype.getItem !== 'function') return;

  let lockedKeys = storageLocks.get(prototype);

  if (!lockedKeys) {
    const prototypeLockedKeys = new Set<string>();
    lockedKeys = prototypeLockedKeys;
    storageLocks.set(prototype, prototypeLockedKeys);

    const getItem = prototype.getItem;

    prototype.getItem = function(storageKey: string): string | null {
      if (prototypeLockedKeys.has(storageKey)) {
        throw new Error(`${storageKey} is locked`);
      }

      return getItem.call(this, storageKey);
    };
  }

  lockedKeys.add(key);

  /*
   * This blocks direct property access such as localStorage[storageKey].
   * The getItem override above still protects runtimes that refuse to
   * redefine a property on the Storage prototype.
   */
  try {
    Object.defineProperty(prototype, key, {
      configurable: true,
      get() {
        throw new Error(`${key} is locked`);
      },
    });
  } catch {
    // Some runtimes may reject redefining Storage prototype properties.
  }
};

/**
 * Gets Nostr keypairs from storage and returns a `Map`-like object of signers.
 * When instantiated, it will lock the storage key to prevent tampering.
 * Changes to the object will sync to storage.
 */
export class NKeyring implements ReadonlyMap<string, NostrSigner> {

  #keypairs = new Map<string, Uint8Array>();
  #storage?: Storage;
  #storageKey: string;

  constructor(storage: Storage | undefined, storageKey: string) {
    this.#storage = storage;
    this.#storageKey = storageKey;

    const data = this.#storage?.getItem(storageKey);
    lockStorageKey(this.#storage, storageKey);

    try {
      const nsecs = new Set(this.dataSchema().parse(data));

      for (const nsec of nsecs) {
        const { data: secretKey } = nip19.decode(nsec);
        const pubkey = getPublicKey(secretKey);
        this.#keypairs.set(pubkey, secretKey);
      }
    } catch (e) {
      this.clear();
    }
  }

  private dataSchema(): z.ZodType<`nsec1${string}`[]> {
    return n.json().pipe(n.bech32('nsec').array()) as unknown as z.ZodType<`nsec1${string}`[]>;
  }

  #syncStorage() {
    const secretKeys = [...this.#keypairs.values()].map(nip19.nsecEncode);
    this.#storage?.setItem(this.#storageKey, JSON.stringify(secretKeys));
  }

  get size(): number {
    return this.#keypairs.size;
  }

  clear(): void {
    this.#keypairs.clear();
    this.#syncStorage();
  }

  delete(pubkey: string): boolean {
    const result = this.#keypairs.delete(pubkey);
    this.#syncStorage();
    return result;
  }

  forEach(callbackfn: (signer: NostrSigner, pubkey: string, map: typeof this) => void, thisArg?: any): void {
    for (const [pubkey] of this.#keypairs) {
      const signer = this.get(pubkey);
      if (signer) {
        callbackfn.call(thisArg, signer, pubkey, this);
      }
    }
  }

  get(pubkey: string): NostrSigner | undefined {
    const secretKey = this.#keypairs.get(pubkey);
    if (secretKey) {
      return new NSecSigner(secretKey);
    }
  }

  has(pubkey: string): boolean {
    return this.#keypairs.has(pubkey);
  }

  add(secretKey: Uint8Array): NostrSigner {
    const pubkey = getPublicKey(secretKey);
    this.#keypairs.set(pubkey, secretKey);
    this.#syncStorage();
    return this.get(pubkey)!;
  }

  *entries(): MapIterator<[string, NostrSigner]> {
    for (const [pubkey] of this.#keypairs) {
      yield [pubkey, this.get(pubkey)!];
    }
  }

  *keys(): MapIterator<string> {
    for (const pubkey of this.#keypairs.keys()) {
      yield pubkey;
    }
  }

  *values(): MapIterator<NostrSigner> {
    for (const pubkey of this.#keypairs.keys()) {
      yield this.get(pubkey)!;
    }
  }

  [Symbol.iterator](): MapIterator<[string, NostrSigner]> {
    return this.entries();
  }

  [Symbol.toStringTag] = 'NKeyStorage';

}
