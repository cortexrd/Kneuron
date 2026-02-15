//Kneuron extension by Cortex R&D Inc.

function injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

const ERROR_COLOR = '#e7c8e2';

const css = `
[data-tippy-root]:not(:has(.kn-help-tip)) {
    display: none !important;
}

@keyframes highlightElement {
    0% { box-shadow: inset 0 0 0 2px #45003a; }
    50% { box-shadow: inset 0 0 10px 2px #45003a; }
    100% { box-shadow: inset 0 0 0 2px #45003a; }
}

.highlight-before-click {
    animation: highlightElement 0.3s ease-in-out;
}

#pages-toolbox form > div textarea {
   height: 300px;
}

#pages-toolbox form > div .redactor-editor {
   max-height: 30em;
   height: 30em;
}

#objects-nav .vue-recycle-scroller__item-view {
    transform: none !important;
    position: relative !important;
}

#objects-nav .vue-recycle-scroller.kneuron-filtering .vue-recycle-scroller__item-view {
    display: none !important;
}
#objects-nav .vue-recycle-scroller.kneuron-filtering .vue-recycle-scroller__item-view.kneuron-filter-match {
    display: block !important;
}

#records-history .kn-table-element {
    height: 78vh;
}

#records-history .kn-table-element thead th {
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
}

.idTextStyle {
    color: #9b9b9b !important;
    font-size: small;
    font-weight: 400 !important;
    white-space: pre;
    font-family: Inter,sans-serif;
}

.truncate-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 20px;
    transition: all 0.5s ease;
}

/* Target both types of spans */
#kn-records-table .kn-table-cell.truncate-cell span[index],
div.kn-view .kn-table-cell.truncate-cell span {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 20px;
}

.truncate-cell.open {
    overflow: visible;
    white-space: normal;
    background: white;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding-bottom: 25px;
    max-height: 500px;
    opacity: 1;
}

/* Reset spans when cell is open */
#kn-records-table .kn-table-cell.truncate-cell.open span[index] {
    white-space: normal;
    overflow: visible;
    max-height: none;
}

.truncate-cell .view-more-btn {
    position: absolute;
    right: 5px;
    bottom: 0px;
    transform: none;
    color: blue;
    text-decoration: none;
    cursor: pointer;
    font-size: 12px;
    z-index: 101;
    background: inherit;
    padding: 5px 5px 0 5px;
}

.monaco-list:not(.equation-editor .monaco-list) .monaco-list-rows {
  background-color: #efeaed !important;
}
.monaco-list:not(.equation-editor .monaco-list) .monaco-list-row:hover:not(.selected):not(.focused) {
 background-color: #fff5fa !important;
}
.monaco-list:not(.equation-editor .monaco-list) .monaco-list-row.focused {
 background-color: #edd5e1 !important;
}
.quick-input-list .monaco-keybinding > .monaco-keybinding-key {
 color: black !important;
}
.form-wrapper .kn-input-rich_text .redactor-editor{
    max-height: 500px !important;
}

.kn-table-element tbody tr:hover {
    box-shadow: inset 0 0 8px 1px rgba(245, 143, 228, 0.3);
}
.kn-table-element tbody tr:hover td {
    background-color: rgba(255, 209, 248, 0.06) !important;
}
.kn-table-element tbody tr:hover td.kneuron-sticky {
    background-color: #fffcfe !important;
    box-shadow: inset 0 8px 8px -7px rgba(245, 143, 228, 0.3), inset 0 -8px 8px -7px rgba(245, 143, 228, 0.3);
}
`;
injectCSS(css);

function getSettings() {
    try { return JSON.parse(localStorage.getItem('Kneuron')) || {}; } catch { return {}; }
}

function setSetting(key, value) {
    const s = getSettings();
    s[key] = value;
    localStorage.setItem('Kneuron', JSON.stringify(s));
}


