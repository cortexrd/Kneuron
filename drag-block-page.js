// Runs in page world before Knack loads to block drag and drop on sorted tables.
(function() {
    try {
        var settings = JSON.parse(localStorage.getItem('Kneuron')) || {};
        if (settings.tableSorting === 'false') return;

        var dragActive = false;
        var startY = 0;

        document.addEventListener('mousedown', function(e) {
            if (e.target.closest && e.target.closest('#objects-nav .vue-recycle-scroller__item-wrapper')) {
                e.stopImmediatePropagation();
                dragActive = true;
                startY = e.clientY;
            }
        }, true);

        document.addEventListener('mouseup', function() { dragActive = false; }, true);

        document.addEventListener('mousemove', function(e) {
            if (dragActive && Math.abs(e.clientY - startY) > 3) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);

        document.addEventListener('dragstart', function(e) {
            if (e.target.closest && e.target.closest('#objects-nav')) e.preventDefault();
        }, true);
    } catch(ex) {}
})();
