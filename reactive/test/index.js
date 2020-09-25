console.log(jReactive);
const { reactive } = jReactive;
const data = reactive({
  msg: 'Hello World',
})
data.msg = 'wow';