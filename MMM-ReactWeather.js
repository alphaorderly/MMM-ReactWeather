/**
 * MagicMirror2 Module: mmm-reactweather
 * Integrates a React front-end (Vite dev server or built bundle) into MagicMirror.
 */

Module.register("MMM-ReactWeather", {
  defaults: {
    updateInterval: 60 * 1000,
    dev: false 
  },

  start() {
    this._isDev = this.config.dev === true;
    this._scriptsInjected = false;
    Log.info(`[mmm-reactweather] Start mode=${this._isDev ? "DEV(watch)" : "PROD(build)"}`);
    // In dev (watch) mode: use updateInterval to poll the built bundle and force reload when it changes.
    if (this._isDev) {
      this._lastBundleSig = null;
      const interval = this.config.updateInterval || 60 * 1000;
      this._devPollTimer = setInterval(() => this._devPollBundle(), interval);
      Log.info(`[mmm-reactweather] Dev poll started (interval=${interval}ms)`);
    }
  },

  getStyles() {
    // Both dev (watch) and prod use built CSS file.
    return [this.file("dist/index.css")];
  },

  // In watch dev mode we still load the built dist/index.js (rebuilt continuously by vite build --watch)
  _injectWatch(wrapper, rootId) {
    if (document.querySelector(`script[data-mmm-reactweather-entry="${rootId}"]`)) {
      Log.info("[mmm-reactweather] Watch script already injected");
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = this.file("dist/index.js");
    script.dataset.mmmReactsampleEntry = rootId;
    script.onerror = () => Log.error("[mmm-reactweather] Failed to load dist/index.js (watch). Run 'yarn dev' (watch build) first.");
    wrapper.appendChild(script);
    Log.info("[mmm-reactweather] Watch script injected (dist/index.js)");
    // Optional simple polling to detect rebuild and force reload if hash changes (disabled by default)
  },

  _injectProd(wrapper, rootId) {
    if (document.querySelector(`script[data-mmm-reactweather-entry="${rootId}"]`)) {
      Log.info("[mmm-reactweather] Prod script already injected");
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = this.file("dist/index.js");
    script.dataset.mmmReactsampleEntry = rootId;
    script.onerror = () => Log.error("[mmm-reactweather] Failed to load dist/index.js. Run 'yarn build'.");
    wrapper.appendChild(script);
    Log.info("[mmm-reactweather] Prod script injected (dist/index.js)");
  },

  getDom() {
    const rootId = `${this.identifier}_react_root`;
    const wrapper = document.createElement("div");
    wrapper.className = "mmm-reactweather-wrapper";

    const root = document.createElement("div");
    root.id = rootId;
    root.className = "mmm-reactweather-root";
    // Expose module config to React via data attribute
    try {
      root.dataset.config = JSON.stringify(this.config || {});
    } catch (e) {
      // Fallback: minimal safe string
      root.dataset.config = '{}';
      Log.error("[mmm-reactweather] Failed to stringify config", e);
    }
    // Placeholder to visualize before React mounts
    root.innerHTML = '<div style="color:#888;font-size:12px;">[mmm-reactweather] Mounting...</div>';
    wrapper.appendChild(root);

    if (!this._scriptsInjected) {
      if (this._isDev) this._injectWatch(wrapper, rootId); else this._injectProd(wrapper, rootId);
      this._scriptsInjected = true;
    }

    return wrapper;
  }
  ,

  stop() {
    // Clean timers when MagicMirror stops / module unloaded
    if (this._devPollTimer) {
      clearInterval(this._devPollTimer);
      this._devPollTimer = null;
    }
  },

  _devPollBundle() {
    // Fetch the current dist bundle with a cache-busting query to detect changes.
    const url = this.file("dist/index.js") + `?t=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then(r => r.text())
      .then(txt => {
        // Lightweight signature: length + simple keyword count
        const kwMatches = txt.match(/import|export|React/g) || [];
        const sig = `${txt.length}:${kwMatches.length}`;
        if (this._lastBundleSig && this._lastBundleSig !== sig) {
          Log.info("[mmm-reactweather] Detected dist/index.js change -> reloading window");
          // Full window reload ensures fresh module evaluation & React remount.
          location.reload();
        }
        this._lastBundleSig = sig;
      })
      .catch(err => {
        Log.error("[mmm-reactweather] Dev poll fetch failed", err);
      });
  }
});
