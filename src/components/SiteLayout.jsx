import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, Home, Menu, Moon, Sun, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { getTheme, setTheme } from '../lib/marketplaceTools.js'

export function SiteLayout({ children, session }) {
  const [open, setOpen] = useState(false)
  const [theme, setCurrentTheme] = useState(getTheme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const close = () => setOpen(false)
  return <>
    <header className="site-header">
      <Link className="wordmark" to="/" onClick={close}><span className="brand-mark"><Home size={15} /></span> HOMORA<span className="wordmark-dot">.</span></Link>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
        <NavLink to="/properties" onClick={close}>Discover</NavLink><NavLink to="/community" onClick={close}>Community</NavLink>{session && <NavLink to="/messages" onClick={close}>Messages</NavLink>}<NavLink to="/sell" onClick={close}>For professionals</NavLink>
      </nav>
      <div className="header-actions">{!supabase && <span className="demo-mode-pill">DEMO</span>}<button className="theme-toggle" onClick={() => { const next = theme === 'light' ? 'dark' : 'light'; setCurrentTheme(setTheme(next)) }} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</button><Link className="login-btn" to={session ? '/account' : '/sign-in'}>{session ? 'My account' : 'Sign in'}</Link><Link className="header-cta" to="/sell">List a property <ArrowUpRight size={15} /></Link></div>
    </header>
    <main>{children}</main>
    <footer className="footer"><div className="footer-main"><Link className="wordmark footer-brand" to="/"><span className="brand-mark"><Home size={15} /></span> HOMORA<span className="wordmark-dot">.</span></Link><p>A more human way to find your place<br />and meet the people behind it.</p><div className="footer-social"><a href="mailto:hello@homora.example" aria-label="Email HOMORA">✉</a><Link to="/community" aria-label="Community">↗</Link></div></div><div className="footer-links"><div><b>DISCOVER</b><Link to="/properties">Homes for sale</Link><Link to="/properties?mode=rent">Homes to rent</Link><Link to="/community">Community</Link></div><div><b>WORK WITH US</b><Link to="/sell">List a property</Link><Link to="/sell">Agents and businesses</Link><Link to="/sign-in">Create an account</Link></div><div><b>THE SMALL PRINT</b><a href="mailto:privacy@homora.example">Privacy</a><a href="mailto:hello@homora.example">Terms &amp; support</a><span>Transactions completed with your chosen legal and financial professionals.</span></div></div><div className="footer-bottom"><span>© 2026 HOMORA · A product in progress</span><span>Designed for people and places.</span><a href="#top">Back to top ↑</a></div></footer>
  </>
}
