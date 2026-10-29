import {mountDashboard} from './dashboard.js';
const data=await fetch('./data.json').then(r=>r.json());
await mountDashboard(data);
