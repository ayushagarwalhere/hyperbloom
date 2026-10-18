'use client';

import { useHarborlineStore } from './store/useHarborlineStore';
import { crisisScenes } from './lib/sceneData';

export default function SceneOverlay() {
  const { activeScene, isSceneMenuOpen, setActiveScene, toggleSceneMenu } = useHarborlineStore();
  const scene = crisisScenes[activeScene];

  return (
    <>
      <div className="scene-caption">
        <span>{String(activeScene + 1).padStart(2, '0')}</span>
        <strong>{scene.label}</strong>
        <small>{scene.eyebrow} · Drag to explore</small>
      </div>
      <button className="scene-menu-trigger" onClick={toggleSceneMenu} aria-expanded={isSceneMenuOpen}>
        <span className="scene-menu-dot" style={{ backgroundColor: scene.accent }} />
        Scenes <span>{isSceneMenuOpen ? '−' : '+'}</span>
      </button>
      {isSceneMenuOpen && (
        <div className="scene-menu">
          {crisisScenes.map((option, index) => (
            <button key={option.id} className={activeScene === index ? 'current' : ''} onClick={() => { setActiveScene(index); toggleSceneMenu(); }}>
              <span style={{ color: option.accent }}>{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{option.label}</strong><small>{option.eyebrow}</small></span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
