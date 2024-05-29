"use strict";

import Conf from '/conf.js';

const cacheName = Conf.CacheName;

if('serviceWorker' in navigator){ //um service worker zu registrieren.
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw_site.js', {type: 'module'})
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log("SW Error!"))
    });
}


const netz_img = document.getElementById("netz_img");
const netz_text = document.getElementById("netz_text");




async function getDataFromCache(itemUrl) { //da isoffline.png geladen wurde, deswegen wird Data von Service Worker abgerufen
    try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
            const url = new URL(request.url);
            if (url.pathname === itemUrl) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    const resUrl = URL.createObjectURL(blob);
                    return resUrl;
                }
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}