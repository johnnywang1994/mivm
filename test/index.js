import { renderApp } from '../src';

const app = renderApp({
  render() {
    return /*html*/`
      <div id="app">
        Hello World
      </div>
    `;
  },
}).mount('#app');

console.log(app);


