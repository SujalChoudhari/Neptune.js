import { Main } from "./pages/Main"
import { ModalProvider } from "./components/library"

function App() {
  return (
    <ModalProvider>
      <Main />
    </ModalProvider>
  )
}

export default App
