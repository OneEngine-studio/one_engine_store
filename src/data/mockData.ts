import { Game, Article, ClientNotification, UserProfile, AppSettings } from '../types/store';

export const INITIAL_GAMES: Game[] = [
  {
    id: 'railbound',
    title: 'RAILBOUND: TACTICAL PROTOCOL',
    tagline: 'High-speed tactical railway logistics & automated rail defense systems.',
    description: 'Lead an automated rail defense vanguard across hostile industrial zones. Reconfigure track matrices, repel mechanized raiders, and deploy armored rolling artillery to secure planetary resource arteries.',
    price: 29.99,
    discountPercent: 20,
    coverImage: '/images/railbound-theme.jpg',
    heroBanner: '/images/railbound-theme.jpg',
    screenshots: [
      '/images/railbound-theme.jpg',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['TACTICAL', 'AUTOMATION', 'DEFENSE', 'STRATEGY', 'SCI-FI'],
    rating: 96,
    ratingBreakdown: { positivePercent: 96, totalReviews: 4820 },
    developer: 'Afterburn Foundry',
    publisher: 'OneEngine Interactive',
    releaseDate: 'OCTOBER 2026',
    installed: true,
    installSizeGb: 38.4,
    isFavorite: true,
    playHours: 42.6,
    lastPlayed: '2 HOURS AGO',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'FEATURED',
    achievements: { unlocked: 18, total: 24 },
    dlcs: [
      { id: 'rb-dlc-1', title: 'Heavy Rolling Artillery Expansion Pack', description: 'Adds 6 dual-rail super-heavy artillery cars and planetary defense scenarios.', price: 9.99, owned: true },
      { id: 'rb-dlc-2', title: 'Subterranean Mag-Lev Soundtracks & Skins', description: 'Official FLAC dynamic soundtrack and foundry camouflage chassis coats.', price: 4.99, owned: false }
    ],
    patchNotes: [
      {
        version: 'v2.4.0',
        date: 'OCT 26, 2026',
        notes: [
          'Direct OneEngine Store headless bypass integration (--auth-token payload).',
          'Automated GameLobby scene handoff with zero manual credential prompting.',
          'Reduced load-in latency by 45% using native IPC session validation.',
        ],
      },
      {
        version: 'v2.3.8',
        date: 'OCT 12, 2026',
        notes: [
          'Resolved collision glitch on junction Switch-7.',
          'Updated shader cache for DirectX 12 render pipelines.',
        ],
      },
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i5-6600K / AMD Ryzen 3 1300X',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GeForce GTX 960 / AMD Radeon R9 380',
        storage: '40 GB available high-speed SSD space',
      },
      recommended: {
        os: 'Windows 11 64-bit',
        processor: 'Intel Core i7-10700K / AMD Ryzen 7 3700X',
        memory: '16 GB RAM',
        graphics: 'NVIDIA GeForce RTX 3060 / AMD Radeon RX 6600 XT',
        storage: '40 GB NVMe PCIe 4.0 SSD space',
      }
    },
    reviews: [
      {
        id: 'rev-rb-1',
        gameId: 'railbound',
        author: 'Valkyrie_9',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9',
        role: 'ELITE VANGUARD',
        isRecommended: true,
        content: 'The low-latency headless session injection in patch 2.4.0 is phenomenal. Zero lag, seamless transitions into high-density rail battles. Best strategy sim this year.',
        date: 'OCT 27, 2026',
        playHours: 42.6,
        helpfulCount: 84,
      },
      {
        id: 'rev-rb-2',
        gameId: 'railbound',
        author: 'Spectre_07',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spectre_07',
        role: 'LEAD SYSTEMS ARCHITECT',
        isRecommended: true,
        content: 'Superb puzzle mechanics and rock-solid 128Hz mechanical simulation. Heavy artillery rolling stock DLC is totally worth picking up.',
        date: 'OCT 25, 2026',
        playHours: 114.2,
        helpfulCount: 52,
      }
    ],
  },
  {
    id: 'cyber-siege',
    title: 'CYBER SIEGE: OPERATIVE',
    tagline: 'Hardcore CQB tactical extraction shooter in a neon-drenched megacity.',
    description: 'Infiltrate corporate arcologies, breach reinforced bio-vaults, and extract classified zero-day exploits before defense teams lock down the perimeter.',
    price: 39.99,
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['EXTRACTION', 'MULTIPLAYER', 'HARDCORE', 'FIRST-PERSON'],
    rating: 91,
    ratingBreakdown: { positivePercent: 91, totalReviews: 8940 },
    developer: 'Hexagon Tactical Labs',
    publisher: 'OneEngine Interactive',
    releaseDate: 'SEPTEMBER 2026',
    installed: true,
    installSizeGb: 62.1,
    isFavorite: false,
    playHours: 114.8,
    lastPlayed: 'YESTERDAY',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'TRENDING_TACTICAL',
    achievements: { unlocked: 34, total: 50 },
    dlcs: [
      { id: 'cs-dlc-1', title: 'Night Infiltration Tactical Operator Pack', description: 'Thermal oculars, suppressed carbines, and carbon weave infiltration rigs.', price: 14.99, owned: false }
    ],
    patchNotes: [
      {
        version: 'v2.1.0',
        date: 'OCT 18, 2026',
        notes: ['Added subterranean Sector 4 map.', 'Improved thermal sight balance.'],
      }
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i5-8400',
        memory: '12 GB RAM',
        graphics: 'NVIDIA GTX 1060 6GB',
        storage: '65 GB SSD',
      },
      recommended: {
        os: 'Windows 11 64-bit',
        processor: 'AMD Ryzen 7 5800X',
        memory: '16 GB RAM',
        graphics: 'NVIDIA RTX 3070 8GB',
        storage: '65 GB NVMe SSD',
      }
    },
    reviews: [
      {
        id: 'rev-cs-1',
        gameId: 'cyber-siege',
        author: 'Apex_Lead',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex_Lead',
        role: 'OPERATOR',
        isRecommended: true,
        content: 'Tight CQB gunplay, ruthless extraction penalties, and gorgeous neo-noir aesthetics. Make sure you bring thermal oculars into Sector 4.',
        date: 'OCT 26, 2026',
        playHours: 88.5,
        helpfulCount: 61,
      }
    ],
  },
  {
    id: 'project-void',
    title: 'PROJECT VOID: DRIFT',
    tagline: 'Zero-G Newtonian physics fighter & capital ship escort simulation.',
    description: 'Pilot next-generation vector-thrust interceptors through dense planetary debris rings and execute tactical fleet coordination in deep space.',
    price: 24.99,
    discountPercent: 15,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['SPACE SIM', 'PHYSICS', 'FLIGHT', 'SCI-FI'],
    rating: 88,
    ratingBreakdown: { positivePercent: 88, totalReviews: 2310 },
    developer: 'AstroCore Studios',
    publisher: 'OneEngine Interactive',
    releaseDate: 'AUGUST 2026',
    installed: false,
    installSizeGb: 28.5,
    isFavorite: false,
    playHours: 0,
    status: 'UNINSTALLED',
    downloadProgress: 0,
    downloadSpeedMbps: 0,
    category: 'TRENDING_TACTICAL',
    achievements: { unlocked: 0, total: 30 },
    dlcs: [],
    patchNotes: [
      {
        version: 'v1.0.4',
        date: 'OCT 05, 2026',
        notes: ['HOTAS joystick calibration profile updates.'],
      }
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel i5-7400',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GTX 1050Ti',
        storage: '30 GB SSD',
      },
      recommended: {
        os: 'Windows 10 64-bit',
        processor: 'Intel i7-9700K',
        memory: '16 GB RAM',
        graphics: 'NVIDIA GTX 1080Ti / RTX 2070',
        storage: '30 GB SSD',
      }
    },
  },
  {
    id: 'rust-protocol',
    title: 'RUST PROTOCOL: MECH DIVISION',
    tagline: 'High-lethality real-time mechanical combat & planetary warfare.',
    description: 'Assemble modular war mechs with specialized reactor cores, rail-accelerators, and active electronic countermeasures in massive 32-player battlefield engagements.',
    price: 'FREE',
    coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['FREE TO PLAY', 'MECH', 'PVP', 'ACTION'],
    rating: 94,
    ratingBreakdown: { positivePercent: 94, totalReviews: 14200 },
    developer: 'Vanguard Dynamics',
    publisher: 'OneEngine Interactive',
    releaseDate: 'EARLY ACCESS',
    installed: true,
    installSizeGb: 48.0,
    isFavorite: true,
    playHours: 58.2,
    lastPlayed: '3 DAYS AGO',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'EARLY_ACCESS',
    achievements: { unlocked: 15, total: 40 },
    dlcs: [
      { id: 'rp-dlc-1', title: 'Foundry Vanguard Season Pass', description: 'Immediate unlock for 3 Heavy Titan Chassis and 20 weapon paint schemes.', price: 19.99, owned: false }
    ],
    patchNotes: [
      {
        version: 'v0.8.9',
        date: 'OCT 22, 2026',
        notes: ['Added Titan-class siege walkers.'],
      }
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i5-6500',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GTX 970',
        storage: '50 GB SSD',
      },
      recommended: {
        os: 'Windows 11 64-bit',
        processor: 'Intel Core i5-11400 / AMD Ryzen 5 5600',
        memory: '16 GB RAM',
        graphics: 'NVIDIA RTX 3060',
        storage: '50 GB SSD',
      }
    },
  },
  {
    id: 'ghost-recon-delta',
    title: 'SPEC-OPS: IRONCLAD',
    tagline: 'Cooperative stealth tactical infiltrations under harsh electromagnetic jamming.',
    description: 'Coordinate simultaneous thermal breaches and silence hostile SAM sites across black-budget mountain bases with up to four operatives in deep winter operations.',
    price: 49.99,
    discountPercent: 10,
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['CO-OP', 'STEALTH', 'MILITARY', 'TACTICAL'],
    rating: 89,
    ratingBreakdown: { positivePercent: 89, totalReviews: 5410 },
    developer: 'Blackwatch Software',
    publisher: 'OneEngine Interactive',
    releaseDate: 'JULY 2026',
    installed: false,
    installSizeGb: 54.2,
    isFavorite: false,
    playHours: 0,
    status: 'UNINSTALLED',
    downloadProgress: 0,
    downloadSpeedMbps: 0,
    category: 'RECOMMENDED',
    achievements: { unlocked: 0, total: 35 },
    dlcs: [],
    patchNotes: [
      {
        version: 'v1.2.0',
        date: 'SEP 28, 2026',
        notes: ['New Night Operations loadout pack.'],
      }
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'AMD Ryzen 3 3100',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GTX 1060',
        storage: '55 GB SSD',
      },
      recommended: {
        os: 'Windows 10 64-bit',
        processor: 'AMD Ryzen 5 3600',
        memory: '16 GB RAM',
        graphics: 'NVIDIA GTX 1660 Super / RTX 2060',
        storage: '55 GB SSD',
      }
    },
  },
  {
    id: 'neon-drifter',
    title: 'KINETIC 2099: DRIFT',
    tagline: 'Anti-gravity supersonic combat racing through subterranean foundry tunnels.',
    description: 'Speeds exceeding Mach 1 on magnetic rails with onboard missile counter-batteries and dynamic tunnel collapses under cyberpunk atmospheric storm weather.',
    price: 19.99,
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['RACING', 'CYBERPUNK', 'HIGH SPEED', 'ACTION'],
    rating: 92,
    ratingBreakdown: { positivePercent: 92, totalReviews: 3190 },
    developer: 'Apex Forge',
    publisher: 'OneEngine Interactive',
    releaseDate: 'JUNE 2026',
    installed: true,
    installSizeGb: 22.0,
    isFavorite: false,
    playHours: 19.4,
    lastPlayed: '3 DAYS AGO',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'RECOMMENDED',
    achievements: { unlocked: 12, total: 20 },
    dlcs: [],
    patchNotes: [
      {
        version: 'v1.1.2',
        date: 'AUG 14, 2026',
        notes: ['Ultra-wide monitor support enhancement.'],
      }
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i3-8100',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GTX 960',
        storage: '25 GB SSD',
      },
      recommended: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i3-10100',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GTX 1050Ti / GTX 1650',
        storage: '25 GB SSD',
      }
    },
  }
];

