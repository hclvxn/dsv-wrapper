// this file is intended to be injected and run from the browser
'use strict';

var tooltipContainer;
var tooltip;

var followMouse = function(e) {
  var e = e || window.event;
  var x = e.clientX + 5;
  var y = e.clientY + 5;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  console.log(x, y);
};

var createTooltip = function() {
  tooltipContainer = document.createElement('div');
  tooltipContainer.innerHTML = '<dl class="tooltip">' +
    '<dt>Shipment Number</dt>' +
    '<dd data-id="shipment-number">2341256</dd>' +
    '<dt>Mode</dt>' +
    '<dd data-id="mode">Air</dd>' +
  '</dl>';
  tooltipContainer.classList.add('tooltip-container');
  document.body.appendChild(tooltipContainer);
  console.log('tooltip created');
  tooltip = tooltipContainer.querySelector('.tooltip');
  // setTimeout(function() { tooltip.classList.add('show'); }, 500);
};

var setChildText = function(parent, dataId, data) {
  var node = parent.querySelector('[data-id="' + dataId + '"]');
  node.innerText = data;
};

var showQuickShipmentInfo = function(event) {
  var shipmentNumber = event.target.innerText;
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function() {
    var result = JSON.parse(xhr.responseText);
    tooltip.classList.remove('remove');
    setTimeout(function() { tooltip.classList.add('show'); }, 1);
    setChildText(tooltip, 'shipment-number', result.shipmentNumbers[0]);
    setChildText(tooltip, 'mode', result.shipmentNumbers);
  });
  // xhr.open('GET', 'https://sinupq10.go2uti.com:8443/api/v1/shipment/' +
  // xhr.withCredentials = true;
  xhr.open('GET', 'https://clientportal.tester@gmail.com:FooBar1@sinupq10.go2uti.com:8443/api/v1/shipment/' +
  // xhr.open('GET', '/shipment/' +
           shipmentNumber + '?shipmentFormat=' +
           // 'DETAILS',
           'SUMMARY',
           true,
           'clientportal.tester@gmail.com',
           'FooBar1'
          );
  var auth = 'clientportal.tester@gmail.com:FooBar1';
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(auth));
  xhr.send(null);
  tooltip.classList.remove('show');
};

var hookQuickShipmentInfo = function() {
  var shipmentNumberNodes = document.querySelectorAll(
    '[headers="SHIPMENT_NUMBER BREAK_OPERATIN_UNIT_1"]'
  );

  for(var i = 0; i < shipmentNumberNodes.length; ++i) {
    shipmentNumberNodes.item(i).onmouseover = showQuickShipmentInfo;
  };
}

window.onload = function() {
  createTooltip();
  // document.body.onmousemove = followMouse;
  hookQuickShipmentInfo();
}
