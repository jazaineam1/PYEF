import React, { useEffect, useMemo, useRef, useState } from 'react';
import { names } from '../constants.js';
import './dean-hud.css';

const TEAM_COLORS = ['#ff7a59', '#4cc9f0', '#b388ff', '#ffd166', '#6ee7a8'];

/** The same stable ordering used by Board, kept pure for fixture/unit testing. */
export function rankGroups(groups = []) {
  return groups.filter((group) => Number(group.members) > 0).slice().sort((a, b) =>
    Number(b.fair_score ?? -1) - Number(a.fair_score ?? -1) ||
    Number(b.coverage_pct || 0) - Number(a.coverage_pct || 0) || Number(a.room_no) - Number(b.room_no));
}

export function groupProgress(group) {
  const target = Number(group.target_exams ?? Number(group.members) * 15);
  return target ? Math.min(100, (100 * Number(group.exams_completed || 0)) / target) : 0;
}

function positionMap(rows) { return new Map(rows.map((group, index) => [Number(group.room_no), index + 1])); }

export default function DeanHud({ groups = [], me = null }) {
  const [expanded, setExpanded] = useState(false);
  const [movement, setMovement] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const previousPositions = useRef(null);
  const lastAnnouncement = useRef(0);
  const movementTimer = useRef(null);
  const ranked = useMemo(() => rankGroups(groups), [groups]);
  const emptyCount = groups.filter((group) => !Number(group.members)).length;
  const ownRoom = Number(me?.room);

  useEffect(() => {
    const nextPositions = positionMap(ranked);
    const previous = previousPositions.current;
    const ownPosition = nextPositions.get(ownRoom);
    if (previous && ownPosition && previous.has(ownRoom) && previous.get(ownRoom) !== ownPosition) {
      const delta = previous.get(ownRoom) - ownPosition;
      setMovement({ delta, until: Date.now() + 4000 });
      window.clearTimeout(movementTimer.current);
      movementTimer.current = window.setTimeout(() => setMovement(null), 4000);
      // A polite live region must not turn the board poll into a screen-reader stream.
      const now = Date.now();
      if (now - lastAnnouncement.current >= 15000) {
        setAnnouncement(`Tu equipo subió a la posición ${ownPosition}.`);
        lastAnnouncement.current = now;
      }
    }
    previousPositions.current = nextPositions;
    return () => window.clearTimeout(movementTimer.current);
  }, [ranked, ownRoom]);

  const own = ranked.find((group) => Number(group.room_no) === ownRoom);
  const ownPosition = own ? ranked.indexOf(own) + 1 : null;
  return <section className={`dean-hud ${expanded ? 'is-expanded' : ''} ${movement ? 'is-moving' : ''}`} data-testid="dean-hud" aria-label="Mini-wall de la clasificación">
    <button className="dean-hud-pill" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
      <span className="dean-hud-pill-mark" aria-hidden="true">⌁</span><span><b>{ownPosition ? `#${ownPosition}` : '—'}</b> <span>Tu equipo</span></span><strong>{own?.fair_score == null ? '—' : Number(own.fair_score).toFixed(1)}</strong>
    </button>
    <div className="dean-hud-panel">
      <header className="dean-hud-heading"><div><b>MINI-WALL</b><span>CLASIFICACIÓN EN VIVO</span></div><span className="dean-hud-status">PROVISIONAL</span></header>
      <div className="dean-hud-rows" role="list" aria-label="Salas con participantes">
        {ranked.slice(0, 5).map((group, index) => {
          const room = Number(group.room_no), isOwn = room === ownRoom, progress = groupProgress(group), change = isOwn && movement?.delta ? movement.delta : 0;
          return <div className={`dean-hud-row ${isOwn ? 'is-own' : ''}`} role="listitem" key={room}>
            <span className="dean-hud-rank">{index === 0 ? '♛' : index + 1}</span>
            <span className="dean-hud-team" style={{ '--team-color': TEAM_COLORS[(room - 1) % TEAM_COLORS.length] }}><i aria-hidden="true" />{names[room - 1] || `Sala ${room}`}{isOwn && <em>TÚ</em>}</span>
            <span className="dean-hud-score">{group.fair_score == null ? '—' : Number(group.fair_score).toFixed(1)}</span>
            {change !== 0 && <span className={`dean-hud-change ${change > 0 ? 'up' : 'down'}`} aria-label={`${change > 0 ? 'sube' : 'baja'} ${Math.abs(change)} posiciones`}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}</span>}
            <span className="dean-hud-meter" aria-label={`${Math.round(progress)}% de exámenes completados`}><i style={{ width: `${progress}%` }} /></span>
          </div>;
        })}
      </div>
      {emptyCount > 0 && <p className="dean-hud-empty">{emptyCount} {emptyCount === 1 ? 'sala vacía' : 'salas vacías'}</p>}
      <p className="dean-hud-note">Puntaje comparable · exámenes pendientes cuentan como cero</p>
    </div>
    <div className="dean-hud-live" aria-live="polite" aria-atomic="true">{announcement}</div>
  </section>;
}
