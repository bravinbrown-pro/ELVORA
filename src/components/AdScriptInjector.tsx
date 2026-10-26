import { useEffect } from 'react';

interface AdScriptInjectorProps {
  scriptSnippet?: string;
  isEnabled?: boolean;
}

export function AdScriptInjector({ scriptSnippet, isEnabled }: AdScriptInjectorProps) {
  useEffect(() => {
    if (!isEnabled || !scriptSnippet || !scriptSnippet.trim()) {
      return;
    }

    const injectedElements: HTMLElement[] = [];
    try {
      const container = document.createElement('div');
      container.innerHTML = scriptSnippet;

      const scripts = container.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        newScript.dataset.elvoraAdScript = 'true';
        document.head.appendChild(newScript);
        injectedElements.push(newScript);
      });
    } catch (err) {
      console.warn('AdScriptInjector execution note:', err);
    }

    return () => {
      injectedElements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [scriptSnippet, isEnabled]);

  return null;
}
