// @ts-ignore
const assetsWorker = new Worker('../core/service.js', {type: 'module'});

export {
    assetsWorker
}