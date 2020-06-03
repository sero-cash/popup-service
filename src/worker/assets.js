"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetsWorker = void 0;
// @ts-ignore
var assetsWorker = new Worker('../core/service.js', { type: 'module' });
exports.assetsWorker = assetsWorker;
//# sourceMappingURL=assets.js.map