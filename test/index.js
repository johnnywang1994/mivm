console.log(Mivm);
const { setup, reactive } = Mivm;

const data = reactive({
  msg: 'Hello World',
  test() {
    console.log(this);
  }
})

const app = setup((h) => {
  return h('div', {
    on: {
      click: data.test,
    }
  }, data.msg);
})

app.mount('#app');
