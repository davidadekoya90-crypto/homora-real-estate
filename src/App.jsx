import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from './lib/supabase.js'
import { SiteLayout } from './components/SiteLayout.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ExplorePage } from './pages/ExplorePage.jsx'
import { PropertyPage } from './pages/PropertyPage.jsx'
import { CommunityPage } from './pages/CommunityPage.jsx'
import { SellPage } from './pages/SellPage.jsx'
import { AccountPage } from './pages/AccountPage.jsx'
import { MessagesPage } from './pages/MessagesPage.jsx'
import { ComparePage } from './pages/ComparePage.jsx'
import { Loading } from './components/Status.jsx'
import { getDemoSession, onDemoSession } from './lib/demoStore.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const shell = useRef(null)
  const location = useLocation()
  const [session, setSession] = useState(() => supabase ? null : getDemoSession())
  const [authReady, setAuthReady] = useState(!supabase)

  useEffect(() => {
    if (!supabase) return onDemoSession(setSession)
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthReady(true) })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.fromTo('.route-enter', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' })
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 90%', once: true } })
      })
    }, shell)
    return () => ctx.revert()
  }, [location.pathname])

  return <div ref={shell}><SiteLayout session={session}><Routes location={location} key={location.pathname}>
    <Route path="/" element={<HomePage session={session} />} />
    <Route path="/properties" element={<ExplorePage session={session} />} />
    <Route path="/properties/:id" element={<PropertyPage session={session} />} />
    <Route path="/community" element={<CommunityPage session={session} />} />
    <Route path="/messages" element={session ? <MessagesPage session={session} /> : <Navigate to="/sign-in" replace />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/sell" element={<SellPage session={session} />} />
    <Route path="/account" element={!authReady ? <section className="section-pad"><Loading label="Checking your account" /></section> : session ? <AccountPage session={session} /> : <Navigate to="/sign-in" replace />} />
    <Route path="/sign-in" element={<AccountPage session={session} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></SiteLayout></div>
}