function applyVerticalDensity(level) {
    let densityCSS = '';
    if (level === 'medium') {
        densityCSS = `
            #objects-nav .nav-item a { padding-top: 0.15rem !important; padding-bottom: 0.15rem !important; }
            .kn-table-element td { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; line-height: 1.4 !important; }
        `;
    } else if (level === 'maximum') {
        densityCSS = `
            #objects-nav .nav-item a { padding-top: 0 !important; padding-bottom: 0 !important; }
            .kn-table-element td { padding-top: 0.10rem !important; padding-bottom: 0.10rem !important; line-height: 1.2 !important; }
        `;
    }
    let styleEl = document.getElementById('kneuron-density-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'kneuron-density-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = densityCSS;
    fixScrollerPool();
}
applyVerticalDensity(getSettings().verticalDensity || 'normal');

// Force the vue-recycle-scroller to render all items by temporarily expanding its wrapper,
// then let CSS min-height:auto shrink it back. The pool keeps all rendered items.
// The scroller renders with Vue's default min-height (items*40px), so all items get
// valid translateY values. We sort DOM elements by translateY to fix display order
// (since CSS transform:none makes DOM order = visual order), then shrink the wrapper
// with a CSS !important rule that persists against Vue's inline style resets.
function fixScrollerPool() {
    const wrapper = document.querySelector('#objects-nav .vue-recycle-scroller__item-wrapper');
    if (!wrapper) return;
    // Remove the shrink rule so the scroller renders at full height with all items positioned
    let fixStyle = document.getElementById('kneuron-scroller-fix');
    if (fixStyle) fixStyle.textContent = '';
    setTimeout(() => {
        const items = Array.from(wrapper.querySelectorAll('.vue-recycle-scroller__item-view'));
        items.sort((a, b) => {
            const getY = (el) => {
                const m = el.style.transform.match(/translateY\((-?\d+)px\)/);
                if (!m) return Infinity;
                const y = parseInt(m[1]);
                return y < 0 ? Infinity : y;
            };
            return getY(a) - getY(b);
        });
        items.forEach(item => wrapper.appendChild(item));
        if (!fixStyle) {
            fixStyle = document.createElement('style');
            fixStyle.id = 'kneuron-scroller-fix';
            document.head.appendChild(fixStyle);
        }
        fixStyle.textContent = '#objects-nav .vue-recycle-scroller__item-wrapper { min-height: auto !important; }';
    }, 200);
}

// Generic MutationObserver to watch for HTML changes and take action.
const genericObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            if (mutation.target.querySelector('#sidebar-nav ul')) {
                reorderNavItems();
            }

            if (mutation.target.querySelector('.toggle-content:not(.auto-open-processed)')) {
                autoExpandHiddenTogglers();
            }

            if (mutation.target.querySelector('.kn-table-element:not(.reduce-processed)')) {
                reduceGrids();
            }

            if (mutation.target.querySelector('.kn-list-items:not(.reduce-processed)')) {
                reduceLists('.kn-list-items');
            }

            if (mutation.target.querySelector('.kn-search-list-wrapper:not(.reduce-processed)')) {
                reduceLists('.kn-search-list-wrapper');
            }

            if (mutation.target.querySelector('#objects-nav h3.text-emphasis')) {
                addTablesFilter();
                fixScrollerPool();
            }

            if (mutation.target.querySelector('#view-add-items')) {
                addFieldsFilter();
            }

            if (mutation.target.querySelector('#connection-objects a[content="Edit this connection!"]:not(.filter-icon-added)')) {
                addConnectionFilterIcons();
            }

            if (mutation.target.querySelector('select[data-cy="movecopy-select"]:not(.filter-processed)')) {
                addMoveCopyViewFilter();
                mutation.target.querySelector('select[data-cy="movecopy-select"]').classList.add('filter-processed');
            }

            if (mutation.target.querySelector('h3[data-cy="page-filter-menu"]:not(.filter-processed)')) {
                addPagesFilter();
                addPageSortToggle();
                mutation.target.querySelector('h3[data-cy="page-filter-menu"]').classList.add('filter-processed');
            }

            if (mutation.target.querySelector('.vue-recycle-scroller__item-view .nav-item:not(:has(.idTextStyle))')) {
                addIDsToElements('.vue-recycle-scroller__item-view .nav-item', 'id', '.label, .transition');
            }

            if (mutation.target.querySelector('.page-list-sortable .nav-item:not(:has(.idTextStyle))')) {
                addIDsToElements('.page-list-sortable .nav-item', 'data-key', '.name span');
            }

            if (mutation.target.querySelector('.view[data-view-key]:not(:has(.idTextStyle))')) {
                addIDsToElements('.view[data-view-key]', 'data-view-key', 'h2');
            }

            if (mutation.target.querySelector('.kn-table-element td:not(.truncate-cell)')) {
                truncateCellText();
            }

            if (mutation.target.querySelector('[id^=object-li-object_].nav-item:not(.record-count-processed)')) {
                if (window.location.href.includes('/records/')) {
                    addRecordCounts();
                }
            }

            if (mutation.target.querySelector('[data-cy="add-filters"]:not(.stickyCols-processed)')) {
                if (window.location.href.includes('/records/')) {
                    addStickyColsInput();
                }
            }

            if (mutation.target.querySelector('#records-body-wrapper table:not(.kneuronStickyColumns)')) {
                if (window.location.href.includes('/records/')) {
                    const colCount = parseInt(getSettings().stickyCols || '0');
                    if (colCount > 0) {
                        applyStickyCols(colCount + 2);
                    }
                }
            }

            if (mutation.target.querySelector('li[id^="page-link-scene_"]:not(.sorted)')) {
                if (pageSortingEnabled) {
                    sortPages();
                }
                mutation.target.querySelectorAll('li[id^="page-link-scene_"]').forEach(item => {
                    item.classList.add('sorted');
                });
            }
        }
    });
});

// Start observing the document body for changes
genericObserver.observe(document.body, {
    childList: true,
    subtree: true
});

async function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(`Timeout waiting for element: ${selector}`);
        }, timeout);

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function reorderNavItems() {
    const sidebarNav = document.querySelector('#sidebar-nav ul');
    if (!sidebarNav) return;

    const order = [
        'Data',
        'Pages',
        'Tasks',
        'Flows',
        'Settings',
        'Data Model'
    ];

    const items = Array.from(sidebarNav.querySelectorAll('li'));
    const sortedItems = [];

    order.forEach(name => {
        const item = items.find(li => li.textContent.trim() === name);
        if (item) {
            sortedItems.push(item);
        }
    });

    sortedItems.forEach(item => sidebarNav.appendChild(item));
}

function highlightAndClick(element) {
    if (!element) return;

    element.classList.add('highlight-before-click');
    element.focus();
    setTimeout(() => {
        element.classList.remove('highlight-before-click');
        element.click();
    }, 300);
}

