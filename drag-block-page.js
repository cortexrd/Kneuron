// Runs in page world before Knack loads to block drag and drop on tables/pages.
// Tables: blocked at Med/High density, when sorted, or when filter is active.
// Pages: blocked when page sorting is enabled.
(function() {
    try {
        var settings = JSON.parse(localStorage.getItem('Kneuron')) || {};
        var density = settings.verticalDensity || 'normal';
        var blockTablesDensity = density !== 'normal';
        var blockTablesSorting = settings.tableSorting !== 'false';
        var blockPages = settings.pageSorting !== 'false';

        var dragActive = false;
        var startY = 0;

        function isTableFiltering() {
            var filterInput = document.querySelector('#incremental-filter-tables');
            return filterInput && filterInput.value.trim() !== '';
        }

        function isTableInScroller(e) {
            return e.target.closest && e.target.closest('#objects-nav .vue-recycle-scroller__item-wrapper');
        }

        function isPageBlocked(e) {
            return blockPages && e.target.closest && e.target.closest('#pages-nav ul');
        }

        // Mousedown: only block for static conditions (density/sorting) — not filter,
        // so clicks still work when filtering at Low density.
        document.addEventListener('mousedown', function(e) {
            if (!e.target.closest) return;
            var blocked = (isTableInScroller(e) && (blockTablesDensity || blockTablesSorting)) || isPageBlocked(e);
            if (blocked) {
                e.stopImmediatePropagation();
                dragActive = true;
                startY = e.clientY;
            }
        }, true);

        document.addEventListener('mouseup', function() { dragActive = false; }, true);

        document.addEventListener('mousemove', function(e) {
            if (!dragActive && isTableInScroller(e) && isTableFiltering()) {
                dragActive = true;
                startY = e.clientY;
            }
            if (dragActive && Math.abs(e.clientY - startY) > 3) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);

        document.addEventListener('dragstart', function(e) {
            if (!e.target.closest) return;
            if (e.target.closest('#objects-nav') && (blockTablesDensity || blockTablesSorting || isTableFiltering())) e.preventDefault();
            if (blockPages && e.target.closest('#pages-nav')) e.preventDefault();
        }, true);
    } catch(ex) {}
})();
