# Mivm

A tiny mvvm library for fun. Use snabbdom.js for virtual dom.

This plugin is just built for learning & memoing purpose.

Do not use in your production.


## Install

``` bash
$ npm install mivm
$ yarn add mivm
```


## Usage

### Create root app

Use `renderApp` with a function or options to create root app, then mount it to DOM.

```js
import { renderApp } from 'mivm';

const app = renderApp(({ html }) =>
  html`<div id="app">Hello App</div>`
).mount('#app');
```


### Create component

Use `setup` to create a component for compiler to deal with.

Components can be used with options `components`, then used in `render` function.

```js
// MyButton
import { setup } from 'mivm';

export default setup(
  ({ html }) => html`<button>My Button</button>`
);
```

```js
// Use in root
import { renderApp } from 'mivm';
import MyButton from './MyButton';

const app = renderApp({
  components: {
    MyButton
  },
  render({ html }) {
    return html`
      <div id="app">
        Hello App
        <MyButton></MyButton>
      </div>
    `;
  }
}).mount('#app');
```

```js
// Use in another component
import { setup } from 'mivm';
import MyButton from './MyButton';

export default setup({
  components: {
    MyButton,
  },
  render({ html }) {
    // ...
  }
})
```


### Create reactive state

Use `data` option with `ref`, `reactive`, `watchEffect` function, then return them.

get returned object by render function's 2nd argument.

```js
import { setup } from 'mivm';

export default setup({
  data({ ref }) {
    const msg = ref('World');
    return { msg };
  },
  render({ html }, state) {
    // get state
    const { msg } = state;
    return html`
      <div class="message">
        Hello ${msg.value}
      </div>
    `;
  }
});
```


### Add event

Add event with `@` startWith, eg. `@click`, `@input`, `@keyup`

```js
export default setup({
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
      <div>
        This is Test: ${inputText.value}
        <input value="${inputText.value}" @input="${inputHandler}" />
      </div>
    `;
  }
});
```


## Demo

Use parceljs for example

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div id="app"></div>

  <script src="index.js"></script>
</body>
</body>
</html>
```

```js
// index.js
import { renderApp, setup } from 'mivm';

// component 1
const Test = setup({
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
      <div class="test">
        This is Test: ${inputText.value}
        <input value="${inputText.value}" @input="${inputHandler}" />
      </div>
    `;
  }
});

// component 2
const Test2 = setup(({ html }) => html`
  <div class="test2">Hello Test2</div>
`);

const app = renderApp({
  components: {
    Test,
    Test2
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
```