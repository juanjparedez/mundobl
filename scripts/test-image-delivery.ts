import assert from 'node:assert/strict';
import { getImageProps } from 'next/image';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import nextConfig from '../next.config';
import {
  isDirectServedImageUrl,
  isStoredImageUrl,
} from '../src/lib/image-helpers';

const fandom =
  'https://static.wikia.nocookie.net/drama/images/3/3d/Decoding_You-2026-09.jpg/revision/latest/scale-to-width-down/250?cb=20261004212153&path-prefix=es';
const patterns = nextConfig.images?.remotePatterns ?? [];

for (const src of [
  fandom,
  'https://another-poster-cdn.example/poster.jpg',
  'https://img.mundobl.com.ar/series/poster.webp',
  'https://project.supabase.co/storage/v1/object/public/images/poster.webp',
]) {
  assert.equal(isDirectServedImageUrl(src), true);
  const { props } = getImageProps({
    src,
    alt: 'Poster',
    width: 260,
    height: 390,
    unoptimized: isDirectServedImageUrl(src),
  });
  assert.equal(props.src, src, 'Render the original URL, never /_next/image');
  assert.equal(props.srcSet, undefined, 'No optimizer URLs in srcSet either');
}

assert.equal(isStoredImageUrl(fandom), false, 'Still attempt to rehost Fandom');
assert.equal(isStoredImageUrl('https://img.mundobl.com.ar/a.webp'), true);
assert.equal(
  isStoredImageUrl('https://project.supabase.co/storage/v1/a.webp'),
  true
);
assert.equal(isStoredImageUrl('https://img.mundobl.com.ar.evil.test/a'), false);

for (const host of [
  'i.ytimg.com',
  'img.youtube.com',
  'lh3.googleusercontent.com',
  'lh6.googleusercontent.com',
  'yt3.ggpht.com',
  'avatars.githubusercontent.com',
  'image.tmdb.org',
  'i.vimeocdn.com',
  'googleusercontent.com',
  'nested.lh3.googleusercontent.com',
  'lh3.googleusercontent.com.evil.test',
  'static.wikia.nocookie.net',
]) {
  for (const protocol of ['https:', 'http:']) {
    const src = `${protocol}//${host}/poster.jpg?version=1`;
    assert.equal(
      !isDirectServedImageUrl(src),
      hasRemoteMatch([], patterns, new URL(src)),
      `Display policy must agree with Next remotePatterns: ${src}`
    );
  }
}

for (const src of [null, undefined, '', '/images/logo.png', 'invalid']) {
  assert.equal(isDirectServedImageUrl(src), false);
  assert.equal(isStoredImageUrl(src), false);
}

console.log(
  'PASS: external posters render directly; optimizer policy and storage ownership stay separate.'
);
