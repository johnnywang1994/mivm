import { renderApp, setup } from '../src';

const Test = setup(({ html }) => html`
  <div class="test">Hello Test2</div>
`);

const Test2 = setup({
  components: {
    Test
  },
  data({ ref }) {
    const inputText = ref('');
    const inputHandler = function(e) {
      inputText.value = e.target.value;
    };
    return { inputText, inputHandler };
  },
  render({ html }, state) {
    const { inputText, inputHandler } = state;
    return html`
      <div class="test2">
        This is Test: ${inputText.value}
        <input value="${inputText.value}" @input="${inputHandler}" />
        <Test></Test>
      </div>
    `;
  }
});

const app = renderApp({
  components: {
    Test2,
  },
  data({ ref }) {
    const count = ref(0);
    const increment = () => {
      count.value += 1;
    };
    return { count, increment };
  },
  render({ html }, state) {
    return html`
      <div id="app">
        ${state.count.value}
        <p @click="${state.increment}">Hello World</p>
        <Test></Test>
        <Test2></Test2>
      </div>
    `;
  },
}).mount('#app');

console.log(app);


// return h('div', {
//   attrs: {
//     id: 'app'
//   }
// }, [
//   state.count.value,
//   h('p', {
//     on: {
//       click: state.increment
//     }
//   }, 'Hello World')
// ]);