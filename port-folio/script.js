/* ============================================================
   Portfolio interactions — static rebuild of the Flutter app.
   Data mirrors lib/core/data/portfolio_data.dart
   ============================================================ */

// ---------- Small helpers ----------
const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
};
const icon = (id) => `<svg class="icon"><use href="#${id}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Data ----------
const skillCategories = [
  { title: 'Languages', icon: 'i-code', skills: ['Dart', 'Swift', 'Kotlin', 'Java', 'C++'] },
  { title: 'Frameworks & SDKs', icon: 'i-layers', skills: ['Flutter', 'Firebase'] },
  { title: 'Backend & APIs', icon: 'i-cloud', skills: ['REST APIs', 'Firebase', 'Cloud Firestore', 'Google Drive API'] },
  { title: 'State Management', icon: 'i-branch', skills: ['Riverpod', 'Bloc', 'Provider', 'ValueNotifier'] },
  { title: 'Databases', icon: 'i-database', skills: ['SQLite', 'Hive', 'Cloud Firestore'] },
  { title: 'Tools', icon: 'i-tool', skills: ['Git', 'Android Studio', 'Xcode', 'VS Code', 'Figma'] },
  { title: 'Platforms', icon: 'i-smartphone', skills: ['Android', 'iOS', 'Web'] },
];

const contactMethods = [
  { label: 'Email', value: 'dipendrabogati1776@gmail.com', icon: 'i-mail', url: 'mailto:dipendrabogati1776@gmail.com' },
  { label: 'Phone', value: '+91 9057241670', icon: 'i-phone', url: 'https://wa.me/919057241670' },
  { label: 'LinkedIn', value: 'linkedin.com/in/dipendrabogati', icon: 'i-briefcase', url: 'https://www.linkedin.com/in/dipendrabogati/' },
  { label: 'GitHub', value: 'github.com/Dipendrabogati', icon: 'i-code', url: 'https://github.com/Dipendrabogati' },
  { label: 'Location', value: 'Jodhpur, India · Doti, Nepal', icon: 'i-map-pin', url: null },
];

const projects = [
  {
    name: 'PaathBook Bhasa', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-book', featured: true,
    description: 'A reading-first language learning product designed around stories, vocabulary, conversation practice, and contextual discovery instead of quiz-heavy lessons.',
    technologies: ['Flutter', 'Riverpod', 'Localization', 'Offline Dictionary', 'AI Fallback'],
    responsibilities: ['Designed the Flutter application structure for a personal product in active development.', 'Built the foundation for reading, vocabulary, stories, and conversation-focused learning flows.', 'Planned offline-first dictionary behavior, word normalization, localization, and gamified progress.'],
    features: ['Reading-first language acquisition experience', 'Multi-language learning support', 'Offline dictionary with normalized word lookup', 'AI-assisted dictionary fallback', 'Vocabulary, stories, conversations, and gamification'],
    contributionLabel: 'Solely developed', ownershipLabel: 'Personal Product',
    screenshots: ['assets/bhasa/bhasa_home.jpg', 'assets/bhasa/bhasa_dictionary.jpg', 'assets/bhasa/bhasa_game_home.jpg', 'assets/bhasa/bhasa_levels.jpg', 'assets/bhasa/bhasa_sheet.jpg'],
  },
  {
    name: 'Khoj Samachar', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-file',
    description: 'A modern news application for verified breaking updates, Nepal-focused reporting, global affairs, sports, business, politics, and analysis in a fast mobile experience.',
    downloads: '250K+', reviews: '13.2k', ratings: '4.9',
    technologies: ['Flutter', 'Dart', 'News Feed', 'Push Notifications', 'Method Channels', 'Native Android', 'Content Platform'],
    responsibilities: ['Solely developed the Flutter mobile application for Android and iOS release.', 'Wrote native Android code for a home-screen widget that displays calendar event details and refreshes automatically every day at 00:01.', 'Built a custom native notification view for a persistent, non-dismissible notification experience.', 'Handled notification scheduling through Flutter method channels without relying on a notification package.'],
    features: ['Verified breaking news and Nepal news coverage', 'International news, politics, business, diplomacy, and global affairs', 'Sports updates and in-depth analysis', 'Fast mobile-first reading interface', 'Android and iOS availability'],
    contributionLabel: 'Solely developed',
    screenshots: ['assets/khoj_samachar/home.jpg', 'assets/khoj_samachar/calendar.jpg', 'assets/khoj_samachar/expense.jpg', 'assets/khoj_samachar/videos.jpg'],
    appStoreUrl: 'https://apps.apple.com/app/id6741786030', googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.roshan.shrestha.roshan',
  },
  {
    name: 'WikiBG', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-file',
    description: 'A verification-first biography and documentation app that brings editorially reviewed WikiBG content into a clean mobile reading experience.',
    downloads: '3K+',
    technologies: ['Flutter', 'Dart', 'Content Platform', 'Editorial Workflow', 'Web Integration'],
    responsibilities: ['Solely developed the mobile app experience connected to the official WikiBG platform.', 'Presented reviewed biography and documentation content in a mobile-friendly format.', 'Focused on clarity, navigation, and trustworthy content consumption across platforms.'],
    features: ['Verification-first biography content', 'Editorially reviewed documentation', 'Official website integration', 'Mobile-friendly reading experience', 'Android and iOS availability'],
    contributionLabel: 'Solely developed',
    screenshots: ['assets/wiki_bg/featured.jpg', 'assets/wiki_bg/tools.jpg'],
    appStoreUrl: 'https://apps.apple.com/app/id6759668747', googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.wikibg.app',
  },
  {
    name: 'PaathBook', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-graduation',
    description: 'A privacy-focused educational app for Nepali GK, grammar, quizzes, bilingual learning, and lightweight PDF utilities for students and self-learners.',
    downloads: '2.6K+', reviews: '56', ratings: '5.0',
    technologies: ['Flutter', 'Dart', 'Bilingual Content', 'Quiz Experience', 'PDF Tools', 'Firebase', 'SQLite', 'Method Channels'],
    responsibilities: ['Solely developed the personal Flutter product for Android and iOS release.', 'Implemented native notification scheduling through method channels without a notification package.', 'Handled notification tap events and deep-link redirection from native code back into Flutter.', 'Built a Firebase-to-local-database sync strategy where content is served from SQLite and Firebase is fetched only when new data is available.', 'Reduced backend reads and billing cost by making local data the primary source for the app experience.'],
    features: ['Nepali GK and educational content', 'GK and grammar quizzes', 'Nepali and English bilingual support', 'Clean interface with no login requirement', 'Privacy-focused learning experience', 'PDF scan, compress, edit, combine, image-to-PDF, extraction, and text tools'],
    contributionLabel: 'Solely developed', ownershipLabel: 'Personal Product',
    screenshots: ['assets/paathbook/home.jpg', 'assets/paathbook/doc_studio.jpg', 'assets/paathbook/quiz.jpg', 'assets/paathbook/samanya_gyan.jpg', 'assets/paathbook/meaning_bottom_sheet.jpeg'],
    appStoreUrl: 'https://apps.apple.com/app/id6760779307', googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.paathbook.app',
  },
  {
    name: 'EventLocal', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-calendar-check',
    description: 'A professional event networking app for conferences and corporate events, helping attendees discover schedules, connect with participants, and stay updated in real time.',
    technologies: ['Flutter', 'Dart', 'Push Notifications', 'Realtime Chat'],
    responsibilities: ['Implemented mobile event experiences for attendee access, networking, and engagement.', 'Supported real-time communication, event information, and contact exchange workflows.', 'Worked on polished Flutter screens suitable for live conference usage.'],
    features: ['Event invitations and live event information', 'Participant networking and contact exchange', 'Built-in chat and notifications', 'Speaker and exhibitor information'],
    appStoreUrl: 'https://apps.apple.com/app/id874271741', googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.event.local',
  },
  {
    name: 'The Academix', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-graduation',
    description: 'An education platform that brings institutional learning resources, virtual classrooms, attendance, assessments, and secure academic collaboration into one mobile experience.',
    technologies: ['Flutter', 'Google Meet', 'Zoom', 'Google Drive', 'Cloud Services'],
    responsibilities: ['Developed Flutter features for academic workflows across students and institutions.', 'Integrated classroom, assessment, attendance, and collaboration-oriented experiences.', 'Helped organize complex education features into a cohesive mobile interface.'],
    features: ['Course management and learning resources', 'Live classes with Google Meet and Zoom support', 'QR-based attendance', 'Online assessments', 'Google Drive integration and secure cloud infrastructure'],
    appStoreUrl: 'https://apps.apple.com/app/id6502640514',
  },
  {
    name: 'DartsKey', platform: 'Flutter', role: 'Flutter Developer', icon: 'i-target',
    description: 'An advanced darts companion app combining AI-assisted score capture, multiplayer play, performance tracking, and synchronized game experiences.',
    technologies: ['Flutter', 'AI Camera Scoring', 'Bluetooth', 'Realtime Sync', 'Subscriptions', 'In-App Purchase', 'Game Logic'],
    responsibilities: ['Implemented in-app purchase flows for premium access and monetized features.', 'Wrote core darts game logic for scoring, match flow, and gameplay rules.', 'Contributed to real-time synchronization and analytics-focused user flows.', 'Supported premium app functionality and performance-sensitive game interactions.'],
    features: ['AI camera scoring', 'Online and Bluetooth multiplayer', 'AI opponent and multiple game modes', 'Match statistics', 'Premium subscription support', 'Real-time synchronization'],
    appStoreUrl: 'https://apps.apple.com/app/id6780764437', googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.key.darts.app',
  },
  {
    name: 'Timelee', platform: 'Native iOS', role: 'iOS Developer', icon: 'i-clock',
    description: 'A native iOS productivity app for flexible reminders, task planning, calendar-aware scheduling, and smart everyday automation.',
    technologies: ['iOS', 'Swift', 'Local Notifications', 'Location Monitoring', 'Offline Sync', 'In-App Purchase'],
    responsibilities: ['Built reminder workflows using local notifications, including standard reminders and location-based reminders.', 'Implemented location monitoring to trigger reminders when users enter or exit selected locations.', 'Managed daily, weekly, and intra-day repeating reminder schedules.', 'Implemented subscription plans and one-time token purchase flows.', 'Built an offline-first local storage model with server synchronization when internet connectivity becomes available.'],
    features: ['Smart reminders and calendar synchronization', 'Medication management', 'Location-based reminders', 'Team collaboration', 'Shopping lists', 'Multiple notification methods'],
    appStoreUrl: 'https://apps.apple.com/app/id6740476818',
  },
  {
    name: 'ScanPix', platform: 'Native iOS', role: 'iOS Developer', icon: 'i-file',
    description: 'A native iOS document scanner that turns a phone into a portable capture tool for documents, IDs, passports, PDFs, and business records.',
    technologies: ['iOS', 'Swift', 'PDF', 'Edge Detection', 'Offline Sync', 'In-App Purchase'],
    responsibilities: ['Built a professional document scanner with edge detection, capture enhancement, and basic editing tools.', 'Added background removal and password-protected file handling for document workflows.', 'Implemented in-app purchase flows for premium scanner functionality.', 'Built offline-first local storage with server synchronization whenever connectivity is available.'],
    features: ['Document, ID, and passport scanning', 'Automatic scan enhancement', 'PDF generation', 'Cloud backup', 'Printing support', 'Scan templates'],
    appStoreUrl: 'https://apps.apple.com/app/id1281894975',
  },
  {
    name: 'Bender', platform: 'Native iOS', role: 'iOS Developer', icon: 'i-users',
    description: 'A native iOS social and dating app built around location-based discovery, secure communication, profiles, and travel-aware matching.',
    technologies: ['iOS', 'Swift', 'Location Services', 'Realtime Messaging'],
    responsibilities: ['Implemented in-app purchase flows for premium dating and social features.', 'Implemented native iOS social discovery and messaging workflows.', 'Built location-aware product features for search, profiles, and user interaction.', 'Supported secure communication patterns and profile management experiences.'],
    features: ['Live location and travel mode', 'Advanced search filters', 'Real-time messaging', 'Profile management', 'Media sharing', 'User verification'],
    appStoreUrl: 'https://apps.apple.com/app/id1563347365',
  },
  {
    name: 'Coaching Zone', platform: 'Native iOS', role: 'iOS Developer', icon: 'i-activity',
    description: 'A native iOS sports coaching platform that helps coaches plan training sessions with structured plans, exercise libraries, and professional video content.',
    technologies: ['iOS', 'Swift', 'Video Content', 'Team Management', 'In-App Purchase'],
    responsibilities: ['Implemented in-app purchase flows for premium coaching content and subscription access.', 'Developed native iOS features for planning, organizing, and managing coaching sessions.', 'Supported exercise-library and professional-video workflows for coach-led training.', 'Contributed to team and content-management experiences.'],
    features: ['Training plans and session organization', 'Exercise library', 'Professional coaching videos', 'Team management', 'Custom coaching content'],
    appStoreUrl: 'https://apps.apple.com/app/id1579274298',
  },
  {
    name: 'Food Dudes', platform: 'Native iOS', role: 'iOS Developer', icon: 'i-truck',
    description: 'A native iOS food delivery platform connecting restaurants and customers through discovery, ordering, menu management, and delivery tracking.',
    technologies: ['iOS', 'Swift', 'Maps', 'Payments', 'Push Notifications'],
    responsibilities: ['Developed native iOS features for ordering, restaurant discovery, and delivery flows.', 'Contributed to customer-facing marketplace screens and operational food-delivery workflows.', 'Supported multi-location ordering and tracking-oriented app behavior.'],
    features: ['Restaurant discovery', 'Online ordering', 'Menu management', 'Delivery tracking', 'Multi-location support'],
    appStoreUrl: 'https://apps.apple.com/app/id1180442819',
  },
];

// ---------- Render: Skills ----------
(function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  skillCategories.forEach((cat, i) => {
    const wrap = el('div', 'reveal');
    wrap.style.setProperty('--reveal-delay', `${65 * i}ms`);
    const tags = cat.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('');
    wrap.innerHTML = `<div class="card hover-lift"><div class="card-inner">
      <div class="skill-head">${icon(cat.icon)}<h3>${esc(cat.title)}</h3></div>
      <div class="skill-tags">${tags}</div>
    </div></div>`;
    grid.appendChild(wrap);
  });
})();

// ---------- Render: Contact ----------
(function renderContact() {
  const grid = document.getElementById('contactGrid');
  contactMethods.forEach((m) => {
    const hasUrl = !!m.url;
    const card = el('div');
    card.innerHTML = `<div class="card"><div class="card-inner contact-card">
      <div class="contact-icon">${icon(m.icon)}</div>
      <div class="contact-info">
        <div class="label">${esc(m.label)}</div>
        <div class="value ${hasUrl ? 'link' : ''}">${esc(m.value)}</div>
      </div>
      <button class="contact-copy" title="Copy" data-copy="${esc(m.value)}">${icon('i-copy')}</button>
      ${hasUrl ? icon('i-external') : ''}
    </div></div>`;
    const inner = card.querySelector('.contact-card');
    if (hasUrl) {
      inner.style.cursor = 'pointer';
      inner.addEventListener('click', (e) => {
        if (e.target.closest('.contact-copy')) return;
        window.open(m.url, '_blank', 'noopener');
      });
    }
    const copyBtn = card.querySelector('.contact-copy');
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(m.value); } catch (_) {}
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = icon('i-check-circle');
      setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.innerHTML = icon('i-copy'); }, 2000);
    });
    grid.appendChild(card);
  });
})();

// ---------- Render: Projects (filter + search) ----------
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'flutter', label: 'Flutter' },
  { key: 'ios', label: 'Native iOS' },
  { key: 'solo', label: 'Solely Developed' },
  { key: 'personal', label: 'Personal Products' },
  { key: 'released', label: 'Released Apps' },
];
let activeFilter = 'all';
let query = '';

function matchesFilter(p) {
  switch (activeFilter) {
    case 'flutter': return p.platform === 'Flutter';
    case 'ios': return p.platform === 'Native iOS';
    case 'solo': return p.contributionLabel === 'Solely developed';
    case 'personal': return p.ownershipLabel === 'Personal Product';
    case 'released': return !!(p.appStoreUrl || p.googlePlayUrl);
    default: return true;
  }
}

function matchesQuery(p) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [p.name, p.description, p.platform, p.role, p.contributionLabel, p.ownershipLabel,
    ...p.technologies, ...p.responsibilities, ...p.features].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q);
}

function statChip(icn, val, label, color) {
  return `<div class="stat-chip">${`<svg class="icon" style="color:${color}"><use href="#${icn}"/></svg>`}
    <div><div class="stat-value">${esc(val)}</div><div class="stat-label">${label}</div></div></div>`;
}

function projectCard(p, featured) {
  const card = el('div', `card project-card hover-lift${featured ? ' featured' : ''}${featured ? '' : ''}`);
  if (featured) card.classList.add('highlighted');

  // Carousel
  let carousel;
  if (p.screenshots && p.screenshots.length) {
    const slides = p.screenshots.map((s) => `<div class="carousel-slide"><img src="${s}" alt="${esc(p.name)} screenshot" loading="lazy"></div>`).join('');
    const dots = p.screenshots.length > 1
      ? `<div class="carousel-dots">${p.screenshots.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('')}</div>` : '';
    carousel = `<div class="carousel"><div class="carousel-track">${slides}</div>${dots}</div>`;
  } else {
    carousel = `<div class="carousel"><div class="carousel-placeholder">${icon(p.icon)}</div></div>`;
  }

  const metaChips = [
    `<span class="chip solid">${icon('i-smartphone')}${esc(p.platform)}</span>`,
    `<span class="chip solid">${icon('i-briefcase')}${esc(p.role)}</span>`,
    p.contributionLabel ? `<span class="chip solid">${icon('i-award')}${esc(p.contributionLabel)}</span>` : '',
    p.ownershipLabel ? `<span class="chip solid">${icon('i-award')}${esc(p.ownershipLabel)}</span>` : '',
  ].join('');

  const stats = (p.downloads || p.reviews || p.ratings) ? `<div class="stats-row">
    ${p.downloads ? statChip('i-download', p.downloads, 'Downloads', 'var(--blue)') : ''}
    ${p.reviews ? statChip('i-file', p.reviews, 'Reviews', 'var(--purple)') : ''}
    ${p.ratings ? statChip('i-star', p.ratings, 'Rating', '#FBBC04') : ''}
  </div>` : '';

  const techChips = `<div class="tech-chips">${p.technologies.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`;

  const details = `<div class="project-details">
    <div class="detail-block"><h4>My Role</h4><ul>${p.responsibilities.map((r) => `<li>${icon('i-check-circle')}<span>${esc(r)}</span></li>`).join('')}</ul></div>
    <div class="detail-block"><h4>Features</h4><ul>${p.features.map((f) => `<li>${icon('i-check-circle')}<span>${esc(f)}</span></li>`).join('')}</ul></div>
  </div>`;

  const storeBtns = [
    p.appStoreUrl ? `<a class="icon-btn" href="${p.appStoreUrl}" target="_blank" rel="noopener" title="App Store">${icon('i-apple')}</a>` : '',
    p.googlePlayUrl ? `<a class="icon-btn" href="${p.googlePlayUrl}" target="_blank" rel="noopener" title="Google Play">${icon('i-play')}</a>` : '',
    p.websiteUrl ? `<a class="icon-btn" href="${p.websiteUrl}" target="_blank" rel="noopener" title="Website">${icon('i-globe')}</a>` : '',
    p.githubUrl ? `<a class="icon-btn" href="${p.githubUrl}" target="_blank" rel="noopener" title="GitHub">${icon('i-code')}</a>` : '',
  ].join('');

  card.innerHTML = `<div class="card-inner">
    ${carousel}
    <div class="project-body">
      <div class="project-title-row"><div class="project-icon">${icon(p.icon)}</div><h3>${esc(p.name)}</h3>${featured ? `<span class="featured-badge"><span class="gradient-text">Featured</span></span>` : ''}</div>
      <div class="meta-chips">${metaChips}</div>
      <p class="project-desc">${esc(p.description)}</p>
      ${stats}
      ${techChips}
      ${details}
      <div class="project-actions">
        <button class="btn outlined toggle-details">${icon('i-chevron-down')}<span>Read More</span></button>
        ${storeBtns}
      </div>
    </div>
  </div>`;

  // Read more toggle
  const toggle = card.querySelector('.toggle-details');
  toggle.addEventListener('click', () => {
    const open = card.classList.toggle('expanded');
    toggle.querySelector('span').textContent = open ? 'Show Less' : 'Read More';
    toggle.querySelector('use').setAttribute('href', open ? '#i-chevron-up' : '#i-chevron-down');
  });

  // Carousel dots sync
  const track = card.querySelector('.carousel-track');
  const dotEls = card.querySelectorAll('.carousel-dots span');
  if (track && dotEls.length) {
    track.addEventListener('scroll', () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });
  }

  return card;
}

function renderProjects() {
  const out = document.getElementById('projectsOutput');
  out.innerHTML = '';

  const filtered = projects.filter((p) => matchesFilter(p) && matchesQuery(p));
  const featured = filtered.find((p) => p.featured);
  const flutter = filtered.filter((p) => p.platform === 'Flutter' && !p.featured);
  const ios = filtered.filter((p) => p.platform === 'Native iOS');

  if (!featured && !flutter.length && !ios.length) {
    out.innerHTML = `<div class="empty-state" style="margin-top:26px">${icon('i-search-off')}
      <h3>No matching projects</h3><p>Try a different filter or search term.</p></div>`;
    return;
  }

  if (featured) {
    const block = el('div', 'reveal is-visible');
    block.style.marginTop = '26px';
    block.appendChild(projectCard(featured, true));
    out.appendChild(block);
  }

  const group = (title, list) => {
    if (!list.length) return;
    const g = el('div', 'project-group');
    g.appendChild(el('h3', null, esc(title)));
    const grid = el('div', 'project-grid');
    list.forEach((p) => grid.appendChild(projectCard(p, false)));
    g.appendChild(grid);
    out.appendChild(g);
  };
  group('Flutter Applications', flutter);
  group('Native iOS Applications', ios);
}

(function initProjects() {
  const filtersEl = document.getElementById('filters');
  FILTERS.forEach((f) => {
    const btn = el('button', `filter-chip${f.key === 'all' ? ' active' : ''}`, esc(f.label));
    btn.addEventListener('click', () => {
      activeFilter = f.key;
      filtersEl.querySelectorAll('.filter-chip').forEach((b) => b.classList.toggle('active', b === btn));
      renderProjects();
    });
    filtersEl.appendChild(btn);
  });

  const search = document.getElementById('projectSearch');
  const clear = document.getElementById('searchClear');
  search.addEventListener('input', () => {
    query = search.value;
    clear.style.display = query ? 'block' : 'none';
    renderProjects();
  });
  clear.addEventListener('click', () => {
    search.value = ''; query = ''; clear.style.display = 'none'; renderProjects(); search.focus();
  });

  renderProjects();
})();

// ---------- Mobile drawer ----------
(function initDrawer() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const open = () => { drawer.classList.add('open'); backdrop.classList.add('open'); };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.remove('open'); };
  toggle.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
})();

// ---------- Reveal on scroll ----------
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((i) => io.observe(i));
})();
