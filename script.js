document.addEventListener('DOMContentLoaded', () => {
    const socialProofContainer = document.getElementById('dynamic-social-proof');
    const videoCarousel = document.querySelector('.video-carousel:not(.merch-carousel)');
    const merchCarousel = document.querySelector('.merch-carousel');
    const socialBar = document.querySelector('.social-bar');
    const followBtn = document.querySelector('.follow-btn');
    const requestBtn = document.querySelector('#request-show-link');
    const emailSignupBtn = document.querySelector('.exclusive-btn');
    const countdownTimerEl = document.getElementById('countdown-timer');
    const tourDatesList = document.getElementById('tour-dates');
    const stickyCtaLink = document.getElementById('sticky-cta-link');

    // Use global pageData variable from data.js
    if (typeof pageData !== 'undefined') {
        initSocialProof(pageData.socialProof);
        initVideos(pageData.videos);
        initMerch(pageData.merch);
        initSocialLinks(pageData.socialLinks);
        initLinks(pageData.artist.links);
        initBandsintown(pageData.artist);
    } else {
        console.error('pageData is not defined. Make sure data.js is loaded.');
    }

    function initLinks(links) {
        if (followBtn) followBtn.href = links.follow;
        if (requestBtn) requestBtn.href = links.requestShow;
        if (emailSignupBtn) emailSignupBtn.href = links.emailSignup;
    }

    function initSocialProof(quotes) {
        if (!quotes || quotes.length === 0) return;

        let currentQuoteIndex = 0;

        function updateSocialProof() {
            const currentQuote = quotes[currentQuoteIndex];
            const newHtml = `
                <p class="quote">“${currentQuote.quote}”</p>
                <p class="source">
                    <i class="${currentQuote.media}"></i> — *${currentQuote.source}*
                </p>
            `;

            socialProofContainer.style.opacity = 0;
            setTimeout(() => {
                socialProofContainer.innerHTML = newHtml;
                socialProofContainer.style.opacity = 1;
                currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            }, 500);
        }

        updateSocialProof();
        setInterval(updateSocialProof, 10000);
    }

    function initVideos(videos) {
        if (!videoCarousel) return;
        videoCarousel.innerHTML = ''; // Clear existing content

        videos.forEach(video => {
            let html = '';
            if (video.type === 'playlist') {
                html = `
                    <a href="${video.url}" target="_blank" class="video-item watch-more-item">
                        <div class="video-placeholder">
                            <span>${video.placeholder.span}</span>
                            <strong>${video.placeholder.strong}</strong>
                        </div>
                    </a>
                `;
            } else {
                html = `
                    <a href="${video.url}" target="_blank" class="video-item">
                        <div class="video-thumbnail-container">
                            <img src="${video.thumbnail}" alt="Video Thumbnail">
                            <div class="play-overlay">
                                <svg class="play-icon" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </a>
                `;
            }
            videoCarousel.insertAdjacentHTML('beforeend', html);
        });
    }

    function initMerch(merchItems) {
        if (!merchCarousel) return;
        merchCarousel.innerHTML = ''; // Clear existing

        merchItems.forEach(item => {
            let html = '';
            if (item.type === 'shopAll') {
                html = `
                    <a href="${item.url}" target="_blank" class="video-item watch-more-item buy-more-merch-item">
                        <div class="video-placeholder">
                            <i class="${item.placeholder.icon}" style="font-size: 2em; margin-bottom: 10px;"></i>
                            <span>${item.placeholder.span}</span>
                            <strong>${item.placeholder.strong}</strong>
                        </div>
                    </a>
                `;
            } else {
                html = `
                    <a href="${item.url}" target="_blank" class="video-item merch-item">
                        <div class="video-thumbnail-container">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="video-placeholder">
                            <p style="color: #000; font-weight: 900;">${item.name}</p>
                            <span>BUY NOW</span>
                        </div>
                    </a>
                `;
            }
            merchCarousel.insertAdjacentHTML('beforeend', html);
        });
    }

    function initSocialLinks(links) {
        if (!socialBar) return;
        socialBar.innerHTML = '';

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.className = 'social-btn';
            a.title = link.platform;
            a.innerHTML = `<i class="${link.icon}"></i>`;
            socialBar.appendChild(a);
        });
    }

    function initBandsintown(artistData) {
        const artistName = artistData.name;
        const appId = artistData.bandsintownAppId;
        const url = `https://rest.bandsintown.com/artists/${artistName}/events?app_id=${appId}`;
        const requestShowUrl = artistData.links.requestShow;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                tourDatesList.innerHTML = '';

                if (!Array.isArray(data) || data.length === 0) {
                    tourDatesList.innerHTML = '<div class="loading">No upcoming dates found on Bandsintown.</div>';
                    countdownTimerEl.innerHTML = "NO EVENTS SCHEDULED";

                    // Set sticky CTA link to Request Show URL
                    if (stickyCtaLink) {
                        stickyCtaLink.innerText = "REQUEST A SHOW";
                        stickyCtaLink.setAttribute('href', requestShowUrl);
                    }
                    return;
                }

                // START THE COUNTDOWN for the first event
                startCountdown(data[0].datetime);

                // SET UP STICKY CTA BAR
                const firstEvent = data[0];
                const ctaText = `BUY TICKETS: ${firstEvent.venue.city.toUpperCase()}`;
                if (stickyCtaLink) {
                    stickyCtaLink.setAttribute('href', firstEvent.url);
                    stickyCtaLink.innerText = ctaText;
                }

                data.forEach(event => {
                    const dateObj = new Date(event.datetime);

                    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                    const yearStr = dateObj.toLocaleDateString('en-US', { year: '2-digit' });
                    const monthYearStr = `${monthStr} ${yearStr}`;
                    const dayOfMonthStr = dateObj.toLocaleDateString('en-US', { day: 'numeric' }).padStart(2, '0');
                    const dayOfWeekStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

                    let ticketUrl = event.url;
                    if (event.offers && event.offers.length > 0) {
                        // Attempt to find a "Tickets" type offer, or fallback to the first one available
                        const ticketOffer = event.offers.find(o => o.type === 'Tickets') || event.offers[0];
                        if (ticketOffer && ticketOffer.url) {
                            ticketUrl = ticketOffer.url;
                        }
                    }

                    const row = document.createElement('div');
                    row.className = 'event-row';

                    row.innerHTML = `
                        <div class="date">
                            <span class="month-year">${monthYearStr}</span>
                            <span class="day-of-month">${dayOfMonthStr}</span>
                            <span class="day-of-week">${dayOfWeekStr}</span>
                        </div>
                        <div class="venue-info">
                            <div class="venue-city">${event.venue.name}</div>
                            <div class="venue-name-small">${event.venue.city}, ${event.venue.country}</div>
                        </div>
                        <a href="${ticketUrl}" target="_blank" class="rsvp-btn">Buy Tickets</a>
                    `;
                    tourDatesList.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching Bandsintown data:', error);
                tourDatesList.innerHTML = '<div class="loading">Connection Error. Please reload.</div>';
                countdownTimerEl.innerHTML = "ERROR";
            });
    }

    function startCountdown(targetDate) {
        const targetTime = new Date(targetDate).getTime();
        const oneDay = 1000 * 60 * 60 * 24;

        function getStatus() {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance <= 0) {
                clearInterval(x);
                return "LIVE NOW!";
            }

            const days = Math.floor(distance / oneDay);
            const today = new Date();
            const eventDay = new Date(targetDate);

            today.setHours(0, 0, 0, 0);
            eventDay.setHours(0, 0, 0, 0);

            const calendarDistance = eventDay.getTime() - today.getTime();
            const calendarDays = calendarDistance / oneDay;

            if (calendarDays === 0) return "TODAY";
            if (calendarDays === 1) return "TOMORROW";

            return `${Math.ceil(calendarDays)} DAYS LEFT`;
        }

        countdownTimerEl.innerHTML = getStatus();

        const x = setInterval(function () {
            countdownTimerEl.innerHTML = getStatus();
        }, 1000 * 60 * 5);
    }
});
