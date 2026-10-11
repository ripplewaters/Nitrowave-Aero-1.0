export type Skin = {
  id: string;
  name: string;
  accent: string;
  finish?: 'mirror' | 'chrome' | 'circuit' | 'porcelain' | 'cassette' | 'hologram';
  description?: string;
  vars: Record<string, string>;
};

// Palettes colour the shared sculpture. These are the skins that ship in the player.
export const SKINS: Skin[] = [
  {
    id: 'ember', name: 'EMBER', accent: '#ff3b22',
    description: 'Charcoal shell, warm cream panels and a red-hot glow.',
    vars: {
      '--body-hi': '#4a3b36', '--body': '#15100f', '--body-lo': '#050404', '--body-edge': '#6d5a52',
      '--cavity': '#070505', '--pod-hi': '#3a302c', '--pod': '#161211', '--pod-lo': '#050404', '--grille': '#000000',
      '--panel-hi': '#fffaf0', '--panel': '#eee0cb', '--panel-lo': '#b69c82', '--panel-edge': '#7d6654',
      '--ink': '#1d1714', '--ink-soft': '#6e5b4d', '--collar': '#0b0808',
      '--bezel-hi': '#fff4e2', '--bezel-lo': '#5d4a3f', '--orb-ink': '#fbefe4',
    },
  },
  {
    id: 'pearl', name: 'PEARL', accent: '#ff7424',
    description: 'Pearl white with soft greys and a tangerine glow.',
    vars: {
      '--body-hi': '#ffffff', '--body': '#ece6de', '--body-lo': '#b9afa4', '--body-edge': '#cfc5b9',
      '--cavity': '#8f8984', '--pod-hi': '#d9d4cf', '--pod': '#8d8781', '--pod-lo': '#4c4845', '--grille': '#2b2826',
      '--panel-hi': '#ffffff', '--panel': '#f5f0e9', '--panel-lo': '#d6cbbd', '--panel-edge': '#c2b5a5',
      '--ink': '#2a2420', '--ink-soft': '#8a7c70', '--collar': '#9d958d',
      '--bezel-hi': '#ffffff', '--bezel-lo': '#9e958b', '--orb-ink': '#fffaf3',
    },
  },
  {
    id: 'aqua', name: 'AQUA', accent: '#22c8ff',
    description: 'Frosted sky-blue plastic with an ice-cyan glow.',
    vars: {
      '--body-hi': '#f4fbff', '--body': '#bcd9e6', '--body-lo': '#6e97a8', '--body-edge': '#a4c5d3',
      '--cavity': '#244b5b', '--pod-hi': '#8fb6c6', '--pod': '#3b6474', '--pod-lo': '#18323d', '--grille': '#0b1c23',
      '--panel-hi': '#ffffff', '--panel': '#e8f5fa', '--panel-lo': '#a8cbd9', '--panel-edge': '#8fb5c4',
      '--ink': '#123240', '--ink-soft': '#5a8193', '--collar': '#1c3c49',
      '--bezel-hi': '#ffffff', '--bezel-lo': '#6f98a8', '--orb-ink': '#f2fbff',
    },
  },
  {
    id: 'noir', name: 'NOIR', accent: '#d8e2ff',
    description: 'Black from shell to panels, lit in cool moonlight.',
    vars: {
      '--body-hi': '#3d3f45', '--body': '#15161a', '--body-lo': '#040405', '--body-edge': '#4d5058',
      '--cavity': '#030304', '--pod-hi': '#2c2e33', '--pod': '#101114', '--pod-lo': '#030304', '--grille': '#000000',
      '--panel-hi': '#5b5e66', '--panel': '#303238', '--panel-lo': '#16171b', '--panel-edge': '#0c0c0e',
      '--ink': '#eef0f5', '--ink-soft': '#9a9fab', '--collar': '#050506',
      '--bezel-hi': '#b9bdc7', '--bezel-lo': '#25272c', '--orb-ink': '#f4f6fb',
    },
  },
  {
    id: 'synth', name: 'SYNTH', accent: '#ff3fb4',
    description: 'Deep violet with lilac panels and a hot-pink glow.',
    vars: {
      '--body-hi': '#4b2a6e', '--body': '#1c0d2c', '--body-lo': '#07030d', '--body-edge': '#6c4592',
      '--cavity': '#060209', '--pod-hi': '#3b2156', '--pod': '#170a24', '--pod-lo': '#05020a', '--grille': '#000000',
      '--panel-hi': '#fbf2ff', '--panel': '#e6d4f4', '--panel-lo': '#a98cc6', '--panel-edge': '#7a5b99',
      '--ink': '#25123a', '--ink-soft': '#76609a', '--collar': '#0b0412',
      '--bezel-hi': '#fdf2ff', '--bezel-lo': '#5b3f7c', '--orb-ink': '#fff3fd',
    },
  },
  {
    id: 'moss', name: 'MOSS', accent: '#b6ff4a',
    description: 'Forest green with sage panels and an acid-lime glow.',
    vars: {
      '--body-hi': '#4c5443', '--body': '#1b2018', '--body-lo': '#060805', '--body-edge': '#606a55',
      '--cavity': '#050604', '--pod-hi': '#343b2e', '--pod': '#141811', '--pod-lo': '#040503', '--grille': '#000000',
      '--panel-hi': '#fbfcf2', '--panel': '#e3e6d2', '--panel-lo': '#a8ae8f', '--panel-edge': '#707760',
      '--ink': '#1b2014', '--ink-soft': '#687058', '--collar': '#070905',
      '--bezel-hi': '#fbfdf0', '--bezel-lo': '#4f5744', '--orb-ink': '#f6faec',
    },
  },
  {
    id: 'chrome', name: 'CHROME', accent: '#8fe3ff', finish: 'mirror',
    description: 'Polished mirror chrome that reflects a bright sky over a dark horizon, with an ice-blue glow.',
    vars: {
      '--body-hi': '#ffffff', '--body': '#7b8b9a', '--body-lo': '#121a22', '--body-edge': '#e6f0f8',
      '--cavity': '#0b1218', '--pod-hi': '#c4d0db', '--pod': '#3a4753', '--pod-lo': '#0b1117', '--grille': '#05090d',
      '--panel-hi': '#ffffff', '--panel': '#c5d3df', '--panel-lo': '#3b4d5d', '--panel-edge': '#5e7384',
      '--ink': '#0c1822', '--ink-soft': '#33475a', '--collar': '#101922',
      '--bezel-hi': '#ffffff', '--bezel-lo': '#1d2f3f', '--orb-ink': '#f1f9ff',
    },
  },
  {
    id: 'opal', name: 'OPAL', accent: '#f9adff', finish: 'hologram',
    description: 'Holographic foil that splits light like a CD, with an embossed diamond grid and sparkles.',
    vars: {
      '--body-hi': '#e7faff', '--body': '#8c75b1', '--body-lo': '#292641', '--body-edge': '#f8d2ff',
      '--cavity': '#221934', '--pod-hi': '#8c85b4', '--pod': '#4d406d', '--pod-lo': '#1d1630', '--grille': '#100c20',
      '--panel-hi': '#fff5ff', '--panel': '#d8d4f2', '--panel-lo': '#a9b5d4', '--panel-edge': '#80759a',
      '--ink': '#332742', '--ink-soft': '#635373', '--collar': '#352545',
      '--bezel-hi': '#fff4fb', '--bezel-lo': '#827da4', '--orb-ink': '#fff4ff',
    },
  },
];