document.addEventListener('keydown', async function (event) {
    const activeElement = document.activeElement;
    const knackSearch = document.querySelector('input[type="search"]');

    // First check if we're in an input field
    if (event.altKey &&
        event.code.startsWith('Digit') &&
        event.code.replace('Digit', '') >= 1 &&
        event.code.replace('Digit', '') <= 5) {
        if ((activeElement.tagName === 'INPUT' && !activeElement.id.startsWith('incremental-filter-') && activeElement !== knackSearch) ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable) {
            return; // Exit early, allowing default Alt+number behavior
        }
    }

    let element;
    let keyPressed = event.code;

    if (keyPressed === 'Enter') {
        if (document.querySelector('.multiselect--active')) //Allow Enter in a dropdown.
            return;

        element = document.querySelector('[data-cy=confirm]')
            || document.querySelector('.kn-popover .knButton[type=submit]')
            || document.querySelector('[data-cy=save-filters]')
            || document.querySelector('[data-cy=save]')
            || document.querySelector('[data-cy=save-view-add]')
            || document.querySelector('[data-cy=add-view-wizard-continue]')
            || document.querySelector('a.save')
            || document.querySelector('.kn-input[type=submit]');

        //If on a multi-line object...
        const isMultiLineInput = event.target.tagName === 'TEXTAREA' || !!event.target.closest('.redactor-editor');
        if (isMultiLineInput && !event.ctrlKey) {
            //Just enter: let it insert its line break
            return;
        } else if (isMultiLineInput && event.ctrlKey) {
            //Ctrl+Enter: Save if we're on a multiline object.
            //Exceptions:
            //  1- if in the Javascript or CSS editor(Use Alt + S in that case)
            //  2- if we're on a redactor-editor, where ctrl+enter can't be trapped.  So we need to click save with the mouse.
            if (element) {
                if (!!element.closest('#settings-js') || !!element.closest('#settings-css')) {
                    return; //Ignore Enter in the Javascript and CSS editors.  Use Alt-S to save, see below KeyS.
                }
            }
        }

        event.preventDefault();
    } else if (keyPressed === 'Escape') {
        const tablesFilter = document.querySelector('#incremental-filter-tables');
        if (tablesFilter && tablesFilter.value) {
            tablesFilter.value = '';
            tablesFilter.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(() => {
                const activeTable = document.querySelector('#objects-nav .router-link-active a');
                if (activeTable) {
                    activeTable.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }, 100);
            return;
        }
        element = document.querySelector('[data-cy=cancel]')
            || document.querySelector('.modal_close')
            || document.querySelector('a.cancel')
            || document.querySelector('.header_close')
            || document.querySelector('a:has(.icon-close)');
    } else if (event.altKey) {
        if (keyPressed.includes('Digit')) {
            keyPressed = keyPressed.replace('Digit', '');
        }

        if (keyPressed >= 1 && keyPressed <= 6) {
            let pageIndex = Number(keyPressed);
            element = document.querySelector(`#sidebar-nav li:nth-child(${pageIndex}) a`);

            //This is to prevent the annoying message "You have unsaved changes" that keeps popping up for no reason.
            if (pageIndex === 4) {
                setTimeout(async () => {
                    try {
                        const cancelButton = await waitForElement('a.cancel');
                        cancelButton && cancelButton.click();
                    } catch (error) { }
                }, 0);
            }
        } else if (['KeyW', 'KeyE', 'KeyR'].includes(keyPressed)) {
            const tabLinks = document.querySelectorAll('.tabLink');
            let tabIndex = ['KeyW', 'KeyE', 'KeyR'].indexOf(keyPressed);
            if (tabLinks[tabIndex]) {
                event.preventDefault();
                element = tabLinks[tabIndex];
            }
        } else if (keyPressed === 'Backquote') {
            element = document.querySelector('.toolbox-back') || document.querySelector('.ast-button');
        } else if (['KeyQ', 'KeyA', 'KeyZ', 'KeyX'].includes(keyPressed)) {
            let toolIndex = ['KeyQ', 'KeyA', 'KeyZ', 'KeyX'].indexOf(keyPressed) + 1;
            element = document.querySelector(`[data-cy=toolbox-links] li:nth-child(${toolIndex}) a`);
            if (element) {
                highlightAndClick(element);
            } else {
                //Go back to view's settings.
                element = document.querySelector('.is-active a.settings');
                if (element) highlightAndClick(element);
                try {
                    const toolboxSelector = `[data-cy=toolbox-links] li:nth-child(${toolIndex}) a`;
                    await waitForElement(toolboxSelector);
                    element = document.querySelector(toolboxSelector);
                } catch (error) {
                    console.error('Error encountered in key processing:', error);
                    return;
                }
            }
        } else if (keyPressed === 'KeyS') {
            event.preventDefault(); //Prevent the added "ß" char on Mac.

            //Does three things, depending on context:
            // 1- Activate the Settings toolbox, when a view is selected
            // 2- Puts cursor on the Filter box when it is visible, or on Knack's Field Filter (toggling between both)
            // 3- Click on Save, when Javascript or CSS editor is active
            const tablesFilter = document.querySelector('#incremental-filter-tables');
            const fieldsFilter = document.querySelector('.input-box.filter-input input');
            const recordsSearch = document.querySelector('#kn-records-table .recordsNav_search input');
            if (activeElement === tablesFilter && (fieldsFilter || recordsSearch)) {
                element = fieldsFilter || recordsSearch;
            } else if ((activeElement === fieldsFilter || activeElement === recordsSearch) && tablesFilter) {
                element = tablesFilter;
            } else {
                element = document.querySelector('[id^=incremental-filter-]')
                    || fieldsFilter
                    || recordsSearch
                    || document.querySelector('.is-active a.settings')
                    || document.querySelector('[data-testid="save-code-btn"]')
                    || document.querySelector('input[type="search"]');
            }
        } else if (keyPressed === 'KeyM') {
            toggleDividerMinMax();
        }
    }

    if (element) highlightAndClick(element);
});

//Auto-detect closed "togglers" and open them.  We have them in list views' settings.
async function autoExpandHiddenTogglers() {
    try {
        await waitForElement('.toggle-content:not(.auto-open-processed)');

        const hiddenToggles = Array.from(document.querySelectorAll('.toggle-content:not(.auto-open-processed)')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.visibility === 'hidden' || style.maxHeight === '0px';
        });

        hiddenToggles.forEach(toggle => {
            const wrapper = toggle.closest('.toggle-wrapper');
            const trigger = wrapper.querySelector('.toggle-trigger');
            trigger.click();
            toggle.classList.add('auto-open-processed');
        });
    } catch (error) { }
}