export const PRESET_USERS: Record<string, UserProfile> = {
  DEVELOPER: {
    id: 'usr_spectre_07',
    callsign: 'Spectre_07',
    rank: 'LEAD SYSTEMS ARCHITECT',
    level: 74,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spectre_07',
    status: 'ONLINE',
    currentGame: undefined,
    walletBalance: 149.50,
    role: 'DEVELOPER',
    ownedGameIds: ['railbound', 'cyber-siege', 'rust-protocol', 'neon-drifter'],
    authToken: 'oe_jwt_spectre_07_developer_bypass_9812',
  },
  COMPETITIVE: {
    id: 'usr_valkyrie_9',
    callsign: 'Valkyrie_9',
    rank: 'ELITE VANGUARD',
    level: 42,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9',
    status: 'ONLINE',
    currentGame: undefined,
    walletBalance: 42.00,
    role: 'OPERATOR',
    ownedGameIds: ['railbound', 'cyber-siege'],
    authToken: 'oe_jwt_valkyrie_9_operator_bypass_4421',
  },
  GUEST: {
    id: 'usr_guest_recon',
    callsign: 'Ghost_Operative',
    rank: 'RECON SCOUT',
    level: 1,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost_Operative',
    status: 'ONLINE',
    currentGame: undefined,
    walletBalance: 0.00,
    role: 'OPERATOR',
    ownedGameIds: [],
    authToken: 'oe_jwt_guest_recon_bypass_0001',
  }
};

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-01',
    title: 'FOUNDRY LOG #44: LOW-LATENCY IPC RUNNER FOR RAILBOUND',
    gameTitle: 'RAILBOUND',
    gameId: 'railbound',
    category: 'DEV_LOGS',
    date: 'OCTOBER 26, 2026',
    author: 'Lead Architect @ Spectre',
    cover: '/images/railbound-theme.jpg',
    summary: 'Today we deployed v2.4.0 containing direct OneEngine Store session injection hooks. No more in-game login prompt delays. Read the full benchmark teardown.',
    content: [
      'With patch 2.4.0, Railbound now completely transitions from desktop click to active GameLobby in under 1.2 seconds.',
      'By injecting cryptographic token arguments (--auth-token, --player-name, and --user-id) directly via low-level OS command vectors, we bypass the legacy Unity LoginMenu scene entirely.',
      'Network tick rates have been stabilized at 128Hz, ensuring seamless mechanical switch synchronization across multi-track defensive lines.'
    ],
    likes: 1240,
    hasLiked: false,
    comments: 184,
  },
  {
    id: 'art-02',
    title: 'CYBER SIEGE CQB EXTRACTION: WEAPON BALLISTICS 2.0',
    gameTitle: 'CYBER SIEGE',
    gameId: 'cyber-siege',
    category: 'PATCH_NOTES',
    date: 'OCTOBER 24, 2026',
    author: 'Weapons Director @ Hexagon',
    cover: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    summary: 'A deep-dive on bullet penetration multipliers through reinforced polycarbonate barriers and ballistic glass in subterranean sectors.',
    content: [
      'Subterranean Sector 4 introduces complex multi-layer ballistic materials. Standard 5.56 AP rounds now lose 30% velocity through reinforced bulletproof glass.',
      'Thermal optics have been re-calibrated to account for ambient steam leaks and heat dispersion pipes.',
      'Recoil recovery curves have been tightened across all sub-machine gun platforms for improved CQB responsiveness.'
    ],
    likes: 842,
    hasLiked: true,
    comments: 92,
  },
  {
    id: 'art-03',
    title: 'COMMUNITY HIGHLIGHTS: MECH CHASSIS CUSTOM BUILDS',
    gameTitle: 'RUST PROTOCOL',
    gameId: 'rust-protocol',
    category: 'COMMUNITY_SPOTLIGHT',
    date: 'OCTOBER 20, 2026',
    author: 'Community Vanguard',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    summary: 'Showcasing the top ten heaviest dual-railgun builds constructed by the competitive community during the weekend siege tournaments.',
    content: [
      'During last weekends Continental Siege event, pilot "IronClad_404" deployed a 72-ton dual-rail accelerator build that dominated Sector G.',
      'We review the reactor heat efficiency ratios and passive heatsink configurations that made this loadout viable without emergency reactor shutdown.',
      'Community blueprints will be featured in the upcoming Foundry Showcase next Tuesday.'
    ],
    likes: 2150,
    hasLiked: false,
    comments: 310,
  },
  {
    id: 'art-04',
    title: 'PATCH 1.0.4: HOTAS FLIGHT CONTROLS & NEWTONIAN STABILIZATION',
    gameTitle: 'PROJECT VOID',
    gameId: 'project-void',
    category: 'PATCH_NOTES',
    date: 'OCTOBER 15, 2026',
    author: 'Flight Physics Team @ AstroCore',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    summary: 'Full dual-stick HOTAS support, customized deadzones, and precision inertia damping for orbital asteroid dogfights.',
    content: [
      'Pilots can now independently bind 6 degrees of freedom across dual-stick flight controllers.',
      'Vector thrust calculations now execute on high-precision physics threads with zero micro-stutter.',
      'Enhanced cockpit holographic HUD telemetry for tracking capital ship orbital decay.'
    ],
    likes: 670,
    hasLiked: false,
    comments: 48,
  },
  {
    id: 'art-05',
    title: 'FOUNDRY ARCHITECTURE: REDUCING DESKTOP CLIENT OVERHEAD',
    gameTitle: 'ONEENGINE STORE',
    gameId: 'railbound',
    category: 'DEV_LOGS',
    date: 'OCTOBER 10, 2026',
    author: 'Desktop Systems Architect',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    summary: 'How we achieved near-zero RAM footprint and instantaneous navigation without heavy browser bloatware.',
    content: [
      'By decoupling background disk operations and running memory-efficient state management, OneEngine Store consumes 70% less standby memory than legacy launchers.',
      'UI rendering is optimized for GPU rasterization, maintaining a locked 120 FPS on all supported display standards.',
      'Local session persistence guarantees immediate access to installed game binaries even during offline operations.'
    ],
    likes: 3120,
    hasLiked: true,
    comments: 420,
  },
  {
    id: 'art-06',
    title: 'SUPERSONIC DRIFT LEAGUE: SEASON 1 CHAMPIONSHIP PREVIEW',
    gameTitle: 'KINETIC 2099',
    gameId: 'neon-drifter',
    category: 'COMMUNITY_SPOTLIGHT',
    date: 'OCTOBER 05, 2026',
    author: 'League Coordinator @ Apex',
    cover: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
    summary: '32 top anti-gravity drift pilots qualify for the subterranean grand finals in the magma conduit circuit.',
    content: [
      'The Magma Conduit track is renowned for its high-speed 45-degree banked turns and dynamic ceiling collapses.',
      'Tune into the official live stream broadcast this Saturday at 19:00 UTC.',
      'Viewers with linked OneEngine accounts will receive the exclusive Obsidian Drift Chassis paint scheme.'
    ],
    likes: 1540,
    hasLiked: false,
    comments: 165,
  }
];

export const INITIAL_NOTIFICATIONS: ClientNotification[] = [
  {
    id: 'notif-1',
    title: 'Railbound v2.4.0 Installed',
    description: 'Direct OneEngine session injection protocol verified and ready.',
    time: '12m ago',
    read: false,
    type: 'update',
  },
  {
    id: 'notif-2',
    title: "Operative 'Valkyrie_9' is in-game",
    description: 'Playing Railbound: Tactical Protocol (Squad slot open).',
    time: '45m ago',
    read: false,
    type: 'friend',
  },
  {
    id: 'notif-3',
    title: 'Foundry Maintenance Complete',
    description: 'All high-speed CDN distribution nodes operating at 100% capacity.',
    time: '2h ago',
    read: true,
    type: 'system',
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup: true,
  downloadDirectory: 'C:\\OneEngine\\GameLibrary',
  primaryAccent: '#FF7A00',
  enableTactileAudio: true,
  hardwareAcceleration: true,
  devTelemetryMode: false,
  bandwidthThrottleMbps: 0,
};
