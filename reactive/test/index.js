console.log(jReactive);
const { reactive, watchEffect } = jReactive;
const data = reactive({
  msg: 'Hello World',
})

watchEffect(() => {
  console.log(data.msg);
});
