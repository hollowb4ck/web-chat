const expess = require('express');

const app = expess();
const port = 3000;

app.use(expess.static('public'));

app.use('/scripts', expess.static(`${__dirname}/node_modules/`));

app.use('/styles', expess.static(`${__dirname}/node_modules/`));

app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

app.listen(port, () => {
  console.log('server start:', port)
});