async function reduceGrids() {
    try {
        await waitForElement('.kn-table-element:not(.reduce-processed)');

        document.querySelectorAll('#pages .kn-table-element:not(.reduce-processed)').forEach(table => {
            table.classList.add('reduce-processed');

            let groupCount = 0;
            let rowsPerGroupCount = 0;

            table.querySelectorAll('tbody tr').forEach(row => {
                if (row.classList.contains('kn-table-group')) {
                    groupCount++;
                    rowsPerGroupCount = 0;

                    if (groupCount === 2) {
                        row.style.opacity = '75%';
                    } else if (groupCount === 3) {
                        row.style.opacity = '50%';
                    } else if (groupCount >= 4) {
                        row.style.display = 'none';
                    }
                } else if (!row.classList.contains('kn-table-totals')) {
                    if (groupCount > 3) {
                        row.style.display = 'none';
                    } else {
                        rowsPerGroupCount++;

                        if (rowsPerGroupCount === 2) {
                            row.style.opacity = '50%';
                        } else if (rowsPerGroupCount === 3) {
                            row.style.opacity = '25%';
                        } else if (rowsPerGroupCount >= 4) {
                            row.style.display = 'none';
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error in reduceGrids:', error);
    }
}

async function reduceLists(selector) {
    try {
        await waitForElement(`#pages ${selector}:not(.reduce-processed)`);

        document.querySelectorAll(`#pages ${selector}:not(.reduce-processed)`).forEach(list => {
            list.classList.add('reduce-processed');
            let listCount = 0;
            list.querySelectorAll('#pages .list-item-wrapper').forEach(listRecord => {
                listCount++;
                if (listCount === 1) {
                    listRecord.style.opacity = '50%';
                } else if (listCount === 2) {
                    listRecord.style.opacity = '25%';
                } else if (listCount >= 3) {
                    listRecord.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error('Error in reduceLists:', error);
    }
}

function addTablesFilter() {
    const tablesTitle = document.querySelector('#objects-nav h3.text-emphasis');
    if (tablesTitle && !document.querySelector('#incremental-filter-tables')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter tables...';
        searchInput.style.marginLeft = '30px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '8px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.style.width = '140px';
        searchInput.id = 'incremental-filter-tables';

        let currentFocusIndex = 0;
        let currentSelectionIndex = -1;
        let searchEmpty = true;
        let tableScroller;
        let filterObserver = null;

        function startFilterObserver() {
            if (filterObserver) return;
            const wrapper = document.querySelector('#objects-nav .vue-recycle-scroller__item-wrapper');
            if (!wrapper) return;
            filterObserver = new MutationObserver(() => {
                filterObserver.disconnect();
                filterListItems(searchInput.value);
                filterObserver.observe(wrapper, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            });
            filterObserver.observe(wrapper, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }

        function stopFilterObserver() {
            if (filterObserver) {
                filterObserver.disconnect();
                filterObserver = null;
            }
        }

        searchInput.addEventListener('focus', () => {
            const filteredListItems = getFilteredListItems(searchEmpty);
            updateListItemFocusStyles(currentFocusIndex, currentSelectionIndex, filteredListItems);
        });

        searchInput.addEventListener('input', (e) => {
            document.querySelector('.left-toolbox').scrollTop = 0;
            tableScroller = document.querySelector('.vue-recycle-scroller');

            const hasMatches = filterListItems(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;

            searchEmpty = e.target.value === "";
            if (tableScroller) tableScroller.classList.toggle('kneuron-filtering', !searchEmpty);
            if (searchEmpty) stopFilterObserver(); else startFilterObserver();
            const filteredListItems = getFilteredListItems(searchEmpty);

            const sampleItem = filteredListItems[0] || document.querySelector('#objects-nav .nav-item');
            const itemHeight = sampleItem ? sampleItem.offsetHeight || 42 : 42;
            const calculatedHeight = filteredListItems.length * itemHeight;

            // Adjust scroller styles
            tableScroller.style.height = searchEmpty ? 'unset' : `${calculatedHeight}px`;
            tableScroller.style.overflow = searchEmpty ? 'unset' : 'hidden';

            currentFocusIndex = 0;
            updateListItemFocusStyles(currentFocusIndex, currentSelectionIndex, filteredListItems);
        });

        searchInput.addEventListener('keydown', (e) => {
            const filteredListItems = getFilteredListItems(searchEmpty);
            currentFocusIndex = handleFilterKeydown(e, {
                filteredListItems,
                currentFocusIndex,
                currentSelectionIndex,
                onFocusChange: updateListItemFocusStyles,
                tableScroller
            });
        });

        searchInput.addEventListener('blur', () => {
            const filteredListItems = getFilteredListItems(searchEmpty);
            updateListItemFocusStyles(-1, currentSelectionIndex, filteredListItems);
        });

        tablesTitle.appendChild(searchInput);
    }

    function filterListItems(searchText) {
        const listItems = document.querySelectorAll('[id^=object-li-object_].nav-item, [id^=role-object-nav-object_].nav-item');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;

        listItems.forEach(item => {
            const spanContent = item.querySelector('span[content]')?.textContent || '';
            const isMatch = spanContent.toLowerCase().includes(searchLower);
            item.style.display = isMatch ? 'block' : 'none';
            item.style.position = isMatch ? 'relative' : 'absolute';
            item.style.height = isMatch ? '' : '0';
            item.style.margin = isMatch ? '' : '0';
            item.style.padding = isMatch ? '' : '0';
            const itemView = item.closest('.vue-recycle-scroller__item-view');
            if (itemView) itemView.classList.toggle('kneuron-filter-match', isMatch);
            if (isMatch) matchFound = true;
        });

        return matchFound;
    }
}

function addMoveCopyViewFilter() {
    const selectElement = document.querySelector('select[data-cy="movecopy-select"]');
    if (selectElement && !document.querySelector('#incremental-filter-movecopy')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter pages...';
        searchInput.style.marginBottom = '10px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '8px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.style.width = '100%';
        searchInput.id = 'incremental-filter-movecopy';

        const resultsPopup = document.createElement('div');
        resultsPopup.id = 'filter-results-popup';
        resultsPopup.style.position = 'absolute';
        resultsPopup.style.maxHeight = '200px';
        resultsPopup.style.top = '84px';
        resultsPopup.style.overflowY = 'auto';
        resultsPopup.style.backgroundColor = 'white';
        resultsPopup.style.border = '1px solid #ccc';
        resultsPopup.style.borderRadius = '8px';
        resultsPopup.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        resultsPopup.style.zIndex = '1000';
        resultsPopup.style.display = 'none';
        resultsPopup.style.width = 'max-content';

        searchInput.addEventListener('input', (e) => {
            const hasMatches = filterOptions(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;

            resultsPopup.style.display = e.target.value ? 'block' : 'none';
        });

        searchInput.addEventListener('keydown', (e) => {
            handleFilterKeydown(e, {
                resultsPopup
            });
        });

        const container = document.createElement('div');
        container.style.position = 'relative';
        container.appendChild(searchInput);
        container.appendChild(resultsPopup);
        selectElement.parentNode.insertBefore(container, selectElement);
    }

    function filterOptions(searchText) {
        const options = document.querySelectorAll('select[data-cy="movecopy-select"] option');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;
        let matchingResults = [];

        options.forEach(option => {
            const optionText = option.textContent || '';
            const isMatch = optionText.toLowerCase().includes(searchLower);
            option.style.display = isMatch ? '' : 'none';
            if (isMatch) {
                matchFound = true;
                matchingResults.push(optionText);
            }
        });

        const resultsPopup = document.querySelector('#filter-results-popup');
        if (resultsPopup) {
            resultsPopup.innerHTML = matchingResults.map(text =>
                `<div style="font-size: medium; padding: 5px 10px; cursor: pointer; hover:background-color: #f5f5f5;">${text}</div>`
            ).join('');

            resultsPopup.querySelectorAll('div').forEach((div, index) => {
                div.addEventListener('mouseover', () => {
                    div.style.backgroundColor = '#f5f5f5';
                });
                div.addEventListener('mouseout', () => {
                    div.style.backgroundColor = 'white';
                });
                div.addEventListener('click', () => {
                    const options = Array.from(document.querySelectorAll('select[data-cy="movecopy-select"] option'));
                    const matchingOption = options.find(opt => opt.textContent === div.textContent);
                    if (matchingOption) {
                        matchingOption.selected = true;
                        resultsPopup.style.display = 'none';
                        const selectElement = document.querySelector('select[data-v-6eadacf6]');
                        if (selectElement) {
                            selectElement.value = matchingOption.value;
                            const event = new Event('change', { bubbles: true });
                            selectElement.dispatchEvent(event);
                        }
                    }
                });
            });
        }

        return matchFound;
    }
}

function addPagesFilter() {
    const filterTitle = document.querySelector('h3[data-cy="page-filter-menu"]');
    if (filterTitle && !document.querySelector('#incremental-filter-pages')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filter pages...';
        searchInput.style.marginLeft = '10px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '8px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.style.width = '110px';
        searchInput.id = 'incremental-filter-pages';

        let currentFocusIndex = 0;
        let currentSelectionIndex = -1;

        function getFilteredPageItems() {
            return Array.from(document.querySelectorAll('li[data-cy="page-link-item"]'))
                .filter(item => item.style.display !== 'none');
        }

        function updatePageFocusStyles(focusIndex, selectionIndex, items) {
            items.forEach(item => {
                const anchor = item.querySelector('a');
                if (anchor) {
                    anchor.style.removeProperty('background-color');
                    anchor.style.removeProperty('box-shadow');
                }
            });
            if (focusIndex >= 0 && focusIndex < items.length && focusIndex !== selectionIndex) {
                const focusedItem = items[focusIndex];
                const anchor = focusedItem?.querySelector('a');
                if (anchor) {
                    anchor.style.setProperty('background-color', 'rgba(251, 239, 249, 1)', 'important');
                    anchor.style.setProperty('box-shadow', 'inset 0 0 0 1px #962783', 'important');
                    focusedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        }

        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        searchInput.addEventListener('click', (e) => e.stopPropagation());

        searchInput.addEventListener('focus', () => {
            const filteredItems = getFilteredPageItems();
            updatePageFocusStyles(currentFocusIndex, currentSelectionIndex, filteredItems);
        });

        searchInput.addEventListener('input', (e) => {
            const hasMatches = filterPages(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
            currentFocusIndex = 0;
            const filteredItems = getFilteredPageItems();
            updatePageFocusStyles(currentFocusIndex, currentSelectionIndex, filteredItems);
        });

        searchInput.addEventListener('keydown', (e) => {
            const filteredItems = getFilteredPageItems();
            currentFocusIndex = handleFilterKeydown(e, {
                filteredListItems: filteredItems,
                currentFocusIndex,
                currentSelectionIndex,
                onFocusChange: updatePageFocusStyles,
                onEscape: () => {
                    setTimeout(() => {
                        const activePage = document.querySelector('.page-list-sortable .router-link-active');
                        if (activePage) {
                            activePage.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }
                    }, 100);
                }
            });
        });

        searchInput.addEventListener('blur', () => {
            const filteredItems = getFilteredPageItems();
            updatePageFocusStyles(-1, currentSelectionIndex, filteredItems);
        });

        filterTitle.appendChild(searchInput);
    }

    function filterPages(searchText) {
        const searchLower = searchText.toLowerCase();
        let matchFound = false;

        function showParents(element) {
            let current = element;
            while (current) {
                if (current.style) {
                    current.style.display = '';
                }

                if (current.tagName === 'LI') {
                    const childContainer = current.querySelector('ul.page-list-sortable');
                    if (childContainer) {
                        childContainer.style.display = '';
                    }
                }

                current = current.parentElement;
                if (current && current.tagName === 'UL') {
                    current = current.parentElement;
                }
            }
        }

        function processPageItem(item) {
            const nameElement = item.querySelector('.name');
            const pageText = nameElement ? nameElement.textContent || '' : '';
            const isMatch = pageText.toLowerCase().includes(searchLower);

            let childrenMatch = false;
            const childList = item.querySelector('ul.page-list-sortable');
            if (childList) {
                const childItems = childList.querySelectorAll(':scope > li[data-cy="page-link-item"]');
                childItems.forEach(childItem => {
                    if (processPageItem(childItem)) {
                        childrenMatch = true;
                    }
                });
            }

            const shouldShow = isMatch || childrenMatch;

            if (shouldShow) {
                showParents(item);
                matchFound = true;
                item.style.display = '';
                if (childList) {
                    childList.style.display = '';
                }
            } else {
                item.style.display = 'none';
                if (childList) {
                    childList.style.display = 'none';
                }
            }

            return shouldShow;
        }

        if (!searchText) {
            document.querySelectorAll('li[data-cy="page-link-item"], ul.page-list-sortable').forEach(el => {
                el.style.display = '';
            });
            return true;
        }

        const topLevelItems = document.querySelectorAll('ul.page-list-sortable > li[data-cy="page-link-item"]');
        topLevelItems.forEach(processPageItem);

        return matchFound;
    }
}

function addFieldsFilter() {
    const fieldTabs = document.querySelector('#view-add-items>div.buttonFilter');
    if (!fieldTabs || document.querySelector('#incremental-filter-fields')) {
        return;
    }

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Filter fields...';
    searchInput.style.marginLeft = '30px';
    searchInput.style.padding = '2px 5px';
    searchInput.style.fontSize = '14px';
    searchInput.style.borderRadius = '8px';
    searchInput.style.border = '1px solid #ccc';
    searchInput.style.height = '35px';
    searchInput.style.width = '140px';
    searchInput.id = 'incremental-filter-fields';
    searchInput.classList.add('filter-input');

    searchInput.addEventListener('input', (e) => {
        document.querySelector('#pages .toolbox-body').scrollTop = 0;
        const hasMatches = filterListItems(e.target.value);
        searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
    });

    searchInput.addEventListener('keydown', (e) => {
        handleFilterKeydown(e);
    });

    fieldTabs.appendChild(searchInput);

    function filterListItems(searchText) {
        const connectionsElement = document.querySelector('[data-cy=connections]');
        const connectionsIsActive = connectionsElement && connectionsElement.classList.contains('is-active');
        const listItems = connectionsIsActive ? document.querySelectorAll('div.items-wrapper') : document.querySelectorAll('.view-add-item');
        const searchLower = searchText.toLowerCase();
        let matchFound = false;

        listItems.forEach(item => {
            if (connectionsIsActive) {
                const addItemsList = item.querySelectorAll('.view-add-item');
                let childMatchFound = false;

                addItemsList.forEach(addItem => {
                    if (filterItem(addItem, searchLower)) {
                        matchFound = true;
                        childMatchFound = true;
                    }
                });
                if (childMatchFound) {
                    const expandButton = item.querySelector('.expandableList_trigger:not(.open)');
                    expandButton && expandButton.click();
                }
                item.style.display = childMatchFound ? 'block' : 'none';
            } else {
                if (filterItem(item, searchLower)) {
                    matchFound = true;
                }
            }
        });

        return matchFound;
    }

    function filterItem(item, searchLower) {
        const spanContent = item.querySelector('span').textContent || '';
        const isMatch = spanContent.toLowerCase().includes(searchLower);

        item.style.display = isMatch ? 'block' : 'none';
        item.style.position = isMatch ? 'relative' : 'absolute';
        item.style.height = isMatch ? '' : '0';
        item.style.margin = isMatch ? '' : '0';
        item.style.padding = isMatch ? '' : '0';

        return isMatch;
    }
}

function addIDsToElements(elementSelector, idAttribute, textSelector) {
    const elements = document.querySelectorAll(`${elementSelector}:not(:has(.idTextStyle))`);
    elements.forEach(element => {
        let id = element.getAttribute(idAttribute) || element.id.match(/object_\d+/)?.[0];
        if (id) {
            // Ensure the ID is in the correct format
            id = id.replace(/.*object_(\d+).*/, 'object_$1');
        }
        const textElement = element.querySelector(textSelector);
        if (id && textElement) {
            textElement.innerHTML += ` <span class="idTextStyle">${id}</span>`;
        }
    });
}

let dividerState = null; // null = unknown, 0 = small, 1 = medium, 2 = max
const DIVIDER_STATES = ['300px', '550px', '800px'];

function toggleDividerMinMax() {
    const toolbox = document.querySelector('.builderLayout_toolbox');
    if (!toolbox) return;

    if (dividerState === null) {
        const current = parseInt(toolbox.style.flexBasis) || 0;
        if (current <= 400) dividerState = 0;
        else if (current <= 650) dividerState = 1;
        else dividerState = 2;
    }

    dividerState = (dividerState + 1) % 3;
    toolbox.style.setProperty('flex-basis', DIVIDER_STATES[dividerState], 'important');
}

function getFilteredListItems(searchEmpty) {
    const listItems = Array.from(document.querySelectorAll('[id^=object-li-object_].nav-item, [id^=role-object-nav-object_].nav-item'));
    return searchEmpty ? listItems : listItems.filter(item => getComputedStyle(item).display === 'block');
}

function updateListItemFocusStyles(currentFocusIndex, currentSelectionIndex, filteredListItems) {
    // Reset all focus styles
    filteredListItems.forEach((item, index) => {
        const anchor = item.querySelector('a'); // Select the <a> inside the <li>
        // Remove highlight styles from the <a>
        anchor.style.removeProperty('--tw-bg-opacity');
        anchor.style.removeProperty('background-color');
        anchor.style.removeProperty('box-shadow');
    });

    // Apply styles to current selection
    if (currentSelectionIndex === currentFocusIndex) return;

    const focusedItem = filteredListItems[currentFocusIndex];
    const anchor = focusedItem?.querySelector('a');
    if (!anchor) return;

    anchor.style.setProperty('--tw-bg-opacity', '1', 'important');
    anchor.style.setProperty('background-color', 'rgba(251, 239, 249, 1)', 'important');
    anchor.style.setProperty('box-shadow', 'inset 0 0 0 1px #962783', 'important');
}

// Shared utility function for keyboard handling in filter inputs
function handleFilterKeydown(e, options = {}) {
    const {
        filteredListItems = [],
        currentFocusIndex = 0,
        currentSelectionIndex = -1,
        onFocusChange = null,
        onEscape = null,
        resultsPopup = null,
        tableScroller = null
    } = options;

    // For Home/End keys - allow default behavior when focused on input field
    if ((e.key === 'Home' || e.key === 'End') && e.target.id.startsWith('incremental-filter-')) {
        return currentFocusIndex;
    }

    // Handle other keys
    switch (e.key) {
        case 'Escape':
            e.target.value = '';
            e.target.dispatchEvent(new Event('input'));
            e.target.blur();
            e.target.style.backgroundColor = 'white';
            if (tableScroller) tableScroller.style.height = 'unset';
            if (resultsPopup) resultsPopup.style.display = 'none';
            onEscape?.();
            break;

        case 'Tab':
            if (filteredListItems.length > 0) {
                e.preventDefault();
                const newIndex = (currentFocusIndex + 1) % filteredListItems.length;
                onFocusChange?.(newIndex, currentSelectionIndex, filteredListItems);
                return newIndex;
            }
            break;

        case 'Enter':
            if (filteredListItems.length > 0 && currentFocusIndex >= 0) {
                e.preventDefault();
                e.stopPropagation();
                const item = filteredListItems[currentFocusIndex];
                const link = item?.querySelector('a');
                (link || item)?.click();
                onFocusChange?.(-1, currentFocusIndex, filteredListItems);
                return currentFocusIndex;
            }
            break;

        case 'ArrowUp':
        case 'ArrowDown':
            if (filteredListItems.length > 0) {
                e.preventDefault();
                const delta = e.key === 'ArrowUp' ? -1 : 1;
                const newIndex = (currentFocusIndex + delta + filteredListItems.length) % filteredListItems.length;
                onFocusChange?.(newIndex, currentSelectionIndex, filteredListItems);
                return newIndex;
            }
            break;

        case 'Home':
        case 'End':
            if (filteredListItems.length > 0) {
                e.preventDefault();
                const newIndex = e.key === 'Home' ? 0 : filteredListItems.length - 1;
                onFocusChange?.(newIndex, currentSelectionIndex, filteredListItems);
                return newIndex;
            }
            break;
    }

    return currentFocusIndex;
}

function truncateCellText(selector = '.kn-table-element td:not(#kn-email-history-table td)', textLimit = 50, parentTableId = '#kn-records-table') {
    try {
        // document.querySelectorAll(selector).forEach(cell => {
        //     if (cell.textContent.length > textLimit) {
        //         cell.classList.add('truncate-cell');
        //         if (cell.closest(parentTableId)) {
        //             if (cell.querySelector('.view-more-btn')) return;
        //             const viewMoreBtn = document.createElement('span');
        //             viewMoreBtn.textContent = 'more';
        //             viewMoreBtn.className = 'view-more-btn';
        //             cell.appendChild(viewMoreBtn);

        //             viewMoreBtn.addEventListener('click', (e) => {
        //                 e.stopPropagation();
        //                 cell.classList.toggle('open');
        //                 viewMoreBtn.textContent = cell.classList.contains('open') ? 'less' : 'more';
        //             });
        //         }
        //     }
        // });
        return true;
    } catch (error) {
        console.error('Error in truncateCells:', error);
        return false;
    }
}

//Add recourd counts to tables in the sidebar - BEGIN
const recordCountCache = {
    CACHE_DURATION: 60 * 60 * 1000, // 1 hour

    get() {
        return getSettings().recordCounts || {};
    },

    set(objectId, count) {
        const cache = this.get();
        cache[objectId] = { count, timestamp: Date.now() };
        setSetting('recordCounts', cache);
    },

    getCachedCount(objectId) {
        const cache = this.get();
        const entry = cache[objectId];
        if (entry && (Date.now() - entry.timestamp) < this.CACHE_DURATION) {
            return entry.count;
        }
        return null;
    }
};

const recordCountQueue = {
    queue: [],
    processing: false,
    DELAY_MS: 500, // delay between requests

    add(objectId) {
        if (!this.queue.includes(objectId)) {
            this.queue.push(objectId);
        }
        this.process();
    },

    async process() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const objectId = this.queue.shift();
            window.postMessage({ type: 'GET_RECORD_COUNT', objectId }, '*');
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));
            }
        }

        this.processing = false;
    }
};

window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.type !== 'RECORD_COUNT_RESPONSE') return;
    if (!window.location.href.includes('/records/')) return;

    const { objectId, count, error } = event.data;
    const item = document.querySelector(`#object-li-object_${objectId}`);
    if (!item) return;

    const textElement = item.querySelector('.label, .transition');
    if (!textElement) return;

    let countSpan = textElement.querySelector('.record-count-style');
    if (!countSpan) return; // Should already exist

    if (error) {
        countSpan.textContent = '(error)';
        countSpan.style.color = '#e74c3c';
    } else {
        countSpan.textContent = `(${count.toLocaleString()})`;
        recordCountCache.set(objectId, count);
    }
});

// Inject the page script
function injectPageScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-script.js');
    script.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
}

function addRecordCounts() {
    if (!window.location.href.includes('/records/')) return;

    const tableItems = document.querySelectorAll('[id^=object-li-object_].nav-item:not(.record-count-processed)');

    tableItems.forEach(item => {
        item.classList.add('record-count-processed');

        const objectId = item.id.match(/object_(\d+)/)?.[1];
        if (!objectId) return;

        const textElement = item.querySelector('.label, .transition');
        if (!textElement) return;

        // Check if count span already exists
        if (textElement.querySelector('.record-count-style')) return;

        const countSpan = document.createElement('span');
        countSpan.className = 'record-count-style';
        countSpan.style.cssText = `
            color: #9b9b9b !important;
            font-size: small;
            font-weight: 400 !important;
            margin-left: 8px;
            font-family: Inter,sans-serif;
        `;

        // Show cached value immediately if available
        const cachedCount = recordCountCache.getCachedCount(objectId);
        if (cachedCount !== null) {
            countSpan.textContent = `(${cachedCount.toLocaleString()})`;
        } else {
            countSpan.textContent = '(...)';
        }
        textElement.appendChild(countSpan);

        // Queue background refresh
        recordCountQueue.add(objectId);
    });
}

injectPageScript();
//Add recourd counts to tables in the sidebar - END


//Sort pages alphabetically - BEGIN
let pageSortingEnabled = getSettings().pageSorting !== 'false';

function sortPages() {
    if (!pageSortingEnabled) return;

    function sortPageList(pagesList) {
        if (!pagesList) return;

        const pageItems = Array.from(pagesList.querySelectorAll(':scope > li[id^="page-link-scene_"]'));
        if (pageItems.length === 0) return;

        pageItems.sort((a, b) => {
            const titleA = a.querySelector('.transition')?.textContent?.trim() || '';
            const titleB = b.querySelector('.transition')?.textContent?.trim() || '';
            return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
        });

        pageItems.forEach(item => {
            pagesList.appendChild(item);
            const childList = item.querySelector('ul.page-list-sortable');
            if (childList) {
                sortPageList(childList);
            }
        });
    }

    const mainPagesList = document.querySelector('ul.page-list-sortable');
    sortPageList(mainPagesList);
}

function addPageSortToggle() {
    const filterInput = document.querySelector('#incremental-filter-pages');

    if (!filterInput || document.querySelector('#page-sort-toggle')) return;

    const toggleButton = document.createElement('button');
    toggleButton.id = 'page-sort-toggle';
    toggleButton.style.cssText = `
        margin-right: 8px;
        padding: 2px 6px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        background: ${pageSortingEnabled ? '#ffeffc' : '#f5f5f5'};
        color: black;
        cursor: pointer;
        height: 35px;
        width: 50px;
        vertical-align: middle;
    `;
    toggleButton.textContent = pageSortingEnabled ? 'ABC' : 'abc';
    toggleButton.title = `Page sorting ${pageSortingEnabled ? 'enabled' : 'disabled'} - click to toggle`;

    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        pageSortingEnabled = !pageSortingEnabled;
        setSetting('pageSorting', pageSortingEnabled.toString());

        toggleButton.style.background = pageSortingEnabled ? '#ffeffc' : '#f5f5f5';
        toggleButton.textContent = pageSortingEnabled ? 'ABC' : 'abc';
        toggleButton.title = `Page sorting ${pageSortingEnabled ? 'enabled' : 'disabled'} - click to toggle`;

        location.reload();
    });

    filterInput.parentNode.insertBefore(toggleButton, filterInput);
}
//Sort pages alphabetically - END

//Sticky columns input control
function addStickyColsInput() {
    const addFiltersBtn = document.querySelector('[data-cy="add-filters"]');
    if (!addFiltersBtn || addFiltersBtn.classList.contains('stickyCols-processed')) return;

    addFiltersBtn.classList.add('stickyCols-processed');

    const container = document.createElement('span');
    container.style.cssText = 'margin-left: 24px; padding: 4px; display: inline-flex; align-items: center;';

    const label = document.createElement('span');
    label.textContent = 'Sticky Cols:';
    label.style.cssText = 'margin-right: 6px; font-size: 13px; color: rgb(var(--content-default));';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '10';
    input.value = getSettings().stickyCols || '0';
    input.title = 'Additional sticky columns after checkbox and actions (0 = disabled)';
    input.style.cssText = 'width: 50px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 8px; text-align: center;';

    container.appendChild(label);
    container.appendChild(input);

    input.addEventListener('change', () => {
        const colCount = parseInt(input.value) || 0;
        setSetting('stickyCols', colCount.toString());

        const table = document.querySelector('#records-body-wrapper table.kneuronStickyColumns');
        if (table) {
            table.classList.remove('kneuronStickyColumns');
            // Reset sticky styles
            table.querySelectorAll('thead th, tbody td').forEach(cell => {
                cell.style.position = '';
                cell.style.left = '';
                cell.style.zIndex = '';
                cell.style.backgroundColor = '';
            });
        }

        if (colCount > 0) {
            applyStickyCols(colCount + 2);
        }
    });

    addFiltersBtn.parentNode.insertBefore(container, addFiltersBtn.nextSibling);

    if (!document.querySelector('#kneuron-density-control')) {
        const densityContainer = document.createElement('span');
        densityContainer.id = 'kneuron-density-control';
        densityContainer.style.cssText = 'margin-left: 24px; padding: 4px; display: inline-flex; align-items: center; font-size: 13px; font-weight: normal !important;';

        const densityLabel = document.createElement('span');
        densityLabel.textContent = 'Density:';
        densityLabel.style.cssText = 'margin-right: 6px; color: rgb(var(--content-default));';
        densityContainer.appendChild(densityLabel);

        const savedDensity = getSettings().verticalDensity || 'normal';
        const levels = [
            { value: 'normal', label: 'Low' },
            { value: 'medium', label: 'Med' },
            { value: 'maximum', label: 'High' },
        ];

        levels.forEach(lvl => {
            const radioLabel = document.createElement('label');
            radioLabel.style.cssText = 'margin-right: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; font-weight: normal;';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'kneuron-density';
            radio.value = lvl.value;
            radio.checked = (lvl.value === savedDensity);
            radio.style.cssText = 'margin: 0; cursor: pointer;';

            radio.addEventListener('change', () => {
                setSetting('verticalDensity', lvl.value);
                applyVerticalDensity(lvl.value);
                const filterInput = document.querySelector('#incremental-filter-tables');
                if (filterInput && filterInput.value) {
                    filterInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            radioLabel.appendChild(radio);
            radioLabel.appendChild(document.createTextNode(lvl.label));
            densityContainer.appendChild(radioLabel);
        });

        container.parentNode.insertBefore(densityContainer, container.nextSibling);
    }
}

//Sticky columns for Records table
function applyStickyCols(columnCount = 3) {
    const table = document.querySelector('#records-body-wrapper table');
    if (!table) return;

    table.classList.add('kneuronStickyColumns');
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '0';

    const headerCells = document.querySelectorAll('thead tr th');
    if (headerCells.length < columnCount) return;

    let leftPos = 0;
    const positions = [];
    for (let i = 0; i < columnCount; i++) {
        positions.push(leftPos);
        leftPos += headerCells[i].offsetWidth;
    }

    for (let i = 0; i < columnCount; i++) {
        const th = headerCells[i];
        th.style.position = 'sticky';
        th.style.left = positions[i] + 'px';
        th.style.zIndex = '3';
    }

    const rows = document.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        const rowBg = window.getComputedStyle(row).backgroundColor;

        let bgColor;
        if (rowBg === 'rgba(0, 0, 0, 0)' || rowBg === 'transparent') {
            bgColor = 'rgb(255, 255, 255)';
        } else {
            bgColor = rowBg;
        }

        for (let i = 0; i < columnCount && i < cells.length; i++) {
            const td = cells[i];
            td.style.position = 'sticky';
            td.style.left = positions[i] + 'px';
            td.style.zIndex = '1';
            td.style.backgroundColor = bgColor;
            td.classList.add('kneuron-sticky');
        }
    });
}
//Sticky columns - END

//Connection filter icons - BEGIN
function addConnectionFilterIcons() {
    // Find all settings links that don't already have a filter icon next to them
    const settingsLinks = document.querySelectorAll('#connection-objects a[content="Edit this connection!"]:not(.filter-icon-added)');

    settingsLinks.forEach(settingsLink => {
        settingsLink.classList.add('filter-icon-added');

        // Get the parent connection element
        const conn = settingsLink.closest('.connection');
        if (!conn) return;

        // Skip elements that have a foreignObjectLink (links to other tables)
        if (conn.querySelector('.foreignObjectLink')) return;

        // Skip if filter icon already exists in this connection
        if (conn.querySelector('.kneuron-filter-icon')) return;

        const fieldNameEl = conn.querySelector('.conn-name span.text-emphasis')
            || conn.querySelector('span.text-emphasis');
        if (!fieldNameEl) return;

        // Push the settings link (and filter icon) to the right
        settingsLink.style.marginLeft = 'auto';

        const filterIcon = document.createElement('a');
        filterIcon.className = 'buttonSquare -size-small kneuron-filter-icon';
        filterIcon.style.cssText = 'margin-left: 4px; cursor: pointer;';
        filterIcon.title = 'View this field';
        filterIcon.innerHTML = `
            <svg viewBox="0 0 24 24" class="icon h-4 w-4 text-default">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
        `;

        filterIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const fieldName = fieldNameEl.textContent.trim();
            if (fieldName) {
                scrollToAndSelectField(fieldName, conn);
            }
        });

        settingsLink.parentNode.insertBefore(filterIcon, settingsLink.nextSibling);
    });
}

injectCSS(`
    .kneuron-field-highlight.kneuron-field-highlight {
        background-color: #f8d7f0 !important;
    }
`);

function clearFieldHighlights() {
    document.querySelectorAll('.kneuron-field-highlight').forEach(el => {
        el.classList.remove('kneuron-field-highlight');
    });
}

function highlightElement(el) {
    el.classList.add('kneuron-field-highlight');
}

// Clear highlights on any click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.kneuron-filter-icon')) {
        clearFieldHighlights();
    }
});

function scrollToAndSelectField(fieldName, sourceConn) {
    const scroller = document.querySelector('[data-cy="object-list-fields"]');
    if (!scroller) return;

    // Clear previous highlights
    clearFieldHighlights();

    // Highlight the source connection
    if (sourceConn) {
        highlightElement(sourceConn);
    }

    const maxAttempts = 200;
    let attempts = 0;
    const scrollAmount = 500;

    // First scroll to top
    scroller.scrollTop = 0;

    function searchAndScroll() {
        const allItems = scroller.querySelectorAll('.vue-recycle-scroller__item-view');
        // Filter out off-screen recycled items (translateY with large negative values)
        const items = Array.from(allItems).filter(item => {
            const transform = item.style.transform;
            if (!transform) return true;
            const match = transform.match(/translateY\((-?\d+)px\)/);
            return !match || parseInt(match[1]) >= 0;
        });
        for (const item of items) {
            const nameEl = item.querySelector('span.text-emphasis')
                || item.querySelector('.text-emphasis')
                || item.querySelector('[class*="field-name"]')
                || item.querySelector('span');
            if (nameEl) {
                const itemName = nameEl.textContent.trim();
                if (itemName === fieldName) {
                    // Found it - scroll to center first
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Re-highlight after scroll completes (poll until items are visible)
                    let highlightAttempts = 0;
                    function tryHighlight() {
                        highlightAttempts++;
                        const freshItems = scroller.querySelectorAll('.vue-recycle-scroller__item-view');
                        for (const freshItem of freshItems) {
                            const transform = freshItem.style.transform;
                            const match = transform ? transform.match(/translateY\((-?\d+)px\)/) : null;
                            if (match && parseInt(match[1]) < 0) continue;

                            const freshNameEl = freshItem.querySelector('span.text-emphasis')
                                || freshItem.querySelector('.text-emphasis')
                                || freshItem.querySelector('span');
                            if (freshNameEl && freshNameEl.textContent.trim() === fieldName) {
                                const tile = freshItem.querySelector('.tile') || freshItem;
                                highlightElement(tile);
                                return;
                            }
                        }
                        if (highlightAttempts < 30) {
                            setTimeout(tryHighlight, 30);
                        }
                    }
                    setTimeout(tryHighlight, 50);
                    return;
                }
            }
        }

        // Not found, check if we've reached the bottom
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10;
        if (atBottom || attempts >= maxAttempts) {
            return;
        }

        // Scroll down and try again
        attempts++;
        scroller.scrollTop += scrollAmount;
        setTimeout(searchAndScroll, 80);
    }

    setTimeout(searchAndScroll, 80);
}
//Connection filter icons - END