// Archived material skins (SVG surfaces in SkinFinish.tsx, hardware in aero2004.css under
// [data-finish]). Not shipped; move one into SKINS to bring it back (Opal already ships).
export const MATERIAL_SKINS: Skin[] = [
  {
    id: 'chrome-material', name: 'CHROME', accent: '#b8e8ff', finish: 'chrome',
    description: 'Mirror chrome with spun-metal grain, an engraved dial and machined hex screws.',
    vars: {
      '--body-hi': '#eef6ff', '--body': '#677481', '--body-lo': '#1c252e', '--body-edge': '#d0e0ed',
      '--cavity': '#101c24', '--pod-hi': '#a0afbe', '--pod': '#384550', '--pod-lo': '#10161d', '--grille': '#080f16',
      '--panel-hi': '#ffffff', '--panel': '#bbc9d5', '--panel-lo': '#526778', '--panel-edge': '#6f8594',
      '--ink': '#101b26', '--ink-soft': '#3d5060', '--collar': '#14212d',
      '--bezel-hi': '#ffffff', '--bezel-lo': '#243c50', '--orb-ink': '#effaff',
    },
  },
  {
    id: 'circuit', name: 'CIRCUIT', accent: '#8eff65', finish: 'circuit',
    description: 'A live circuit board: copper traces, a DSP chip, gold contacts and a status LED in your glow colour.',
    vars: {
      '--body-hi': '#347a5b', '--body': '#0b3227', '--body-lo': '#03150e', '--body-edge': '#67c68e',
      '--cavity': '#02150c', '--pod-hi': '#1f5c42', '--pod': '#0b291e', '--pod-lo': '#020e08', '--grille': '#000b04',
      '--panel-hi': '#386e4a', '--panel': '#153e2c', '--panel-lo': '#062317', '--panel-edge': '#4d9965',
      '--ink': '#e4ffd5', '--ink-soft': '#b1d5a7', '--collar': '#062117',
      '--bezel-hi': '#d9e8b4', '--bezel-lo': '#36542c', '--orb-ink': '#efffe2',
    },
  },
  {
    id: 'porcelain', name: 'PORCELAIN', accent: '#80b8ff', finish: 'porcelain',
    description: 'Glazed porcelain with hand-painted cobalt peonies, a gold rim line and one kintsugi repair.',
    vars: {
      '--body-hi': '#ffffff', '--body': '#e1e8f5', '--body-lo': '#91a4c5', '--body-edge': '#f7fbff',
      '--cavity': '#243c64', '--pod-hi': '#6685b6', '--pod': '#27486f', '--pod-lo': '#102544', '--grille': '#06152f',
      '--panel-hi': '#fffefa', '--panel': '#f3f3ea', '--panel-lo': '#c5cede', '--panel-edge': '#8b9fb7',
      '--ink': '#17325b', '--ink-soft': '#4f6690', '--collar': '#233e64',
      '--bezel-hi': '#ffedb2', '--bezel-lo': '#977341', '--orb-ink': '#fffdf5',
    },
  },
  {
    id: 'mixtape', name: 'MIXTAPE', accent: '#ffb12b', finish: 'cassette',
    description: 'A summer mixtape: wound tape reels, a ruled label, seventies stripes and piano-key buttons.',
    vars: {
      '--body-hi': '#a06e32', '--body': '#41291a', '--body-lo': '#170e09', '--body-edge': '#d8a45a',
      '--cavity': '#1d120b', '--pod-hi': '#7c4c25', '--pod': '#3a2417', '--pod-lo': '#120c07', '--grille': '#080502',
      '--panel-hi': '#ffe6a5', '--panel': '#dbae65', '--panel-lo': '#997140', '--panel-edge': '#76532e',
      '--ink': '#342314', '--ink-soft': '#5e452c', '--collar': '#352115',
      '--bezel-hi': '#ffdf94', '--bezel-lo': '#72512d', '--orb-ink': '#fff3cf',
      '--font-panel': "'Consolas', monospace",
    },
  },
];


export function findSkin(id: string): Skin {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}
