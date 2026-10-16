/* Public equipment site: keep stable header geometry. Authentication belongs to the PhotoBridge first-party origin. */
(()=>{'use strict';
 const header=document.querySelector('.equipment-site > .site-header');
 if(!header)return;
 const measure=()=>document.documentElement.style.setProperty('--equipment-header-height',Math.round(header.getBoundingClientRect().height)+'px');
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);
 measure();
})();
