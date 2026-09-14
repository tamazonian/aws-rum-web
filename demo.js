const failure = new Error('Example credential failure');
const warning = 'Could not get AWS credentials. RUM may be unable to send monitoring data.';
const fixed = document.body.dataset.version === 'after';
const status = document.getElementById('status');
let calls = 0;
let rejections = 0;
let warnings = 0;
let otherErrors = 0;
let finished = false;
function updateCounts() {
    document.getElementById('calls').textContent = calls;
    document.getElementById('rejections').textContent = rejections;
    document.getElementById('warnings').textContent = warnings;
}
function showResult() {
    updateCounts();
    status.dataset.result = 'inconclusive';
    if (otherErrors) {
        status.textContent = 'Another browser error occurred. This result is unclear.';
    } else if (calls === 1 && rejections === 1 && warnings === 0 && !fixed) {
        status.textContent = 'The problem happened: RUM left the error unhandled.';
        status.dataset.result = 'before';
    } else if (calls === 1 && rejections === 0 && warnings === 1 && fixed) {
        status.textContent = 'The fix worked: RUM handled the error.';
        status.dataset.result = 'after';
    } else if (!calls) {
        status.textContent = 'The test did not run. No access request was made.';
    } else if (rejections) {
        status.textContent = 'An error was left unhandled. This does not show a working fix.';
    } else {
        status.textContent = 'The result is unclear. This does not prove the fix worked.';
    }
}
window.addEventListener('unhandledrejection', event => {
    if (event.reason === failure) rejections++;
    else otherErrors++;
    updateCounts();
    if (finished) showResult();
});
window.addEventListener('error', () => {
    otherErrors++;
    if (finished) showResult();
});
const originalWarn = console.warn;
console.warn = function (...args) {
    if (args[1] === warning) {
        warnings++;
        updateCounts();
    }
    return Reflect.apply(originalWarn, console, args);
};
window.AwsRumClient = {
    n: 'cwr', i: '00000000-0000-4000-8000-000000000000', v: '1.0.0', r: 'us-east-1',
    c: { telemetries: [], allowCookies: false, enableRumClient: false, disableAutoPageView: true, debug: true },
    q: [{ c: 'setAwsCredentials', p: () => {
        calls++;
        updateCounts();
        status.textContent = 'Access failed as planned. Checking how RUM handles it...';
        return Promise.reject(failure);
    } }]
};
const sdk = document.createElement('script');
sdk.src = document.body.dataset.sdk;
sdk.onerror = () => {
    status.textContent = 'The test could not load. No result is available. Try refreshing the page.';
    status.dataset.result = 'load-error';
};
sdk.onload = () => {
    setTimeout(() => { finished = true; showResult(); }, 1000);
};
document.head.appendChild(sdk);
