const { mount, h, patch } = JVN;

const vnode1 = h('div', {
  attrs: {
    id: 'app',
    class: 'lock'
  },
}, [
  h('p', 'new P content'),
  h('div', {
    on: {
      click() {
        console.log('Clicked1');
      }
    }
  }, 'Text Content'),
]);

const vnode2 = h('div', {
  attrs: {
    id: 'app',
    class: 'lock'
  },
}, [
  'Hello Johnny',
  h('p', 'new P content'),
  h('div', {
    on: {
      click() {
        console.log('Clicked2');
      }
    }
  }, 'Text Content'),
  h('input', {
    attrs: {
      type: 'text'
    },
    on: {
      input() {
        console.log(this.value);
      }
    }
  })
]);

const app = mount(vnode1, '#app');
setTimeout(() => {
  patch(vnode1, vnode2);
  console.log(vnode1);
}, 2000);

console.log(vnode1);
