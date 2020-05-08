"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var assetsWorker = new Worker('../core/service.js', { type: 'module' });
exports.assetsWorker = assetsWorker;
