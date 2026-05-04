export const PRODUCT_CATEGORIES = ['Doors', 'Windows', 'Showers'];

export const PRODUCT_TYPES = ['Sliding', 'Hinged', 'Patch Fitting', 'Shower Cubicle'];

export const GLASS_TYPES = ['Clear', 'Frosted', 'Toughened'];

export const GLASS_THICKNESSES = ['8mm', '10mm', '12mm'];

export const GLASS_RATES = {
  Doors: {
    Sliding: {
      Clear: { '8mm': 360, '10mm': 420, '12mm': 480 },
      Frosted: { '8mm': 390, '10mm': 450, '12mm': 520 },
      Toughened: { '8mm': 420, '10mm': 490, '12mm': 560 },
    },
    Hinged: {
      Clear: { '8mm': 340, '10mm': 400, '12mm': 460 },
      Frosted: { '8mm': 370, '10mm': 430, '12mm': 500 },
      Toughened: { '8mm': 400, '10mm': 470, '12mm': 540 },
    },
    'Patch Fitting': {
      Clear: { '8mm': 370, '10mm': 430, '12mm': 500 },
      Frosted: { '8mm': 400, '10mm': 470, '12mm': 540 },
      Toughened: { '8mm': 430, '10mm': 500, '12mm': 580 },
    },
    'Shower Cubicle': {
      Clear: { '8mm': 410, '10mm': 470, '12mm': 530 },
      Frosted: { '8mm': 440, '10mm': 500, '12mm': 570 },
      Toughened: { '8mm': 470, '10mm': 540, '12mm': 610 },
    },
  },
  Windows: {
    Sliding: {
      Clear: { '8mm': 300, '10mm': 360, '12mm': 420 },
      Frosted: { '8mm': 330, '10mm': 390, '12mm': 450 },
      Toughened: { '8mm': 360, '10mm': 420, '12mm': 490 },
    },
    Hinged: {
      Clear: { '8mm': 310, '10mm': 370, '12mm': 430 },
      Frosted: { '8mm': 340, '10mm': 400, '12mm': 470 },
      Toughened: { '8mm': 370, '10mm': 430, '12mm': 500 },
    },
    'Patch Fitting': {
      Clear: { '8mm': 330, '10mm': 390, '12mm': 450 },
      Frosted: { '8mm': 360, '10mm': 420, '12mm': 490 },
      Toughened: { '8mm': 390, '10mm': 450, '12mm': 520 },
    },
    'Shower Cubicle': {
      Clear: { '8mm': 390, '10mm': 450, '12mm': 510 },
      Frosted: { '8mm': 420, '10mm': 480, '12mm': 550 },
      Toughened: { '8mm': 450, '10mm': 520, '12mm': 590 },
    },
  },
  Showers: {
    Sliding: {
      Clear: { '8mm': 380, '10mm': 440, '12mm': 510 },
      Frosted: { '8mm': 410, '10mm': 470, '12mm': 540 },
      Toughened: { '8mm': 440, '10mm': 510, '12mm': 590 },
    },
    Hinged: {
      Clear: { '8mm': 390, '10mm': 450, '12mm': 520 },
      Frosted: { '8mm': 420, '10mm': 480, '12mm': 560 },
      Toughened: { '8mm': 450, '10mm': 520, '12mm': 600 },
    },
    'Patch Fitting': {
      Clear: { '8mm': 420, '10mm': 490, '12mm': 560 },
      Frosted: { '8mm': 450, '10mm': 520, '12mm': 600 },
      Toughened: { '8mm': 480, '10mm': 550, '12mm': 640 },
    },
    'Shower Cubicle': {
      Clear: { '8mm': 460, '10mm': 530, '12mm': 600 },
      Frosted: { '8mm': 490, '10mm': 560, '12mm': 630 },
      Toughened: { '8mm': 520, '10mm': 590, '12mm': 680 },
    },
  },
};

export const HARDWARE_COSTS = {
  Handles: 1800,
  Hinges: 2600,
  Locks: 2200,
};

export const DEFAULT_ESTIMATE = {
  category: 'Doors',
  type: 'Sliding',
  widthMm: 900,
  heightMm: 2100,
  glassType: 'Clear',
  thickness: '10mm',
  wastagePercent: 10,
  laborCharge: 1200,
  selectedHardware: {
    Handles: true,
    Hinges: true,
    Locks: false,
  },
};

export const TAX_PERCENT = 18;

export const BRAND = {
  businessName: 'Axis Glass & Hardware',
  address: 'Industrial Area, Sector 12',
  phone: '+91 98765 43210',
  email: 'sales@axisglass.in',
  accentColor: '#1e3a8a',
};
