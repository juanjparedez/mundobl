import type { SupportedLocale } from './config';

type TranslationShape = {
  common: {
    language: string;
    na: string;
    private: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    neverWatched: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
  };
  seriesDetail: {
    tabInfo: string;
    tabContent: string;
    tabRatings: string;
    tabComments: string;
  };
  seriesHeader: {
    universe: string;
    originalTitle: string;
    formatVertical: string;
    basedOn: string;
    typeSerie: string;
    typePelicula: string;
    typeCorto: string;
    typeEspecial: string;
    typeAnime: string;
    typeReality: string;
  };
  seriesInfo: {
    fieldTitle: string;
    fieldOriginalTitle: string;
    fieldYear: string;
    fieldCountry: string;
    fieldType: string;
    fieldFormat: string;
    fieldBasedOn: string;
    fieldSeasons: string;
    fieldEpisodes: string;
    fieldSoundtrack: string;
    fieldProduction: string;
    fieldLanguage: string;
    fieldDubbings: string;
    fieldGenre: string;
    fieldDirectors: string;
    formatVertical: string;
    formatRegular: string;
    whereToWatch: string;
    unofficial: string;
    castSection: string;
    couplebadge: string;
    asCharacter: string;
    protagonist: string;
    synopsisSection: string;
    reviewSection: string;
    observationsSection: string;
    privateLabel: string;
    notesPrivateLabel: string;
    notesPrivateHelp: string;
    relatedSection: string;
  };
  comments: {
    addTitle: string;
    placeholderPrivate: string;
    placeholderPublic: string;
    placeholderEpisode: string;
    tooltipPrivate: string;
    privateLabel: string;
    savePrivateButton: string;
    addButton: string;
    privateButtonCompact: string;
    commentButton: string;
    loginPrompt: string;
    listTitle: string;
    emptyText: string;
    warningEmpty: string;
    successPrivate: string;
    successPublic: string;
    errorSave: string;
    reportModalTitle: string;
    reportModalHint: string;
    reportPlaceholder: string;
    reportButton: string;
    cancelButton: string;
    reportedSuccess: string;
    reportError: string;
  };
  episodesList: {
    headerTitle: string;
    generateButton: string;
    addButton: string;
    emptyText: string;
    selectedCount: string;
    colEpisode: string;
    colActions: string;
    bulkWatched: string;
    bulkUnwatched: string;
    bulkDelete: string;
    tooltipWatched: string;
    tooltipUnwatched: string;
    tooltipDelete: string;
    tooltipEdit: string;
    watchedTag: string;
    deleteConfirmTitle: string;
    deleteConfirmContent: string;
    deleteBulkConfirmTitle: string;
    deleteBulkConfirmContent: string;
    confirmOk: string;
    confirmCancel: string;
    successUpdated: string;
    successCreated: string;
    successDeleted: string;
    successBulkWatched: string;
    successBulkUnwatched: string;
    errorSave: string;
    errorDelete: string;
    errorBulkDelete: string;
    errorToggleWatched: string;
    errorBulkToggle: string;
    errorGenerate: string;
    modalEditTitle: string;
    modalNewTitle: string;
    fieldEpisodeNumber: string;
    fieldEpisodeTitle: string;
    fieldMinutes: string;
    fieldSynopsis: string;
    hintTitle: string;
    hintSynopsis: string;
    requiredEpisodeNumber: string;
    saveButton: string;
    createButton: string;
    cancelButton: string;
    markedWatched: string;
    markedUnwatched: string;
    episodesUnit: string;
    bulkMarkedWatched: string;
    bulkMarkedUnwatched: string;
  };
  seasonsList: {
    emptyText: string;
    seasonLabel: string;
    capsTag: string;
    watchedTag: string;
    editButton: string;
    synopsisTitle: string;
    observationsTitle: string;
    commentsTitle: string;
    ratingsTitle: string;
    castTitle: string;
    protagonistTag: string;
  };
  ratingSection: {
    officialLabel: string;
    userAverageLabel: string;
    votesSingular: string;
    votesPlural: string;
    officialTitle: string;
    officialHint: string;
    saveOfficialButton: string;
    userTitle: string;
    userHint: string;
    saveUserButton: string;
    loginPrompt: string;
    userAverageTitle: string;
    successOfficial: string;
    errorOfficial: string;
    successUser: string;
    errorUser: string;
    catTrama: string;
    catCasting: string;
    catDireccion: string;
    catGuion: string;
    catProduccion: string;
    catFotografia: string;
    catBso: string;
    catQuimicaPrincipal: string;
    catQuimicaSecundaria: string;
  };
  viewStatus: {
    sinVer: string;
    viendo: string;
    vista: string;
    abandonada: string;
    retomar: string;
    ariaLabel: string;
    tooltipEpisodes: string;
    episodesUnit: string;
    errorUpdate: string;
    statusMessage: string;
  };
  watchingDashboard: {
    loginPrompt: string;
    emptyText: string;
    exploreCatalog: string;
    removeTitle: string;
    nextLabel: string;
    continueButton: string;
    detailsButton: string;
    editButton: string;
    removedMessage: string;
    errorRemove: string;
    episodeMarkedMessage: string;
    errorMarkEpisode: string;
    markEpisodeTooltip: string;
  };
  appLayout: {
    skipToContent: string;
  };
  sidebar: {
    catalog: string;
    watching: string;
    novedades: string;
    feedback: string;
    sites: string;
    content: string;
    administration: string;
    series: string;
    tags: string;
    universes: string;
    actors: string;
    directors: string;
    users: string;
    comments: string;
    info: string;
    logs: string;
    collapseMenu: string;
    expandMenu: string;
    login: string;
    logout: string;
    profile: string;
    switchToLight: string;
    switchToDark: string;
    dark: string;
    light: string;
    stats: string;
  };
  profile: {
    loginRequired: string;
    memberSince: string;
    statWatched: string;
    statWatching: string;
    statAbandoned: string;
    statToRewatch: string;
    statFavorites: string;
    statRatings: string;
    statComments: string;
    sectionWatching: string;
    sectionRecent: string;
    sectionFavorites: string;
    sectionMyComments: string;
    sectionDisputes: string;
    commentsSelectAll: string;
    commentsSelectedCount: string;
    commentsDeleteSelected: string;
    commentsDeleteSuccess: string;
    commentsDeleteError: string;
    commentsLoadError: string;
    commentsEmpty: string;
    commentsExport: string;
    commentsPublic: string;
    commentsPrivate: string;
    commentsTargetUnknown: string;
    commentsSearchPlaceholder: string;
    commentsFilterAll: string;
    commentsFilterPublic: string;
    commentsFilterPrivate: string;
    commentsFilterTargetAll: string;
    commentsFilterReported: string;
    commentsTargetSeries: string;
    commentsTargetSeason: string;
    commentsTargetEpisode: string;
    commentsSetPublic: string;
    commentsSetPrivate: string;
    commentsVisibilityUpdateError: string;
    commentsVisibilityPublicSuccess: string;
    commentsVisibilityPrivateSuccess: string;
    commentsReportCount: string;
    commentsEdit: string;
    commentsEditTitle: string;
    commentsEditPlaceholder: string;
    commentsEditSave: string;
    commentsEditCancel: string;
    commentsEditSuccess: string;
    commentsEditError: string;
    commentsOpenDispute: string;
    disputesEmpty: string;
    disputesLoadError: string;
    disputeOpenTitle: string;
    disputePlaceholder: string;
    disputeSubmit: string;
    disputeCancel: string;
    disputeSuccess: string;
    disputeError: string;
    disputeForComment: string;
    sectionStats: string;
    statsHoursWatched: string;
    statsActiveDays: string;
    statsTopGenres: string;
    statsTopCountries: string;
    statsTopActors: string;
    statsTopProductionCompanies: string;
    statsCompletedByYear: string;
    statsNoData: string;
    statsModeLabel: string;
    statsModeBasic: string;
    statsModeAdvanced: string;
    statsTopNLabel: string;
    statsTopN5: string;
    statsTopN10: string;
    statsTopN25: string;
    statsTopN50: string;
    statsTopNAll: string;
    statsRestoreWidgets: string;
    statsEpisodesLabel: string;
    statsStreakTitle: string;
    statsStreakDays: string;
    statsAvgRating: string;
    statsRatingsGiven: string;
    statsByType: string;
    statsTopRated: string;
    sectionSettings: string;
    settingsAppearanceTitle: string;
    settingsAppearanceHint: string;
    settingsAppearanceOpen: string;
    settingsSessionTitle: string;
    settingsSessionHint: string;
    settingsDangerTitle: string;
    settingsDangerHint: string;
    settingsExportData: string;
    settingsComingSoon: string;
    settingsIrreversible: string;
    settingsExportSuccess: string;
    settingsExportError: string;
    settingsDeleteTitle: string;
    settingsDeleteIntro: string;
    settingsDeletePolicyKeep: string;
    settingsDeletePolicyAnonymize: string;
    settingsDeletePolicyDelete: string;
    settingsDeleteEmailLabel: string;
    settingsDeleteEmailPlaceholder: string;
    settingsDeleteEmailHint: string;
    settingsDeleteConfirmButton: string;
    settingsDeleteCancelButton: string;
    settingsDeleteSuccess: string;
    settingsDeleteError: string;
    settingsDeleteMissingEmail: string;
  };
  novedades: {
    title: string;
    subtitle: string;
    empty: string;
    newSeriesTitle: string;
    newSeasonsTitle: string;
    seasonLabel: string;
    changelogTitle: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    label: string;
    openTitle: string;
    empty: string;
    new: string;
    unread: string;
    allRead: string;
    markRead: string;
    markAllRead: string;
    delete: string;
    clearAll: string;
    cleared: string;
    loginRequired: string;
  };
  offline: {
    message: string;
  };
  cmdk: {
    placeholder: string;
    hintMinChars: string;
    empty: string;
    groupSeries: string;
    groupActors: string;
    groupDirectors: string;
    groupTags: string;
    navigate: string;
    select: string;
    close: string;
  };
  bottomNav: {
    mainNavigation: string;
    catalog: string;
    watching: string;
    feedback: string;
    admin: string;
    loading: string;
    login: string;
    logout: string;
    settings: string;
    accentColor: string;
    theme: string;
    switchToLight: string;
    switchToDark: string;
  };
  settings: {
    title: string;
    sectionAppearance: string;
    sectionTypography: string;
    sectionDensity: string;
    sectionLanguage: string;
    sectionAccessibility: string;
    sectionDataPrivacy: string;
    sectionSession: string;
    themeLabel: string;
    themeLight: string;
    themeDark: string;
    accentLabel: string;
    toneLabel: string;
    toneDefault: string;
    toneWarm: string;
    toneCool: string;
    toneContrast: string;
    fontLabel: string;
    fontSystem: string;
    fontSerif: string;
    fontMono: string;
    fontDyslexic: string;
    scaleLabel: string;
    scaleSmall: string;
    scaleMedium: string;
    scaleLarge: string;
    scaleExtraLarge: string;
    densityLabel: string;
    densityCompact: string;
    densityComfortable: string;
    densitySpacious: string;
    motionLabel: string;
    motionAuto: string;
    motionReduce: string;
    saverLabel: string;
    saverDescription: string;
    saverOff: string;
    saverOn: string;
    resetButton: string;
    resetConfirm: string;
    clearCachesButton: string;
    clearCachesDescription: string;
    clearCachesSuccess: string;
    resetSwButton: string;
    resetSwDescription: string;
    resetSwConfirm: string;
    sectionNotifications: string;
    pushLabel: string;
    pushDescription: string;
    pushUnsupported: string;
    pushDeniedHint: string;
    closeOtherSessionsButton: string;
    closeOtherSessionsDescription: string;
    closeAllSessionsButton: string;
    closeAllSessionsConfirm: string;
    deleteAccountButton: string;
    deleteAccountDescription: string;
    closeButton: string;
    sectionPreferences: string;
    defaultCommentPrivateLabel: string;
    defaultCommentPrivateHint: string;
  };
  adminComments: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsReported: string;
    statsPage: string;
    filterAll: string;
    filterSeries: string;
    filterSeasons: string;
    filterEpisodes: string;
    filterAuthorAll: string;
    filterAuthorActive: string;
    filterAuthorDeleted: string;
    searchPlaceholder: string;
    reportedOnly: string;
    columnUser: string;
    columnComment: string;
    columnAbout: string;
    columnDate: string;
    columnActions: string;
    targetEpisode: string;
    targetSeason: string;
    targetSeries: string;
    targetSeriesFallback: string;
    targetUnknown: string;
    deletedUser: string;
    unnamedUser: string;
    edited: string;
    reportsSuffixOne: string;
    reportsSuffixMany: string;
    actionView: string;
    actionIgnore: string;
    actionEdit: string;
    actionDelete: string;
    dismissReportsTitle: string;
    dismissReportsDescription: string;
    dismissReportsConfirm: string;
    cancel: string;
    deleteTitle: string;
    deleteDescription: string;
    deleteConfirm: string;
    modalEditTitle: string;
    modalEditPlaceholder: string;
    save: string;
    noReason: string;
    loadError: string;
    deleteSuccess: string;
    deleteError: string;
    dismissSuccess: string;
    dismissError: string;
    editEmptyWarning: string;
    editLengthWarning: string;
    editSuccess: string;
    editError: string;
  };
  adminActors: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    statsSelected: string;
    newItem: string;
    searchPlaceholder: string;
    mergeSelected: string;
    columnName: string;
    columnStageName: string;
    columnNationality: string;
    columnSeries: string;
    columnActions: string;
    unnamed: string;
    emptyValue: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    requiredName: string;
    fieldName: string;
    fieldStageName: string;
    fieldBirthDate: string;
    fieldNationality: string;
    fieldImageUrl: string;
    fieldBiography: string;
    hintName: string;
    hintStageName: string;
    hintNationality: string;
    hintImageUrl: string;
    hintBiography: string;
    deleteTitle: string;
    deleteDescription: string;
    deleteBlockedDescription: string;
    mergeModalTitle: string;
    mergeSelectSurvivor: string;
    mergeWarning: string;
    participationCount: string;
    loadError: string;
    saveCreateSuccess: string;
    saveUpdateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
    mergeSuccess: string;
    mergeError: string;
  };
  adminDirectors: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    statsSelected: string;
    newItem: string;
    searchPlaceholder: string;
    mergeSelected: string;
    columnName: string;
    columnNationality: string;
    columnSeries: string;
    columnActions: string;
    emptyValue: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    requiredName: string;
    fieldName: string;
    fieldNationality: string;
    fieldImageUrl: string;
    fieldBiography: string;
    hintName: string;
    hintNationality: string;
    hintImageUrl: string;
    hintBiography: string;
    deleteTitle: string;
    deleteDescription: string;
    deleteBlockedDescription: string;
    mergeModalTitle: string;
    mergeSelectSurvivor: string;
    mergeWarning: string;
    seriesCount: string;
    loadError: string;
    saveCreateSuccess: string;
    saveUpdateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
    mergeSuccess: string;
    mergeError: string;
  };
  adminTags: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    statsSelected: string;
    searchPlaceholder: string;
    newPlaceholder: string;
    create: string;
    mergeSelected: string;
    columnTag: string;
    columnCategory: string;
    columnSeries: string;
    columnActions: string;
    emptyCategory: string;
    actionEdit: string;
    actionDelete: string;
    modalEditTitle: string;
    modalMergeTitle: string;
    save: string;
    cancel: string;
    fieldName: string;
    requiredName: string;
    hintName: string;
    mergeSelectSurvivor: string;
    mergeWarning: string;
    seriesCount: string;
    deleteTitle: string;
    deleteDescription: string;
    createEmptyWarning: string;
    loadError: string;
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
    mergeSuccess: string;
    mergeError: string;
  };
  adminProductionCompanies: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    searchPlaceholder: string;
    newItem: string;
    columnName: string;
    columnCountry: string;
    columnSeries: string;
    columnActions: string;
    emptyValue: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    fieldName: string;
    fieldCountry: string;
    requiredName: string;
    hintName: string;
    hintCountry: string;
    deleteTitle: string;
    deleteDescription: string;
    loadError: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  adminUniverses: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    searchPlaceholder: string;
    newItem: string;
    columnName: string;
    columnDescription: string;
    columnSeries: string;
    columnActions: string;
    emptyValue: string;
    seriesCount: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    fieldName: string;
    fieldDescription: string;
    fieldImageUrl: string;
    requiredName: string;
    hintName: string;
    hintDescription: string;
    hintImageUrl: string;
    deleteTitle: string;
    deleteDescription: string;
    deleteBlockedDescription: string;
    loadError: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  adminLanguages: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    searchPlaceholder: string;
    newItem: string;
    columnName: string;
    columnCode: string;
    columnSeries: string;
    columnDubbings: string;
    columnActions: string;
    emptyValue: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    fieldName: string;
    fieldCode: string;
    requiredName: string;
    hintName: string;
    hintCode: string;
    deleteTitle: string;
    deleteDescription: string;
    loadError: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  adminSites: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    searchPlaceholder: string;
    newItem: string;
    newItemShort: string;
    columnName: string;
    columnCategory: string;
    columnLanguage: string;
    columnDescription: string;
    columnOrder: string;
    columnActions: string;
    emptyValue: string;
    actionEdit: string;
    actionDelete: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    cancel: string;
    fieldName: string;
    fieldUrl: string;
    fieldDescription: string;
    fieldCategory: string;
    fieldLanguage: string;
    fieldImageUrl: string;
    fieldOrder: string;
    requiredName: string;
    requiredUrl: string;
    invalidUrl: string;
    hintName: string;
    hintUrl: string;
    hintDescription: string;
    hintCategory: string;
    hintLanguage: string;
    hintImageUrl: string;
    deleteTitle: string;
    deleteDescription: string;
    loadError: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  adminUsers: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsBanned: string;
    statsIps: string;
    searchPlaceholder: string;
    sectionUsers: string;
    sectionBannedIps: string;
    columnUser: string;
    columnRole: string;
    columnCreatedAt: string;
    columnActions: string;
    columnIp: string;
    columnReason: string;
    columnDate: string;
    tagBanned: string;
    actionBan: string;
    actionUnban: string;
    actionUnblockIp: string;
    banTitle: string;
    banDescription: string;
    unbanTitle: string;
    unbanDescription: string;
    roleAdmin: string;
    roleModerator: string;
    roleVisitor: string;
    filterAllRoles: string;
    filterOnlyAdmins: string;
    filterOnlyModerators: string;
    filterOnlyVisitors: string;
    ipPlaceholder: string;
    ipReasonPlaceholder: string;
    ipBlockButton: string;
    ipMissingWarning: string;
    ipBlockSuccess: string;
    ipBlockError: string;
    ipUnblockSuccess: string;
    ipUnblockError: string;
    loadError: string;
    roleUpdateSuccess: string;
    roleUpdateError: string;
    banSuccess: string;
    unbanSuccess: string;
    banError: string;
  };
  adminContent: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsFiltered: string;
    statsDuplicates: string;
    searchPlaceholder: string;
    newItem: string;
    newItemShort: string;
    actionImport: string;
    actionImportShort: string;
    actionShowDuplicates: string;
    columnTitle: string;
    columnPlatform: string;
    columnCategory: string;
    columnSeries: string;
    columnFeatured: string;
    columnActions: string;
    tagDuplicate: string;
    actionEdit: string;
    actionDelete: string;
    deleteTitle: string;
    cancel: string;
    modalNewTitle: string;
    modalEditTitle: string;
    save: string;
    fieldTitle: string;
    fieldUrl: string;
    fieldPlatform: string;
    fieldCategory: string;
    fieldDescription: string;
    fieldLanguage: string;
    fieldThumbnailUrl: string;
    thumbnailHint: string;
    fieldChannelName: string;
    fieldChannelUrl: string;
    fieldSeries: string;
    fieldOfficial: string;
    fieldFeatured: string;
    fieldOrder: string;
    requiredTitle: string;
    requiredUrl: string;
    requiredPlatform: string;
    invalidUrl: string;
    hintTitle: string;
    hintUrl: string;
    hintThumbnailUrl: string;
    hintChannelName: string;
    hintChannelUrl: string;
    hintSeries: string;
    previewButton: string;
    previewWarning: string;
    loadError: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    deleteSuccess: string;
    deleteError: string;
  };
  adminLogs: {
    title: string;
    subtitle: string;
    statsTotal: string;
    statsTotalUsers: string;
    statsTopEndpoints: string;
    statsActions: string;
    filterActionPlaceholder: string;
    filterUserPlaceholder: string;
    filterIpPlaceholder: string;
    filterPathPlaceholder: string;
    actionRefresh: string;
    actionCleanScanners: string;
    actionCleanOld: string;
    cleanModalTitle: string;
    cleanModalDaysLabel: string;
    cleanModalConfirmText: string;
    cleanModalOk: string;
    cleanModalCancel: string;
    anonymous: string;
    loadingText: string;
    emptyText: string;
    columnDate: string;
    columnUser: string;
    columnAction: string;
    columnPath: string;
    columnIp: string;
    columnUserAgent: string;
    columnCount: string;
    paginationPrev: string;
    paginationNext: string;
    pageInfo: string;
    showTotal: string;
    loadError: string;
    cleanError: string;
    cleanScannersError: string;
  };
  seriesForm: {
    headerCreate: string;
    headerEdit: string;
    favoriteButton: string;
    addFavoriteButton: string;
    cancelButton: string;
    unsavedTitle: string;
    unsavedContent: string;
    unsavedOk: string;
    unsavedCancel: string;
    sectionBasic: string;
    sectionCast: string;
    sectionDirectors: string;
    sectionWatchLinks: string;
    sectionRelated: string;
    sectionContent: string;
    fieldTitle: string;
    fieldOriginalTitle: string;
    fieldType: string;
    fieldCountry: string;
    fieldYear: string;
    fieldUniverse: string;
    fieldBasedOn: string;
    fieldFormat: string;
    fieldProduction: string;
    fieldLanguage: string;
    fieldGenres: string;
    fieldSynopsis: string;
    fieldSoundtrack: string;
    fieldRating: string;
    fieldObservations: string;
    fieldTags: string;
    fieldImage: string;
    fieldImagePosition: string;
    typeOption_serie: string;
    typeOption_pelicula: string;
    typeOption_corto: string;
    typeOption_especial: string;
    typeOption_anime: string;
    typeOption_reality: string;
    formatOption_regular: string;
    formatOption_vertical: string;
    requiredTitle: string;
    requiredType: string;
    requiredFormat: string;
    requiredSeasonNumber: string;
    helpBasedOn: string;
    helpProduction: string;
    helpLanguage: string;
    helpGenres: string;
    helpTags: string;
    helpImage: string;
    helpImagePosition: string;
    helpRelated: string;
    hintTitle: string;
    hintOriginalTitle: string;
    hintCountry: string;
    hintUniverse: string;
    hintBasedOn: string;
    hintProduction: string;
    hintLanguage: string;
    hintGenres: string;
    hintSynopsis: string;
    hintSoundtrack: string;
    hintRating: string;
    hintObservations: string;
    hintTags: string;
    hintImage: string;
    hintActorName: string;
    hintCharacter: string;
    hintDirectorName: string;
    hintPairingGroup: string;
    hintWatchUrl: string;
    hintRelatedSeries: string;
    castAlertTitle: string;
    castAlertDescription: string;
    castPairingHint: string;
    fieldActorName: string;
    fieldCharacter: string;
    fieldIsMain: string;
    fieldPairingGroup: string;
    addActorButton: string;
    addDirectorButton: string;
    fieldPlatform: string;
    fieldWatchUrl: string;
    fieldOfficial: string;
    addPlatformButton: string;
    seasonAlertTitle: string;
    seasonAlertEdit: string;
    seasonAlertCreate: string;
    fieldSeasonNumber: string;
    fieldEpisodeCount: string;
    editSeasonButton: string;
    addSeasonButton: string;
    relatedSearching: string;
    relatedEmpty: string;
    createButton: string;
    saveButton: string;
    universeModalTitle: string;
    universeCreateButton: string;
    universeCancelButton: string;
    universeNamePlaceholder: string;
    universeDescriptionPlaceholder: string;
    createNewUniverseTitle: string;
    createSuccess: string;
    updateSuccess: string;
    saveError: string;
    uploadSuccess: string;
    uploadError: string;
    uploadingLabel: string;
    uploadButton: string;
    favoriteAdded: string;
    favoriteRemoved: string;
    favoriteError: string;
    universeCreated: string;
    universeCreateError: string;
  };
  seasonForm: {
    headerTitle: string;
    backButton: string;
    cancelButton: string;
    sectionBasic: string;
    sectionCast: string;
    castDescription: string;
    fieldSeasonNumber: string;
    requiredSeasonNumber: string;
    fieldTitle: string;
    fieldEpisodeCount: string;
    fieldYear: string;
    fieldSynopsis: string;
    fieldObservations: string;
    fieldImage: string;
    helpImage: string;
    hintImage: string;
    hintTitle: string;
    hintEpisodeCount: string;
    hintSynopsis: string;
    hintObservations: string;
    hintActorName: string;
    hintCharacter: string;
    fieldIsMain: string;
    requiredActorName: string;
    addActorButton: string;
    saveButton: string;
    viewSeriesButton: string;
    uploadButton: string;
    uploadingLabel: string;
    updateSuccess: string;
    saveError: string;
    uploadSuccess: string;
    uploadError: string;
  };
  catalogo: {
    searchPlaceholder: string;
    filtersButton: string;
    alphaFilterTooltip: string;
    titlesCount: string;
    filteredCount: string;
    filterCountry: string;
    filterType: string;
    filterStatus: string;
    filterFavorites: string;
    filterTags: string;
    filterMinRating: string;
    filterFrom: string;
    filterTo: string;
    filterClear: string;
    statusWatched: string;
    statusUnwatched: string;
    favoritesOnly: string;
    universeTitles: string;
    universeExpand: string;
    filteringBy: string;
    filterCountryLabel: string;
    filterTypeLabel: string;
    filterFormatLabel: string;
    filterGenreLabel: string;
    filterLanguageLabel: string;
    filterProductionLabel: string;
    filterDirectorLabel: string;
    filterActorLabel: string;
    filterYearLabel: string;
    filterTagLabel: string;
    drawerTitle: string;
    addFavorite: string;
    removeFavorite: string;
    viewDetail: string;
    watchedTag: string;
    newButton: string;
    emptyFiltered: string;
    emptyCatalog: string;
    clearAllFilters: string;
    paginationTotal: string;
    favoriteAdded: string;
    favoriteRemoved: string;
    favoriteError: string;
    moreInfo: string;
    hideInfo: string;
    infoSeasons: string;
    infoEpisodes: string;
    infoRuntime: string;
    infoActors: string;
    infoNoActors: string;
    infoUnknown: string;
    sortLabel: string;
    sortAZ: string;
    sortZA: string;
    sortYearNew: string;
    sortYearOld: string;
    sortRatingDesc: string;
  };
  landing: {
    subtitle: string;
    exploreCatalog: string;
    signIn: string;
    description: string;
    goToProfile: string;
    statSeries: string;
    statViews: string;
    statComments: string;
    featuresTitle: string;
    featureCatalogTitle: string;
    featureCatalogDesc: string;
    featureRatingsTitle: string;
    featureRatingsDesc: string;
    featureTrackingTitle: string;
    featureTrackingDesc: string;
    featureCommentsTitle: string;
    featureCommentsDesc: string;
    featureFavoritesTitle: string;
    featureFavoritesDesc: string;
    featureStatsTitle: string;
    featureStatsDesc: string;
    footerCtaText: string;
  };
  welcomeBanner: {
    title: string;
    description: string;
    dismiss: string;
  };
  privacyBanner: {
    text: string;
    accept: string;
  };
  header: {
    title: string;
  };
  adminNav: {
    series: string;
    seriesShort: string;
    tags: string;
    tagsShort: string;
    universes: string;
    universesShort: string;
    actors: string;
    actorsShort: string;
    directors: string;
    directorsShort: string;
    productionCompanies: string;
    productionCompaniesShort: string;
    languages: string;
    languagesShort: string;
    sites: string;
    sitesShort: string;
    content: string;
    contentShort: string;
    comments: string;
    commentsShort: string;
    info: string;
    infoShort: string;
    logs: string;
    logsShort: string;
    stats: string;
    statsShort: string;
  };
  adminStats: {
    pageTitle: string;
    totalUsers: string;
    currentlyWatching: string;
    completedThisWeek: string;
    commentsThisWeek: string;
    rankingWatching: string;
    rankingCompleted: string;
    rankingFavorited: string;
    rankingCommented: string;
    rankingRated: string;
    activeUsers: string;
    badgeWatching: string;
    badgeCompleted: string;
    badgeFavorited: string;
    badgeCommented: string;
  };
  adminTable: {
    searchPlaceholder: string;
    resultCount: string;
    deleteConfirmTitle: string;
    deleteConfirmContent: string;
    deleteConfirmOk: string;
    deleteConfirmCancel: string;
    deleteSuccess: string;
    deleteError: string;
    columnTitle: string;
    columnCountry: string;
    columnType: string;
    columnSeasons: string;
    columnEpisodes: string;
    columnYear: string;
    columnStatus: string;
    columnActions: string;
    paginationTotal: string;
  };
  editSerieModal: {
    title: string;
    save: string;
    cancel: string;
    loadError: string;
    updateSuccess: string;
    updateError: string;
    fieldTitle: string;
    requiredTitle: string;
    fieldOriginalTitle: string;
    fieldImageUrl: string;
    fieldYear: string;
    fieldType: string;
    requiredType: string;
    fieldCountry: string;
    fieldRating: string;
    fieldBasedOn: string;
    fieldFormat: string;
    requiredFormat: string;
    fieldSynopsis: string;
    fieldReview: string;
    fieldSoundtrack: string;
    fieldObservations: string;
    placeholderTitle: string;
    placeholderOriginalTitle: string;
    placeholderImageUrl: string;
    placeholderYear: string;
    placeholderType: string;
    placeholderCountry: string;
    placeholderRating: string;
    placeholderBasedOn: string;
    placeholderSynopsis: string;
    placeholderReview: string;
    placeholderSoundtrack: string;
    placeholderObservations: string;
    typeOption_serie: string;
    typeOption_pelicula: string;
    typeOption_corto: string;
    typeOption_especial: string;
    basedOnLibro: string;
    basedOnNovela: string;
    basedOnCorto: string;
    basedOnManga: string;
    basedOnAnime: string;
    formatRegular: string;
    formatVertical: string;
  };
  tagPage: {
    titleCountSingular: string;
    titleCountPlural: string;
    seriesWithTag: string;
    empty: string;
  };
  contenidoPage: {
    pageTitle: string;
    subtitle: string;
    filterPlatform: string;
    filterCategory: string;
    filterChannel: string;
    emptyNoContent: string;
    emptyFiltered: string;
    playButton: string;
    unofficialTag: string;
    modalSource: string;
    modalViewOn: string;
    modalRelatedSeries: string;
  };
  feedback: {
    pageTitle: string;
    tabRequests: string;
    tabChangelog: string;
    activeCount: string;
    newRequest: string;
    emptyRequests: string;
    emptyChangelog: string;
    completedSection: string;
    currentVersion: string;
    deleteButton: string;
    createButton: string;
    formTitle: string;
    formFieldType: string;
    formFieldTitle: string;
    formFieldDescription: string;
    formDescriptionPlaceholder: string;
    formDescriptionHint: string;
    formRequiredType: string;
    formRequiredTitle: string;
    statusPendiente: string;
    statusEnProgreso: string;
    statusCompletado: string;
    statusDescartado: string;
    typeBug: string;
    typeFeature: string;
    typeIdea: string;
    successCreated: string;
    successStatusUpdated: string;
    successDeleted: string;
    errorCreate: string;
    errorVote: string;
    errorStatusUpdate: string;
    errorDelete: string;
    errorUpload: string;
  };
  notFound: {
    description: string;
    backLink: string;
  };
};

