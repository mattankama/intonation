import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Design-system tokens, in the order design-system/README.md prescribes.
import '../design-system/tokens/fonts.css';
import '../design-system/tokens/colors.css';
import '../design-system/tokens/typography.css';
import '../design-system/tokens/spacing.css';
import '../design-system/tokens/shape.css';
import '../design-system/tokens/base.css';
import './styles/app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
