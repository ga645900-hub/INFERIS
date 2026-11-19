// GET /api/slots -> horarios livres da agenda do Gabriel (seg a sex, 14h-19h, 30 min, horario de Brasilia).
import {freeSlots, live, send, TZ} from './_lib.js';

export default async function handler(req, res) {
  try {
    send(res, 200, {tz: TZ, days: await freeSlots(), mock: !live()});
  } catch (e) {
    console.error('slots', e.message);
    send(res, 502, {error: 'agenda'});
  }
}
