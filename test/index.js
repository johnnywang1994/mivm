import { render, setup } from '../src';

// const Test = ({ jsx }) => (
//   <div>
//     Hello Test
//   </div>
// );

const Test = setup({
  data({ ref }) {
    const msg = ref('Hello Msg');
    return { msg };
  },
  render({ jsx }, state) {
    return (
      <div>
        {state.msg.value}
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
      <Test id="test" />
    </div>
  );
}).mount('#app');
