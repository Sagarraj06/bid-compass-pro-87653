// HTTP backend configuration - MUST run frontend locally on http://localhost:8080
// Browsers block HTTP API calls from HTTPS sites (mixed content security)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://161.118.181.8:80/api';

export const DAILY_CREDITS = 10;

export const CHART_COLORS = [
  'hsl(210, 100%, 50%)',
  'hsl(160, 100%, 40%)',
  'hsl(45, 100%, 51%)',
  'hsl(15, 100%, 60%)',
  'hsl(250, 70%, 60%)',
  'hsl(150, 50%, 60%)',
  'hsl(35, 100%, 60%)',
  'hsl(330, 100%, 70%)'
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' }
];

export const DATE_RANGE_OPTIONS = [
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' }
];
