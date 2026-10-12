/** Editable metadata; identity, ownership and episode IDs never come from the client. */
export const CURATION_FIELDS = {
  title: 'fieldTitle',
  originalTitle: 'fieldOriginalTitle',
  year: 'fieldYear',
  type: 'fieldType',
  durationMinutes: 'fieldDurationMinutes',
  basedOn: 'fieldBasedOn',
  format: 'fieldFormat',
  imageUrl: 'fieldImage',
  imagePosition: 'fieldImagePosition',
  synopsis: 'fieldSynopsis',
  review: 'fieldReview',
  soundtrack: 'fieldSoundtrack',
  overallRating: 'fieldRating',
  observations: 'fieldObservations',
  countryName: 'fieldCountry',
  productionCompanyName: 'fieldProduction',
  originalLanguageName: 'fieldLanguage',
  actors: 'sectionCast',
  directors: 'sectionDirectors',
  tags: 'fieldTags',
  genres: 'fieldGenres',
  airDays: 'curationAirDays',
  featured: 'fieldFeatured',
  featuredOrder: 'fieldFeaturedOrder',
  notesPrivate: 'curationPrivate',
  universeId: 'fieldUniverse',
  isUniverseMain: 'universeMain',
  dubbingIds: 'curationDubbing',
  relatedSeriesIds: 'sectionRelated',
} as const;
export type CurationField = keyof typeof CURATION_FIELDS;

export function hasCurationValue(value: unknown): boolean {
  return (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    (!Array.isArray(value) || value.length > 0)
  );
}