const es: TranslationShape = {
  common: {
    language: 'Idioma',
    na: 'N/A',
    private: 'Privado',
    today: 'Hoy',
    yesterday: 'Ayer',
    daysAgo: 'Hace {n} días',
    weeksAgo: 'Hace {n} semanas',
    monthsAgo: 'Hace {n} meses',
    neverWatched: 'Nunca',
    justNow: 'Justo ahora',
    minutesAgo: 'Hace {n} min',
    hoursAgo: 'Hace {n}h',
  },
  seriesDetail: {
    tabInfo: 'Información',
    tabContent: 'Contenido',
    tabRatings: 'Puntuación',
    tabComments: 'Comentarios',
  },
  seriesHeader: {
    universe: 'Universo',
    originalTitle: 'Título original',
    formatVertical: 'Formato Vertical',
    basedOn: 'Basado en {label}',
    typeSerie: 'Serie',
    typePelicula: 'Película',
    typeCorto: 'Corto',
    typeEspecial: 'Especial',
    typeAnime: 'Animé',
    typeReality: 'Reality',
  },
  seriesInfo: {
    fieldTitle: 'Título',
    fieldOriginalTitle: 'Título Original',
    fieldYear: 'Año',
    fieldCountry: 'País',
    fieldType: 'Tipo',
    fieldFormat: 'Formato',
    fieldBasedOn: 'Basado en',
    fieldSeasons: 'Temporadas',
    fieldEpisodes: 'Episodios',
    fieldSoundtrack: 'BSO',
    fieldProduction: 'Productora',
    fieldLanguage: 'Idioma Original',
    fieldDubbings: 'Doblajes',
    fieldGenre: 'Género',
    fieldDirectors: 'Director(es)',
    formatVertical: 'Vertical',
    formatRegular: 'Regular',
    whereToWatch: 'Donde Ver',
    unofficial: ' (no oficial)',
    castSection: 'Reparto',
    couplebadge: 'Pareja',
    asCharacter: 'como {character}',
    protagonist: 'Protagonista',
    synopsisSection: 'Sinopsis',
    reviewSection: 'Reseña Personal',
    observationsSection: 'Observaciones',
    privateLabel: 'Privada',
    notesPrivateLabel: 'Reseña y observaciones privadas',
    notesPrivateHelp:
      'Si está activado, sólo los administradores pueden ver la reseña y las observaciones de esta serie.',
    relatedSection: 'Series Relacionadas',
  },
  comments: {
    addTitle: 'Agregar Comentario',
    placeholderPrivate: 'Escribe una nota privada (solo vos la verás)...',
    placeholderPublic:
      'Escribe tus impresiones, opiniones o notas sobre esta serie...',
    placeholderEpisode:
      'Escribe tus notas sobre este episodio, escenas interesantes, momentos clave...',
    tooltipPrivate: 'Los comentarios privados solo son visibles para vos',
    privateLabel: 'Privado',
    savePrivateButton: 'Guardar Nota Privada',
    addButton: 'Agregar Comentario',
    privateButtonCompact: 'Nota Privada',
    commentButton: 'Comentar',
    loginPrompt: 'Inicia sesión para dejar un comentario',
    listTitle: 'Comentarios ({n})',
    emptyText: 'No hay comentarios aún',
    warningEmpty: 'Escribe un comentario primero',
    successPrivate: 'Nota privada agregada',
    successPublic: 'Comentario agregado',
    errorSave: 'Error al guardar el comentario',
    reportModalTitle: 'Reportar comentario',
    reportModalHint:
      'Contanos brevemente por qué (opcional). Un admin lo va a revisar.',
    reportPlaceholder: 'Spam, contenido fuera de tema, datos personales...',
    reportButton: 'Reportar',
    cancelButton: 'Cancelar',
    reportedSuccess: 'Comentario reportado. Gracias por avisar.',
    reportError: 'No se pudo reportar',
  },
  episodesList: {
    headerTitle: 'Episodios ({n})',
    generateButton: 'Generar',
    addButton: 'Agregar',
    emptyText:
      'No hay episodios registrados. Usa "Generar" o "Agregar" para comenzar.',
    selectedCount: '{n} seleccionado{s}',
    colEpisode: 'Episodio',
    colActions: 'Acciones',
    bulkWatched: 'Vistos',
    bulkUnwatched: 'No vistos',
    bulkDelete: 'Eliminar',
    tooltipWatched: 'Marcar como vistos',
    tooltipUnwatched: 'Marcar como no vistos',
    tooltipDelete: 'Eliminar',
    tooltipEdit: 'Editar',
    watchedTag: 'Visto',
    deleteConfirmTitle: '¿Eliminar episodio?',
    deleteConfirmContent: '¿Estás seguro de eliminar el episodio {n}?',
    deleteBulkConfirmTitle: '¿Eliminar episodios seleccionados?',
    deleteBulkConfirmContent:
      'Se eliminarán {n} episodio(s) con sus comentarios y estados de visualización.',
    confirmOk: 'Sí, eliminar',
    confirmCancel: 'Cancelar',
    successUpdated: 'Episodio actualizado',
    successCreated: 'Episodio creado',
    successDeleted: 'Episodio eliminado',
    successBulkWatched: '{n} episodio(s) marcado(s) como vistos',
    successBulkUnwatched: '{n} episodio(s) marcado(s) como no vistos',
    errorSave: 'Error al guardar el episodio',
    errorDelete: 'Error al eliminar el episodio',
    errorBulkDelete: 'Error al eliminar los episodios',
    errorToggleWatched: 'Error al actualizar el estado',
    errorBulkToggle: 'Error al actualizar los episodios',
    errorGenerate: 'Error al generar episodios',
    modalEditTitle: 'Editar Episodio',
    modalNewTitle: 'Nuevo Episodio',
    fieldEpisodeNumber: 'Número de Episodio',
    fieldEpisodeTitle: 'Título (opcional)',
    fieldMinutes: 'Minutos',
    fieldSynopsis: 'Sinopsis',
    hintTitle: 'Ej: The Beginning',
    hintSynopsis: 'Breve descripción de lo que sucede en este episodio...',
    requiredEpisodeNumber: 'Requerido',
    saveButton: 'Guardar',
    createButton: 'Crear',
    cancelButton: 'Cancelar',
    markedWatched: 'Episodio marcado como visto',
    markedUnwatched: 'Episodio marcado como no visto',
    episodesUnit: '{watched}/{total} episodios',
    bulkMarkedWatched: '{n} episodio(s) marcado(s) como vistos',
    bulkMarkedUnwatched: '{n} episodio(s) marcado(s) como no vistos',
  },
  seasonsList: {
    emptyText: 'No hay temporadas registradas',
    seasonLabel: 'Temporada {n}',
    capsTag: '{n} caps',
    watchedTag: 'Vista',
    editButton: 'Editar',
    synopsisTitle: 'Sinopsis de esta temporada',
    observationsTitle: 'Observaciones',
    commentsTitle: 'Comentarios de esta temporada',
    ratingsTitle: 'Puntuación de esta temporada',
    castTitle: 'Reparto de esta temporada ({n})',
    protagonistTag: 'Protagonista',
  },
  ratingSection: {
    officialLabel: 'Puntuación oficial',
    userAverageLabel: 'Puntuación de usuarios',
    votesSingular: '{n} voto',
    votesPlural: '{n} votos',
    officialTitle: 'Puntuación Oficial',
    officialHint: 'Evalúa cada aspecto de la serie del 1 al 10',
    saveOfficialButton: 'Guardar Puntuación Oficial',
    userTitle: 'Tu Puntuación',
    userHint:
      'Tu puntuación será pública y contribuirá al promedio de usuarios',
    saveUserButton: 'Guardar Mi Puntuación',
    loginPrompt: 'Inicia sesión para puntuar esta serie',
    userAverageTitle: 'Promedio de Usuarios por Categoría',
    successOfficial: 'Puntuaciones oficiales guardadas',
    errorOfficial: 'Error al guardar las puntuaciones',
    successUser: 'Tu puntuación fue guardada',
    errorUser: 'Error al guardar tu puntuación',
    catTrama: 'Trama',
    catCasting: 'Casting',
    catDireccion: 'Dirección',
    catGuion: 'Guión',
    catProduccion: 'Producción',
    catFotografia: 'Fotografía',
    catBso: 'Banda Sonora',
    catQuimicaPrincipal: 'Química de pareja principal',
    catQuimicaSecundaria: 'Química de pareja secundaria',
  },
  viewStatus: {
    sinVer: 'Sin ver',
    viendo: 'Viendo ahora',
    vista: 'Vista',
    abandonada: 'Abandonada',
    retomar: 'Retomar',
    ariaLabel: 'Estado de visualización',
    tooltipEpisodes: '{watched} de {total} episodios vistos',
    episodesUnit: '{watched}/{total} episodios',
    errorUpdate: 'Error al actualizar el estado',
    statusMessage: 'Estado: {label}',
  },
  watchingDashboard: {
    loginPrompt: 'Iniciá sesión para ver tu lista de series',
    emptyText: 'No estás viendo ninguna serie actualmente',
    exploreCatalog: 'Explorar Catálogo',
    removeTitle: 'Remover de viendo ahora',
    nextLabel: 'Siguiente',
    continueButton: 'Continuar viendo',
    detailsButton: 'Ver detalles',
    editButton: 'Editar',
    removedMessage: '"\{title}" removida de "Viendo ahora"',
    errorRemove: 'Error al remover de la lista',
    episodeMarkedMessage: 'Episodio {ep} marcado como visto',
    errorMarkEpisode: 'Error al marcar el episodio',
    markEpisodeTooltip: 'Marcar {ep} como visto',
  },
  appLayout: {
    skipToContent: 'Saltar al contenido principal',
  },
  sidebar: {
    catalog: 'Catalogo',
    watching: 'Viendo Ahora',
    novedades: 'Novedades',
    feedback: 'Feedback',
    sites: 'Sitios de Interes',
    content: 'Contenido',
    administration: 'Administracion',
    series: 'Series',
    tags: 'Tags',
    universes: 'Universos',
    actors: 'Actores',
    directors: 'Directores',
    users: 'Usuarios',
    comments: 'Comentarios',
    info: 'Info',
    logs: 'Logs',
    collapseMenu: 'Colapsar menu',
    expandMenu: 'Expandir menu',
    login: 'Iniciar sesion',
    logout: 'Cerrar sesion',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
    dark: 'Oscuro',
    light: 'Claro',
    profile: 'Mi Perfil',
    stats: 'Estad\u00edsticas',
  },
  profile: {
    loginRequired: 'Inicia sesion para ver tu perfil',
    memberSince: 'Miembro desde',
    statWatched: 'Vistas',
    statWatching: 'Viendo',
    statAbandoned: 'Abandonadas',
    statToRewatch: 'Retomar',
    statFavorites: 'Favoritos',
    statRatings: 'Ratings',
    statComments: 'Comentarios',
    sectionWatching: 'Viendo ahora',
    sectionRecent: 'Completadas recientemente',
    sectionFavorites: 'Mis favoritos',
    sectionMyComments: 'Mis comentarios',
    sectionDisputes: 'Mis disputas',
    commentsSelectAll: 'Seleccionar todo',
    commentsSelectedCount: '{n} seleccionados',
    commentsDeleteSelected: 'Eliminar seleccionados',
    commentsDeleteSuccess: 'Se eliminaron {n} comentarios',
    commentsDeleteError: 'No se pudieron eliminar los comentarios',
    commentsLoadError: 'No se pudieron cargar los comentarios',
    commentsEmpty: 'Todavia no tienes comentarios',
    commentsExport: 'Descargar JSON',
    commentsPublic: 'Publico',
    commentsPrivate: 'Privado',
    commentsTargetUnknown: 'Sin referencia',
    commentsSearchPlaceholder: 'Buscar en mis comentarios...',
    commentsFilterAll: 'Todo',
    commentsFilterPublic: 'Publicos',
    commentsFilterPrivate: 'Privados',
    commentsFilterTargetAll: 'Todos los tipos',
    commentsFilterReported: 'Solo reportados',
    commentsTargetSeries: 'Serie',
    commentsTargetSeason: 'Temporada',
    commentsTargetEpisode: 'Episodio',
    commentsSetPublic: 'Marcar publicos',
    commentsSetPrivate: 'Marcar privados',
    commentsVisibilityUpdateError: 'No se pudo actualizar la visibilidad',
    commentsVisibilityPublicSuccess: 'Comentarios marcados como publicos',
    commentsVisibilityPrivateSuccess: 'Comentarios marcados como privados',
    commentsReportCount: '{n} reportes',
    commentsEdit: 'Editar',
    commentsEditTitle: 'Editar comentario',
    commentsEditPlaceholder: 'Actualiza el contenido del comentario',
    commentsEditSave: 'Guardar',
    commentsEditCancel: 'Cancelar',
    commentsEditSuccess: 'Comentario actualizado',
    commentsEditError: 'No se pudo actualizar el comentario',
    commentsOpenDispute: 'Abrir disputa',
    disputesEmpty: 'No has creado disputas',
    disputesLoadError: 'No se pudieron cargar las disputas',
    disputeOpenTitle: 'Nuevo descargo',
    disputePlaceholder:
      'Explica por que consideras que este comentario no incumple reglas',
    disputeSubmit: 'Enviar descargo',
    disputeCancel: 'Cancelar',
    disputeSuccess: 'Descargo enviado correctamente',
    disputeError: 'No se pudo crear la disputa',
    disputeForComment: 'Comentario #{n}',
    sectionStats: 'Estadísticas detalladas',
    statsHoursWatched: 'Horas vistas',
    statsActiveDays: 'Días activos esta semana',
    statsTopGenres: 'Géneros más vistos',
    statsTopCountries: 'Países más vistos',
    statsTopActors: 'Actores más vistos',
    statsTopProductionCompanies: 'Productoras más vistas',
    statsCompletedByYear: 'Completadas por año',
    statsNoData: 'Sin datos aún',
    statsModeLabel: 'Vista',
    statsModeBasic: 'Básica',
    statsModeAdvanced: 'Avanzada',
    statsTopNLabel: 'Top N',
    statsTopN5: '5',
    statsTopN10: '10',
    statsTopN25: '25',
    statsTopN50: '50',
    statsTopNAll: 'Todos',
    statsRestoreWidgets: 'Widgets ocultos:',
    statsEpisodesLabel: 'episodios',
    statsStreakTitle: 'Racha máxima (12 sem.)',
    statsStreakDays: 'días consecutivos',
    statsAvgRating: 'Calificación promedio',
    statsRatingsGiven: 'calificaciones dadas',
    statsByType: 'Por tipo de contenido',
    statsTopRated: 'Series mejor calificadas',
    sectionSettings: 'Configuración',
    settingsAppearanceTitle: 'Apariencia y accesibilidad',
    settingsAppearanceHint:
      'Tema, color de acento, tono base, fuente, tamaño de texto, densidad y animaciones. Estas preferencias viven en este navegador.',
    settingsAppearanceOpen: 'Abrir preferencias',
    settingsSessionTitle: 'Sesión y cache',
    settingsSessionHint:
      'Soluciona problemas raros: limpiá el cache local, reseteá el Service Worker o cerrá sesión en todos los dispositivos.',
    settingsDangerTitle: 'Zona peligrosa',
    settingsDangerHint:
      'Exporta tus datos o elimina tu cuenta con confirmación por email.',
    settingsExportData: 'Exportar mis datos',
    settingsComingSoon: 'Próximamente',
    settingsIrreversible: 'Irreversible',
    settingsExportSuccess: 'Tu archivo JSON se descargó correctamente.',
    settingsExportError: 'No se pudo exportar tu cuenta en este momento.',
    settingsDeleteTitle: 'Eliminar cuenta',
    settingsDeleteIntro:
      'Esta acción elimina tu cuenta y datos personales. Elegí qué hacer con tus comentarios públicos.',
    settingsDeletePolicyKeep:
      'Conservar comentarios públicos (la autoría puede anonimizarse)',
    settingsDeletePolicyAnonymize:
      'Anonimizar comentarios públicos (recomendado)',
    settingsDeletePolicyDelete: 'Eliminar todos mis comentarios públicos',
    settingsDeleteEmailLabel:
      'Escribe tu email para confirmar la eliminación de la cuenta',
    settingsDeleteEmailPlaceholder: 'tu-email@ejemplo.com',
    settingsDeleteEmailHint: 'Email esperado:',
    settingsDeleteConfirmButton: 'Eliminar cuenta',
    settingsDeleteCancelButton: 'Cancelar',
    settingsDeleteSuccess: 'Tu cuenta fue eliminada.',
    settingsDeleteError: 'No se pudo eliminar tu cuenta.',
    settingsDeleteMissingEmail:
      'No encontramos tu email de sesión para confirmar la acción.',
  },
  novedades: {
    title: 'Novedades',
    subtitle:
      'Series recién agregadas, nuevas temporadas y los últimos cambios en MundoBL.',
    empty: 'Por ahora no hay novedades. Volvé en unos días.',
    newSeriesTitle: 'Series recién agregadas',
    newSeasonsTitle: 'Nuevas temporadas',
    seasonLabel: 'Temporada',
    changelogTitle: 'Cambios recientes',
  },
  notifications: {
    title: 'Notificaciones',
    subtitle: 'Tus avisos personales en MundoBL.',
    label: 'Notificaciones',
    openTitle: 'Ver notificaciones',
    empty: 'No tenés notificaciones por ahora.',
    new: 'Nueva',
    unread: 'sin leer',
    allRead: 'Estás al día',
    markRead: 'Marcar como leída',
    markAllRead: 'Marcar todas como leídas',
    delete: 'Eliminar',
    clearAll: 'Borrar todas',
    cleared: 'Notificaciones borradas.',
    loginRequired: 'Iniciá sesión para ver tus notificaciones personales.',
  },
  offline: {
    message: 'Estás sin conexión. Algunas funciones pueden no funcionar.',
  },
  cmdk: {
    placeholder: 'Buscar series, actores, directores, tags...',
    hintMinChars: 'Escribí al menos 2 caracteres para buscar.',
    empty: 'Sin resultados.',
    groupSeries: 'Series',
    groupActors: 'Actores',
    groupDirectors: 'Directores',
    groupTags: 'Tags',
    navigate: 'Navegar',
    select: 'Seleccionar',
    close: 'Cerrar',
  },
  bottomNav: {
    mainNavigation: 'Navegacion principal',
    catalog: 'Catalogo',
    watching: 'Viendo',
    feedback: 'Feedback',
    admin: 'Admin',
    loading: 'Cargando',
    login: 'Entrar',
    logout: 'Salir',
    settings: 'Ajustes',
    accentColor: 'Color',
    theme: 'Tema',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',
  },
  settings: {
    title: 'Preferencias',
    sectionAppearance: 'Apariencia',
    sectionTypography: 'Tipografia',
    sectionDensity: 'Densidad',
    sectionLanguage: 'Idioma',
    sectionAccessibility: 'Accesibilidad',
    sectionDataPrivacy: 'Datos y privacidad',
    sectionSession: 'Sesion',
    themeLabel: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    accentLabel: 'Color de acento',
    toneLabel: 'Tono base',
    toneDefault: 'Predeterminado',
    toneWarm: 'Calido',
    toneCool: 'Frio',
    toneContrast: 'Alto contraste',
    fontLabel: 'Fuente',
    fontSystem: 'Sistema',
    fontSerif: 'Serif',
    fontMono: 'Monoespaciada',
    fontDyslexic: 'Para dislexia',
    scaleLabel: 'Tamano del texto',
    scaleSmall: 'Pequeno',
    scaleMedium: 'Mediano',
    scaleLarge: 'Grande',
    scaleExtraLarge: 'Muy grande',
    densityLabel: 'Densidad',
    densityCompact: 'Compacta',
    densityComfortable: 'Comoda',
    densitySpacious: 'Amplia',
    motionLabel: 'Animaciones',
    motionAuto: 'Automatico (sigue al sistema)',
    motionReduce: 'Reducidas',
    saverLabel: 'Ahorrar datos',
    saverDescription:
      'Oculta fondos decorativos y reduce la calidad de imagen en planes con poco trafico.',
    saverOff: 'Desactivado',
    saverOn: 'Activado',
    resetButton: 'Restaurar valores por defecto',
    resetConfirm: 'Esto restablecera todas tus preferencias visuales.',
    clearCachesButton: 'Limpiar cache local',
    clearCachesDescription:
      'Borra imagenes y datos guardados por el navegador. No cierra sesion.',
    clearCachesSuccess: 'Cache local limpiada.',
    resetSwButton: 'Resetear Service Worker',
    resetSwDescription:
      'Desinstala el worker, limpia caches y recarga. Util si la app quedo en un estado raro tras un deploy.',
    resetSwConfirm:
      'Esto desinstalara el Service Worker y recargara la pagina. ¿Continuar?',
    sectionNotifications: 'Notificaciones',
    pushLabel: 'Notificaciones del navegador',
    pushDescription:
      'Recibí notificaciones del navegador cuando hay novedades. No vamos a pedir permiso a menos que actives esto.',
    pushUnsupported: 'Tu navegador no soporta notificaciones del navegador.',
    pushDeniedHint:
      'Bloqueaste las notificaciones para este sitio. Habilitalas en la configuración del navegador para activarlas.',
    closeOtherSessionsButton: 'Cerrar otras sesiones',
    closeOtherSessionsDescription:
      'Cierra cualquier otra sesion abierta en otros dispositivos.',
    closeAllSessionsButton: 'Cerrar sesion en todos los dispositivos',
    closeAllSessionsConfirm:
      '¿Cerrar sesion en todos los dispositivos? Tendras que volver a iniciar sesion.',
    deleteAccountButton: 'Eliminar mi cuenta',
    deleteAccountDescription:
      'Elimina permanentemente tu cuenta y datos personales. Disponible proximamente.',
    closeButton: 'Cerrar',
    sectionPreferences: 'Preferencias',
    defaultCommentPrivateLabel: 'Notas privadas por defecto',
    defaultCommentPrivateHint:
      'Tus nuevos comentarios se marcarán como privados al escribirlos.',
  },
  adminComments: {
    title: 'Comentarios publicos',
    subtitle:
      'Moderacion y curaduria editorial de comentarios de la comunidad.',
    statsTotal: 'Total',
    statsReported: 'Reportados',
    statsPage: 'En pagina',
    filterAll: 'Todos',
    filterSeries: 'Series',
    filterSeasons: 'Temporadas',
    filterEpisodes: 'Episodios',
    filterAuthorAll: 'Todos los usuarios',
    filterAuthorActive: 'Con usuario activo',
    filterAuthorDeleted: 'Usuario eliminado',
    searchPlaceholder: 'Buscar contenido...',
    reportedOnly: 'Solo reportados',
    columnUser: 'Usuario',
    columnComment: 'Comentario',
    columnAbout: 'Sobre',
    columnDate: 'Fecha',
    columnActions: 'Acciones',
    targetEpisode: 'Episodio',
    targetSeason: 'Temporada',
    targetSeries: 'Serie',
    targetSeriesFallback: 'Serie',
    targetUnknown: 'Sin objetivo',
    deletedUser: 'Usuario eliminado',
    unnamedUser: 'Sin nombre',
    edited: 'Editado',
    reportsSuffixOne: 'reporte',
    reportsSuffixMany: 'reportes',
    actionView: 'Ver',
    actionIgnore: 'Ignorar',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    dismissReportsTitle: 'Descartar reportes?',
    dismissReportsDescription:
      'Se eliminan los reportes y el contador vuelve a cero',
    dismissReportsConfirm: 'Descartar',
    cancel: 'Cancelar',
    deleteTitle: 'Eliminar comentario?',
    deleteDescription: 'Esta accion no se puede deshacer',
    deleteConfirm: 'Eliminar',
    modalEditTitle: 'Editar comentario',
    modalEditPlaceholder: 'Edita el comentario...',
    save: 'Guardar',
    noReason: 'Sin razon',
    loadError: 'Error al cargar comentarios',
    deleteSuccess: 'Comentario eliminado',
    deleteError: 'Error al eliminar comentario',
    dismissSuccess: 'Reportes descartados',
    dismissError: 'Error al descartar reportes',
    editEmptyWarning: 'El contenido no puede estar vacio',
    editLengthWarning: 'El comentario no puede superar 2000 caracteres',
    editSuccess: 'Comentario editado',
    editError: 'Error al editar comentario',
  },
  adminActors: {
    title: 'Administracion de Actores',
    subtitle: 'Gestiona ficha, fusion y limpieza de actores del catalogo.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    statsSelected: 'Seleccionados',
    newItem: 'Nuevo Actor',
    searchPlaceholder: 'Buscar por nombre, nombre artistico o nacionalidad...',
    mergeSelected: 'Fusionar seleccionados',
    columnName: 'Nombre',
    columnStageName: 'Nombre Artistico',
    columnNationality: 'Nacionalidad',
    columnSeries: 'Series',
    columnActions: 'Acciones',
    unnamed: 'Sin nombre',
    emptyValue: '-',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nuevo Actor',
    modalEditTitle: 'Editar Actor',
    save: 'Guardar',
    cancel: 'Cancelar',
    requiredName: 'El nombre es requerido',
    fieldName: 'Nombre',
    fieldStageName: 'Nombre Artistico',
    fieldBirthDate: 'Fecha de Nacimiento',
    fieldNationality: 'Nacionalidad',
    fieldImageUrl: 'URL de Imagen',
    fieldBiography: 'Biografia',
    hintName: 'Nombre del actor',
    hintStageName: 'Nombre artistico (opcional)',
    hintNationality: 'Ej: Tailandia, Corea del Sur',
    hintImageUrl: 'URL de la foto del actor (opcional)',
    hintBiography: 'Breve biografia del actor (opcional)',
    deleteTitle: 'Eliminar actor?',
    deleteDescription: 'Estas seguro de eliminar este actor?',
    deleteBlockedDescription:
      'Este actor tiene {count} participaciones. Primero desvinculalo.',
    mergeModalTitle: 'Fusionar Actores',
    mergeSelectSurvivor: 'Selecciona que actor debe sobrevivir:',
    mergeWarning:
      'El actor no seleccionado sera eliminado y todas sus referencias se moveran al actor que sobreviva.',
    participationCount: '{count} participaciones',
    loadError: 'Error al cargar los actores',
    saveCreateSuccess: 'Actor creado exitosamente',
    saveUpdateSuccess: 'Actor actualizado exitosamente',
    saveError: 'Error al guardar el actor',
    deleteSuccess: 'Actor eliminado correctamente',
    deleteError: 'Error al eliminar el actor',
    mergeSuccess: 'Actores fusionados exitosamente',
    mergeError: 'Error al fusionar actores',
  },
  adminDirectors: {
    title: 'Administracion de Directores',
    subtitle: 'Gestiona ficha, fusion y limpieza de directores del catalogo.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    statsSelected: 'Seleccionados',
    newItem: 'Nuevo Director',
    searchPlaceholder: 'Buscar por nombre o nacionalidad...',
    mergeSelected: 'Fusionar seleccionados',
    columnName: 'Nombre',
    columnNationality: 'Nacionalidad',
    columnSeries: 'Series',
    columnActions: 'Acciones',
    emptyValue: '-',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nuevo Director',
    modalEditTitle: 'Editar Director',
    save: 'Guardar',
    cancel: 'Cancelar',
    requiredName: 'El nombre es requerido',
    fieldName: 'Nombre',
    fieldNationality: 'Nacionalidad',
    fieldImageUrl: 'URL de Imagen',
    fieldBiography: 'Biografia',
    hintName: 'Nombre del director',
    hintNationality: 'Ej: Tailandia, Corea del Sur',
    hintImageUrl: 'URL de la foto del director (opcional)',
    hintBiography: 'Breve biografia del director (opcional)',
    deleteTitle: 'Eliminar director?',
    deleteDescription: 'Estas seguro de eliminar este director?',
    deleteBlockedDescription:
      'Este director tiene {count} series. Primero desvinculalo.',
    mergeModalTitle: 'Fusionar Directores',
    mergeSelectSurvivor: 'Selecciona que director debe sobrevivir:',
    mergeWarning:
      'El director no seleccionado sera eliminado y todas sus referencias se moveran al director que sobreviva.',
    seriesCount: '{count} series',
    loadError: 'Error al cargar los directores',
    saveCreateSuccess: 'Director creado exitosamente',
    saveUpdateSuccess: 'Director actualizado exitosamente',
    saveError: 'Error al guardar el director',
    deleteSuccess: 'Director eliminado correctamente',
    deleteError: 'Error al eliminar el director',
    mergeSuccess: 'Directores fusionados exitosamente',
    mergeError: 'Error al fusionar directores',
  },
  adminTags: {
    title: 'Administracion de Tags',
    subtitle: 'Crea, corrige y fusiona tags para mantener un catalogo limpio.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    statsSelected: 'Seleccionados',
    searchPlaceholder: 'Buscar tags por nombre o categoria...',
    newPlaceholder: 'Nombre del nuevo tag (ej: Enemy to Lovers)',
    create: 'Crear Tag',
    mergeSelected: 'Fusionar seleccionados',
    columnTag: 'Tag',
    columnCategory: 'Categoria',
    columnSeries: 'Series',
    columnActions: 'Acciones',
    emptyCategory: 'Sin categoria',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalEditTitle: 'Editar Tag',
    modalMergeTitle: 'Fusionar Tags',
    save: 'Guardar',
    cancel: 'Cancelar',
    fieldName: 'Nombre',
    requiredName: 'El nombre es requerido',
    hintName: 'Nombre del tag',
    mergeSelectSurvivor: 'Selecciona que tag debe sobrevivir:',
    mergeWarning:
      'El tag no seleccionado sera eliminado y todas las series que lo tenian pasaran a usar el tag que sobreviva.',
    seriesCount: '{count} series',
    deleteTitle: 'Eliminar tag?',
    deleteDescription: 'Esto eliminara el tag de {count} series',
    createEmptyWarning: 'Escribe un nombre para el tag',
    loadError: 'Error al cargar los tags',
    createSuccess: 'Tag creado exitosamente',
    createError: 'Error al crear el tag',
    updateSuccess: 'Tag actualizado exitosamente',
    updateError: 'Error al actualizar el tag',
    deleteSuccess: 'Tag eliminado correctamente',
    deleteError: 'Error al eliminar el tag',
    mergeSuccess: 'Tags fusionados exitosamente',
    mergeError: 'Error al fusionar tags',
  },
  adminProductionCompanies: {
    title: 'Administracion de Productoras',
    subtitle: 'Gestiona productoras y normaliza su informacion en catalogo.',
    statsTotal: 'Total',
    statsFiltered: 'Filtradas',
    searchPlaceholder: 'Buscar por nombre o pais...',
    newItem: 'Nueva Productora',
    columnName: 'Nombre',
    columnCountry: 'Pais',
    columnSeries: 'Series',
    columnActions: 'Acciones',
    emptyValue: '-',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nueva Productora',
    modalEditTitle: 'Editar Productora',
    save: 'Guardar',
    cancel: 'Cancelar',
    fieldName: 'Nombre',
    fieldCountry: 'Pais',
    requiredName: 'El nombre es requerido',
    hintName: 'Nombre de la productora',
    hintCountry: 'Pais de la productora (opcional)',
    deleteTitle: 'Eliminar productora?',
    deleteDescription: 'Esto eliminara la productora "{name}"',
    loadError: 'Error al cargar las productoras',
    createSuccess: 'Productora creada exitosamente',
    updateSuccess: 'Productora actualizada exitosamente',
    saveError: 'Error al guardar la productora',
    deleteSuccess: 'Productora eliminada correctamente',
    deleteError: 'Error al eliminar la productora',
  },
  adminUniverses: {
    title: 'Administracion de Universos',
    subtitle: 'Gestiona universos narrativos y su relacion con las series.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    searchPlaceholder: 'Buscar por nombre o descripcion...',
    newItem: 'Nuevo Universo',
    columnName: 'Nombre',
    columnDescription: 'Descripcion',
    columnSeries: 'Series',
    columnActions: 'Acciones',
    emptyValue: '-',
    seriesCount: '{count} series',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nuevo Universo',
    modalEditTitle: 'Editar Universo',
    save: 'Guardar',
    cancel: 'Cancelar',
    fieldName: 'Nombre',
    fieldDescription: 'Descripcion',
    fieldImageUrl: 'URL de Imagen',
    requiredName: 'El nombre es requerido',
    hintName: 'Ej: 2 Moons Universe',
    hintDescription: 'Descripcion del universo (opcional)',
    hintImageUrl: 'URL de la imagen del universo (opcional)',
    deleteTitle: 'Eliminar universo?',
    deleteDescription: 'Estas seguro de eliminar este universo?',
    deleteBlockedDescription:
      'Este universo tiene {count} series. Primero desvinculalas.',
    loadError: 'Error al cargar los universos',
    createSuccess: 'Universo creado exitosamente',
    updateSuccess: 'Universo actualizado exitosamente',
    saveError: 'Error al guardar el universo',
    deleteSuccess: 'Universo eliminado correctamente',
    deleteError: 'Error al eliminar el universo',
  },
  adminLanguages: {
    title: 'Administracion de Idiomas',
    subtitle: 'Gestiona idiomas originales y doblajes disponibles en catalogo.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    searchPlaceholder: 'Buscar por nombre o codigo...',
    newItem: 'Nuevo Idioma',
    columnName: 'Idioma',
    columnCode: 'Codigo',
    columnSeries: 'Series',
    columnDubbings: 'Doblajes',
    columnActions: 'Acciones',
    emptyValue: '-',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nuevo Idioma',
    modalEditTitle: 'Editar Idioma',
    save: 'Guardar',
    cancel: 'Cancelar',
    fieldName: 'Nombre',
    fieldCode: 'Codigo',
    requiredName: 'El nombre es requerido',
    hintName: 'Nombre del idioma (ej: Coreano)',
    hintCode: 'Codigo ISO (ej: ko, th, ja)',
    deleteTitle: 'Eliminar idioma?',
    deleteDescription: 'Esto eliminara el idioma "{name}"',
    loadError: 'Error al cargar los idiomas',
    createSuccess: 'Idioma creado exitosamente',
    updateSuccess: 'Idioma actualizado exitosamente',
    saveError: 'Error al guardar el idioma',
    deleteSuccess: 'Idioma eliminado correctamente',
    deleteError: 'Error al eliminar el idioma',
  },
  adminSites: {
    title: 'Administracion de Sitios',
    subtitle: 'Gestiona el directorio de sitios de interes recomendados.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    searchPlaceholder: 'Buscar por nombre, categoria o descripcion...',
    newItem: 'Nuevo Sitio',
    newItemShort: 'Nuevo',
    columnName: 'Nombre',
    columnCategory: 'Categoria',
    columnLanguage: 'Idioma',
    columnDescription: 'Descripcion',
    columnOrder: 'Orden',
    columnActions: 'Acciones',
    emptyValue: '-',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    modalNewTitle: 'Nuevo Sitio',
    modalEditTitle: 'Editar Sitio',
    save: 'Guardar',
    cancel: 'Cancelar',
    fieldName: 'Nombre',
    fieldUrl: 'URL',
    fieldDescription: 'Descripcion',
    fieldCategory: 'Categoria',
    fieldLanguage: 'Idioma',
    fieldImageUrl: 'URL de imagen',
    fieldOrder: 'Orden',
    requiredName: 'El nombre es requerido',
    requiredUrl: 'La URL es requerida',
    invalidUrl: 'Ingresa una URL valida',
    hintName: 'Nombre del sitio',
    hintUrl: 'https://ejemplo.com',
    hintDescription: 'Breve descripcion del sitio',
    hintCategory: 'Seleccionar categoria',
    hintLanguage: 'Idioma del sitio',
    hintImageUrl: 'https://ejemplo.com/logo.png',
    deleteTitle: 'Eliminar sitio?',
    deleteDescription: 'Esto eliminara "{name}"',
    loadError: 'Error al cargar los sitios',
    createSuccess: 'Sitio creado exitosamente',
    updateSuccess: 'Sitio actualizado exitosamente',
    saveError: 'Error al guardar el sitio',
    deleteSuccess: 'Sitio eliminado correctamente',
    deleteError: 'Error al eliminar el sitio',
  },
  adminUsers: {
    title: 'Administracion de Usuarios',
    subtitle: 'Gestion de usuarios, roles y IPs bloqueadas.',
    statsTotal: 'Total usuarios',
    statsBanned: 'Baneados',
    statsIps: 'IPs bloqueadas',
    searchPlaceholder: 'Buscar por nombre o email...',
    sectionUsers: 'Usuarios',
    sectionBannedIps: 'IPs Bloqueadas',
    columnUser: 'Usuario',
    columnRole: 'Rol',
    columnCreatedAt: 'Registro',
    columnActions: 'Acciones',
    columnIp: 'IP',
    columnReason: 'Razon',
    columnDate: 'Fecha',
    tagBanned: 'Baneado',
    actionBan: 'Banear',
    actionUnban: 'Desbanear',
    actionUnblockIp: 'Desbloquear',
    banTitle: 'Banear usuario?',
    banDescription: 'El usuario no podra acceder al sitio',
    unbanTitle: 'Desbanear usuario?',
    unbanDescription: 'El usuario podra acceder nuevamente',
    roleAdmin: 'Administrador',
    roleModerator: 'Moderador',
    roleVisitor: 'Visitante',
    filterAllRoles: 'Todos los roles',
    filterOnlyAdmins: 'Solo administradores',
    filterOnlyModerators: 'Solo moderadores',
    filterOnlyVisitors: 'Solo visitantes',
    ipPlaceholder: 'IP (ej: 192.168.1.1)',
    ipReasonPlaceholder: 'Razon (opcional)',
    ipBlockButton: 'Bloquear',
    ipMissingWarning: 'Ingresa una IP',
    ipBlockSuccess: 'IP bloqueada',
    ipBlockError: 'Error al bloquear IP',
    ipUnblockSuccess: 'IP desbloqueada',
    ipUnblockError: 'Error al desbloquear IP',
    loadError: 'Error al cargar usuarios',
    roleUpdateSuccess: 'Rol actualizado',
    roleUpdateError: 'Error al cambiar rol',
    banSuccess: 'Usuario baneado',
    unbanSuccess: 'Usuario desbaneado',
    banError: 'Error al banear usuario',
  },
  adminContent: {
    title: 'Administracion de Contenido',
    subtitle: 'Gestion de videos y embeds para series y catalogo.',
    statsTotal: 'Total',
    statsFiltered: 'Filtrados',
    statsDuplicates: 'Duplicados',
    searchPlaceholder: 'Buscar por titulo, canal o serie...',
    newItem: 'Nuevo Contenido',
    newItemShort: 'Nuevo',
    actionImport: 'Importar Canal',
    actionImportShort: 'Importar',
    actionShowDuplicates: 'Duplicados ({count})',
    columnTitle: 'Titulo',
    columnPlatform: 'Plataforma',
    columnCategory: 'Categoria',
    columnSeries: 'Serie',
    columnFeatured: 'Dest.',
    columnActions: 'Acciones',
    tagDuplicate: 'Duplicado',
    actionEdit: 'Editar',
    actionDelete: 'Eliminar',
    deleteTitle: 'Eliminar este contenido?',
    cancel: 'Cancelar',
    modalNewTitle: 'Nuevo Contenido',
    modalEditTitle: 'Editar Contenido',
    save: 'Guardar',
    fieldTitle: 'Titulo',
    fieldUrl: 'URL',
    fieldPlatform: 'Plataforma',
    fieldCategory: 'Categoria',
    fieldDescription: 'Descripcion',
    fieldLanguage: 'Idioma',
    fieldThumbnailUrl: 'URL de miniatura',
    thumbnailHint: 'Se genera automaticamente para YouTube al ingresar la URL',
    fieldChannelName: 'Canal / Creador',
    fieldChannelUrl: 'URL del canal',
    fieldSeries: 'Serie relacionada (opcional)',
    fieldOfficial: 'Oficial',
    fieldFeatured: 'Destacado',
    fieldOrder: 'Orden',
    requiredTitle: 'El titulo es requerido',
    requiredUrl: 'La URL es requerida',
    requiredPlatform: 'La plataforma es requerida',
    invalidUrl: 'Ingresa una URL valida',
    hintTitle: 'Titulo del contenido',
    hintUrl: 'https://www.youtube.com/watch?v=...',
    hintThumbnailUrl: 'https://...',
    hintChannelName: 'Nombre del canal',
    hintChannelUrl: 'https://...',
    hintSeries: 'Buscar serie...',
    previewButton: 'Previsualizar embed',
    previewWarning: 'Ingresa una URL y plataforma para previsualizar',
    loadError: 'Error al cargar el contenido',
    createSuccess: 'Contenido creado',
    updateSuccess: 'Contenido actualizado',
    saveError: 'Error al guardar',
    deleteSuccess: 'Contenido eliminado',
    deleteError: 'Error al eliminar el contenido',
  },
  adminLogs: {
    title: 'Access Logs',
    subtitle: 'Registro de accesos y acciones del sistema.',
    statsTotal: 'Total logs',
    statsTotalUsers: 'Usuarios registrados',
    statsTopEndpoints: 'Top rutas',
    statsActions: 'Por accion',
    filterActionPlaceholder: 'Accion',
    filterUserPlaceholder: 'Usuario',
    filterIpPlaceholder: 'Buscar IP',
    filterPathPlaceholder: 'Buscar ruta',
    actionRefresh: 'Refrescar',
    actionCleanScanners: 'Limpiar scanners',
    actionCleanOld: 'Limpiar logs...',
    cleanModalTitle: 'Limpiar logs antiguos',
    cleanModalDaysLabel: 'Eliminar logs de mas de N dias',
    cleanModalConfirmText:
      'Se eliminaran todos los logs con mas de {days} dias. Esta accion no se puede deshacer.',
    cleanModalOk: 'Eliminar',
    cleanModalCancel: 'Cancelar',
    anonymous: 'Anonimo',
    loadingText: 'Cargando...',
    emptyText: 'Sin resultados',
    columnDate: 'Fecha',
    columnUser: 'Usuario',
    columnAction: 'Accion',
    columnPath: 'Ruta',
    columnIp: 'IP',
    columnUserAgent: 'User Agent',
    columnCount: 'Cantidad',
    paginationPrev: 'Anterior',
    paginationNext: 'Siguiente',
    pageInfo: '{page} / {total}',
    showTotal: '{total} logs',
    loadError: 'Error al cargar logs',
    cleanError: 'Error al limpiar logs',
    cleanScannersError: 'Error al limpiar logs de scanners',
  },
  seriesForm: {
    headerCreate: 'Nueva Serie/Pelicula',
    headerEdit: 'Editar Serie/Pelicula',
    favoriteButton: 'Favorito',
    addFavoriteButton: 'Agregar a Favoritos',
    cancelButton: 'Cancelar',
    unsavedTitle: 'Hay cambios sin guardar',
    unsavedContent:
      'Si sales ahora, perderas los cambios que no hayas guardado. Deseas continuar?',
    unsavedOk: 'Salir sin guardar',
    unsavedCancel: 'Seguir editando',
    sectionBasic: 'Informacion Basica',
    sectionCast: 'Reparto',
    sectionDirectors: 'Directores',
    sectionWatchLinks: 'Donde Ver',
    sectionRelated: 'Series Relacionadas',
    sectionContent: 'Contenido Relacionado',
    fieldTitle: 'Titulo',
    fieldOriginalTitle: 'Titulo Original',
    fieldType: 'Tipo',
    fieldCountry: 'Pais',
    fieldYear: 'Anio',
    fieldUniverse: 'Universo (opcional)',
    fieldBasedOn: 'Basada en',
    fieldFormat: 'Formato de Pantalla',
    fieldProduction: 'Productora',
    fieldLanguage: 'Idioma Original',
    fieldGenres: 'Genero',
    fieldSynopsis: 'Sinopsis',
    fieldSoundtrack: 'Banda Sonora (BSO)',
    fieldRating: 'Puntuacion General (1-10)',
    fieldObservations: 'Observaciones',
    fieldTags: 'Tags / Etiquetas',
    fieldImage: 'Imagen / Portada',
    fieldImagePosition: 'Posicion de imagen en catalogo',
    typeOption_serie: 'Serie',
    typeOption_pelicula: 'Pelicula',
    typeOption_corto: 'Cortometraje',
    typeOption_especial: 'Especial',
    typeOption_anime: 'Anime',
    typeOption_reality: 'Reality',
    formatOption_regular: 'Regular (Horizontal)',
    formatOption_vertical: 'Vertical (Para movil)',
    requiredTitle: 'El titulo es obligatorio',
    requiredType: 'Selecciona un tipo',
    requiredFormat: 'Selecciona un formato',
    requiredSeasonNumber: 'Numero requerido',
    helpBasedOn:
      'Escribe para buscar o agregar nuevos (ej: Manga, Manhwa, Novela)',
    helpProduction: 'Escribe para buscar o crear una nueva productora',
    helpLanguage: 'Escribe para buscar o crear un nuevo idioma',
    helpGenres:
      'Escribe y presiona Enter para crear nuevos generos. Ej: Drama, Romance, Comedia',
    helpTags:
      'Escribe y presiona Enter para crear nuevos tags. Ej: Enemy to Lovers, Rico-Pobre, Escuela',
    helpImage: 'Pega una URL o sube un archivo desde tu computadora',
    helpImagePosition: 'Selecciona que parte de la imagen se ve en las cards',
    helpRelated:
      'Busca por titulo para vincular series que comparten personajes o historia',
    hintTitle: 'Ej: 2 Moons',
    hintOriginalTitle: 'Titulo en idioma original',
    hintCountry: 'Selecciona un pais',
    hintUniverse: 'Pertenece a algun universo/franquicia?',
    hintBasedOn: 'Ej: Libro, Manga, Manhwa...',
    hintProduction: 'Ej: GMMTV',
    hintLanguage: 'Ej: Tailandes',
    hintGenres: 'Agrega generos como Drama, Romance, etc.',
    hintSynopsis: 'Breve descripcion de la serie/pelicula',
    hintSoundtrack: 'Compositor o informacion de la BSO',
    hintRating: '8',
    hintObservations: 'Notas personales, comentarios, etc.',
    hintTags: 'Agrega tags como Enemy to Lovers, Escuela, etc.',
    hintImage: 'https://example.com/imagen.jpg',
    hintActorName: 'Nombre del actor',
    hintCharacter: 'Personaje',
    hintDirectorName: 'Nombre del director',
    hintPairingGroup: 'Pareja',
    hintWatchUrl: 'URL del contenido',
    hintRelatedSeries: 'Busca y selecciona series relacionadas...',
    castAlertTitle: 'Reparto principal de la serie',
    castAlertDescription:
      'Este es el reparto que aparece en todas las temporadas. Para agregar reparto especifico de cada temporada, usa el boton Editar junto a cada temporada abajo.',
    castPairingHint:
      'Para emparejar personajes, asigna el mismo numero en Pareja (ej: 1 y 1 = primera pareja)',
    fieldActorName: 'Actor',
    fieldCharacter: 'Personaje',
    fieldIsMain: 'Protagonista',
    fieldPairingGroup: 'Pareja',
    addActorButton: 'Agregar Actor',
    addDirectorButton: 'Agregar Director',
    fieldPlatform: 'Plataforma',
    fieldWatchUrl: 'URL',
    fieldOfficial: 'Oficial',
    addPlatformButton: 'Agregar Plataforma',
    seasonAlertTitle: 'Informacion basica de temporadas',
    seasonAlertEdit:
      'Usa el boton Editar junto a cada temporada para agregar reparto especifico, sinopsis, episodios, comentarios y ratings.',
    seasonAlertCreate:
      'Primero guarda la serie, luego podras editar cada temporada en detalle para agregar reparto, sinopsis, episodios, etc.',
    fieldSeasonNumber: 'Temporada',
    fieldEpisodeCount: 'Capitulos',
    editSeasonButton: 'Editar',
    addSeasonButton: 'Agregar Temporada',
    relatedSearching: 'Buscando...',
    relatedEmpty: 'Escribe para buscar',
    createButton: 'Crear Serie',
    saveButton: 'Guardar Cambios',
    universeModalTitle: 'Crear nuevo universo',
    universeCreateButton: 'Crear',
    universeCancelButton: 'Cancelar',
    universeNamePlaceholder: 'Nombre del universo',
    universeDescriptionPlaceholder: 'Descripcion (opcional)',
    createNewUniverseTitle: 'Crear nuevo universo',
    createSuccess: 'Serie creada exitosamente',
    updateSuccess: 'Serie actualizada exitosamente',
    saveError: 'Error al guardar la serie',
    uploadSuccess: 'Imagen subida exitosamente',
    uploadError: 'Error al subir la imagen',
    uploadingLabel: 'Subiendo...',
    uploadButton: 'Subir',
    favoriteAdded: 'Agregado a favoritos',
    favoriteRemoved: 'Removido de favoritos',
    favoriteError: 'Error al actualizar favorito',
    universeCreated: 'Universo "{name}" creado',
    universeCreateError: 'Error al crear universo',
  },
  seasonForm: {
    headerTitle: 'Editar Temporada {number}',
    backButton: 'Volver a {title}',
    cancelButton: 'Cancelar',
    sectionBasic: 'Informacion Basica de la Temporada',
    sectionCast: 'Reparto de esta Temporada',
    castDescription:
      'Agrega actores especificos de esta temporada. El reparto principal de la serie se muestra automaticamente.',
    fieldSeasonNumber: 'Numero de Temporada',
    requiredSeasonNumber: 'Requerido',
    fieldTitle: 'Titulo (opcional)',
    fieldEpisodeCount: 'Numero de Capitulos',
    fieldYear: 'Anio',
    fieldSynopsis: 'Sinopsis de esta Temporada',
    fieldObservations: 'Observaciones',
    fieldImage: 'Imagen de la Temporada',
    helpImage: 'Pega una URL o sube un archivo desde tu computadora',
    hintImage: 'https://example.com/season-image.jpg',
    hintTitle: 'Ej: The Beginning',
    hintEpisodeCount: '12',
    hintSynopsis: 'Descripcion de lo que sucede en esta temporada...',
    hintObservations: 'Notas personales sobre esta temporada...',
    hintActorName: 'Nombre del actor',
    hintCharacter: 'Personaje',
    fieldIsMain: 'Protagonista',
    requiredActorName: 'Nombre requerido',
    addActorButton: 'Agregar Actor a esta Temporada',
    saveButton: 'Guardar Cambios',
    viewSeriesButton: 'Ver Serie',
    uploadButton: 'Subir',
    uploadingLabel: 'Subiendo...',
    updateSuccess: 'Temporada actualizada exitosamente',
    saveError: 'Error al guardar la temporada',
    uploadSuccess: 'Imagen subida exitosamente',
    uploadError: 'Error al subir la imagen',
  },
  catalogo: {
    searchPlaceholder: 'Buscar por título, país o tipo...',
    filtersButton: 'Filtros',
    alphaFilterTooltip: 'Filtro alfabético',
    titlesCount: '{n} títulos',
    filteredCount: '{from} de {total}',
    filterCountry: 'País',
    filterType: 'Tipo',
    filterStatus: 'Estado',
    filterFavorites: 'Favoritos',
    filterTags: 'Tags',
    filterMinRating: 'Rating mín.',
    filterFrom: 'Desde',
    filterTo: 'Hasta',
    filterClear: 'Limpiar',
    statusWatched: 'Vistas',
    statusUnwatched: 'No vistas',
    favoritesOnly: 'Favoritos',
    universeTitles: '{n} títulos',
    universeExpand: 'Ver series',
    filteringBy: 'Filtrando por:',
    filterCountryLabel: 'País: {value}',
    filterTypeLabel: 'Tipo: {value}',
    filterFormatLabel: 'Formato: {value}',
    filterGenreLabel: 'Género: {value}',
    filterLanguageLabel: 'Idioma: {value}',
    filterProductionLabel: 'Productora: {value}',
    filterDirectorLabel: 'Director: {value}',
    filterActorLabel: 'Actor: {value}',
    filterYearLabel: 'Año: {year}',
    filterTagLabel: 'Tag: {name}',
    drawerTitle: 'Filtros',
    addFavorite: 'Agregar a favoritos',
    removeFavorite: 'Quitar de favoritos',
    viewDetail: 'Ver detalle',
    watchedTag: 'Vista',
    newButton: 'Nueva',
    emptyFiltered: 'No se encontraron series con estos filtros',
    emptyCatalog: 'No hay series en el catálogo',
    clearAllFilters: 'Limpiar todos los filtros',
    paginationTotal: '{from}-{to} de {total}',
    favoriteAdded: 'Agregado a favoritos',
    favoriteRemoved: 'Removido de favoritos',
    favoriteError: 'Error al actualizar favorito',
    moreInfo: '+ info',
    hideInfo: 'Ocultar info',
    infoSeasons: 'Temporadas',
    infoEpisodes: 'Episodios',
    infoRuntime: 'Horas aprox.',
    infoActors: 'Actores',
    infoNoActors: 'Sin actores cargados',
    infoUnknown: 'Sin dato',
    sortLabel: 'Ordenar',
    sortAZ: 'A-Z',
    sortZA: 'Z-A',
    sortYearNew: 'Más nuevo',
    sortYearOld: 'Más antiguo',
    sortRatingDesc: 'Mejor valorado',
  },
  landing: {
    subtitle: 'Tu catálogo personal de series BL y más.',
    exploreCatalog: 'Explorar Catálogo',
    signIn: 'Iniciar Sesión',
    description:
      'Un espacio dedicado a las series BL, GL y doramas asiáticos. Seguí lo que estás viendo, calificá tus favoritas y compartir tus opiniones.',
    goToProfile: 'Mi Perfil',
    statSeries: 'series en catálogo',
    statViews: 'veces vistas',
    statComments: 'comentarios',
    featuresTitle: '¿Qué podés hacer?',
    featureCatalogTitle: 'Catálogo completo',
    featureCatalogDesc:
      'Explorá cientos de series organizadas por género, país, año y tipo de contenido.',
    featureRatingsTitle: 'Calificaciones por categoría',
    featureRatingsDesc:
      'Puntuá cada serie en trama, acting, OST y más. Tenés tu propia puntuación.',
    featureTrackingTitle: 'Seguimiento de episodios',
    featureTrackingDesc:
      'Registrá tu progreso episodio a episodio. Sabé siempre dónde quedás.',
    featureCommentsTitle: 'Comentarios y reseñas',
    featureCommentsDesc:
      'Dejá tus reflexiones por serie, temporada o episodio. Públicás o guardás privado.',
    featureFavoritesTitle: 'Favoritos',
    featureFavoritesDesc:
      'Armá tu lista de series favoritas para volver a ellas siempre que quieras.',
    featureStatsTitle: 'Estadísticas personales',
    featureStatsDesc:
      'Descubrí cuántas horas viste, tus géneros preferidos y tus rachas de actividad.',
    footerCtaText: 'Empezá a explorar el catálogo ahora.',
  },
  welcomeBanner: {
    title: 'Bienvenido/a a MundoBL',
    description:
      'Este es mi catálogo personal de series BL que fui viendo, incluyendo las que aún están en emisión. Si viste alguna, me encantaría que dejes tu comentario, reflexión o reseña.',
    dismiss: 'Entendido',
  },
  privacyBanner: {
    text: 'Este sitio registra información de acceso con fines de seguridad y mejora. Al continuar navegando, aceptás nuestra política de privacidad.',
    accept: 'Entendido',
  },
  header: {
    title: 'MundoBL - Catálogo de Series',
  },
  adminNav: {
    series: 'Series',
    seriesShort: 'Series',
    tags: 'Tags',
    tagsShort: 'Tags',
    universes: 'Universos',
    universesShort: 'Univ.',
    actors: 'Actores',
    actorsShort: 'Actor.',
    directors: 'Directores',
    directorsShort: 'Direct.',
    productionCompanies: 'Productoras',
    productionCompaniesShort: 'Prod.',
    languages: 'Idiomas',
    languagesShort: 'Idiom.',
    sites: 'Sitios',
    sitesShort: 'Sitios',
    content: 'Contenido',
    contentShort: 'Cont.',
    comments: 'Comentarios',
    commentsShort: 'Coment.',
    info: 'Info',
    infoShort: 'Info',
    logs: 'Logs',
    logsShort: 'Logs',
    stats: 'Estadísticas',
    statsShort: 'Stats',
  },
  adminStats: {
    pageTitle: 'Estadísticas de actividad',
    totalUsers: 'Usuarios registrados',
    currentlyWatching: 'Series en curso (únicas)',
    completedThisWeek: 'Completadas esta semana',
    commentsThisWeek: 'Comentarios esta semana',
    rankingWatching: 'Más viendo ahora',
    rankingCompleted: 'Más completadas',
    rankingFavorited: 'Más en favoritos',
    rankingCommented: 'Más comentadas',
    rankingRated: 'Mejor calificadas por usuarios',
    activeUsers: 'Usuarios activos (últimos 30 días)',
    badgeWatching: '{n} viendo',
    badgeCompleted: '{n} vistas',
    badgeFavorited: '{n} favs',
    badgeCommented: '{n} comentarios',
  },
  adminTable: {
    searchPlaceholder: 'Buscar por título, país o tipo...',
    resultCount: '{n} de {total} series',
    deleteConfirmTitle: '¿Estás seguro?',
    deleteConfirmContent:
      '¿Deseas eliminar la serie "{title}"? Esta acción no se puede deshacer.',
    deleteConfirmOk: 'Sí, eliminar',
    deleteConfirmCancel: 'Cancelar',
    deleteSuccess: 'Serie eliminada correctamente',
    deleteError: 'Error al eliminar la serie',
    columnTitle: 'Título',
    columnCountry: 'País',
    columnType: 'Tipo',
    columnSeasons: 'Temporadas',
    columnEpisodes: 'Episodios',
    columnYear: 'Año',
    columnStatus: 'Estado',
    columnActions: 'Acciones',
    paginationTotal: '{from}-{to} de {total} series',
  },
  editSerieModal: {
    title: 'Editar Serie',
    save: 'Guardar',
    cancel: 'Cancelar',
    loadError: 'Error al cargar los datos de la serie',
    updateSuccess: 'Serie actualizada correctamente',
    updateError: 'Error al actualizar la serie',
    fieldTitle: 'Título',
    requiredTitle: 'El título es requerido',
    fieldOriginalTitle: 'Título Original',
    fieldImageUrl: 'URL de Imagen',
    fieldYear: 'Año',
    fieldType: 'Tipo',
    requiredType: 'El tipo es requerido',
    fieldCountry: 'País de Origen',
    fieldRating: 'Rating General',
    fieldBasedOn: 'Basado en',
    fieldFormat: 'Formato de Pantalla',
    requiredFormat: 'Selecciona un formato',
    fieldSynopsis: 'Sinopsis',
    fieldReview: 'Reseña Personal',
    fieldSoundtrack: 'Banda Sonora',
    fieldObservations: 'Observaciones',
    placeholderTitle: 'Título de la serie',
    placeholderOriginalTitle: 'Título original (opcional)',
    placeholderImageUrl: 'URL de la imagen de portada',
    placeholderYear: 'Año de estreno',
    placeholderType: 'Selecciona el tipo',
    placeholderCountry: 'Selecciona el país',
    placeholderRating: 'Rating (1-10)',
    placeholderBasedOn: 'Selecciona si está basado en algo',
    placeholderSynopsis: 'Sinopsis de la serie...',
    placeholderReview: 'Tu reseña personal, opinión, crítica...',
    placeholderSoundtrack: 'Información sobre la banda sonora',
    placeholderObservations: 'Observaciones, comentarios, reseña personal...',
    typeOption_serie: 'Serie',
    typeOption_pelicula: 'Película',
    typeOption_corto: 'Corto',
    typeOption_especial: 'Especial',
    basedOnLibro: '📖 Libro',
    basedOnNovela: '📚 Novela',
    basedOnCorto: '📄 Cuento/Relato Corto',
    basedOnManga: '🎌 Manga',
    basedOnAnime: '🎨 Anime',
    formatRegular: '📱 Regular (Horizontal)',
    formatVertical: '📲 Vertical (Para móvil)',
  },
  tagPage: {
    titleCountSingular: '1 título',
    titleCountPlural: '{n} títulos',
    seriesWithTag: 'Series con este tag ({n})',
    empty: 'No hay series con este tag',
  },
  contenidoPage: {
    pageTitle: 'Contenido',
    subtitle: 'Trailers, OSTs, entrevistas y más desde plataformas oficiales',
    filterPlatform: 'Plataforma',
    filterCategory: 'Categoría',
    filterChannel: 'Canal / Fuente',
    emptyNoContent: 'Aún no hay contenido disponible',
    emptyFiltered: 'No hay contenido con estos filtros',
    playButton: 'Ver',
    unofficialTag: 'No oficial',
    modalSource: 'Fuente: {platform}',
    modalViewOn: 'Ver en {platform}',
    modalRelatedSeries: 'Serie relacionada:',
  },
  feedback: {
    pageTitle: 'Feedback',
    tabRequests: 'Ideas y Bugs',
    tabChangelog: 'Changelog',
    activeCount: '{n} solicitudes activas',
    newRequest: 'Nueva solicitud',
    emptyRequests: 'No hay solicitudes activas',
    emptyChangelog: 'No hay cambios registrados',
    completedSection: 'Solicitudes completadas',
    currentVersion: 'Versión actual: {version}',
    deleteButton: 'Eliminar',
    createButton: 'Crear',
    formTitle: 'Nueva solicitud',
    formFieldType: 'Tipo',
    formFieldTitle: 'Título',
    formFieldDescription: 'Descripción',
    formDescriptionPlaceholder:
      'Escribí la descripción... Podés pegar imágenes del clipboard (Ctrl+V)',
    formDescriptionHint: 'Pegá imágenes del clipboard en la descripción',
    formRequiredType: 'Seleccioná un tipo',
    formRequiredTitle: 'Ingresá un título',
    statusPendiente: 'Pendiente',
    statusEnProgreso: 'En progreso',
    statusCompletado: 'Completado',
    statusDescartado: 'Descartado',
    typeBug: 'Bug',
    typeFeature: 'Feature',
    typeIdea: 'Idea',
    successCreated: 'Solicitud creada',
    successStatusUpdated: 'Estado actualizado',
    successDeleted: 'Solicitud eliminada',
    errorCreate: 'Error al crear la solicitud',
    errorVote: 'Error al votar',
    errorStatusUpdate: 'Error al actualizar',
    errorDelete: 'Error al eliminar',
    errorUpload: 'Error al subir imagen',
  },
  notFound: {
    description: 'La página que buscas no existe o fue movida.',
    backLink: 'Volver al catálogo',
  },
};

