// Central Dynamic Portal Navigation & Category Hierarchy for watv.org style multi-level portal

export const DEFAULT_PORTAL_STRUCTURE = [
  {
    categorySlug: 'home',
    titleEn: 'Home',
    titleTe: 'హోమ్',
    descriptionEn: 'Central assembly announcements, event highlights, and ministry schedule.',
    descriptionTe: 'కేంద్ర సమాఖ్య నూతన తాజా సమాచారం, సంఘ విశేషాలు మరియు సమయ పట్టిక.',
    iconName: 'Home',
    pages: [
      {
        pageSlug: 'new-updates',
        titleEn: 'New Updates',
        titleTe: 'నూతన తాజా సమాచారం',
        descEn: 'Official pastoral updates, general assembly notifications, and urgent communications.',
        descTe: 'అధికారిక సంఘ సమాచారం, ప్రాంతీయ ప్రకటనలు మరియు ముఖ్యమైన తాజా వివరాలు.',
        iconName: 'Bell',
      },
      {
        pageSlug: 'events',
        titleEn: 'Events',
        titleTe: 'కార్యక్రమాలు & విశేషాలు',
        descEn: 'Upcoming spiritual conferences, assembly gatherings, choir workshops, and seminars.',
        descTe: 'రాబోవు ఆత్మీయ సదస్సులు, పండుగల సమావేశాలు మరియు ప్రత్యేక కార్యక్రమాలు.',
        iconName: 'Calendar',
      },
      {
        pageSlug: 'schedule',
        titleEn: 'Schedule',
        titleTe: 'సమయ పట్టిక',
        descEn: 'Weekly worship timetable, prayer watch hours, and sacred assembly calendar.',
        descTe: 'వారంవారీ ఆరాధనల సమయాలు, ప్రార్థనా సమయ పట్టిక మరియు కూటముల వివరాలు.',
        iconName: 'Clock',
      },
    ],
  },
  {
    categorySlug: 'worship',
    titleEn: 'Worship',
    titleTe: 'ఆరాధన',
    descriptionEn: 'Sacred worship orders, reverence prayers, new songs, and solemn feast observances.',
    descriptionTe: 'పవిత్ర ఆరాధనా క్రమములు, స్తుతి గీతాలు, ప్రసంగాలు మరియు పండుగల ఆచరణ.',
    iconName: 'Flame',
    pages: [
      {
        pageSlug: 'orders',
        titleEn: 'Orders',
        titleTe: 'ఆరాధన క్రమములు',
        descEn: 'Reverent service liturgies, Sabbath worship procedures, and altar conduct.',
        descTe: 'పవిత్ర ఆరాధనా విధి విధానాలు, విశ్రాంతి దిన ప్రార్థనా క్రమములు.',
        iconName: 'Scroll',
      },
      {
        pageSlug: 'prayers',
        titleEn: 'Prayers',
        titleTe: 'ప్రార్థనలు',
        descEn: 'Sacred prayer guidelines, daily intercessions, and feast prayer petitions.',
        descTe: 'దైవిక ప్రార్థనా మార్గదర్శకాలు, విజ్ఞాపనలు మరియు స్తుతి ప్రార్థనలు.',
        iconName: 'HeartHandshake',
      },
      {
        pageSlug: 'new-songs',
        titleEn: 'New Songs',
        titleTe: 'నూతన కీర్తనలు',
        descEn: 'The New Songs praise collection, lyrics, choral scores, and reverent audio.',
        descTe: 'నూతన కీర్తనల సాహిత్యం, ఆరాధనా స్తుతి గీతాలు మరియు గానబృంద స్వరాలు.',
        iconName: 'Music',
      },
      {
        pageSlug: 'sermons',
        titleEn: 'Sermons',
        titleTe: 'ఉపదేశ ప్రసంగాలు',
        descEn: 'Recorded sermons, pastoral teachings, and video homilies from worldwide assemblies.',
        descTe: 'జీవవాక్య ఉపదేశాలు, విశ్వాస బోధలు మరియు సత్యవాక్య ప్రసంగాల సంకలనం.',
        iconName: 'Tv',
      },
      {
        pageSlug: 'yearly-feasts',
        titleEn: 'Yearly Feasts',
        titleTe: 'వార్షిక పండుగలు',
        descEn: 'The 7 Feasts in 3 Times: Passover, Unleavened Bread, Firstfruits, Pentecost, Trumpets, Atonement, Tabernacles.',
        descTe: 'మూడు పర్యాయముల ఏడు పండుగలు: పస్కా, పులియని రొట్టెల పండుగ, ప్రథమఫలములు, పెంతెకొస్తు, బూరల పండుగ, ప్రాయశ్చిత్తార్థ దినము, పర్ణశాలల పండుగ.',
        iconName: 'Sparkles',
      },
      {
        pageSlug: 'weekly-feasts',
        titleEn: 'Weekly Feasts',
        titleTe: 'వారపు పండుగలు (విశ్రాంతి దినము)',
        descEn: 'The Seventh-day Sabbath: Memorial of the Creator God, holy convocations, and blessings.',
        descTe: 'సృష్టికర్త అయిన దేవుని జ్ఞాపకార్థ దినమైన ఏడవ దిన విశ్రాంతి దిన పవిత్ర ఆరాధన.',
        iconName: 'SunMedium',
      },
    ],
  },
  {
    categorySlug: 'bible-truth',
    titleEn: 'Bible & Truth',
    titleTe: 'బైబిల్ & సత్యం',
    descriptionEn: 'Theological doctrines, biblical prophecies, New Covenant mysteries, and reading plans.',
    descriptionTe: 'లేఖనముల సత్య సిద్ధాంతములు, బైబిల్ ప్రవచనములు మరియు నూతన నిబంధన మర్మములు.',
    iconName: 'BookOpen',
    pages: [
      {
        pageSlug: 'sermon-preaching-book',
        titleEn: 'Sermon Preaching Book',
        titleTe: 'సువార్త ప్రకటనా గ్రంథం',
        descEn: 'Comprehensive topical scripture references and evangelism outlines for gospel workers.',
        descTe: 'సువార్త ప్రకటనా గ్రంథ వాక్యములు, ఉపదేశ సారాంశం మరియు లేఖన సూచిక.',
        iconName: 'BookMarked',
      },
      {
        pageSlug: 'misunderstanding-truth',
        titleEn: 'Misunderstanding & Truth',
        titleTe: 'అపార్థం & సత్యం',
        descEn: 'Clarifying common theological misconceptions with biblical textual proof.',
        descTe: 'క్రైస్తవ లోకంలో బైబిల్ గురించిన అపార్థాలు మరియు వాస్తవ బైబిల్ సత్యములు.',
        iconName: 'HelpCircle',
      },
      {
        pageSlug: 'father',
        titleEn: 'Father',
        titleTe: 'పరలోకపు తండ్రి',
        descEn: 'The mystery of the Holy Spirit, prophecies of the Spirit, and the Savior in the age of the Holy Spirit.',
        descTe: 'పరిశుద్ధాత్మ దేవుని మర్మము, పరిశుద్ధాత్మ యుగపు రక్షకుని ప్రవచనములు.',
        iconName: 'Crown',
      },
      {
        pageSlug: 'mother',
        titleEn: 'Mother',
        titleTe: 'పరలోకపు తల్లి',
        descEn: 'The Bride, the Heavenly Jerusalem, God the Mother testified from Genesis to Revelation.',
        descTe: 'ఆదికాండము నుండి ప్రకటన వరకు లేఖనములలో సాక్ష్యమివ్వబడిన పరలోకపు యెరూషలేము తల్లి.',
        iconName: 'Heart',
      },
      {
        pageSlug: 'stories',
        titleEn: 'Stories',
        titleTe: 'బైబిల్ కథలు & చరిత్ర',
        descEn: 'Heroes of faith: Noah, Abraham, Moses, David, the Apostles, and lessons of obedience.',
        descTe: 'విశ్వాస వీరుల చరిత్రలు, విధేయత యొక్క మాదిరులు మరియు ఆత్మీయ గుణపాఠాలు.',
        iconName: 'Library',
      },
      {
        pageSlug: 'self-study',
        titleEn: 'Self Study',
        titleTe: 'స్వయం అధ్యయనం',
        descEn: 'Personal scripture reflection modules, doctrinal worksheets, and verse mastery.',
        descTe: 'వ్యక్తిగత లేఖన పరిశీలనా పద్ధతులు, వాక్య ధ్యానములు మరియు నోట్స్.',
        iconName: 'GraduationCap',
      },
      {
        pageSlug: 'reading-plan',
        titleEn: 'Reading Plan',
        titleTe: 'బైబిల్ పఠన ప్రణాళిక',
        descEn: 'Structured 1-year and 90-day chronological Bible reading tracks and trackers.',
        descTe: 'సంవత్సరంలో పూర్తి బైబిల్ చదివే క్రమబద్ధమైన దినచర్య పట్టిక.',
        iconName: 'CheckSquare',
      },
    ],
  },
  {
    categorySlug: 'family',
    titleEn: 'Family',
    titleTe: 'ఆత్మీయ కుటుంబం',
    descriptionEn: 'The Mother’s Teaching: loving care, visitation, brotherly unity, and warm fellowship.',
    descriptionTe: 'తల్లి బోధలు: ప్రేమ, సంరక్షణ, సహోదర ఐక్యత మరియు పరిశుద్ధ కుటుంబ సహవాసం.',
    iconName: 'Users',
    pages: [
      {
        pageSlug: 'care',
        titleEn: 'Care',
        titleTe: 'ఆత్మీయ సంరక్షణ',
        descEn: 'Nurturing new souls, spiritual mentoring, and pastoral compassion.',
        descTe: 'నూతన విశ్వాసుల పోషణ, ఆత్మీయ సంరక్షణ మరియు సహోదర ప్రేమ.',
        iconName: 'ShieldAlert',
      },
      {
        pageSlug: 'visit',
        titleEn: 'Visit',
        titleTe: 'సందర్శనలు',
        descEn: 'Encouragement visitations, fellowship calls, and building up one another.',
        descTe: 'గృహ సందర్శనలు, ఆదరణ మాటలు మరియు విశ్వాసంలో బలపరచుట.',
        iconName: 'DoorOpen',
      },
      {
        pageSlug: 'love',
        titleEn: 'Love',
        titleTe: 'దేవుని ప్రేమ',
        descEn: 'God is Love: living out sacrifice, consideration, patience, and tenderness.',
        descTe: 'దేవుని నిజమైన ప్రేమ, త్యాగం, ఓర్పు మరియు ఒకరినొకరు క్షమించుకొనుట.',
        iconName: 'HeartHandshake',
      },
      {
        pageSlug: 'sharing',
        titleEn: 'Sharing',
        titleTe: 'పంచుకోవడం & సహవాసం',
        descEn: 'Sharing spiritual testimonies, grace stories, and blessings of the kingdom.',
        descTe: 'దేవుని కృప సాక్ష్యాలు, ఆత్మీయ అనుభవాలు మరియు దీవెనల పంపకం.',
        iconName: 'Share2',
      },
      {
        pageSlug: 'support',
        titleEn: 'Support',
        titleTe: 'సహాయం & మద్దతు',
        descEn: 'Mutual aid in trials, prayer partnerships, and institutional welfare.',
        descTe: 'కష్టకాలంలో పరస్పర ఆదరణ, ప్రార్థనా సహకారం మరియు ఆత్మీయ చేయూత.',
        iconName: 'LifeBuoy',
      },
      {
        pageSlug: 'unity',
        titleEn: 'Unity',
        titleTe: 'ఐక్యత',
        descEn: 'How good and pleasant it is when God’s people live together in unity.',
        descTe: 'సహోదరులు ఐక్యత కలిగి నివసించుట ఎంత మేలు ఎంత మనోహరము.',
        iconName: 'Network',
      },
      {
        pageSlug: 'example',
        titleEn: 'Example',
        titleTe: 'మాదిరికరమైన జీవితం',
        descEn: 'Christ is our Example: servant leadership, humility, and graceful speech.',
        descTe: 'క్రీస్తు మాదిరి: పరిచారక మనస్సు, వినయం మరియు ఉప్పు వేసినట్లుగా మాట్లాడటం.',
        iconName: 'Award',
      },
    ],
  },
  {
    categorySlug: 'grow',
    titleEn: 'Grow',
    titleTe: 'ఆత్మీయ ఎదుగుదల',
    descriptionEn: 'Interactive quizzes, doctrinal surveys, language education, and educational videos.',
    descriptionTe: 'బైబిల్ క్విజ్, సర్వేలు, భాషా అధ్యయనం మరియు ఆత్మీయ శిక్షణా సాధనాలు.',
    iconName: 'TrendingUp',
    pages: [
      {
        pageSlug: 'quiz',
        titleEn: 'Quiz',
        titleTe: 'బైబిల్ క్విజ్',
        descEn: 'Interactive Bible truth quizzes, feast trivia, and knowledge challenges.',
        descTe: 'వాక్య జ్ఞానాన్ని పరీక్షించే బైబిల్ క్విజ్ మరియు ఆత్మీయ ప్రశ్నలు.',
        iconName: 'HelpCircle',
      },
      {
        pageSlug: 'survey',
        titleEn: 'Survey',
        titleTe: 'సర్వే & అభిప్రాయాలు',
        descEn: 'Fellowship feedback surveys, assembly questionnaires, and growth polls.',
        descTe: 'సభ్యుల అవసరాల గుర్తింపు, ఆత్మీయ సర్వేలు మరియు సూచనలు.',
        iconName: 'ClipboardList',
      },
      {
        pageSlug: 'language',
        titleEn: 'Language',
        titleTe: 'భాషా జ్ఞానం & అధ్యయనం',
        descEn: 'Biblical Hebrew, Greek terms, and global language study for worldwide evangelism.',
        descTe: 'హీబ్రూ, గ్రీకు పదాల వివరణ మరియు సువార్త ప్రకటనా భాషా పాఠాలు.',
        iconName: 'Languages',
      },
      {
        pageSlug: 'game-zone',
        titleEn: 'Game Zone',
        titleTe: 'ఆత్మీయ గేమ్ జోన్',
        descEn: 'Educational scripture word games, memory verse puzzles, and youth challenges.',
        descTe: 'లేఖనాల పద శోధనలు, బైబిల్ పజిల్స్ మరియు ఆత్మీయ ఆటలు.',
        iconName: 'Gamepad2',
      },
      {
        pageSlug: 'videos',
        titleEn: 'Videos',
        titleTe: 'ఎడ్యుకేషనల్ వీడియోలు',
        descEn: 'High-definition video library, animations, conference archives, and sermon media.',
        descTe: 'ఆత్మీయ విశేషాలు, ఉపదేశ ప్రసంగాలు మరియు విద్యా వీడియోల లైబ్రరీ.',
        iconName: 'Film',
      },
      {
        pageSlug: 'self-management',
        titleEn: 'Self Management',
        titleTe: 'స్వీయ క్రమశిక్షణ & నిర్వహణ',
        descEn: 'Time management in faith, prayer routines, and spiritual goal checklists.',
        descTe: 'సమయ పాలన, దినచర్య క్రమశిక్షణ మరియు విశ్వాస లక్ష్యాల సాధన.',
        iconName: 'Target',
      },
    ],
  },
  {
    categorySlug: 'go-come',
    titleEn: 'Go & Come',
    titleTe: 'సువార్త సేవ & గమ్యం',
    descriptionEn: 'Evangelism channels, global mission media, Elohist magazine, and truth archives.',
    descriptionTe: 'సువార్త ప్రసార మాధ్యమాలు, గ్లోబల్ మిషన్, ఎలోహిస్ట్ మరియు ఆత్మ రక్షణ సేవ.',
    iconName: 'Compass',
    pages: [
      {
        pageSlug: 'youtube',
        titleEn: 'Youtube',
        titleTe: 'యూట్యూబ్ ఛానెల్స్',
        descEn: 'Official video streams, hymn praise broadcasts, and global sermon channels.',
        descTe: 'అధికారిక యూట్యూబ్ ప్రసారాలు, ప్రసంగాలు మరియు స్తుతి గీతాలు.',
        iconName: 'PlayCircle',
      },
      {
        pageSlug: 'wiki',
        titleEn: 'Wiki',
        titleTe: 'సత్య జ్ఞాన విజ్ఞానకోశం',
        descEn: 'Encyclopedic documentation of biblical history, archeology, and truth prophecies.',
        descTe: 'చారిత్రక ఆధారాలు, పురాతత్వ వాస్తవాలు మరియు బైబిల్ విజ్ఞానకోశం.',
        iconName: 'Book',
      },
      {
        pageSlug: 'watv',
        titleEn: 'WATV',
        titleTe: 'WATV అధికారిక పోర్టల్',
        descEn: 'Direct access to the global headquarters portal: watv.org news and media.',
        descTe: 'ప్రధాన ప్రధాన కార్యాలయ అంతర్జాతీయ అధికారిక పోర్టల్ watv.org.',
        iconName: 'Globe',
      },
      {
        pageSlug: 'father-go',
        titleEn: 'Father',
        titleTe: 'తండ్రి దేవుని సువార్త',
        descEn: 'Proclaiming the glory and sacrifice of Christ Ahnsahnghong to the ends of the earth.',
        descTe: 'భూదిగంతముల వరకు తండ్రి దేవుని నామ మహిమను ప్రకటించుట.',
        iconName: 'Crown',
      },
      {
        pageSlug: 'mother-go',
        titleEn: 'Mother',
        titleTe: 'తల్లి దేవుని సువార్త',
        descEn: 'Let anyone who is thirsty come: Proclaiming the Spirit and the Bride who give the Water of Life.',
        descTe: 'జీవజలమిచ్చు ఆత్మయు పెండ్లికుమార్తెయైన తల్లి దేవుని ప్రేమను ప్రకటించుట.',
        iconName: 'Sparkle',
      },
      {
        pageSlug: 'elohist',
        titleEn: 'Elohist',
        titleTe: 'ఎలోహిస్ట్ మాసపత్రిక',
        descEn: 'The Elohist monthly publication of gospel articles, poetry, and faith columns.',
        descTe: 'ప్రతి నెలా వెలువడే ఎలోహిస్ట్ మాసపత్రిక సంచికలు మరియు ఆత్మీయ లేఖనాలు.',
        iconName: 'FileText',
      },
      {
        pageSlug: 'soul',
        titleEn: 'Soul',
        titleTe: 'ఆత్మ రక్షణ',
        descEn: 'Where do we come from, why are we here, and where are we going? The origin of the soul.',
        descTe: 'ఆత్మల జన్మస్థలం, మానవ జన్మ ఉద్దేశం మరియు పరలోక నిత్యజీవ మార్గము.',
        iconName: 'Feather',
      },
      {
        pageSlug: 'other',
        titleEn: 'Other',
        titleTe: 'ఇతర విశేషాలు',
        descEn: 'Supplementary evangelism resources, foreign mission guidelines, and materials.',
        descTe: 'విదేశీ సువార్త ప్రయాణాలు, అదనపు వనరులు మరియు సహాయక సమాచారం.',
        iconName: 'MoreHorizontal',
      },
    ],
  },
  {
    categorySlug: 'program',
    titleEn: 'Program',
    titleTe: 'కార్యక్రమాలు',
    descriptionEn: 'Prophetic gospel programs: Stars, Count evaluations, and Gospel Diary tracking.',
    descriptionTe: 'సువార్త ప్రణాళికలు: నక్షత్రాల కార్యక్రమం, కౌంట్ మరియు ఆత్మీయ డైరీ నిర్వహణ.',
    iconName: 'Layers',
    pages: [
      {
        pageSlug: 'stars',
        titleEn: 'Stars',
        titleTe: 'ఆకాశ నక్షత్రాల కార్యక్రమం',
        descEn: 'Those who lead many to righteousness will shine like the stars forever and ever.',
        descTe: 'అనేకులను నీతి మార్గమున నడిపించువారు ఆకాశ జ్యోతులవలె సదాకాలము ప్రకాశింతురు.',
        iconName: 'Star',
      },
      {
        pageSlug: 'count',
        titleEn: 'Count',
        titleTe: 'లెక్కింపు విభాగం',
        descEn: 'Statistical tracking of gospel milestones, attendance metrics, and feast tallies.',
        descTe: 'సభ్యుల హాజరు, పండుగల లెక్కింపు మరియు ప్రాంతీయ పురోగతి వివరాలు.',
        iconName: 'BarChart2',
      },
      {
        pageSlug: 'diary',
        titleEn: 'Diary',
        titleTe: 'సువార్త డైరీ',
        descEn: 'Interactive Gospel Diary: prayer journaling, preaching records, and soul reflections.',
        descTe: 'దైనందిన ఆత్మీయ ప్రార్థనలు, సువార్త పర్యటనలు మరియు వ్యక్తిగత డైరీ.',
        iconName: 'BookOpen',
      },
    ],
  },
  {
    categorySlug: 'more',
    titleEn: 'More',
    titleTe: 'మరిన్ని విభాగాలు',
    descriptionEn: 'Central repository for ministerial files, proposal idea bank, and institutional store.',
    descriptionTe: 'కేంద్ర పత్రాల భాండాగారం, నూతన సలహాలు & ఆలోచనలు మరియు పుస్తక విభాగం.',
    iconName: 'Grid',
    pages: [
      {
        pageSlug: 'files',
        titleEn: 'Files',
        titleTe: 'ముఖ్యమైన పత్రాలు & ఫైల్స్',
        descEn: 'Downloadable templates, assembly forms, circulars, and official publication PDFs.',
        descTe: 'డౌన్‌లోడ్ చేసుకోదగిన ముఖ్యమైన సర్క్యులర్లు, నమూనా పత్రాలు మరియు డాక్యుమెంట్లు.',
        iconName: 'FolderArchive',
      },
      {
        pageSlug: 'new-idea',
        titleEn: 'New Idea',
        titleTe: 'నూతన ఆలోచనలు & సూచనలు',
        descEn: 'Member proposal hub: submit innovative initiatives for church welfare and technology.',
        descTe: 'సంఘ అభివృద్ధి కొరకు నూతన సలహాలు, సాంకేతిక ఆలోచనలు పంచుకునే వేదిక.',
        iconName: 'Lightbulb',
      },
      {
        pageSlug: 'store',
        titleEn: 'Store',
        titleTe: 'ఆత్మీయ భాండాగారం / స్టోర్',
        descEn: 'Hymn books, bible covers, choir attire, study guides, and sacred feast accessories.',
        descTe: 'కీర్తనల పుస్తకాలు, బైబిల్ కవర్లు, గానబృంద వస్త్రాలు మరియు పవిత్ర పండుగల సామగ్రి.',
        iconName: 'ShoppingBag',
      },
    ],
  },
];

