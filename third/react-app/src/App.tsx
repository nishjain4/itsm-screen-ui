import { Gate } from './features/gate/Gate'
import { AppShell } from './features/shell/AppShell'
import { useApp } from './state/AppState'

export default function App() {
  const { role } = useApp()
  return (
    <>
      <a
        href="#main"
        className="fixed -top-16 left-3 z-[2000] rounded-md bg-primary px-3.5 py-2 font-semibold text-white transition-[top] focus:top-3"
      >
        Skip to main content
      </a>
      {role ? <AppShell /> : <Gate />}
    </>
  )
}
