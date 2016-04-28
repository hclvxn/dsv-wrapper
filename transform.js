// http://sinmpm09/CAisd/pdmweb2.exe
// http://sinupy12.go2uti.com:12345/apex/prod/f?p=140:16:14929461577347::NO:::

const atob = require('atob');
const http = require('http');
const httpProxy = require('http-proxy');
const jsdomLib = require('jsdom');
const R = require('ramda');
const Agent = require('agentkeepalive');
const connect = require('connect');
const transformProxy = require('transformer-proxy');

const jsdom = jsdomLib.jsdom;
const serializeDocument = jsdomLib.serializeDocument;

const app = connect();
// var host = 'sinmpy46';
var host = 'sinmpm09';

const agent = new Agent({
  maxSockets: 100,
  keepAlive: true,
  maxFreeSockets: 10,
  keepAliveMsecs:1000,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});

const proxy = httpProxy.createProxyServer({agent: agent});


const useProxyUrl = (data) => {
  console.log('modifying response');
  const doc = jsdom(data);
  const headNode = doc.querySelector('head');
  const scriptNode = doc.createElement('script');
  scriptNode.type = 'text/javascript';
  // scriptNode.text = 'alert("ohai casdm")';
  headNode.appendChild(scriptNode);
  // console.log('head', headNode.outerHTML);
  const html = serializeDocument(doc);
  // console.log(html);
  const hostMatch = html.match(/SINMPM\d+/i);
  console.log('sin present', html.match(/sin/i));
  if(hostMatch) {
    host = hostMatch[0];
    console.log('-------------- -------- new host', host);
  }
  const fixedHtml = html.replace(/sinmpm\d+/gi, 'localhost:7770');
  // console.log('---------------------------------------------');
  // console.log(fixedHtml);
  return fixedHtml;
};

const transformMiddleware = (data, req, res) => {
  console.log(data);
  console.log('location', res.getHeader('location'));
  // console.log('headers', res._headers);
  const ntlmHeader = res.getHeader('www-authenticate');
  console.log('ntlm', ntlmHeader);
  if(ntlmHeader && ntlmHeader.length == 1) {
    const encodedAuth = ntlmHeader[0].split(' ')[1];
    console.log('encoded', encodedAuth);
    const decoded = atob(encodedAuth);
    console.log('decoded', decoded);
  }
  if(res.getHeader('content-type') == 'text/html' && !req.url.match(/\.js$/)) {
    return useProxyUrl(data);
  }
  else return data;
};

proxy.on('proxyRes', (proxyRes, req, res, options) => {
  const key = 'www-authenticate';
  proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].split(',');
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
  proxyReq.headers = R.merge(req.headers, { host: host, referrer: 'http://' + host + '/' });
  proxyReq.url = req.url;
  console.log('proxied -> ' + proxyReq.method + ' ' + proxyReq.url);
});

app.use(transformProxy(transformMiddleware));
app.use((req, res) => {
  proxy.web(req, res, {target: 'http://' + host }, (e) => {
    console.error('error proxying', e);
  });
});

http.createServer(app).listen(7770);
console.log('listening on 7770');
