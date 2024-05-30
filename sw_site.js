"use strict";

import Conf from '/conf.js';

const cacheName = Conf.CacheName;



/* '/',
'/conf.js',
'/assets/scripts/mvp.js',
'/assets/scripts/data.json',
'/assets/scripts/main.js',
'/assets/css/mvp.css',
'/assets/images/header.jpg',
'/assets/images/gear-spinner.svg',
'/assets/manifest/icons/icon-128x128.png',
'https://cdnjs.cloudflare.com/ajax/libs/vexflow/1.2.88/vexflow-min.js',
'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css',
'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js',
'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js' */


self.addEventListener('install', e=>{
    e.waitUntil(
        caches
            .open(cacheName)
            .then(cache => {
                cache.addAll(cacheAssets);
            })
            .then(() => self.skipWaiting())
    );
});


self.addEventListener('activate', e=>{
    e.waitUntil(
        caches.keys().then(cacheNamesList => {
            return Promise.all(
                cacheNamesList.map(cache => {
                    if(cache !== cacheName){
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});


self.addEventListener('fetch', e => {
    if (e.request.method !== 'POST') {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const resClone = res.clone();
                    caches
                        .open(cacheName)
                        .then(cache => {
                            cache.put(e.request, resClone);
                        });
                    return res;
                })
                .catch(err => caches.match(e.request).then(res => res))
        );
    }
});
