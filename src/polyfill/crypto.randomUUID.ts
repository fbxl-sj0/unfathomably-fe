/*
  Project: Unfathomably Frontend
  ------------------------------

  File: src/polyfill/crypto.randomUUID.ts

  Purpose:

    Provide crypto.randomUUID() on browser origins where the Web Crypto object
    exists, but the convenience UUID helper is not exposed.

  Responsibilities:

    * preserve the native implementation whenever the browser provides one
    * generate RFC 4122 version 4 UUIDs with crypto.getRandomValues()
    * keep temporary HTTP smoke-test deployments from crashing during startup

  This file intentionally does NOT contain:

    * application-specific id generation
    * server-side UUID generation
    * non-browser cryptography helpers
*/

const browserCrypto = globalThis.crypto as (Crypto & {
  randomUUID?: () => `${string}-${string}-${string}-${string}-${string}`;
}) | undefined;

if (browserCrypto && typeof browserCrypto.randomUUID !== 'function') {
  const byteToHex = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, '0'));

  browserCrypto.randomUUID = function randomUUID() {
    const bytes = new Uint8Array(16);

    /*
      RFC 4122 version 4 UUIDs store the version in the high nibble of byte 6
      and the variant in the high bits of byte 8.  getRandomValues() is still
      available on ordinary HTTP origins, unlike crypto.randomUUID().
    */
    browserCrypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [
      byteToHex[bytes[0]],
      byteToHex[bytes[1]],
      byteToHex[bytes[2]],
      byteToHex[bytes[3]],
      '-',
      byteToHex[bytes[4]],
      byteToHex[bytes[5]],
      '-',
      byteToHex[bytes[6]],
      byteToHex[bytes[7]],
      '-',
      byteToHex[bytes[8]],
      byteToHex[bytes[9]],
      '-',
      byteToHex[bytes[10]],
      byteToHex[bytes[11]],
      byteToHex[bytes[12]],
      byteToHex[bytes[13]],
      byteToHex[bytes[14]],
      byteToHex[bytes[15]],
    ].join('') as `${string}-${string}-${string}-${string}-${string}`;
  };
}

/* end of src/polyfill/crypto.randomUUID.ts */