const en: TranslationShape = {
  common: {
    language: 'Language',
    na: 'N/A',
    private: 'Private',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{n} days ago',
    weeksAgo: '{n} weeks ago',
    monthsAgo: '{n} months ago',
    neverWatched: 'Never',
    justNow: 'Just now',
    minutesAgo: '{n} min ago',
    hoursAgo: '{n}h ago',
  },
  seriesDetail: {
    tabInfo: 'Information',
    tabContent: 'Content',
    tabRatings: 'Ratings',
    tabComments: 'Comments',
  },
  seriesHeader: {
    universe: 'Universe',
    originalTitle: 'Original title',
    formatVertical: 'Vertical Format',
    basedOn: 'Based on {label}',
    typeSerie: 'Series',
    typePelicula: 'Movie',
    typeCorto: 'Short',
    typeEspecial: 'Special',
    typeAnime: 'Anime',
    typeReality: 'Reality',
  },
  seriesInfo: {
    fieldTitle: 'Title',
    fieldOriginalTitle: 'Original Title',
    fieldYear: 'Year',
    fieldCountry: 'Country',
    fieldType: 'Type',
    fieldFormat: 'Format',
    fieldBasedOn: 'Based on',
    fieldSeasons: 'Seasons',
    fieldEpisodes: 'Episodes',
    fieldSoundtrack: 'OST',
    fieldProduction: 'Production',
    fieldLanguage: 'Original Language',
    fieldDubbings: 'Dubbings',
    fieldGenre: 'Genre',
    fieldDirectors: 'Director(s)',
    formatVertical: 'Vertical',
    formatRegular: 'Regular',
    whereToWatch: 'Where to Watch',
    unofficial: ' (unofficial)',
    castSection: 'Cast',
    couplebadge: 'Couple',
    asCharacter: 'as {character}',
    protagonist: 'Main',
    synopsisSection: 'Synopsis',
    reviewSection: 'Personal Review',
    observationsSection: 'Observations',
    privateLabel: 'Private',
    notesPrivateLabel: 'Private review and observations',
    notesPrivateHelp:
      'When enabled, only administrators can see the review and observations for this series.',
    relatedSection: 'Related Series',
  },
  comments: {
    addTitle: 'Add Comment',
    placeholderPrivate: 'Write a private note (only you will see it)...',
    placeholderPublic:
      'Write your impressions, opinions or notes about this series...',
    placeholderEpisode:
      'Write your notes about this episode, interesting scenes, key moments...',
    tooltipPrivate: 'Private comments are only visible to you',
    privateLabel: 'Private',
    savePrivateButton: 'Save Private Note',
    addButton: 'Add Comment',
    privateButtonCompact: 'Private Note',
    commentButton: 'Comment',
    loginPrompt: 'Sign in to leave a comment',
    listTitle: 'Comments ({n})',
    emptyText: 'No comments yet',
    warningEmpty: 'Write a comment first',
    successPrivate: 'Private note added',
    successPublic: 'Comment added',
    errorSave: 'Error saving comment',
    reportModalTitle: 'Report comment',
    reportModalHint: 'Tell us briefly why (optional). An admin will review it.',
    reportPlaceholder: 'Spam, off-topic content, personal data...',
    reportButton: 'Report',
    cancelButton: 'Cancel',
    reportedSuccess: 'Comment reported. Thanks for letting us know.',
    reportError: 'Could not report',
  },
  episodesList: {
    headerTitle: 'Episodes ({n})',
    generateButton: 'Generate',
    addButton: 'Add',
    emptyText: 'No episodes recorded. Use "Generate" or "Add" to start.',
    selectedCount: '{n} selected',
    colEpisode: 'Episode',
    colActions: 'Actions',
    bulkWatched: 'Watched',
    bulkUnwatched: 'Unwatched',
    bulkDelete: 'Delete',
    tooltipWatched: 'Mark as watched',
    tooltipUnwatched: 'Mark as unwatched',
    tooltipDelete: 'Delete',
    tooltipEdit: 'Edit',
    watchedTag: 'Watched',
    deleteConfirmTitle: 'Delete episode?',
    deleteConfirmContent: 'Are you sure you want to delete episode {n}?',
    deleteBulkConfirmTitle: 'Delete selected episodes?',
    deleteBulkConfirmContent:
      '{n} episode(s) will be deleted with their comments and view statuses.',
    confirmOk: 'Yes, delete',
    confirmCancel: 'Cancel',
    successUpdated: 'Episode updated',
    successCreated: 'Episode created',
    successDeleted: 'Episode deleted',
    successBulkWatched: '{n} episode(s) marked as watched',
    successBulkUnwatched: '{n} episode(s) marked as unwatched',
    errorSave: 'Error saving episode',
    errorDelete: 'Error deleting episode',
    errorBulkDelete: 'Error deleting episodes',
    errorToggleWatched: 'Error updating status',
    errorBulkToggle: 'Error updating episodes',
    errorGenerate: 'Error generating episodes',
    modalEditTitle: 'Edit Episode',
    modalNewTitle: 'New Episode',
    fieldEpisodeNumber: 'Episode Number',
    fieldEpisodeTitle: 'Title (optional)',
    fieldMinutes: 'Minutes',
    fieldSynopsis: 'Synopsis',
    hintTitle: 'E.g. The Beginning',
    hintSynopsis: 'Brief description of what happens in this episode...',
    requiredEpisodeNumber: 'Required',
    saveButton: 'Save',
    createButton: 'Create',
    cancelButton: 'Cancel',
    markedWatched: 'Episode marked as watched',
    markedUnwatched: 'Episode marked as unwatched',
    episodesUnit: '{watched}/{total} episodes',
    bulkMarkedWatched: '{n} episode(s) marked as watched',
    bulkMarkedUnwatched: '{n} episode(s) marked as unwatched',
  },
  seasonsList: {
    emptyText: 'No seasons recorded',
    seasonLabel: 'Season {n}',
    capsTag: '{n} eps',
    watchedTag: 'Watched',
    editButton: 'Edit',
    synopsisTitle: 'Season synopsis',
    observationsTitle: 'Observations',
    commentsTitle: 'Season comments',
    ratingsTitle: 'Season rating',
    castTitle: 'Season cast ({n})',
    protagonistTag: 'Main',
  },
  ratingSection: {
    officialLabel: 'Official rating',
    userAverageLabel: 'User rating',
    votesSingular: '{n} vote',
    votesPlural: '{n} votes',
    officialTitle: 'Official Rating',
    officialHint: 'Rate each aspect of the series from 1 to 10',
    saveOfficialButton: 'Save Official Rating',
    userTitle: 'Your Rating',
    userHint: 'Your rating will be public and contribute to the user average',
    saveUserButton: 'Save My Rating',
    loginPrompt: 'Sign in to rate this series',
    userAverageTitle: 'User Average by Category',
    successOfficial: 'Official ratings saved',
    errorOfficial: 'Error saving ratings',
    successUser: 'Your rating was saved',
    errorUser: 'Error saving your rating',
    catTrama: 'Plot',
    catCasting: 'Casting',
    catDireccion: 'Direction',
    catGuion: 'Script',
    catProduccion: 'Production',
    catFotografia: 'Photography',
    catBso: 'Soundtrack',
    catQuimicaPrincipal: 'Main couple chemistry',
    catQuimicaSecundaria: 'Secondary couple chemistry',
  },
  viewStatus: {
    sinVer: 'Not watched',
    viendo: 'Watching now',
    vista: 'Watched',
    abandonada: 'Abandoned',
    retomar: 'Resume',
    ariaLabel: 'View status',
    tooltipEpisodes: '{watched} of {total} episodes watched',
    episodesUnit: '{watched}/{total} episodes',
    errorUpdate: 'Error updating status',
    statusMessage: 'Status: {label}',
  },
  watchingDashboard: {
    loginPrompt: 'Sign in to see your series list',
    emptyText: 'You are not watching any series currently',
    exploreCatalog: 'Explore Catalog',
    removeTitle: 'Remove from watching now',
    nextLabel: 'Next',
    continueButton: 'Continue watching',
    detailsButton: 'View details',
    editButton: 'Edit',
    removedMessage: '"{title}" removed from "Watching now"',
    errorRemove: 'Error removing from list',
    episodeMarkedMessage: 'Episode {ep} marked as watched',
    errorMarkEpisode: 'Error marking episode',
    markEpisodeTooltip: 'Mark {ep} as watched',
  },
  appLayout: {
    skipToContent: 'Skip to main content',
  },
  sidebar: {
    catalog: 'Catalog',
    watching: 'Watching Now',
    novedades: "What's new",
    feedback: 'Feedback',
    sites: 'Useful Sites',
    content: 'Content',
    administration: 'Administration',
    series: 'Series',
    tags: 'Tags',
    universes: 'Universes',
    actors: 'Actors',
    directors: 'Directors',
    users: 'Users',
    comments: 'Comments',
    info: 'Info',
    logs: 'Logs',
    collapseMenu: 'Collapse menu',
    expandMenu: 'Expand menu',
    login: 'Sign in',
    logout: 'Sign out',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    dark: 'Dark',
    light: 'Light',
    profile: 'My Profile',
    stats: 'Statistics',
  },
  profile: {
    loginRequired: 'Sign in to view your profile',
    memberSince: 'Member since',
    statWatched: 'Watched',
    statWatching: 'Watching',
    statAbandoned: 'Abandoned',
    statToRewatch: 'To rewatch',
    statFavorites: 'Favorites',
    statRatings: 'Ratings',
    statComments: 'Comments',
    sectionWatching: 'Currently watching',
    sectionRecent: 'Recently completed',
    sectionFavorites: 'My favorites',
    sectionMyComments: 'My comments',
    sectionDisputes: 'My disputes',
    commentsSelectAll: 'Select all',
    commentsSelectedCount: '{n} selected',
    commentsDeleteSelected: 'Delete selected',
    commentsDeleteSuccess: '{n} comments deleted',
    commentsDeleteError: 'Could not delete comments',
    commentsLoadError: 'Could not load comments',
    commentsEmpty: 'You have no comments yet',
    commentsExport: 'Download JSON',
    commentsPublic: 'Public',
    commentsPrivate: 'Private',
    commentsTargetUnknown: 'No reference',
    commentsSearchPlaceholder: 'Search in my comments...',
    commentsFilterAll: 'All',
    commentsFilterPublic: 'Public',
    commentsFilterPrivate: 'Private',
    commentsFilterTargetAll: 'All targets',
    commentsFilterReported: 'Reported only',
    commentsTargetSeries: 'Series',
    commentsTargetSeason: 'Season',
    commentsTargetEpisode: 'Episode',
    commentsSetPublic: 'Set public',
    commentsSetPrivate: 'Set private',
    commentsVisibilityUpdateError: 'Could not update visibility',
    commentsVisibilityPublicSuccess: 'Comments set to public',
    commentsVisibilityPrivateSuccess: 'Comments set to private',
    commentsReportCount: '{n} reports',
    commentsEdit: 'Edit',
    commentsEditTitle: 'Edit comment',
    commentsEditPlaceholder: 'Update the comment content',
    commentsEditSave: 'Save',
    commentsEditCancel: 'Cancel',
    commentsEditSuccess: 'Comment updated',
    commentsEditError: 'Could not update comment',
    commentsOpenDispute: 'Open dispute',
    disputesEmpty: 'You have no disputes yet',
    disputesLoadError: 'Could not load disputes',
    disputeOpenTitle: 'New appeal',
    disputePlaceholder: 'Explain why this comment should not be penalized',
    disputeSubmit: 'Submit appeal',
    disputeCancel: 'Cancel',
    disputeSuccess: 'Appeal submitted successfully',
    disputeError: 'Could not create dispute',
    disputeForComment: 'Comment #{n}',
    sectionStats: 'Detailed statistics',
    statsHoursWatched: 'Hours watched',
    statsActiveDays: 'Active days this week',
    statsTopGenres: 'Most watched genres',
    statsTopCountries: 'Most watched countries',
    statsTopActors: 'Most watched actors',
    statsTopProductionCompanies: 'Most watched production companies',
    statsCompletedByYear: 'Completed per year',
    statsNoData: 'No data yet',
    statsModeLabel: 'View',
    statsModeBasic: 'Basic',
    statsModeAdvanced: 'Advanced',
    statsTopNLabel: 'Top N',
    statsTopN5: '5',
    statsTopN10: '10',
    statsTopN25: '25',
    statsTopN50: '50',
    statsTopNAll: 'All',
    statsRestoreWidgets: 'Hidden widgets:',
    statsEpisodesLabel: 'episodes',
    statsStreakTitle: 'Longest streak (12 wks)',
    statsStreakDays: 'consecutive days',
    statsAvgRating: 'Average rating',
    statsRatingsGiven: 'ratings given',
    statsByType: 'By content type',
    statsTopRated: 'Top rated series',
    sectionSettings: 'Settings',
    settingsAppearanceTitle: 'Appearance & accessibility',
    settingsAppearanceHint:
      'Theme, accent color, base tone, font, text size, density and motion. These preferences live in this browser.',
    settingsAppearanceOpen: 'Open preferences',
    settingsSessionTitle: 'Session & cache',
    settingsSessionHint:
      'Fix odd issues: clear local cache, reset the service worker or sign out of every device.',
    settingsDangerTitle: 'Danger zone',
    settingsDangerHint:
      'Export your data or delete your account with email confirmation.',
    settingsExportData: 'Export my data',
    settingsComingSoon: 'Coming soon',
    settingsIrreversible: 'Irreversible',
    settingsExportSuccess: 'Your JSON file was downloaded successfully.',
    settingsExportError: 'Could not export your account right now.',
    settingsDeleteTitle: 'Delete account',
    settingsDeleteIntro:
      'This action removes your account and personal data. Choose what to do with your public comments.',
    settingsDeletePolicyKeep:
      'Keep public comments (authorship may be anonymized)',
    settingsDeletePolicyAnonymize: 'Anonymize public comments (recommended)',
    settingsDeletePolicyDelete: 'Delete all my public comments',
    settingsDeleteEmailLabel: 'Type your email to confirm account deletion',
    settingsDeleteEmailPlaceholder: 'your-email@example.com',
    settingsDeleteEmailHint: 'Expected email:',
    settingsDeleteConfirmButton: 'Delete account',
    settingsDeleteCancelButton: 'Cancel',
    settingsDeleteSuccess: 'Your account has been deleted.',
    settingsDeleteError: 'Could not delete your account.',
    settingsDeleteMissingEmail:
      'We could not read your session email to confirm this action.',
  },
  novedades: {
    title: "What's new",
    subtitle:
      'Recently added series, new seasons and the latest changes in MundoBL.',
    empty: 'Nothing new for now. Check back in a few days.',
    newSeriesTitle: 'Recently added series',
    newSeasonsTitle: 'New seasons',
    seasonLabel: 'Season',
    changelogTitle: 'Recent changes',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Your personal alerts on MundoBL.',
    label: 'Notifications',
    openTitle: 'Open notifications',
    empty: 'You have no notifications yet.',
    new: 'New',
    unread: 'unread',
    allRead: "You're all caught up",
    markRead: 'Mark as read',
    markAllRead: 'Mark all as read',
    delete: 'Delete',
    clearAll: 'Clear all',
    cleared: 'Notifications cleared.',
    loginRequired: 'Sign in to see your personal notifications.',
  },
  offline: {
    message: "You're offline. Some features may not work.",
  },
  cmdk: {
    placeholder: 'Search series, actors, directors, tags...',
    hintMinChars: 'Type at least 2 characters to search.',
    empty: 'No results.',
    groupSeries: 'Series',
    groupActors: 'Actors',
    groupDirectors: 'Directors',
    groupTags: 'Tags',
    navigate: 'Navigate',
    select: 'Select',
    close: 'Close',
  },
  bottomNav: {
    mainNavigation: 'Main navigation',
    catalog: 'Catalog',
    watching: 'Watching',
    feedback: 'Feedback',
    admin: 'Admin',
    loading: 'Loading',
    login: 'Sign in',
    logout: 'Sign out',
    settings: 'Settings',
    accentColor: 'Accent color',
    theme: 'Theme',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
  },
  settings: {
    title: 'Preferences',
    sectionAppearance: 'Appearance',
    sectionTypography: 'Typography',
    sectionDensity: 'Density',
    sectionLanguage: 'Language',
    sectionAccessibility: 'Accessibility',
    sectionDataPrivacy: 'Data & privacy',
    sectionSession: 'Session',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    accentLabel: 'Accent color',
    toneLabel: 'Base tone',
    toneDefault: 'Default',
    toneWarm: 'Warm',
    toneCool: 'Cool',
    toneContrast: 'High contrast',
    fontLabel: 'Font',
    fontSystem: 'System',
    fontSerif: 'Serif',
    fontMono: 'Monospaced',
    fontDyslexic: 'Dyslexia-friendly',
    scaleLabel: 'Text size',
    scaleSmall: 'Small',
    scaleMedium: 'Medium',
    scaleLarge: 'Large',
    scaleExtraLarge: 'Extra large',
    densityLabel: 'Density',
    densityCompact: 'Compact',
    densityComfortable: 'Comfortable',
    densitySpacious: 'Spacious',
    motionLabel: 'Animations',
    motionAuto: 'Auto (follows system)',
    motionReduce: 'Reduced',
    saverLabel: 'Save data',
    saverDescription:
      'Hides decorative backdrops and lowers image quality on limited connections.',
    saverOff: 'Off',
    saverOn: 'On',
    resetButton: 'Reset to defaults',
    resetConfirm: 'This will reset all your visual preferences.',
    clearCachesButton: 'Clear local cache',
    clearCachesDescription:
      'Removes browser-stored images and data. Does not log you out.',
    clearCachesSuccess: 'Local cache cleared.',
    resetSwButton: 'Reset service worker',
    resetSwDescription:
      'Unregisters the worker, clears caches and reloads. Useful if the app gets stuck after a deploy.',
    resetSwConfirm:
      'This will unregister the service worker and reload the page. Continue?',
    sectionNotifications: 'Notifications',
    pushLabel: 'Browser notifications',
    pushDescription:
      "Get browser notifications when there's news. We won't ask for permission unless you turn this on.",
    pushUnsupported: 'Your browser does not support push notifications.',
    pushDeniedHint:
      'You blocked notifications for this site. Enable them in your browser settings to turn them on.',
    closeOtherSessionsButton: 'Close other sessions',
    closeOtherSessionsDescription:
      'Sign out of any other sessions on other devices.',
    closeAllSessionsButton: 'Sign out of all devices',
    closeAllSessionsConfirm:
      'Sign out everywhere? You will need to sign in again.',
    deleteAccountButton: 'Delete my account',
    deleteAccountDescription:
      'Permanently deletes your account and personal data. Coming soon.',
    closeButton: 'Close',
    sectionPreferences: 'Preferences',
    defaultCommentPrivateLabel: 'Private notes by default',
    defaultCommentPrivateHint:
      'Your new comments will be marked as private when you write them.',
  },
  adminComments: {
    title: 'Public comments',
    subtitle: 'Moderation and editorial curation for community comments.',
    statsTotal: 'Total',
    statsReported: 'Reported',
    statsPage: 'On page',
    filterAll: 'All',
    filterSeries: 'Series',
    filterSeasons: 'Seasons',
    filterEpisodes: 'Episodes',
    filterAuthorAll: 'All users',
    filterAuthorActive: 'With active user',
    filterAuthorDeleted: 'Deleted user',
    searchPlaceholder: 'Search content...',
    reportedOnly: 'Reported only',
    columnUser: 'User',
    columnComment: 'Comment',
    columnAbout: 'About',
    columnDate: 'Date',
    columnActions: 'Actions',
    targetEpisode: 'Episode',
    targetSeason: 'Season',
    targetSeries: 'Series',
    targetSeriesFallback: 'Series',
    targetUnknown: 'No target',
    deletedUser: 'Deleted user',
    unnamedUser: 'Unnamed',
    edited: 'Edited',
    reportsSuffixOne: 'report',
    reportsSuffixMany: 'reports',
    actionView: 'View',
    actionIgnore: 'Ignore',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    dismissReportsTitle: 'Dismiss reports?',
    dismissReportsDescription:
      'Reports will be deleted and counter reset to zero',
    dismissReportsConfirm: 'Dismiss',
    cancel: 'Cancel',
    deleteTitle: 'Delete comment?',
    deleteDescription: 'This action cannot be undone',
    deleteConfirm: 'Delete',
    modalEditTitle: 'Edit comment',
    modalEditPlaceholder: 'Edit the comment...',
    save: 'Save',
    noReason: 'No reason',
    loadError: 'Error loading comments',
    deleteSuccess: 'Comment deleted',
    deleteError: 'Error deleting comment',
    dismissSuccess: 'Reports dismissed',
    dismissError: 'Error dismissing reports',
    editEmptyWarning: 'Content cannot be empty',
    editLengthWarning: 'Comment cannot exceed 2000 characters',
    editSuccess: 'Comment updated',
    editError: 'Error updating comment',
  },
  adminActors: {
    title: 'Actors Management',
    subtitle: 'Manage profile, merge and cleanup of catalog actors.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    statsSelected: 'Selected',
    newItem: 'New Actor',
    searchPlaceholder: 'Search by name, stage name or nationality...',
    mergeSelected: 'Merge selected',
    columnName: 'Name',
    columnStageName: 'Stage Name',
    columnNationality: 'Nationality',
    columnSeries: 'Series',
    columnActions: 'Actions',
    unnamed: 'Unnamed',
    emptyValue: '-',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Actor',
    modalEditTitle: 'Edit Actor',
    save: 'Save',
    cancel: 'Cancel',
    requiredName: 'Name is required',
    fieldName: 'Name',
    fieldStageName: 'Stage Name',
    fieldBirthDate: 'Birth Date',
    fieldNationality: 'Nationality',
    fieldImageUrl: 'Image URL',
    fieldBiography: 'Biography',
    hintName: 'Actor name',
    hintStageName: 'Stage name (optional)',
    hintNationality: 'Ex: Thailand, South Korea',
    hintImageUrl: 'Actor photo URL (optional)',
    hintBiography: 'Brief actor biography (optional)',
    deleteTitle: 'Delete actor?',
    deleteDescription: 'Are you sure you want to delete this actor?',
    deleteBlockedDescription:
      'This actor has {count} participations. Unlink first.',
    mergeModalTitle: 'Merge Actors',
    mergeSelectSurvivor: 'Select which actor should survive:',
    mergeWarning:
      'The unselected actor will be deleted and all references will be moved to the surviving actor.',
    participationCount: '{count} participations',
    loadError: 'Error loading actors',
    saveCreateSuccess: 'Actor created successfully',
    saveUpdateSuccess: 'Actor updated successfully',
    saveError: 'Error saving actor',
    deleteSuccess: 'Actor deleted successfully',
    deleteError: 'Error deleting actor',
    mergeSuccess: 'Actors merged successfully',
    mergeError: 'Error merging actors',
  },
  adminDirectors: {
    title: 'Directors Management',
    subtitle: 'Manage profile, merge and cleanup of catalog directors.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    statsSelected: 'Selected',
    newItem: 'New Director',
    searchPlaceholder: 'Search by name or nationality...',
    mergeSelected: 'Merge selected',
    columnName: 'Name',
    columnNationality: 'Nationality',
    columnSeries: 'Series',
    columnActions: 'Actions',
    emptyValue: '-',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Director',
    modalEditTitle: 'Edit Director',
    save: 'Save',
    cancel: 'Cancel',
    requiredName: 'Name is required',
    fieldName: 'Name',
    fieldNationality: 'Nationality',
    fieldImageUrl: 'Image URL',
    fieldBiography: 'Biography',
    hintName: 'Director name',
    hintNationality: 'Ex: Thailand, South Korea',
    hintImageUrl: 'Director photo URL (optional)',
    hintBiography: 'Brief director biography (optional)',
    deleteTitle: 'Delete director?',
    deleteDescription: 'Are you sure you want to delete this director?',
    deleteBlockedDescription: 'This director has {count} series. Unlink first.',
    mergeModalTitle: 'Merge Directors',
    mergeSelectSurvivor: 'Select which director should survive:',
    mergeWarning:
      'The unselected director will be deleted and all references will be moved to the surviving director.',
    seriesCount: '{count} series',
    loadError: 'Error loading directors',
    saveCreateSuccess: 'Director created successfully',
    saveUpdateSuccess: 'Director updated successfully',
    saveError: 'Error saving director',
    deleteSuccess: 'Director deleted successfully',
    deleteError: 'Error deleting director',
    mergeSuccess: 'Directors merged successfully',
    mergeError: 'Error merging directors',
  },
  adminTags: {
    title: 'Tags Management',
    subtitle: 'Create, correct and merge tags to keep a clean catalog.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    statsSelected: 'Selected',
    searchPlaceholder: 'Search tags by name or category...',
    newPlaceholder: 'New tag name (e.g. Enemy to Lovers)',
    create: 'Create Tag',
    mergeSelected: 'Merge selected',
    columnTag: 'Tag',
    columnCategory: 'Category',
    columnSeries: 'Series',
    columnActions: 'Actions',
    emptyCategory: 'No category',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalEditTitle: 'Edit Tag',
    modalMergeTitle: 'Merge Tags',
    save: 'Save',
    cancel: 'Cancel',
    fieldName: 'Name',
    requiredName: 'Name is required',
    hintName: 'Tag name',
    mergeSelectSurvivor: 'Select which tag should survive:',
    mergeWarning:
      'The unselected tag will be deleted and all series that had it will switch to the surviving tag.',
    seriesCount: '{count} series',
    deleteTitle: 'Delete tag?',
    deleteDescription: 'This will remove the tag from {count} series',
    createEmptyWarning: 'Type a tag name first',
    loadError: 'Error loading tags',
    createSuccess: 'Tag created successfully',
    createError: 'Error creating tag',
    updateSuccess: 'Tag updated successfully',
    updateError: 'Error updating tag',
    deleteSuccess: 'Tag deleted successfully',
    deleteError: 'Error deleting tag',
    mergeSuccess: 'Tags merged successfully',
    mergeError: 'Error merging tags',
  },
  adminProductionCompanies: {
    title: 'Production Companies Management',
    subtitle: 'Manage production companies and normalize catalog data.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    searchPlaceholder: 'Search by name or country...',
    newItem: 'New Company',
    columnName: 'Name',
    columnCountry: 'Country',
    columnSeries: 'Series',
    columnActions: 'Actions',
    emptyValue: '-',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Company',
    modalEditTitle: 'Edit Company',
    save: 'Save',
    cancel: 'Cancel',
    fieldName: 'Name',
    fieldCountry: 'Country',
    requiredName: 'Name is required',
    hintName: 'Company name',
    hintCountry: 'Company country (optional)',
    deleteTitle: 'Delete company?',
    deleteDescription: 'This will delete company "{name}"',
    loadError: 'Error loading companies',
    createSuccess: 'Company created successfully',
    updateSuccess: 'Company updated successfully',
    saveError: 'Error saving company',
    deleteSuccess: 'Company deleted successfully',
    deleteError: 'Error deleting company',
  },
  adminUniverses: {
    title: 'Universes Management',
    subtitle: 'Manage story universes and their relation to series.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    searchPlaceholder: 'Search by name or description...',
    newItem: 'New Universe',
    columnName: 'Name',
    columnDescription: 'Description',
    columnSeries: 'Series',
    columnActions: 'Actions',
    emptyValue: '-',
    seriesCount: '{count} series',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Universe',
    modalEditTitle: 'Edit Universe',
    save: 'Save',
    cancel: 'Cancel',
    fieldName: 'Name',
    fieldDescription: 'Description',
    fieldImageUrl: 'Image URL',
    requiredName: 'Name is required',
    hintName: 'Ex: 2 Moons Universe',
    hintDescription: 'Universe description (optional)',
    hintImageUrl: 'Universe image URL (optional)',
    deleteTitle: 'Delete universe?',
    deleteDescription: 'Are you sure you want to delete this universe?',
    deleteBlockedDescription: 'This universe has {count} series. Unlink first.',
    loadError: 'Error loading universes',
    createSuccess: 'Universe created successfully',
    updateSuccess: 'Universe updated successfully',
    saveError: 'Error saving universe',
    deleteSuccess: 'Universe deleted successfully',
    deleteError: 'Error deleting universe',
  },
  adminLanguages: {
    title: 'Languages Management',
    subtitle: 'Manage original languages and dubbing options in the catalog.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    searchPlaceholder: 'Search by name or code...',
    newItem: 'New Language',
    columnName: 'Language',
    columnCode: 'Code',
    columnSeries: 'Series',
    columnDubbings: 'Dubbings',
    columnActions: 'Actions',
    emptyValue: '-',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Language',
    modalEditTitle: 'Edit Language',
    save: 'Save',
    cancel: 'Cancel',
    fieldName: 'Name',
    fieldCode: 'Code',
    requiredName: 'Name is required',
    hintName: 'Language name (e.g. Korean)',
    hintCode: 'ISO code (e.g. ko, th, ja)',
    deleteTitle: 'Delete language?',
    deleteDescription: 'This will delete language "{name}"',
    loadError: 'Error loading languages',
    createSuccess: 'Language created successfully',
    updateSuccess: 'Language updated successfully',
    saveError: 'Error saving language',
    deleteSuccess: 'Language deleted successfully',
    deleteError: 'Error deleting language',
  },
  adminSites: {
    title: 'Sites Management',
    subtitle: 'Manage the directory of recommended sites of interest.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    searchPlaceholder: 'Search by name, category or description...',
    newItem: 'New Site',
    newItemShort: 'New',
    columnName: 'Name',
    columnCategory: 'Category',
    columnLanguage: 'Language',
    columnDescription: 'Description',
    columnOrder: 'Order',
    columnActions: 'Actions',
    emptyValue: '-',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    modalNewTitle: 'New Site',
    modalEditTitle: 'Edit Site',
    save: 'Save',
    cancel: 'Cancel',
    fieldName: 'Name',
    fieldUrl: 'URL',
    fieldDescription: 'Description',
    fieldCategory: 'Category',
    fieldLanguage: 'Language',
    fieldImageUrl: 'Image URL',
    fieldOrder: 'Order',
    requiredName: 'Name is required',
    requiredUrl: 'URL is required',
    invalidUrl: 'Enter a valid URL',
    hintName: 'Site name',
    hintUrl: 'https://example.com',
    hintDescription: 'Brief description of the site',
    hintCategory: 'Select category',
    hintLanguage: 'Site language',
    hintImageUrl: 'https://example.com/logo.png',
    deleteTitle: 'Delete site?',
    deleteDescription: 'This will delete "{name}"',
    loadError: 'Error loading sites',
    createSuccess: 'Site created successfully',
    updateSuccess: 'Site updated successfully',
    saveError: 'Error saving site',
    deleteSuccess: 'Site deleted successfully',
    deleteError: 'Error deleting site',
  },
  adminUsers: {
    title: 'User Management',
    subtitle: 'Manage users, roles and blocked IPs.',
    statsTotal: 'Total users',
    statsBanned: 'Banned',
    statsIps: 'Blocked IPs',
    searchPlaceholder: 'Search by name or email...',
    sectionUsers: 'Users',
    sectionBannedIps: 'Blocked IPs',
    columnUser: 'User',
    columnRole: 'Role',
    columnCreatedAt: 'Registered',
    columnActions: 'Actions',
    columnIp: 'IP',
    columnReason: 'Reason',
    columnDate: 'Date',
    tagBanned: 'Banned',
    actionBan: 'Ban',
    actionUnban: 'Unban',
    actionUnblockIp: 'Unblock',
    banTitle: 'Ban user?',
    banDescription: 'The user will not be able to access the site',
    unbanTitle: 'Unban user?',
    unbanDescription: 'The user will be able to access again',
    roleAdmin: 'Administrator',
    roleModerator: 'Moderator',
    roleVisitor: 'Visitor',
    filterAllRoles: 'All roles',
    filterOnlyAdmins: 'Only administrators',
    filterOnlyModerators: 'Only moderators',
    filterOnlyVisitors: 'Only visitors',
    ipPlaceholder: 'IP (e.g. 192.168.1.1)',
    ipReasonPlaceholder: 'Reason (optional)',
    ipBlockButton: 'Block',
    ipMissingWarning: 'Enter an IP address',
    ipBlockSuccess: 'IP blocked',
    ipBlockError: 'Error blocking IP',
    ipUnblockSuccess: 'IP unblocked',
    ipUnblockError: 'Error unblocking IP',
    loadError: 'Error loading users',
    roleUpdateSuccess: 'Role updated',
    roleUpdateError: 'Error changing role',
    banSuccess: 'User banned',
    unbanSuccess: 'User unbanned',
    banError: 'Error banning user',
  },
  adminContent: {
    title: 'Content Management',
    subtitle: 'Manage embeddable videos for series and catalog.',
    statsTotal: 'Total',
    statsFiltered: 'Filtered',
    statsDuplicates: 'Duplicates',
    searchPlaceholder: 'Search by title, channel or series...',
    newItem: 'New Content',
    newItemShort: 'New',
    actionImport: 'Import Channel',
    actionImportShort: 'Import',
    actionShowDuplicates: 'Duplicates ({count})',
    columnTitle: 'Title',
    columnPlatform: 'Platform',
    columnCategory: 'Category',
    columnSeries: 'Series',
    columnFeatured: 'Feat.',
    columnActions: 'Actions',
    tagDuplicate: 'Duplicate',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    deleteTitle: 'Delete this content?',
    cancel: 'Cancel',
    modalNewTitle: 'New Content',
    modalEditTitle: 'Edit Content',
    save: 'Save',
    fieldTitle: 'Title',
    fieldUrl: 'URL',
    fieldPlatform: 'Platform',
    fieldCategory: 'Category',
    fieldDescription: 'Description',
    fieldLanguage: 'Language',
    fieldThumbnailUrl: 'Thumbnail URL',
    thumbnailHint: 'Auto-generated for YouTube when URL is entered',
    fieldChannelName: 'Channel / Creator',
    fieldChannelUrl: 'Channel URL',
    fieldSeries: 'Related series (optional)',
    fieldOfficial: 'Official',
    fieldFeatured: 'Featured',
    fieldOrder: 'Order',
    requiredTitle: 'Title is required',
    requiredUrl: 'URL is required',
    requiredPlatform: 'Platform is required',
    invalidUrl: 'Enter a valid URL',
    hintTitle: 'Content title',
    hintUrl: 'https://www.youtube.com/watch?v=...',
    hintThumbnailUrl: 'https://...',
    hintChannelName: 'Channel name',
    hintChannelUrl: 'https://...',
    hintSeries: 'Search series...',
    previewButton: 'Preview embed',
    previewWarning: 'Enter a URL and platform to preview',
    loadError: 'Error loading content',
    createSuccess: 'Content created',
    updateSuccess: 'Content updated',
    saveError: 'Error saving content',
    deleteSuccess: 'Content deleted',
    deleteError: 'Error deleting content',
  },
  adminLogs: {
    title: 'Access Logs',
    subtitle: 'System access and action log.',
    statsTotal: 'Total logs',
    statsTotalUsers: 'Registered users',
    statsTopEndpoints: 'Top paths',
    statsActions: 'By action',
    filterActionPlaceholder: 'Action',
    filterUserPlaceholder: 'User',
    filterIpPlaceholder: 'Search IP',
    filterPathPlaceholder: 'Search path',
    actionRefresh: 'Refresh',
    actionCleanScanners: 'Clean scanners',
    actionCleanOld: 'Clean logs...',
    cleanModalTitle: 'Clean old logs',
    cleanModalDaysLabel: 'Delete logs older than N days',
    cleanModalConfirmText:
      'All logs older than {days} days will be deleted. This action cannot be undone.',
    cleanModalOk: 'Delete',
    cleanModalCancel: 'Cancel',
    anonymous: 'Anonymous',
    loadingText: 'Loading...',
    emptyText: 'No results',
    columnDate: 'Date',
    columnUser: 'User',
    columnAction: 'Action',
    columnPath: 'Path',
    columnIp: 'IP',
    columnUserAgent: 'User Agent',
    columnCount: 'Count',
    paginationPrev: 'Previous',
    paginationNext: 'Next',
    pageInfo: '{page} / {total}',
    showTotal: '{total} logs',
    loadError: 'Error loading logs',
    cleanError: 'Error cleaning logs',
    cleanScannersError: 'Error cleaning scanner logs',
  },
  seriesForm: {
    headerCreate: 'New Series/Movie',
    headerEdit: 'Edit Series/Movie',
    favoriteButton: 'Favorite',
    addFavoriteButton: 'Add to Favorites',
    cancelButton: 'Cancel',
    unsavedTitle: 'Unsaved changes',
    unsavedContent:
      'If you leave now, you will lose unsaved changes. Do you want to continue?',
    unsavedOk: 'Leave without saving',
    unsavedCancel: 'Keep editing',
    sectionBasic: 'Basic Information',
    sectionCast: 'Cast',
    sectionDirectors: 'Directors',
    sectionWatchLinks: 'Where to Watch',
    sectionRelated: 'Related Series',
    sectionContent: 'Related Content',
    fieldTitle: 'Title',
    fieldOriginalTitle: 'Original Title',
    fieldType: 'Type',
    fieldCountry: 'Country',
    fieldYear: 'Year',
    fieldUniverse: 'Universe (optional)',
    fieldBasedOn: 'Based on',
    fieldFormat: 'Screen Format',
    fieldProduction: 'Production Company',
    fieldLanguage: 'Original Language',
    fieldGenres: 'Genre',
    fieldSynopsis: 'Synopsis',
    fieldSoundtrack: 'Soundtrack (OST)',
    fieldRating: 'Overall Rating (1-10)',
    fieldObservations: 'Observations',
    fieldTags: 'Tags',
    fieldImage: 'Image / Cover',
    fieldImagePosition: 'Image position in catalog',
    typeOption_serie: 'Series',
    typeOption_pelicula: 'Movie',
    typeOption_corto: 'Short Film',
    typeOption_especial: 'Special',
    typeOption_anime: 'Anime',
    typeOption_reality: 'Reality',
    formatOption_regular: 'Regular (Horizontal)',
    formatOption_vertical: 'Vertical (Mobile)',
    requiredTitle: 'Title is required',
    requiredType: 'Select a type',
    requiredFormat: 'Select a format',
    requiredSeasonNumber: 'Number required',
    helpBasedOn: 'Type to search or add new (e.g. Manga, Manhwa, Novel)',
    helpProduction: 'Type to search or create a new production company',
    helpLanguage: 'Type to search or create a new language',
    helpGenres:
      'Type and press Enter to create genres. E.g. Drama, Romance, Comedy',
    helpTags:
      'Type and press Enter to create tags. E.g. Enemy to Lovers, School',
    helpImage: 'Paste a URL or upload a file from your computer',
    helpImagePosition: 'Select which part of the image is shown in cards',
    helpRelated:
      'Search by title to link series that share characters or story',
    hintTitle: 'E.g. 2 Moons',
    hintOriginalTitle: 'Title in original language',
    hintCountry: 'Select a country',
    hintUniverse: 'Belongs to a universe/franchise?',
    hintBasedOn: 'E.g. Book, Manga, Manhwa...',
    hintProduction: 'E.g. GMMTV',
    hintLanguage: 'E.g. Thai',
    hintGenres: 'Add genres like Drama, Romance, etc.',
    hintSynopsis: 'Brief description of the series/movie',
    hintSoundtrack: 'Composer or OST information',
    hintRating: '8',
    hintObservations: 'Personal notes, comments, etc.',
    hintTags: 'Add tags like Enemy to Lovers, School, etc.',
    hintImage: 'https://example.com/image.jpg',
    hintActorName: 'Actor name',
    hintCharacter: 'Character',
    hintDirectorName: 'Director name',
    hintPairingGroup: 'Pair',
    hintWatchUrl: 'Content URL',
    hintRelatedSeries: 'Search and select related series...',
    castAlertTitle: 'Main series cast',
    castAlertDescription:
      'This is the cast that appears across all seasons. To add season-specific cast, use the Edit button next to each season below.',
    castPairingHint:
      'To pair characters, assign the same number in Pair (e.g. 1 and 1 = first pair)',
    fieldActorName: 'Actor',
    fieldCharacter: 'Character',
    fieldIsMain: 'Main',
    fieldPairingGroup: 'Pair',
    addActorButton: 'Add Actor',
    addDirectorButton: 'Add Director',
    fieldPlatform: 'Platform',
    fieldWatchUrl: 'URL',
    fieldOfficial: 'Official',
    addPlatformButton: 'Add Platform',
    seasonAlertTitle: 'Basic season information',
    seasonAlertEdit:
      'Use the Edit button next to each season to add specific cast, synopsis, episodes, comments and ratings.',
    seasonAlertCreate:
      'Save the series first, then you can edit each season in detail to add cast, synopsis, episodes, etc.',
    fieldSeasonNumber: 'Season',
    fieldEpisodeCount: 'Episodes',
    editSeasonButton: 'Edit',
    addSeasonButton: 'Add Season',
    relatedSearching: 'Searching...',
    relatedEmpty: 'Type to search',
    createButton: 'Create Series',
    saveButton: 'Save Changes',
    universeModalTitle: 'Create new universe',
    universeCreateButton: 'Create',
    universeCancelButton: 'Cancel',
    universeNamePlaceholder: 'Universe name',
    universeDescriptionPlaceholder: 'Description (optional)',
    createNewUniverseTitle: 'Create new universe',
    createSuccess: 'Series created successfully',
    updateSuccess: 'Series updated successfully',
    saveError: 'Error saving series',
    uploadSuccess: 'Image uploaded successfully',
    uploadError: 'Error uploading image',
    uploadingLabel: 'Uploading...',
    uploadButton: 'Upload',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    favoriteError: 'Error updating favorite',
    universeCreated: 'Universe "{name}" created',
    universeCreateError: 'Error creating universe',
  },
  seasonForm: {
    headerTitle: 'Edit Season {number}',
    backButton: 'Back to {title}',
    cancelButton: 'Cancel',
    sectionBasic: 'Basic Season Information',
    sectionCast: 'Season Cast',
    castDescription:
      'Add actors specific to this season. The main series cast is shown automatically.',
    fieldSeasonNumber: 'Season Number',
    requiredSeasonNumber: 'Required',
    fieldTitle: 'Title (optional)',
    fieldEpisodeCount: 'Episode Count',
    fieldYear: 'Year',
    fieldSynopsis: 'Season Synopsis',
    fieldObservations: 'Observations',
    fieldImage: 'Season Image',
    helpImage: 'Paste a URL or upload a file from your computer',
    hintImage: 'https://example.com/season-image.jpg',
    hintTitle: 'E.g. The Beginning',
    hintEpisodeCount: '12',
    hintSynopsis: 'Description of what happens in this season...',
    hintObservations: 'Personal notes about this season...',
    hintActorName: 'Actor name',
    hintCharacter: 'Character',
    fieldIsMain: 'Main',
    requiredActorName: 'Name required',
    addActorButton: 'Add Actor to this Season',
    saveButton: 'Save Changes',
    viewSeriesButton: 'View Series',
    uploadButton: 'Upload',
    uploadingLabel: 'Uploading...',
    updateSuccess: 'Season updated successfully',
    saveError: 'Error saving season',
    uploadSuccess: 'Image uploaded successfully',
    uploadError: 'Error uploading image',
  },
  catalogo: {
    searchPlaceholder: 'Search by title, country or type...',
    filtersButton: 'Filters',
    alphaFilterTooltip: 'Alphabetical filter',
    titlesCount: '{n} titles',
    filteredCount: '{from} of {total}',
    filterCountry: 'Country',
    filterType: 'Type',
    filterStatus: 'Status',
    filterFavorites: 'Favorites',
    filterTags: 'Tags',
    filterMinRating: 'Min. Rating',
    filterFrom: 'From',
    filterTo: 'To',
    filterClear: 'Clear',
    statusWatched: 'Watched',
    statusUnwatched: 'Unwatched',
    favoritesOnly: 'Favorites',
    universeTitles: '{n} titles',
    universeExpand: 'View series',
    filteringBy: 'Filtering by:',
    filterCountryLabel: 'Country: {value}',
    filterTypeLabel: 'Type: {value}',
    filterFormatLabel: 'Format: {value}',
    filterGenreLabel: 'Genre: {value}',
    filterLanguageLabel: 'Language: {value}',
    filterProductionLabel: 'Studio: {value}',
    filterDirectorLabel: 'Director: {value}',
    filterActorLabel: 'Actor: {value}',
    filterYearLabel: 'Year: {year}',
    filterTagLabel: 'Tag: {name}',
    drawerTitle: 'Filters',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    viewDetail: 'View details',
    watchedTag: 'Watched',
    newButton: 'New',
    emptyFiltered: 'No series found with these filters',
    emptyCatalog: 'No series in the catalog',
    clearAllFilters: 'Clear all filters',
    paginationTotal: '{from}-{to} of {total}',
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',
    favoriteError: 'Error updating favorite',
    moreInfo: '+ info',
    hideInfo: 'Hide info',
    infoSeasons: 'Seasons',
    infoEpisodes: 'Episodes',
    infoRuntime: 'Approx hours',
    infoActors: 'Actors',
    infoNoActors: 'No actors loaded',
    infoUnknown: 'Unknown',
    sortLabel: 'Sort',
    sortAZ: 'A-Z',
    sortZA: 'Z-A',
    sortYearNew: 'Newest first',
    sortYearOld: 'Oldest first',
    sortRatingDesc: 'Best rated',
  },
  landing: {
    subtitle: 'Your personal BL series catalog and more.',
    exploreCatalog: 'Explore Catalog',
    signIn: 'Sign In',
    description:
      'A space dedicated to BL, GL and Asian dramas. Track what you are watching, rate your favorites and share your thoughts.',
    goToProfile: 'My Profile',
    statSeries: 'series in catalog',
    statViews: 'times watched',
    statComments: 'comments',
    featuresTitle: 'What can you do?',
    featureCatalogTitle: 'Full catalog',
    featureCatalogDesc:
      'Browse hundreds of series organized by genre, country, year and content type.',
    featureRatingsTitle: 'Category ratings',
    featureRatingsDesc:
      'Rate each series on plot, acting, OST and more. Keep your own personal score.',
    featureTrackingTitle: 'Episode tracking',
    featureTrackingDesc:
      'Log your progress episode by episode. Always know where you left off.',
    featureCommentsTitle: 'Comments & reviews',
    featureCommentsDesc:
      'Leave your thoughts on a series, season or episode. Publish publicly or keep it private.',
    featureFavoritesTitle: 'Favorites',
    featureFavoritesDesc:
      'Build your favorites list to come back to your most loved series anytime.',
    featureStatsTitle: 'Personal stats',
    featureStatsDesc:
      'Discover how many hours you have watched, your favorite genres and your activity streaks.',
    footerCtaText: 'Start exploring the catalog now.',
  },
  welcomeBanner: {
    title: 'Welcome to MundoBL',
    description:
      'This is my personal catalog of BL series I have watched, including those still airing. If you have watched any, I would love for you to leave a comment, reflection or review.',
    dismiss: 'Got it',
  },
  privacyBanner: {
    text: 'This site logs access information for security and improvement purposes. By continuing to browse, you accept our privacy policy.',
    accept: 'Got it',
  },
  header: {
    title: 'MundoBL - Series Catalog',
  },
  adminNav: {
    series: 'Series',
    seriesShort: 'Series',
    tags: 'Tags',
    tagsShort: 'Tags',
    universes: 'Universes',
    universesShort: 'Univ.',
    actors: 'Actors',
    actorsShort: 'Actor.',
    directors: 'Directors',
    directorsShort: 'Dir.',
    productionCompanies: 'Studios',
    productionCompaniesShort: 'Prod.',
    languages: 'Languages',
    languagesShort: 'Lang.',
    sites: 'Sites',
    sitesShort: 'Sites',
    content: 'Content',
    contentShort: 'Cont.',
    comments: 'Comments',
    commentsShort: 'Com.',
    info: 'Info',
    infoShort: 'Info',
    logs: 'Logs',
    logsShort: 'Logs',
    stats: 'Statistics',
    statsShort: 'Stats',
  },
  adminStats: {
    pageTitle: 'Activity Statistics',
    totalUsers: 'Registered users',
    currentlyWatching: 'Series in progress (unique)',
    completedThisWeek: 'Completed this week',
    commentsThisWeek: 'Comments this week',
    rankingWatching: 'Most watching now',
    rankingCompleted: 'Most completed',
    rankingFavorited: 'Most favorited',
    rankingCommented: 'Most commented',
    rankingRated: 'Best rated by users',
    activeUsers: 'Active users (last 30 days)',
    badgeWatching: '{n} watching',
    badgeCompleted: '{n} completed',
    badgeFavorited: '{n} favs',
    badgeCommented: '{n} comments',
  },
  adminTable: {
    searchPlaceholder: 'Search by title, country or type...',
    resultCount: '{n} of {total} series',
    deleteConfirmTitle: 'Are you sure?',
    deleteConfirmContent:
      'Do you want to delete "{title}"? This action cannot be undone.',
    deleteConfirmOk: 'Yes, delete',
    deleteConfirmCancel: 'Cancel',
    deleteSuccess: 'Series deleted successfully',
    deleteError: 'Error deleting series',
    columnTitle: 'Title',
    columnCountry: 'Country',
    columnType: 'Type',
    columnSeasons: 'Seasons',
    columnEpisodes: 'Episodes',
    columnYear: 'Year',
    columnStatus: 'Status',
    columnActions: 'Actions',
    paginationTotal: '{from}-{to} of {total} series',
  },
  editSerieModal: {
    title: 'Edit Series',
    save: 'Save',
    cancel: 'Cancel',
    loadError: 'Error loading series data',
    updateSuccess: 'Series updated successfully',
    updateError: 'Error updating series',
    fieldTitle: 'Title',
    requiredTitle: 'Title is required',
    fieldOriginalTitle: 'Original Title',
    fieldImageUrl: 'Image URL',
    fieldYear: 'Year',
    fieldType: 'Type',
    requiredType: 'Type is required',
    fieldCountry: 'Country of Origin',
    fieldRating: 'Overall Rating',
    fieldBasedOn: 'Based on',
    fieldFormat: 'Screen Format',
    requiredFormat: 'Select a format',
    fieldSynopsis: 'Synopsis',
    fieldReview: 'Personal Review',
    fieldSoundtrack: 'Soundtrack',
    fieldObservations: 'Observations',
    placeholderTitle: 'Series title',
    placeholderOriginalTitle: 'Original title (optional)',
    placeholderImageUrl: 'Cover image URL',
    placeholderYear: 'Release year',
    placeholderType: 'Select type',
    placeholderCountry: 'Select country',
    placeholderRating: 'Rating (1-10)',
    placeholderBasedOn: 'Select if based on something',
    placeholderSynopsis: 'Series synopsis...',
    placeholderReview: 'Your personal review, opinion, critique...',
    placeholderSoundtrack: 'Soundtrack information',
    placeholderObservations: 'Observations, comments, personal notes...',
    typeOption_serie: 'Series',
    typeOption_pelicula: 'Movie',
    typeOption_corto: 'Short',
    typeOption_especial: 'Special',
    basedOnLibro: '📖 Book',
    basedOnNovela: '📚 Novel',
    basedOnCorto: '📄 Short Story',
    basedOnManga: '🎌 Manga',
    basedOnAnime: '🎨 Anime',
    formatRegular: '📱 Regular (Horizontal)',
    formatVertical: '📲 Vertical (Mobile)',
  },
  tagPage: {
    titleCountSingular: '1 title',
    titleCountPlural: '{n} titles',
    seriesWithTag: 'Series with this tag ({n})',
    empty: 'No series with this tag',
  },
  contenidoPage: {
    pageTitle: 'Content',
    subtitle: 'Trailers, OSTs, interviews and more from official platforms',
    filterPlatform: 'Platform',
    filterCategory: 'Category',
    filterChannel: 'Channel / Source',
    emptyNoContent: 'No content available yet',
    emptyFiltered: 'No content with these filters',
    playButton: 'Watch',
    unofficialTag: 'Unofficial',
    modalSource: 'Source: {platform}',
    modalViewOn: 'Watch on {platform}',
    modalRelatedSeries: 'Related series:',
  },
  feedback: {
    pageTitle: 'Feedback',
    tabRequests: 'Ideas & Bugs',
    tabChangelog: 'Changelog',
    activeCount: '{n} active requests',
    newRequest: 'New request',
    emptyRequests: 'No active requests',
    emptyChangelog: 'No changes recorded',
    completedSection: 'Completed requests',
    currentVersion: 'Current version: {version}',
    deleteButton: 'Delete',
    createButton: 'Create',
    formTitle: 'New request',
    formFieldType: 'Type',
    formFieldTitle: 'Title',
    formFieldDescription: 'Description',
    formDescriptionPlaceholder:
      'Write your description... You can paste images from clipboard (Ctrl+V)',
    formDescriptionHint: 'Paste images from clipboard in the description',
    formRequiredType: 'Select a type',
    formRequiredTitle: 'Enter a title',
    statusPendiente: 'Pending',
    statusEnProgreso: 'In progress',
    statusCompletado: 'Completed',
    statusDescartado: 'Discarded',
    typeBug: 'Bug',
    typeFeature: 'Feature',
    typeIdea: 'Idea',
    successCreated: 'Request created',
    successStatusUpdated: 'Status updated',
    successDeleted: 'Request deleted',
    errorCreate: 'Error creating request',
    errorVote: 'Error voting',
    errorStatusUpdate: 'Error updating status',
    errorDelete: 'Error deleting',
    errorUpload: 'Error uploading image',
  },
  notFound: {
    description: 'The page you are looking for does not exist or was moved.',
    backLink: 'Back to catalog',
  },
};

const it: TranslationShape = {
  ...en,
  common: { ...en.common, language: 'Lingua' },
};

const de: TranslationShape = {
  ...en,
  common: { ...en.common, language: 'Sprache' },
};

const fr: TranslationShape = {
  ...en,
  common: { ...en.common, language: 'Langue' },
};

const ja: TranslationShape = {
  ...en,
  common: { ...en.common, language: '言語' },
};

const ko: TranslationShape = {
  ...en,
  common: { ...en.common, language: '언어' },
};

const zhCN: TranslationShape = {
  ...en,
  common: { ...en.common, language: '语言' },
};

const zhTW: TranslationShape = {
  ...en,
  common: { ...en.common, language: '語言' },
};

const th: TranslationShape = {
  ...en,
  common: { ...en.common, language: 'ภาษา' },
};

export const MESSAGES: Record<SupportedLocale, TranslationShape> = {
  es,
  en,
  it,
  de,
  fr,
  ja,
  ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  th,
};

type Join<K extends string, P extends string> = `${K}.${P}`;

type Leaves<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : Join<K, Leaves<T[K]>>;
    }[keyof T & string];

export type TranslationKey = Leaves<TranslationShape>;
