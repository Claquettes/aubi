import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router';
import { ToastProvider } from './components/feedback/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  );
}
