import { Main } from "./pages/Main"
import { ModalProvider } from "./components/library"
import { SettingsProvider } from "./components/context/SettingsContext"

function App() {
  return (
    <ModalProvider>
      <SettingsProvider>
        <Main />
      </SettingsProvider>
    </ModalProvider>
  )
}

export default App
