// http://sinupy12.go2uti.com:12345/apex/prod/f?p=140:16:14929461577347::NO:::
// http://sinupy12.go2uti.com:12345/apex/prod/f?p=140:LOGIN:14929461577347
// https://1view.go2uti.com/#!booking/123099826
// needed to allow us to proxy to https sources
const process = require('process');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const atob = require('atob');
const http = require('http');
const httpProxy = require('http-proxy');
const jsdomLib = require('jsdom');
const R = require('ramda');
const Agent = require('agentkeepalive');
// const connect = require('connect');
const express = require('express');
const transformProxy = require('transformer-proxy');

const jsdom = jsdomLib.jsdom;
const serializeDocument = jsdomLib.serializeDocument;

const app = express();
// var host = 'sinmpy46';
var host = 'sinupy12.go2uti.com';
var viewShipmentTemplateUrl = 'https://1view.go2uti.com/#!booking/';

const agent = new Agent({
  maxSockets: 100,
  keepAlive: true,
  maxFreeSockets: 10,
  keepAliveMsecs:1000,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});

const proxy = httpProxy.createProxyServer({agent: agent});
const apiProxy = httpProxy.createProxyServer({
  rejectUnauthorized: false,
  requestCert: true,
  https: true,
});

const addTooltip = (doc) => {
  const headNode = doc.querySelector('head');
  const scriptNode = doc.createElement('script');
  scriptNode.type = 'text/javascript';
  scriptNode.src = '/inject/finance-inject.js';
  headNode.appendChild(scriptNode);

  const linkNode = doc.createElement('link');
  linkNode.href = '/inject/finance-inject.css';
  linkNode.setAttribute('rel', 'stylesheet');
  headNode.appendChild(linkNode);
};

const useProxyUrl = (doc) => {
  const headNode = doc.querySelector('head');
  const scriptNode = doc.createElement('script');
  scriptNode.type = 'text/javascript';
  const nodes = doc.querySelectorAll(
    '[headers="SHIPMENT_NUMBER BREAK_OPERATIN_UNIT_1"]'
  );
  console.log('found ' + nodes.length + ' nodes');
  for(var i = 0; i < nodes.length; ++i) {
    var node = nodes.item(i);
    var shipmentNumber = node.innerHTML;
    node.innerHTML = '<a href="' + viewShipmentTemplateUrl + shipmentNumber +
      '">' + shipmentNumber + '</a>';
    console.log('new text', node.innerHTML);
  }
  headNode.appendChild(scriptNode);
};

const mutateHtml = (data) => {
  console.log('modifying response');
  const doc = jsdom(data);

  useProxyUrl(doc);
  addTooltip(doc);

  const html = serializeDocument(doc);
  const hostMatch = html.match(/sinpuy12\.go2uti\.com/i);
  if(hostMatch) {
    host = hostMatch[0];
    console.log('-------------- -------- new host', host);
  }
  const fixedHtml = html.replace(/sinpuy12\.go2uti\.com/gi, 'localhost:7770');
  return fixedHtml;
};

const transformMiddleware = (data, req, res) => {
  // console.log('location', res.getHeader('location'));
  const ntlmHeader = res.getHeader('www-authenticate');
  if(ntlmHeader && ntlmHeader.length == 1) {
    const encodedAuth = ntlmHeader[0].split(' ')[1];
    const decoded = atob(encodedAuth);
  }
  if(res.getHeader('content-type')
     && res.getHeader('content-type').match(/^text\/html/)
     && !req.url.match(/\.(js|gif)$/)) {
    return mutateHtml(data);
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
  // console.log('proxied -> ' + proxyReq.method + ' ' + proxyReq.url);
});

app.use('/inject', express.static('inject'));
app.use('/shipment', (req, res) => {
  apiProxy.web(req, res, {
    target: 'https://sinupq10.go2uti.com:8443/api/v1/shipment/',
    rejectUnauthorized: false,
    // ssl: true,
    // secure: false,
  }, (e) => {
    console.error('error proxying to shipment api', e);
  });
});

app.use(transformProxy(transformMiddleware));
app.use((req, res) => {
  proxy.web(req, res, {target: 'http://' + host + ':12345' }, (e) => {
    console.error('error proxying', e);
  });
});

http.createServer(app).listen(7770);
console.log('listening on 7770');
