import { describe, expect, it } from 'vitest';

import { addAutoPlay } from './media.ts';

const parseIframe = (html: string): HTMLIFrameElement => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return document.querySelector('iframe')!;
};

describe('addAutoPlay()', () => {
  describe('when the provider is Rumble', () => {
    it('adds the correct query parameters to the src', () => {
      const html = '<iframe src="https://rumble.com/embed/123456/" width="1920" height="1080" frameborder="0" title="Video upload for 1" allowfullscreen=""></iframe>';
      const iframe = parseIframe(addAutoPlay(html));
      expect(iframe.src).toEqual('https://rumble.com/embed/123456/?pub=7a20&autoplay=2');
      expect(iframe.style.width).toEqual('100%');
      expect(iframe.style.height).toEqual('100%');
    });

    describe('when the iframe src already has params', () => {
      it('adds the correct query parameters to the src', () => {
        const html = '<iframe src="https://rumble.com/embed/123456/?foo=bar" width="1920" height="1080" frameborder="0" title="Video upload for 1" allowfullscreen=""></iframe>';
        const iframe = parseIframe(addAutoPlay(html));
        expect(iframe.src).toEqual('https://rumble.com/embed/123456/?foo=bar&pub=7a20&autoplay=2');
      });
    });
  });

  describe('when the provider is not Rumble', () => {
    it('adds the correct query parameters to the src', () => {
      const html = '<iframe src="https://youtube.com/embed/123456/" width="1920" height="1080" frameborder="0" title="Video upload for 1" allowfullscreen=""></iframe>';
      const iframe = parseIframe(addAutoPlay(html));
      expect(iframe.src).toEqual('https://youtube.com/embed/123456/?autoplay=1&auto_play=1');
      expect(iframe.getAttribute('allow')).toEqual('autoplay');
    });

    describe('when the iframe src already has params', () => {
      it('adds the correct query parameters to the src', () => {
        const html = '<iframe src="https://youtube.com/embed/123456?foo=bar" width="1920" height="1080" frameborder="0" title="Video upload for 1" allowfullscreen=""></iframe>';
        const iframe = parseIframe(addAutoPlay(html));
        expect(iframe.src).toEqual('https://youtube.com/embed/123456?foo=bar&autoplay=1&auto_play=1');
      });
    });
  });
});
