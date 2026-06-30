var fs = require('fs');
var p = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\AccountingServices.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');
for (var i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('use client') !== -1) {
    lines.splice(i+1, 0, '', 'import React, { useState, useRef, useCallback } from "react";');
    console.log('Inserted React import at line ' + (i+3));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done');
