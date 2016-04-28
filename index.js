const http = require('http');
const httpProxy = require('http-proxy');
const jsdomLib = require('jsdom');
const R = require('ramda');
const Agent = require('agentkeepalive');
const connect = require('connect');


const jsdom = jsdomLib.jsdom;
const serializeDocument = jsdomLib.serializeDocument;

const agent = new Agent({
  maxSockets: 100,
  keepAlive: true,
  maxFreeSockets: 10,
  keepAliveMsecs:1000,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});

const app = connect();

const proxy = httpProxy.createProxyServer({agent: agent});

var host = 'sinmpy46';

const modifyResponse = (response, next, f) => {
  var _end = response.end;
  var chunks;
  var _writeHead = response.writeHead;
  var _write = response.write;

  // const bufferedBody = new Buffer(0);
  // bufferedBody.write(newBody);

  response.writeHead = function(){
    if( proxyRes.headers && proxyRes.headers[ 'content-length' ] ){
      /*
      response.setHeader(
        'content-length',
        // parseInt( proxyRes.headers[ 'content-length' ], 10 ) + scriptElm.length
        // bufferedBody.length
      );
      */
    }

    // This disables chunked encoding
    response.setHeader( 'transfer-encoding', '' );

    // Disable cache for all http as well
    response.setHeader( 'cache-control', 'no-cache' );

    _writeHead.apply( this, arguments );
  };

  response.write = function( data ) {
    if( chunks ) {
      chunks += data;
    } else {
      chunks = data;
    }
  };

  response.end = function(data, encoding) {
    const newData = f(data);
    // console.log('writing new body', newBody);
    // if( chunks && chunks.toString ) {
    //   _end.apply( response, [ newBody ] );
    // } else {
    //   _end.apply( response, arguments );
    // }
    // if( chunks && chunks.toString ) {
      _write.apply( this, newData );
    // }
    const bufferedBody = new Buffer(newData);
    console.log(typeof bufferedBody);
    _end.apply(this, bufferedBody );

    next();
  };
}

proxy.on('proxyRes', (proxyRes, req, res, options) => {
  // console.log('got proxied response');
  console.log('status', res.statusCode);

  const key = 'www-authenticate';
  proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].split(',');

  // const chunks = [];
  proxyRes.on('data', (chunk) => {
    // chunks.push(chunk);
  });

  proxyRes.on('end', () => {
    // console.log('done with response data');
    // console.log('response headers', proxyRes.headers);
    // console.log('-------- location header --------', proxyRes.headers.location);

  });
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
  // console.log('sending headers', proxyReq.headers);
  // console.log('client headers', req.headers);
  proxyReq.headers = R.merge(req.headers, { host: host, referrer: 'http://' + host + '/' });
  proxyReq.url = req.url;
  console.log('proxied -> ' + proxyReq.method + ' ' + proxyReq.url);
});

const proxyMiddleware = (req, res, next) => {
  console.log(req.method + ' ' + req.url);
  // if(!req.headers['authorization']) {
  //   console.log('not authenticated, asking the user for basic auth');
  //   res.statusCode = 401;
  //   // res.setHeader('WWW-Authenticate', 'Basic');
  //   res.setHeader('WWW-Authenticate', ['NTLM', 'Negociate']);
  //   res.end();
  // }
  // else {
  // console.log('authenticated, performing proxy');
  // console.log('auth', req.headers['authorization']);
  // proxy.web(req, res, { target: 'http://eitsd.go2uti.com/'})
  console.log('proxy to ', host);
  // proxy.web(req, res, { target: 'http://' + host + '/CAisd/pdmweb.exe'}, (e) => {
  proxy.web(req, res, { target: 'http://' + host }, (e) => {
    console.error('error proxying', e);
  });
  // }
  // next();
};


const modifyRedirectPost = (req, res, next) => {
  // const body = Buffer.concat(chunks).toString();
  // console.log('body', body);
  // console.log('content type', proxyRes.headers['content-type']);
  console.log(res.getHeader('content-type'));
  console.log(res.headers);
  console.log(res._headers);
  // if(res.headers && res.headers['content-type'] == 'text/html') {
  if(res.getHeader('content-type') == 'text/html') {
    console.log('content type', res.headers['content-type']);
    // res.write(fixedHtml);
    modifyResponse(res, next, (data) => {
      console.log('modifying response');
      const doc = jsdom(data);
      const headNode = doc.querySelector('head');
      const scriptNode = doc.createElement('div');
      headNode.appendChild(scriptNode);
      const html = serializeDocument(doc);
      // console.log(html);
      const hostMatch = html.match(/SINMPM\d+/i);
      if(hostMatch) {
        host = hostMatch[0];
        console.log('-------------- -------- new host', host);
      }
      const fixedHtml = html.replace(new RegExp(host, 'gi'), 'localhost:7770');
      // console.log('---------------------------------------------');
      console.log(fixedHtml);
      return fixedHtml;
    });
  }
};

app.use(proxyMiddleware);
app.use(modifyRedirectPost);

http.createServer(app).listen(7770);
console.log('listening on 7770');
