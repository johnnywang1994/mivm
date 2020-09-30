import { renderApp, setup } from '../src';

const Todo = setup({
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
      <div class="todo">
        <input value={text.value} onInput={increment.value} />
        {text.value}
      </div>
    );
  }
});

const app = window.app = renderApp({
  data({ reactive }) {
    const todoList = reactive([
      {
        id: 1,
        value: 'Test1',
      },
      {
        id: 2,
        value: 'Test2',
      },
      {
        id: 3,
        value: 'Test3',
      }
    ]);
    return { todoList };
  },
  render({ jsx }, state) {
    const { todoList } = state;
    const todoListNodes = todoList.map((todo) => <Todo key={`todo_${todo.id}`} />);
    return (
      <div
        id="app"
        class="lock"
      >
        <Todo>Test</Todo>
      </div>
    );
  }
}).mount('#app');

console.log(app.vnode);
