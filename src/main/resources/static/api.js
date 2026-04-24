/**
 * api.js  —  REST client for lifeOS Spring Boot backend.
 * Replaces the IndexedDB layer.  All functions return Promises.
 */

const API = (() => {
  const BASE = '/api';

  async function req(method, path, body) {
    const opts = {
      method,
      credentials: 'include',   // send session cookie with every request
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (res.status === 401) {
      window.location.href = '/login.html';
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // Generic CRUD helpers
  const get    = path          => req('GET',    path);
  const put    = (path, body)  => req('PUT',    path, body);
  const del    = path          => req('DELETE', path);

  // ── Entity endpoints ─────────────────────────────────

  return {
    // Areas
    getAreas:      ()     => get('/areas'),
    saveArea:      (a)    => put(`/areas/${a.id}`, a),
    deleteArea:    (id)   => del(`/areas/${id}`),

    // Activities
    getActivities:    ()  => get('/activities'),
    saveActivity:     (a) => put(`/activities/${a.id}`, a),
    deleteActivity:   (id)=> del(`/activities/${id}`),

    // Projects
    getProjects:   ()     => get('/projects'),
    saveProject:   (p)    => put(`/projects/${p.id}`, p),
    deleteProject: (id)   => del(`/projects/${id}`),

    // Tasks
    getTasks:      ()     => get('/tasks'),
    saveTask:      (t)    => put(`/tasks/${t.id}`, t),
    deleteTask:    (id)   => del(`/tasks/${id}`),

    // Routines
    getRoutines:   ()     => get('/routines'),
    saveRoutine:   (r)    => put(`/routines/${r.id}`, r),
    deleteRoutine: (id)   => del(`/routines/${id}`),

    // Events
    getEvents:     ()     => get('/events'),
    saveEvent:     (e)    => put(`/events/${e.id}`, e),
    deleteEvent:   (id)   => del(`/events/${id}`),

    // Periods
    getPeriods:    ()     => get('/periods'),
    savePeriod:    (p)    => put(`/periods/${p.id}`, p),
    deletePeriod:  (id)   => del(`/periods/${id}`),

    // Balance
    getBalance:    ()     => get('/balance'),
    saveBalance:   (b)    => put(`/balance/${b.id}`, b),
    deleteBalance: (id)   => del(`/balance/${id}`),

    // Actions
    getActions:         ()            => get('/actions'),
    getActionsByDate:   (date)        => get(`/actions?date=${date}`),
    getActionsByRange:  (from, to)    => get(`/actions?from=${from}&to=${to}`),
    getActionDates:     ()            => get('/actions/dates'),
    saveAction:         (a)           => put(`/actions/${a.id}`, a),
    deleteAction:       (id)          => del(`/actions/${id}`),

    // Score
    getDayScore:   (date)        => get(`/score/day/${date}`),
    getRangeScore: (from, to)    => get(`/score/range?from=${from}&to=${to}`),

    // Agenda suggestions
    getSuggestions: (date) => get(`/agenda/suggest/${date}`),

    // Auth
    logout: () => fetch('/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(() => { window.location.href = '/login.html'; }),

  };
})();
