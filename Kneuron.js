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
`;
injectCSS(css);

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

            if (mutation.target.querySelector('#page-views .kn-form .item-wrapper .kn-item')) {
                addFieldIdTooltip();
            }

            if (mutation.target.querySelector('.kn-search-list-wrapper:not(.reduce-processed)')) {
                reduceLists('.kn-search-list-wrapper');
            }

            if (mutation.target.querySelector('#objects-nav h3.text-emphasis')) {
                addTablesFilter();
            }

            if (mutation.target.querySelector('#view-add-items')) {
                addFieldsFilter();
            }

            if (mutation.target.querySelector('select[data-cy="movecopy-select"]:not(.filter-processed)')) {
                addMoveCopyViewFilter();
                mutation.target.querySelector('select[data-cy="movecopy-select"]').classList.add('filter-processed');
            }

            if (mutation.target.querySelector('h3[data-cy="page-filter-menu"]:not(.filter-processed)')) {
                addPagesFilter();
                mutation.target.querySelector('h3[data-cy="page-filter-menu"]').classList.add('filter-processed');
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
    // First check if we're in an input field
    if (event.altKey &&
        event.code.startsWith('Digit') &&
        event.code.replace('Digit', '') >= 1 &&
        event.code.replace('Digit', '') <= 5) {
        const activeElement = document.activeElement;
        if ((activeElement.tagName === 'INPUT' && !activeElement.id.startsWith('incremental-filter')) ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable) {
            return; // Exit early, allowing default Alt+number behavior
        }
    }

    let element;
    let keyPressed = event.code;

    if (keyPressed === 'Enter') {
        element = document.querySelector('[data-cy=confirm]')
            || document.querySelector('a.save')
            || document.querySelector('.kn-submit button')
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
        element = document.querySelector('[data-cy=cancel]') || document.querySelector('.modal_close') || document.querySelector('a.cancel') || document.querySelector('.header_close');
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
            //Does three things, depending on context:
            // 1- Activate the Settings toolbox, when a view is selected
            // 2- Puts cursor on the Filter box when it is visible
            // 3- Click on Save, when Javascript or CSS editor is active
            element = document.querySelector('[id^=incremental-filter]') || document.querySelector('.is-active a.settings') || document.querySelector('a.save');
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
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.id = 'incremental-filter-tables';
        searchInput.addEventListener('input', (e) => {
            document.querySelector('.left-toolbox').scrollTop = 0;
            const hasMatches = filterListItems(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterListItems('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
            }
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
        searchInput.style.borderRadius = '4px';
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
        resultsPopup.style.borderRadius = '4px';
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
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterOptions('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
                resultsPopup.style.display = 'none';
            }
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
        searchInput.style.marginLeft = '30px';
        searchInput.style.padding = '2px 5px';
        searchInput.style.fontSize = '14px';
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ccc';
        searchInput.style.height = '35px';
        searchInput.id = 'incremental-filter-pages';

        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        searchInput.addEventListener('click', (e) => e.stopPropagation());
        searchInput.addEventListener('input', (e) => {
            const hasMatches = filterPages(e.target.value);
            searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterPages('');
                searchInput.blur();
                searchInput.style.backgroundColor = 'white';
            }
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
    searchInput.style.borderRadius = '4px';
    searchInput.style.border = '1px solid #ccc';
    searchInput.style.height = '35px';
    searchInput.id = 'incremental-filter-fields';
    searchInput.classList.add('filter-input');

    searchInput.addEventListener('input', (e) => {
        document.querySelector('#pages .toolbox-body').scrollTop = 0;
        const hasMatches = filterListItems(e.target.value);
        searchInput.style.backgroundColor = hasMatches ? 'white' : ERROR_COLOR;
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterListItems('');
            searchInput.blur();
            searchInput.style.backgroundColor = 'white';
        }
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

function addFieldIdTooltip() {
    const overlays = document.querySelectorAll('.overlay');

    overlays.forEach(overlay => {
        // Event listener to show tooltip on hover
        overlay.addEventListener('mouseenter', function() {
            // Check if tooltip already exists for this overlay
            if (!overlay.tooltipElement) {
                const itemWrapper = overlay.closest('.item-wrapper');
                let fieldId = null;

                // Check if the item has an input or select with id or name that starts with "field_"
                const inputField = itemWrapper ? itemWrapper.querySelector('input, select') : null;
                if (inputField) {
                    // Check id or name directly if it starts with "field_"
                    if (inputField.id && inputField.id.startsWith('field_')) {
                        fieldId = inputField.id;
                    } else if (inputField.name && inputField.name.startsWith('field_')) {
                        fieldId = inputField.name;
                    }
                }

                // Special check for First and Last Name fields where hidden input has the field ID
                if (!fieldId && itemWrapper) {
                    const hiddenInput = itemWrapper.querySelector('input[type="hidden"]');
                    if (hiddenInput && hiddenInput.value && hiddenInput.value.startsWith('field_')) {
                        fieldId = hiddenInput.value;
                    }
                }

                // Only show tooltip if a valid field ID was found
                if (fieldId) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'field-tooltip';
                    tooltip.textContent = fieldId;
                    tooltip.style.position = 'absolute';
                    tooltip.style.background = '#333';
                    tooltip.style.color = '#fff';
                    tooltip.style.padding = '2px 5px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '12px';

                    // Position the tooltip relative to the overlay
                    const rect = overlay.getBoundingClientRect();
                    tooltip.style.top = `${rect.top + window.scrollY}px`;
                    tooltip.style.left = `${rect.left + window.scrollX}px`;
                    tooltip.style.zIndex = '1000';

                    document.body.appendChild(tooltip);
                    overlay.tooltipElement = tooltip; // Store reference for removal later
                }
            }
        });

        // Event listener to hide tooltip when leaving the element
        overlay.addEventListener('mouseleave', function() {
            if (overlay.tooltipElement) {
                overlay.tooltipElement.remove();
                overlay.tooltipElement = null; // Clear the reference
            }
        });
    });
}