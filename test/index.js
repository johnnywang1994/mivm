import { render, setup } from '../src';

// const Test = ({ jsx }) => (
//   <div>
//     Hello Test
//   </div>
// );

const Test = setup({
  data({ ref }) {
    const text = ref('Hello Msg');
    const increment = ref(function(e) {
      text.value = e.target.value;
    });
    return { text, increment };
  },
  render({ jsx }, state) {
    const { text, increment } = state;
    return (
      <div class="test">
        <input value={text.value} onInput={increment.value} />
        {text.value}
      </div>
    );
  }
});

console.log(Test);

const app = window.app = render(({ jsx }) => {
  return (
    <div
      id="app"
      class="lock"
    >
      <Test />
    </div>
  );
}).mount('#app');

// const root = render(({ jsx }) => {
//   return (
//     <div id="root">
//       <Test />
//     </div>
//   );
// }).mount('#root');
