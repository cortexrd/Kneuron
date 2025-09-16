// page-script.js - runs in page context, can access Knack
window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data.type !== 'GET_RECORD_COUNT') return;

    const { objectId } = event.data;

    if (!window.Knack?.Api) {
        window.postMessage({
            type: 'RECORD_COUNT_RESPONSE',
            objectId,
            error: 'Knack not available'
        }, '*');
        return;
    }

    try {
        const result = await Knack.Api.getRecords('object_' + objectId);
        window.postMessage({
            type: 'RECORD_COUNT_RESPONSE',
            objectId,
            count: result.total_records
        }, '*');
    } catch (error) {
        window.postMessage({
            type: 'RECORD_COUNT_RESPONSE',
            objectId,
            error: error.message
        }, '*');
    }
});