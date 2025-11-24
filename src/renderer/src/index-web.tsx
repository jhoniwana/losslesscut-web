import { Suspense, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';

import '@fontsource/open-sans/300.css';
import '@fontsource/open-sans/300-italic.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/400-italic.css';
import '@fontsource/open-sans/500.css';
import '@fontsource/open-sans/500-italic.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/600-italic.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/700-italic.css';
import '@fontsource/open-sans/800.css';
import '@fontsource/open-sans/800-italic.css';

import App from './App.web';
import './i18n.web';

import './main.css';

enableMapSet();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find root element');

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </StrictMode>
);
