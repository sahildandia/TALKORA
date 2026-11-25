import { useEffect, useState, type FormEvent } from 'react';
import { db } from './lib';

type ChatRow = { session_id: string; created_at: string; user_a: string; user_b: string; active_members: number };

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('dandiasahil@gmail.com');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  async function load() {
    if (!db) return;
    const { data, error: e } = await db.rpc('tk_admin_list_chats');
    if (e) throw e;
    setRows((data ?? []) as ChatRow[]);
  }
  useEffect(() => {
    if (!db) return;
    let alive = true;
    void db.auth.getSession().then(async ({ data }) => {
      if (!alive || !data.session || data.session.user.email?.toLowerCase() !== 'dandiasahil@gmail.com') return;
      try { await load(); if (alive) setSignedIn(true); } catch { if (alive) void db?.auth.signOut(); }
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setInterval(() => { void load().catch(e => setError(e.message)); }, 4000);
    return () => window.clearInterval(timer);
  }, [signedIn]);

  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (!db) throw new Error('Chat service unavailable.');
      if (email.trim().toLowerCase() !== 'dandiasahil@gmail.com') throw new Error('This email is not authorized.');
      const { error: e } = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (e) throw e;
      await load();
      setSignedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    setBusy(true); setError(''); setNotice('');
    try {
      if (!db) throw new Error('Chat service unavailable.');
      if (email.trim().toLowerCase() !== 'dandiasahil@gmail.com') throw new Error('This email is not authorized.');
      const { error: e } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (e) throw e;
      setNotice('Password reset link sent. Open the email and choose your password, then return here to sign in.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send password reset link.'); }
    finally { setBusy(false); }
  }
  async function stop(id: string) {
    if (!db || !window.confirm('Stop this conversation?')) return;
    setBusy(true); setError('');
    try {
      const { error: e } = await db.rpc('tk_admin_stop_chat', { p_session_id: id });
      if (e) throw e;
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not stop chat.'); }
    finally { setBusy(false); }
  }
  async function logout() { await db?.auth.signOut(); setSignedIn(false); setRows([]); setPassword(''); }

  return <section style={{width:'min(760px, calc(100% - 32px))',margin:'auto',padding:'26px 0',color:'var(--text)'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
      <div><div style={{fontSize:10,letterSpacing:2,color:'var(--muted)'}}>TALKORA CONTROL CENTER</div><h2 style={{fontSize:28,marginTop:8}}>Admin portal</h2></div>
      <button className="button secondary" onClick={onClose}>Close</button>
    </div>
    {!signedIn ? <div className="start-card" style={{maxWidth:440,margin:'auto'}}>
      <p style={{fontSize:13,color:'var(--muted)',marginBottom:18}}>Admin sign-in</p>
      <form onSubmit={login} style={{display:'grid',gap:12}}>
        <label style={{fontSize:12}}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="username" style={{padding:13,borderRadius:10,border:'1px solid var(--line)',background:'var(--bg)',color:'var(--text)'}}/>
        <label style={{fontSize:12}}>Password</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required autoComplete="current-password" style={{padding:13,borderRadius:10,border:'1px solid var(--line)',background:'var(--bg)',color:'var(--text)'}}/>
        <button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <button type="button" className="text-button" disabled={busy} onClick={()=>void resetPassword()} style={{marginTop:14}}>Set / reset password by email</button>
    </div> : <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><p style={{fontSize:12,color:'var(--muted)'}}>Managing Talkora + StrangerTalk · {rows.length} active chats</p><button className="button secondary" onClick={()=>void logout()}>Sign out</button></div>
      {rows.length ? <div style={{display:'grid',gap:10}}>{rows.map(row=><article key={row.session_id} className="start-card" style={{display:'flex',alignItems:'center',gap:12,justifyContent:'space-between',flexWrap:'wrap'}}>
        <div style={{minWidth:0}}><strong style={{fontSize:13}}>Active conversation</strong><p style={{fontSize:11,color:'var(--muted)',marginTop:6}}>Started {new Date(row.created_at).toLocaleString()} · {row.active_members}/2 connected</p><p style={{fontSize:10,color:'var(--muted)',marginTop:4}}>ID: {row.session_id.slice(0,8)}…</p></div>
        <button className="button secondary" disabled={busy} onClick={()=>void stop(row.session_id)}>Stop chat</button>
      </article>)}</div> : <div className="start-card" style={{textAlign:'center',color:'var(--muted)',fontSize:13}}>No active conversations right now.</div>}
    </>}
    {notice ? <p role="status" style={{color:'var(--muted)',fontSize:12,marginTop:14}}>{notice}</p> : null}
    {error ? <p role="alert" style={{color:'#d88',fontSize:12,marginTop:14}}>{error}</p> : null}
  </section>;
}
