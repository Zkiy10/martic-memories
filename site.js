(() => {
    const nav = document.querySelector('nav');
    const progress = document.querySelector('.scroll-progress span');

    const updateScrollState = () => {
        if (nav) {
            nav.classList.toggle('scrolled', window.scrollY > 24);
        }

        if (progress) {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progressPercent = scrollableHeight > 0
                ? (window.scrollY / scrollableHeight) * 100
                : 0;
            progress.style.width = `${Math.min(progressPercent, 100)}%`;
        }
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    const textElements = document.querySelectorAll('main h1, main h2, main p, main > a, main .ms1f-1');
    textElements.forEach((element, index) => {
        element.classList.add('text-reveal');
        element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 70}ms`);
    });

    const animatedElements = document.querySelectorAll('.sc-anim, .text-reveal');
    if ('IntersectionObserver' in window) {
        document.documentElement.classList.add('has-scroll-animations');
        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    currentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        animatedElements.forEach((element) => observer.observe(element));
    } else {
        animatedElements.forEach((element) => element.classList.add('is-visible'));
    }
})();
