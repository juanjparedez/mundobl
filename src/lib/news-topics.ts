const TRAILER =
  /\b(trailer|teaser)\b|ตัวอย่าง|ทีเซอร์|예고|티저|予告|ティザー|預告|预告/i;
const EPISODE_OR_MUSIC =
  /\bep\.?\s*\d|\bost\b|ตอน(?:ที่)?\s*\d|第\s*\d+\s*[話话集]|\d+\s*회/i;

export function isSeriesTrailer(title: string): boolean {
  return TRAILER.test(title) && !EPISODE_OR_MUSIC.test(title);
}
