// color = accent for the shell glow; sky / ground paint the little horizon swatch in the visual panel.
export const SHADER_PRESETS = [
  { name: 'SKY CRUISE', color: '#ff9ec4', sky: '#5a5fc8', ground: '#b9a0e0' },
  { name: 'NIGHT CITY', color: '#ff4fd8', sky: '#1a0526', ground: '#3a0d3a' },
  { name: 'RAIN CITY', color: '#4fc8ff', sky: '#050c1c', ground: '#16304a' },
  { name: 'SNOW DRIFT', color: '#bfe6ff', sky: '#2a3a78', ground: '#9aa8dc' },
  { name: 'SUNNY COAST', color: '#ffcf3f', sky: '#3f8ee8', ground: '#138a9e' },
  { name: 'DESERT RUN', color: '#ff8a3c', sky: '#4a1440', ground: '#b8502e' },
  { name: 'PULSE GRID', color: '#ff6da0', sky: '#2a0436', ground: '#16001e' },
  { name: 'HYPERSPACE', color: '#8d9bff', sky: '#0a0a2a', ground: '#2c2470' },
  { name: 'NEON TUNNEL', color: '#c56bff', sky: '#12002a', ground: '#28105a' },
  { name: 'AURORA SEA', color: '#72f4be', sky: '#04141c', ground: '#0c3a36' },
] as const;

export type ShaderPresetIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
