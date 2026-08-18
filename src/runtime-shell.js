(() => {
  const shell = document.querySelector('[data-retro-runtime]');
  if (!shell) return;
  const frame = shell.querySelector('.runtime-frame');
  const playArea = shell.querySelector('.runtime-play-area');
  const status = shell.querySelector('.runtime-status');
  const controllerStatus = shell.querySelector('.runtime-controller-status');
  const title = shell.dataset.runtimeTitle || 'Bundled runtime';
  const held = new Map();
  const pointerCodes = new Map();
  const keyValues = { ArrowLeft:'ArrowLeft', ArrowUp:'ArrowUp', ArrowRight:'ArrowRight', ArrowDown:'ArrowDown', Space:' ', Escape:'Escape', Enter:'Enter', KeyN:'n', F1:'F1', F7:'F7', F9:'F9', F10:'F10' };
  const keyCodes = { ArrowLeft:37, ArrowUp:38, ArrowRight:39, ArrowDown:40, Space:32, Escape:27, Enter:13, KeyN:78, F1:112, F7:118, F9:120, F10:121 };
  const setStatus = text => { if (status) status.textContent = text; };
  const gameDocument = () => { try { return frame.contentDocument; } catch (_) { return null; } };
  const focusGame = () => { try { frame.contentWindow.focus(); const doc = gameDocument(); const target = doc?.getElementById('canvas') || doc?.querySelector('canvas') || doc?.body; target?.focus?.(); } catch (_) {} };
  const dispatchKey = (code, type) => {
    const doc = gameDocument();
    if (!doc) return;
    const init = { code, key:keyValues[code] || code, bubbles:true, cancelable:true };
    const event = new KeyboardEvent(type, init);
    try { Object.defineProperties(event, { keyCode:{value:keyCodes[code] || 0}, which:{value:keyCodes[code] || 0} }); } catch (_) {}
    doc.dispatchEvent(event);
    const target = doc.getElementById('canvas') || doc.querySelector('canvas');
    if (target) {
      const copy = new KeyboardEvent(type, init);
      try { Object.defineProperties(copy, { keyCode:{value:keyCodes[code] || 0}, which:{value:keyCodes[code] || 0} }); } catch (_) {}
      target.dispatchEvent(copy);
    }
    focusGame();
  };
  const hold = (code, source) => { const sources = held.get(code) || new Set(); if (!sources.size) dispatchKey(code, 'keydown'); sources.add(source); held.set(code, sources); };
  const release = (code, source) => { const sources = held.get(code); if (!sources) return; sources.delete(source); if (!sources.size) { held.delete(code); dispatchKey(code, 'keyup'); } };
  const releaseAll = () => { [...held.keys()].forEach(code => dispatchKey(code, 'keyup')); held.clear(); pointerCodes.clear(); shell.querySelectorAll('.runtime-pad.is-active').forEach(button => button.classList.remove('is-active')); };
  shell.querySelectorAll('[data-key]').forEach(button => {
    const press = event => { if (event.pointerType === 'mouse' && event.button !== 0) return; event.preventDefault(); const code = button.dataset.key; button.classList.add('is-active'); button.setPointerCapture?.(event.pointerId); pointerCodes.set(event.pointerId, code); hold(code, `pointer-${event.pointerId}`); };
    const lift = event => { event.preventDefault(); const code = pointerCodes.get(event.pointerId); if (!code) return; release(code, `pointer-${event.pointerId}`); pointerCodes.delete(event.pointerId); if (![...pointerCodes.values()].includes(code)) button.classList.remove('is-active'); };
    button.addEventListener('pointerdown', press); button.addEventListener('pointerup', lift); button.addEventListener('pointercancel', lift); button.addEventListener('lostpointercapture', lift); button.addEventListener('contextmenu', event => event.preventDefault());
  });
  shell.querySelectorAll('[data-tap-key]').forEach(button => button.addEventListener('click', () => { const code = button.dataset.tapKey; dispatchKey(code, 'keydown'); window.setTimeout(() => dispatchKey(code, 'keyup'), 35); }));
  const restart = () => { const source = new URL(frame.getAttribute('src'), location.href); source.searchParams.set('fresh', Date.now()); frame.src = source.pathname.replace(/^.*\/(dist\/)/, '$1') + source.search; setStatus(`Restarting ${title}…`); };
  shell.querySelectorAll('[data-runtime-restart]').forEach(button => button.addEventListener('click', restart));
  shell.querySelectorAll('[data-runtime-focus]').forEach(button => button.addEventListener('click', focusGame));
  const resizeRuntime = () => { try { frame.contentWindow.dispatchEvent(new Event('resize')); } catch (_) {} focusGame(); };
  const fullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await playArea.requestFullscreen({ navigationUI:'hide' }); window.setTimeout(resizeRuntime, 120); } catch (error) { setStatus(`Fullscreen unavailable\n${error.message}`); } };
  shell.querySelectorAll('[data-runtime-fullscreen]').forEach(button => button.addEventListener('click', fullscreen));
  document.addEventListener('fullscreenchange', () => window.setTimeout(resizeRuntime, 120));
  frame.addEventListener('load', () => { focusGame(); window.setTimeout(() => setStatus(`READY\n${title} is running locally. Use keyboard, PSP touch controls or a gamepad.`), 300); });
  const primary = shell.querySelector('[data-gamepad-primary]')?.dataset.gamepadPrimary || 'Space';
  const states = { ArrowLeft:false, ArrowUp:false, ArrowRight:false, ArrowDown:false, [primary]:false };
  let pauseWasPressed = false;
  const updateGamepad = () => {
    const pad = Array.from(navigator.getGamepads?.() || []).find(Boolean);
    if (pad) {
      const next = { ArrowLeft:pad.axes[0] < -.35 || pad.buttons[14]?.pressed, ArrowUp:pad.axes[1] < -.35 || pad.buttons[12]?.pressed, ArrowRight:pad.axes[0] > .35 || pad.buttons[15]?.pressed, ArrowDown:pad.axes[1] > .35 || pad.buttons[13]?.pressed, [primary]:pad.buttons[0]?.pressed || pad.buttons[2]?.pressed };
      Object.entries(next).forEach(([code, active]) => { if (active !== states[code]) { states[code] = active; active ? hold(code, `gamepad-${code}`) : release(code, `gamepad-${code}`); } });
      const pause = pad.buttons[9]?.pressed || pad.buttons[3]?.pressed;
      if (pause && !pauseWasPressed) { dispatchKey('Escape', 'keydown'); window.setTimeout(() => dispatchKey('Escape', 'keyup'), 35); }
      pauseWasPressed = pause;
      if (controllerStatus) { controllerStatus.textContent = `Gamepad ready · ${pad.id.slice(0, 28)}${pad.id.length > 28 ? '…' : ''}`; controllerStatus.classList.add('is-gamepad'); }
    } else {
      Object.keys(states).forEach(code => { if (states[code]) { states[code] = false; release(code, `gamepad-${code}`); } });
      pauseWasPressed = false;
      if (controllerStatus) { controllerStatus.textContent = 'Touch ready · Gamepad waiting'; controllerStatus.classList.remove('is-gamepad'); }
    }
    requestAnimationFrame(updateGamepad);
  };
  window.addEventListener('gamepadconnected', focusGame); window.addEventListener('pagehide', releaseAll); document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  setStatus(`Starting ${title}…`); updateGamepad();
})();
