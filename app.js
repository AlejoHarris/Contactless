const currentPage$ = new rxjs.BehaviorSubject('page-home')


currentPage$.pipe(
    rxjs.operators.skip(1),
    rxjs.operators.distinctUntilChanged()
).subscribe(page => {
    const $a = $('.page.active');
    const $b = $('#' + page);
    $a.addClass('leave')
    $b.addClass('enter')
    $b.get(0).scrollTo(0, 0);
    setTimeout(() => {
      location.hash = page;
      $a.removeClass('active');
      $b.addClass('active');
      $('.enter').removeClass('enter')
      $('.leave').removeClass('leave')
    }, 400)
})

document.querySelectorAll('a[href^="#page-"]').forEach(el => 
    rxjs.fromEvent(el, 'click').pipe(
        rxjs.operators.map(ev => ev.target.getAttribute('href') ? ev.target.getAttribute('href') : ev.target.parentNode.getAttribute('href')),
        rxjs.operators.map(href => href.replace('#',''))
    ).subscribe(page => currentPage$.next(page))
)
currentPage$.subscribe(page => console.log('currentPage$', page))

// Navegar al hash
const initialPage = location.hash.replace('#','');
if (initialPage && initialPage.length) {
    currentPage$.next(initialPage)
}

const $pageWrapper = $('.page-wrapper');


const figures = ['SVD5', 'CDM7', 'PIXT2', 'SVD6',  'CDM8', 'PI52']

/**
 * FAB BUTTON
 */
const $fab = $('.fab');
currentPage$.pipe(
    rxjs.operators.map(page => page !== 'page-home' && page.indexOf('page-figure') === -1)
).subscribe(showClose => {
    console.log('show close', showClose)
    $fab.toggleClass('close', showClose);
});
currentPage$.subscribe(page => {
  const showFab = page.indexOf('home') === -1;
  $fab.toggle(showFab);
})

rxjs.fromEvent($fab.get(0), 'click').pipe(
    rxjs.operators.withLatestFrom(currentPage$)
).subscribe(([ev, page]) => {
    if (page.indexOf('page-figure') === 0) {
      // Vista figura
      const figure = page.replace('page-figure-','');
      const newPage = 'page-info-figure-' + figure;
      currentPage$.next(newPage);
    } else if (page.indexOf('page-info-figure') === 0) {
      // Vista info figura
      const figure = page.replace('page-info-figure-','');
      currentPage$.next('page-figure-' + figure);
    } else if (page === 'page-home') {
      currentPage$.next('page-expo')
    } else {
      currentPage$.next('page-home')
    }
})
currentPage$.subscribe(newPage => {  
  const videoEl = $('#' + newPage).find('video').get(0);
  if (videoEl) {
    videoEl.play();
  }
})

currentPage$.subscribe(newPage => {  
  const figure = newPage.split('figure-')[1]
  const iframe = $('#page-figure-' + figure).find('iframe').get(0);
  [...document.querySelectorAll('iframe')].filter(
      el => el.src && el.src.indexOf(figure) === -1
  ).forEach(el => el.setAttribute('src', ''))
  //$('iframe').filter(function() { return $(this).attr('src').indexOf('figure') == -1}).attr('src','');
  if (iframe && iframe.getAttribute('src') !== $(iframe).attr('data-src')) {
    iframe.setAttribute('src', $(iframe).attr('data-src')); 
  }
})


/**
 * UP & DOWN ARROWS
 */
const $up = $('.arrow-up').hide();
const $down = $('.arrow-down').hide();
currentPage$.subscribe(page => {
    if (page == 'page-home') {
        $down.show();
        $up.hide();
    } else if (page.indexOf('figure') > -1 && page.indexOf('info') === -1) {
        $down.show();
        $up.show();
    } else if (page == 'page-end') {
        $down.hide();
        $up.show();
    } else {
        $down.hide();
        $up.hide();
    }
})


rxjs.fromEvent($down.get(0), 'click').pipe(
    rxjs.operators.withLatestFrom(currentPage$)
).subscribe(([ev, page]) => {
    if (page === 'page-home') {
        currentPage$.next('page-figure-' + figures[0])
    } else {
        currentIndex = figures.indexOf(page.replace('page-figure-',''));
        const nextFigure = figures[currentIndex + 1];
        console.log(page, nextFigure)
        if (nextFigure) {
            currentPage$.next('page-figure-' + nextFigure)
        } else {
            currentPage$.next('page-end')
        }
        console.log('TODO')
    }
})

rxjs.fromEvent($up.get(0), 'click').pipe(
    rxjs.operators.withLatestFrom(currentPage$)
).subscribe(([ev, page]) => {
    if (page === 'page-end') {
        currentPage$.next('page-figure-' + figures[figures.length - 1])
    } else {
        currentIndex = figures.indexOf(page.replace('page-figure-',''));
        const nextFigure = figures[currentIndex - 1];
        console.log(page, nextFigure)
        if (nextFigure) {
            currentPage$.next('page-figure-' + nextFigure)
        } else if (currentIndex === 0) {
            currentPage$.next('page-home')
        } else {
            currentPage$.next('page-end')
        }
    }
})