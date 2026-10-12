import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FileSystemProvider } from "@/context/FileSystemContext";

createRoot(document.getElementById('root')!).render(
  <FileSystemProvider>
    <App />
  </FileSystemProvider>
)
