/**
 * @fileoverview HTML overlay panel that renders details for the currently
 * selected sephira or path. Lives outside the canvas so text remains crisp and
 * accessible.
 */

import './info-panel.css';

import * as React from 'react';

import { paths } from '../data/paths';
import { sephiroth } from '../data/sephiroth';
import type { Selection } from '../data/types';
import { createLabelData } from '../utils/label-factory';

interface InfoPanelProps {
  selection: Selection;
  onClose: () => void;
}

export function InfoPanel({
  selection,
  onClose,
}: InfoPanelProps): React.JSX.Element | null {
  if (!selection) return null;

  if (selection.kind === 'sephira') {
    const s = sephiroth.find((x) => x.id === selection.id);
    if (!s) return null;
    return (
      <aside className="info-panel" aria-label={`Sephira ${s.name}`}>
        <button
          type="button"
          className="info-panel__close"
          onClick={onClose}
          aria-label="Close info panel"
        >
          ×
        </button>
        <header className="info-panel__header">
          <span
            className="info-panel__swatch"
            style={{ background: s.botaColor }}
            aria-hidden
          />
          <div>
            <div className="info-panel__eyebrow">Sephira {s.id}</div>
            <h2 className="info-panel__title">{s.name}</h2>
            <div className="info-panel__subtitle">
              {s.title}{' '}
              <span className="info-panel__hebrew">{s.hebrewName}</span>
            </div>
          </div>
        </header>
        <dl className="info-panel__list">
          <dt>Pillar</dt>
          <dd>{s.pillar}</dd>
          <dt>Divine Name</dt>
          <dd>{s.divineName}</dd>
          <dt>Archangel</dt>
          <dd>{s.archangel}</dd>
          <dt>Angelic Choir</dt>
          <dd>{s.angelicChoir}</dd>
          <dt>Correspondence</dt>
          <dd>{s.planetaryCorrespondence}</dd>
          <dt>Color (Queen Scale)</dt>
          <dd>{s.botaColor}</dd>
        </dl>
      </aside>
    );
  }

  const p = paths.find((x) => x.pathNumber === selection.pathNumber);
  if (!p) return null;
  const data = createLabelData(p.letter);
  const fromS = sephiroth.find((x) => x.id === p.from);
  const toS = sephiroth.find((x) => x.id === p.to);

  return (
    <aside className="info-panel" aria-label={`Path ${p.pathNumber}`}>
      <button
        type="button"
        className="info-panel__close"
        onClick={onClose}
        aria-label="Close info panel"
      >
        ×
      </button>
      <header className="info-panel__header">
        <span
          className="info-panel__swatch"
          style={{ background: data.colorValue }}
          aria-hidden
        />
        <div>
          <div className="info-panel__eyebrow">Path {p.pathNumber}</div>
          <h2 className="info-panel__title">{data.title}</h2>
          <div className="info-panel__subtitle">
            {data.letterName}{' '}
            <span className="info-panel__hebrew">{data.glyph}</span>
            {' — '}
            {data.assocName} {data.assocGlyph}
          </div>
        </div>
      </header>
      {data.imagePath && (
        <img
          className="info-panel__image"
          src={data.imagePath}
          alt={`Tarot ${data.title}`}
        />
      )}
      <dl className="info-panel__list">
        <dt>Connects</dt>
        <dd>
          {fromS?.name ?? p.from} ↔ {toS?.name ?? p.to}
        </dd>
        <dt>Color</dt>
        <dd>
          {data.color}{' '}
          <span
            className="info-panel__color-chip"
            style={{ background: data.colorValue }}
            aria-hidden
          />
        </dd>
        <dt>Note</dt>
        <dd>{data.note}</dd>
        <dt>Significance</dt>
        <dd>{data.significance}</dd>
        <dt>Gematria</dt>
        <dd>{data.gematria}</dd>
        <dt>Alchemy</dt>
        <dd>{data.alchemy}</dd>
        <dt>Intelligence</dt>
        <dd>{data.intelligence}</dd>
        {data.outerPlanet && (
          <>
            <dt>Outer Planet</dt>
            <dd>
              {data.outerPlanet} {data.outerPlanetGlyph}
            </dd>
          </>
        )}
      </dl>
    </aside>
  );
}
