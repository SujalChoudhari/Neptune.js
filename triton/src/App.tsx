import { Main } from "./pages/Main"
import { ModalProvider } from "./components/library"
import { SettingsProvider } from "./components/context/SettingsContext"
import { GameProvider } from "./context/GameContext"

function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <ModalProvider>
          <Main />
        </ModalProvider>
      </GameProvider>
    </SettingsProvider>
  )
}

export default App
