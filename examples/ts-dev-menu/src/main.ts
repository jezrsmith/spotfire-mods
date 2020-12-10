/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */


// Import the Spotfire module
import { Spotfire } from "./api";
// Import needed types

// Starting point for every mod
Spotfire.initialize(async mod => {
    // Used later to inform Spotfire that the render is complete
    let context = mod.getRenderContext();
    
    // setup menu
    const sideNav: any = document.getElementById('sideNav');
   
    // read menu config
    // @ts-ignore
    const menuConfigJson: string = (await mod.document.property('menuConfig')).value();
    const menuConfig = JSON.parse(menuConfigJson);
    if (sideNav) {
        sideNav.tabs = menuConfig;
        let activePageJson: string;
        (async () => {
            await customElements.whenDefined('uxpl-left-nav-multi');
                // read current page
                // @ts-ignore
                activePageJson = (await mod.document.property('activePage')).value();
                const activePage = JSON.parse(activePageJson);
                if (activePage) {
                    if (activePage.child) {
                        await sideNav.setTab(sideNav.tabs[activePage.tab].child[activePage.child]);
                    } else {
                        await sideNav.setTab(sideNav.tabs[activePage.tab]);        
                    }
                }
            })();

        sideNav.addEventListener('selected', (event: any) => {
            const newTab = testme(sideNav.tabs, event.detail.id);
            if (newTab) {
                if (activePageJson !== newTab) {
                    const newTabJson = JSON.stringify(newTab);
                    mod.document.property('activePage').set(newTabJson);
                    console.log('side tab selected: ', newTabJson);
                    mod.document.setActivePage(event.detail.id);
                }
                
            }
        });



    }

    // Create a reader object that reacts only data and window size changes
    let reader = mod.createReader(mod.visualization.data(), mod.windowSize());

    reader.subscribe(async function render(dataView, size) {
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Data view contains errors. Display these and clear the chart to avoid
            // getting a flickering effect with an old chart configuration later.
            mod.controls.errorOverlay.show(errors, "DataView");

            return;
        }

        mod.controls.errorOverlay.hide("DataView");
        let rows = await dataView.allRows();
        console.log(rows);
        

        // Inform Spotfire that the render is complete (needed for export)
        context.signalRenderComplete();
    });

    const testme = (menuConfig: [], selectedId: string):any  => {
        let foundTab: any;
        menuConfig.forEach((tab: any, tabIdx: number) => {
            // the selected Id is a top level tab
            if (!foundTab && tab.id === selectedId) {
                foundTab = {
                    tab: tabIdx,
                    child: undefined
                }
            } else {
                if (!foundTab && tab.child && tab.child.length > 0) {
                   tab.child.forEach((child: any, childTabIdx: number) => {
                        if (!foundTab && child.id === selectedId) {
                            foundTab = {
                                tab: tabIdx,
                                child: childTabIdx
                            }
                        }
                    })
                }
            }
        });
        return foundTab;
    }
});
