import assert from 'node:assert/strict';
import { outboundRel, withOutboundUtm } from '../src/lib/outbound-links';

const tagged = new URL(
  withOutboundUtm('https://www.youtube.com/watch?v=abc', true)
);
assert.equal(tagged.searchParams.get('v'), 'abc');
assert.equal(tagged.searchParams.get('utm_source'), 'mundobl');
assert.equal(tagged.searchParams.get('utm_medium'), 'referral');
assert.equal(tagged.searchParams.get('utm_campaign'), 'where_to_watch');

const unofficial = 'https://example.com/serie';
assert.equal(withOutboundUtm(unofficial, false), unofficial);
const existing = 'https://www.viki.com/tv/1?utm_source=partner';
assert.equal(withOutboundUtm(existing, true), existing);
assert.equal(
  withOutboundUtm('http://insecure.test/x', true),
  'http://insecure.test/x'
);
assert.equal(withOutboundUtm('not a url', true), 'not a url');

assert.equal(outboundRel(true).includes('noreferrer'), false);
assert.equal(outboundRel(false).includes('noreferrer'), true);
assert.ok(outboundRel(true).includes('noopener'));

console.log(
  'Outbound links: UTM only on official https links, existing UTMs kept, rel by officiality passed.'
);
