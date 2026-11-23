import { useEffect, useState } from 'react'
import { Stage } from './components/Stage'
import { useGame } from './store/gameStore'
import { preloadAll } from './assets/manifest'
import { loadVoiceManifest, stopVoice } from './audio/voice'
import { music } from './audio/sfx'
import { stopListening } from './speech/recognition'
import { Welcome } from './screens/Welcome'
import { Menu } from './screens/Menu'
import { MapScreen } from './screens/MapScreen'
import { Rewards } from './screens/Rewards'
import { Settings } from './screens/Settings'
import { TeacherMode } from './screens/TeacherMode'
import { Garden } from './levels/Garden'
import { School } from './levels/School'
import { Toys } from './levels/Toys'
import { House } from './levels/House'
import { Volley } from './levels/Volley'
import { Talk } from './levels/Talk'

export default function App() {
  const screen = useGame((s) => s.screen)
  const reducedMotion = useGame((s) => s.settings.reducedMotion)
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadVoiceManifest()
    preloadAll((d, t) => setLoaded(d / t)).then(() => setReady(true))
    // returning players go straight to the menu
    if (useGame.getState().playerName) useGame.getState().go({ name: 'menu' })
  }, [])

  // stop speech / listening whenever the screen changes
  useEffect(() => {
    stopVoice()
    stopListening()
    music.refresh()
  }, [screen])

  let body: React.ReactNode = null
  if (!ready)
    body = (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(#e3d2f5, #bdeeea)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="title-font" style={{ fontSize: 64, fontWeight: 700, color: '#4a3a7a' }}>Alya&apos;s Dream House</div>
          <div style={{ width: 600, height: 34, borderRadius: 20, background: '#fff', margin: '30px auto', overflow: 'hidden', border: '4px solid #fff' }}>
            <div style={{ width: `${Math.round(loaded * 100)}%`, height: '100%', background: '#1f9c9c', transition: 'width 0.2s' }} />
          </div>
          <div className="title-font" style={{ fontSize: 30, color: '#4a3a7a' }}>Loading… {Math.round(loaded * 100)}%</div>
        </div>
      </div>
    )
  else
    switch (screen.name) {
      case 'welcome':
        body = <Welcome />
        break
      case 'menu':
        body = <Menu />
        break
      case 'map':
        body = <MapScreen />
        break
      case 'rewards':
        body = <Rewards />
        break
      case 'settings':
        body = <Settings back={screen.back} />
        break
      case 'teacher':
        body = <TeacherMode />
        break
      case 'level':
        body =
          screen.level === 'garden' ? <Garden /> : screen.level === 'school' ? <School /> : screen.level === 'toys' ? <Toys /> : screen.level === 'house' ? <House /> : screen.level === 'talk' ? <Talk /> : <Volley />
        break
    }
  return <Stage reducedMotion={reducedMotion}>{body}</Stage>
}
