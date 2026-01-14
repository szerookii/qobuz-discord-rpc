import './app.css';

import { mount } from 'svelte';
import ToggleRpcButton from './toggle-rpc-button.svelte';

function injectButton() {
    const container = document.querySelector('.NavBarMenu__appearance');

    if (container && !document.getElementById('qobuz-rpc-toggle')) {
        const host = document.createElement('div');
        host.id = 'qobuz-rpc-toggle';
        host.style.display = 'flex';
        host.style.alignItems = 'center';

        container.appendChild(host);

        mount(ToggleRpcButton, { target: host });
    }
}

const observer = new MutationObserver(() => {
    injectButton();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

injectButton();