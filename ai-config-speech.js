export function createSpeechController({ state, els, setLanguagePreference, setStatus }) {
  let speechRecognizer = null;

  function makeRecognizer() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = state.langPreference === 'th' ? 'th-TH' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    return rec;
  }

  function stop() {
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (err) { console.warn('STT stop issue', err); }
    }
  }

  function toggle() {
    if (state.isListening) {
      stop();
      return;
    }
    speechRecognizer = makeRecognizer();
    if (!speechRecognizer) {
      setStatus('Speech recognition is not supported in this browser.', 'error');
      return;
    }
    state.isListening = true;
    if (els.sttBtn) els.sttBtn.classList.add('is-listening');
    setStatus('Listening...');

    speechRecognizer.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript && els.input) {
        els.input.value = transcript.trim();
        const hasThai = /[\u0E00-\u0E7F]/.test(transcript);
        if (hasThai && state.langPreference !== 'th') {
          setLanguagePreference('th');
          setStatus('Detected Thai speech; instructions will be in Thai, outputs stay in English.');
        } else if (!hasThai && state.langPreference !== 'en') {
          setLanguagePreference('en');
          setStatus('Detected English speech; instructions will stay in English.');
        }
      }
      setStatus('Captured voice input.');
    };

    speechRecognizer.onerror = () => {
      setStatus('Could not capture speech. Try again.', 'error');
    };

    speechRecognizer.onend = () => {
      state.isListening = false;
      if (els.sttBtn) els.sttBtn.classList.remove('is-listening');
      if (!state.isBusy && els.sttBtn) {
        els.sttBtn.disabled = false;
      }
      if (!state.isBusy) {
        setStatus('Listening stopped.');
      }
    };

    speechRecognizer.start();
  }

  return { toggle, stop };
}