/**
 * Merge default portal structure with any custom pages added to Firestore `portal_pages`
 */
export function mergePortalStructure(customPagesFromFirestore = []) {
  // Deep clone default structure
  const structure = JSON.parse(JSON.stringify(DEFAULT_PORTAL_STRUCTURE));

  if (!customPagesFromFirestore || customPagesFromFirestore.length === 0) {
    return structure;
  }

  for (const customPage of customPagesFromFirestore) {
    const catSlug = (customPage.categorySlug || 'more').toLowerCase();
    let cat = structure.find((c) => c.categorySlug === catSlug);

    if (!cat) {
      // If admin created a brand new custom category
      cat = {
        categorySlug: catSlug,
        titleEn: customPage.categoryTitleEn || catSlug.toUpperCase(),
        titleTe: customPage.categoryTitleTe || customPage.categoryTitleEn || catSlug,
        descriptionEn: customPage.categoryDescEn || '',
        descriptionTe: customPage.categoryDescTe || '',
        iconName: customPage.iconName || 'Folder',
        pages: [],
      };
      structure.push(cat);
    }

    const existingPageIdx = cat.pages.findIndex((p) => p.pageSlug === customPage.pageSlug);
    if (existingPageIdx >= 0) {
      cat.pages[existingPageIdx] = { ...cat.pages[existingPageIdx], ...customPage };
    } else {
      cat.pages.push({
        id: customPage.id,
        pageSlug: customPage.pageSlug,
        titleEn: customPage.titleEn,
        titleTe: customPage.titleTe,
        descEn: customPage.descEn || '',
        descTe: customPage.descTe || '',
        iconName: customPage.iconName || 'FileText',
        externalUrl: customPage.externalUrl || null,
        isCustom: true,
      });
    }
  }

  return structure;
}

/**
 * Lookup Category and Page definition by categorySlug and pageSlug
 */
export function findPageInfo(portalStructure, categorySlug, pageSlug) {
  const cat = portalStructure.find(
    (c) => c.categorySlug.toLowerCase() === (categorySlug || '').toLowerCase()
  );
  if (!cat) return { category: null, page: null };

  const page = cat.pages.find(
    (p) => p.pageSlug.toLowerCase() === (pageSlug || '').toLowerCase()
  );
  return { category: cat, page: page || null };
}
