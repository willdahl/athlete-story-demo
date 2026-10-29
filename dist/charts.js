/** Source-aware training visuals. No inferred series or totals are generated here. */
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const number = value => new Intl.NumberFormat('en-US', {maximumFractionDigits: 1}).format(value);
const sports = {
  cycling: {distance: 'distance ridden', time: 'time training'},
  running: {distance: 'distance run', time: 'time training'},
  hiking: {distance: 'distance hiked', time: 'time training'},
  walking: {distance: 'distance walked', time: 'time training'}
};
const sourceLabel = source => source === 'synthetic_fixture' ? 'Synthetic example training data' : source === 'athlete_reported' ? 'Athlete-reported training figures; may include estimates' : 'Training figures; source not specified';

/** Returns safe, self-contained HTML. Accepts only numeric values, not numeric-looking strings. */
export function renderTraining(metrics = {}, activity = 'cycling') {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) metrics = {};
  const sport = Object.hasOwn(sports, activity) ? sports[activity] : {distance:'training distance', time:'time training'};
  const cards = [
    [metrics.preparationWeeks, 'weeks', 'of preparation', false],
    [metrics.trainingDays, '', 'training days', true],
    [metrics.distanceKm, 'km', sport.distance, false],
    [metrics.trainingHours, 'hours', sport.time, false]
  ].filter(([value,,,integer]) => finite(value) && (!integer || Number.isInteger(value)))
   .map(([value, unit, label]) => `<div style="padding:12px 14px;background:#f0f3eb;border-radius:12px;min-width:0"><strong style="display:block;font:600 24px/1.2 Georgia,serif;color:#183f39;overflow-wrap:anywhere">${number(value)}${unit ? ` <span style="font-size:15px">${unit}</span>` : ''}</strong><span style="display:block;font:13px/1.4 system-ui,sans-serif;color:#52685e;margin-top:4px">${label}</span></div>`).join('');

  const supplied = Array.isArray(metrics.weekly) ? metrics.weekly : [];
  const valid = supplied.filter(row => row && typeof row === 'object' && Number.isInteger(row.week) && row.week > 0 && finite(row.distanceKm));
  const weeks = new Set(valid.map(row => row.week));
  const duplicateWeeks = weeks.size !== valid.length;
  const excessive = valid.length > 200;
  const series = duplicateWeeks || excessive ? [] : valid.slice().sort((a,b) => a.week-b.week);
  let chart = '';
  if (series.length) {
    const width = 640, height = 220, left = 55, right = 20, top = 22, bottom = 38;
    const plotWidth = width-left-right, plotHeight = height-top-bottom;
    const minWeek = series[0].week, maxWeek = series.at(-1).week;
    const span = maxWeek-minWeek+1;
    const max = Math.max(...series.map(row => row.distanceKm));
    const scale = max || 1;
    const slot = plotWidth/span;
    const barWidth = Math.max(0.5,Math.min(42,slot*0.68));
    const showEvery = Math.max(1,Math.ceil(series.length/12));
    const bars = series.map((row,index) => {
      const x = left+(row.week-minWeek+.5)*slot;
      const barHeight = row.distanceKm/scale*plotHeight;
      return `<g><title>Week ${row.week}: ${number(row.distanceKm)} km</title>${row.distanceKm===0 ? `<circle cx="${x}" cy="${top+plotHeight}" r="2.5" fill="#256b58"/>` : `<rect x="${x-barWidth/2}" y="${top+plotHeight-barHeight}" width="${barWidth}" height="${barHeight}" rx="2" fill="#256b58"/>`}${index%showEvery===0 || index===series.length-1 ? `<text x="${x}" y="${height-17}" text-anchor="middle" font-size="11" fill="#52685e">${row.week}</text>` : ''}</g>`;
    }).join('');
    const gaps = span > series.length;
    const invalid = supplied.length-valid.length;
    const rows = series.map(row => `<tr><th scope="row" style="text-align:left;padding:5px 8px">${row.week}</th><td style="padding:5px 8px">${number(row.distanceKm)} km</td></tr>`).join('');
    chart = `<figure class="training-weekly-chart" style="margin:18px 0 0"><figcaption style="font:600 14px/1.4 system-ui,sans-serif;color:#183f39">Weekly training distance</figcaption><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Weekly training distance in kilometers. ${series.length} reported weeks. Values are available in the table below." viewBox="0 0 ${width} ${height}" style="display:block;width:100%;height:auto;max-height:250px"><title>Weekly training distance</title><line x1="${left}" y1="${top+plotHeight}" x2="${width-right}" y2="${top+plotHeight}" stroke="#bdc9bd"/><line x1="${left}" y1="${top}" x2="${width-right}" y2="${top}" stroke="#e0e5db"/><text x="${left-8}" y="${top+4}" text-anchor="end" font-size="11" fill="#52685e">${number(scale)}</text><text x="${left-8}" y="${top+plotHeight+4}" text-anchor="end" font-size="11" fill="#52685e">0</text><text x="${left}" y="12" font-size="11" fill="#52685e">km</text>${bars}<text x="${width-right}" y="${height-3}" text-anchor="end" font-size="11" fill="#52685e">Training week</text></svg>${gaps ? '<p style="font:12px/1.5 system-ui,sans-serif;color:#52685e">Gaps are weeks with no supplied record, not zero-distance weeks.</p>' : ''}${invalid ? '<p style="font:12px/1.5 system-ui,sans-serif;color:#52685e">Some weekly entries could not be displayed because their week or distance was invalid.</p>' : ''}<details style="font:13px/1.5 system-ui,sans-serif"><summary style="cursor:pointer;color:#256b58">View weekly values</summary><table style="margin-top:8px;border-collapse:collapse"><caption style="text-align:left">Supplied training distances</caption><thead><tr><th scope="col" style="text-align:left;padding:5px 8px">Week</th><th scope="col" style="text-align:left;padding:5px 8px">Distance</th></tr></thead><tbody>${rows}</tbody></table></details></figure>`;
  }
  let note = '';
  if (duplicateWeeks) note='Weekly chart unavailable: more than one distance was supplied for the same week. Review those entries first.';
  else if (excessive) note='The weekly chart supports up to 200 supplied weeks. Your totals remain available.';
  else if (!series.length && supplied.length) note='Weekly chart unavailable: the supplied entries need valid week numbers and distances.';
  else if (!series.length && cards) note='These are training totals. A weekly chart needs weekly records.';
  else if (!cards && !series.length) note='No training figures added yet. Your story can stand on its own.';
  return `<section class="training-summary" aria-label="Training and preparation" style="margin:16px 0;color:#183f39"><p class="training-source" style="font:12px/1.5 system-ui,sans-serif;color:#52685e;margin:0 0 10px">${escape(sourceLabel(metrics.source))}</p>${cards ? `<div class="training-metric-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px">${cards}</div>` : ''}${chart}${note ? `<p class="training-note" style="font:13px/1.6 system-ui,sans-serif;color:#52685e;margin:10px 0 0">${note}</p>` : ''}</section>`;
}
