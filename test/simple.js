import { renderApp } from '../src';
import MyButton from './MyButton';

const app = renderApp({
  components: {
    MyButton
  },
  render({ html }) {
    return html`
      <div id="app">
        Hello app
        <br />
        <MyButton></MyButton>
      </div>
    `;
  }
}).mount('#app');

console.log(app);